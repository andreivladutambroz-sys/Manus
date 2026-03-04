/**
 * Voice Commands & Dictation Service
 * Provides speech-to-text and voice command functionality
 */

export interface VoiceCommandResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  language: string;
}

export interface VoiceCommandOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

/**
 * Initialize Web Speech API
 */
export function initializeVoiceRecognition(options: VoiceCommandOptions = {}) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    throw new Error('Speech Recognition API not supported in this browser');
  }

  const recognition = new SpeechRecognition();

  // Configure recognition
  recognition.language = options.language || 'en-US';
  recognition.continuous = options.continuous || false;
  recognition.interimResults = options.interimResults !== false;
  recognition.maxAlternatives = options.maxAlternatives || 1;

  return recognition;
}

/**
 * Start voice recording and return text
 */
export function startVoiceRecording(
  onResult: (result: VoiceCommandResult) => void,
  onError: (error: string) => void,
  options: VoiceCommandOptions = {}
): () => void {
  try {
    const recognition = initializeVoiceRecognition(options);

    recognition.onstart = () => {
      console.log('Voice recording started');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }

        if (event.results[i].isFinal) {
          onResult({
            text: finalTranscript.trim(),
            confidence,
            isFinal: true,
            language: options.language || 'en-US',
          });
        }
      }

      if (interimTranscript) {
        onResult({
          text: interimTranscript,
          confidence: 0.5,
          isFinal: false,
          language: options.language || 'en-US',
        });
      }
    };

    recognition.onerror = (event: any) => {
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('Voice recording ended');
    };

    recognition.start();

    // Return stop function
    return () => {
      recognition.stop();
    };
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
    return () => {};
  }
}

/**
 * Dictate text with real-time feedback
 */
export function startDictation(
  onText: (text: string) => void,
  onError: (error: string) => void,
  language: string = 'en-US'
): () => void {
  let fullText = '';

  const stop = startVoiceRecording(
    (result) => {
      if (result.isFinal) {
        fullText += result.text + ' ';
        onText(fullText.trim());
      }
    },
    onError,
    { language, continuous: true, interimResults: true }
  );

  return stop;
}

/**
 * Voice search functionality
 */
export function startVoiceSearch(
  onSearch: (query: string) => void,
  onError: (error: string) => void,
  language: string = 'en-US'
): () => void {
  return startVoiceRecording(
    (result) => {
      if (result.isFinal && result.confidence > 0.5) {
        onSearch(result.text);
      }
    },
    onError,
    { language, continuous: false, interimResults: false }
  );
}

/**
 * Check if browser supports Web Speech API
 */
export function isVoiceRecognitionSupported(): boolean {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Get supported languages
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'ro-RO', name: 'Română' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'es-ES', name: 'Español' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'zh-CN', name: '中文 (简体)' },
];

/**
 * Text-to-Speech functionality
 */
export function speak(text: string, language: string = 'en-US') {
  if (!('speechSynthesis' in window)) {
    console.error('Speech Synthesis API not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop text-to-speech
 */
export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if text-to-speech is supported
 */
export function isTextToSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}
