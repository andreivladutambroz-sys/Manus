import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  startVoiceRecording,
  isVoiceRecognitionSupported,
  SUPPORTED_LANGUAGES,
} from '@/lib/voiceCommands';

interface VoiceInputProps {
  onText: (text: string) => void;
  placeholder?: string;
  language?: string;
  onLanguageChange?: (language: string) => void;
}

export function VoiceInput({
  onText,
  placeholder = 'Click mic to speak...',
  language = 'en-US',
  onLanguageChange,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  const isSupported = isVoiceRecognitionSupported();

  const handleStartListening = () => {
    if (!isSupported) {
      setError('Voice recognition not supported in your browser');
      return;
    }

    setError(null);
    setIsListening(true);
    setInterimText('');
    setFinalText('');

    try {
      stopRecordingRef.current = startVoiceRecording(
        (result) => {
          if (result.isFinal) {
            setFinalText(result.text);
            setInterimText('');
            setConfidence(result.confidence);
            onText(result.text);
          } else {
            setInterimText(result.text);
          }
        },
        (err) => {
          setError(err);
          setIsListening(false);
        },
        { language }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error starting voice recording');
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (stopRecordingRef.current) {
      stopRecordingRef.current();
    }
    setIsListening(false);
  };

  const displayText = finalText || interimText;

  return (
    <div className="space-y-3">
      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => {
            onLanguageChange?.(e.target.value);
          }}
          className="text-sm border border-border rounded px-2 py-1 bg-background"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Input Area */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={displayText}
            onChange={(e) => setFinalText(e.target.value)}
            placeholder={placeholder}
            disabled={isListening}
            className={interimText ? 'opacity-60' : ''}
          />
          {interimText && (
            <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
              <span className="text-muted-foreground italic">{interimText}</span>
            </div>
          )}
        </div>

        <Button
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={!isSupported}
          variant={isListening ? 'destructive' : 'default'}
          size="icon"
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 animate-pulse" />
            </>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2 text-sm">
        {isListening && (
          <Badge variant="secondary" className="animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Listening...
          </Badge>
        )}

        {finalText && confidence > 0 && (
          <Badge variant="outline">
            <Check className="h-3 w-3 mr-1 text-green-600" />
            {Math.round(confidence * 100)}% confidence
          </Badge>
        )}

        {error && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </Badge>
        )}

        {!isSupported && (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Voice not supported
          </Badge>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        💡 Tip: Click the microphone and speak clearly. Your speech will be converted to text.
      </p>
    </div>
  );
}
