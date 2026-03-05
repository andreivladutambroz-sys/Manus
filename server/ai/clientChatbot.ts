import { ENV } from '../_core/env';

/**
 * Client Chatbot Service
 * Provides FAQ automation and escalation to mechanics
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    diagnosticId?: string;
    vehicleId?: string;
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  clientId: string;
  diagnosticId?: string;
  messages: ChatMessage[];
  status: 'active' | 'escalated' | 'closed';
  escalatedToMechanic?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  relatedDiagnostics?: string[];
}

/**
 * Call Kimi API
 */
async function callKimi(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 2000, jsonMode = false } = options;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.kimiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshot-v1-128k',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kimi API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message.content || '';
}

/**
 * Generate chatbot response
 */
export async function generateChatbotResponse(
  userMessage: string,
  chatHistory: ChatMessage[],
  faqs: FAQ[],
  diagnosticContext?: { brand: string; model: string; issue: string }
): Promise<{ response: string; shouldEscalate: boolean; confidence: number }> {
  const systemPrompt = buildSystemPrompt(faqs, diagnosticContext);
  const userPrompt = buildChatPrompt(userMessage, chatHistory, faqs);

  try {
    const response = await callKimi(systemPrompt, userPrompt, {
      temperature: 0.6,
      maxTokens: 1000,
      jsonMode: false,
    });

    const shouldEscalate = detectEscalationNeeded(userMessage, response);
    const confidence = calculateResponseConfidence(response);

    return {
      response,
      shouldEscalate,
      confidence,
    };
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return {
      response: 'I apologize, but I could not process your request. Please try again or contact our support team.',
      shouldEscalate: true,
      confidence: 0,
    };
  }
}

/**
 * Build system prompt for chatbot
 */
function buildSystemPrompt(faqs: FAQ[], diagnosticContext?: any): string {
  const faqContext = faqs
    .slice(0, 10)
    .map(f => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');

  const diagnosticInfo = diagnosticContext
    ? `\nVehicle: ${diagnosticContext.brand} ${diagnosticContext.model}\nIssue: ${diagnosticContext.issue}`
    : '';

  return `You are a helpful automotive customer support chatbot.
Your role is to answer customer questions about their vehicle diagnostics and repairs.

FREQUENTLY ASKED QUESTIONS:
${faqContext}${diagnosticInfo}

Guidelines:
- Be friendly and professional
- Provide clear, concise answers
- If you don't know the answer, suggest escalating to a mechanic
- Ask clarifying questions when needed
- Provide safety warnings when relevant`;
}

/**
 * Build chat prompt
 */
function buildChatPrompt(userMessage: string, chatHistory: ChatMessage[], faqs: FAQ[]): string {
  const recentHistory = chatHistory
    .slice(-5)
    .map(m => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const relevantFAQs = findRelevantFAQs(userMessage, faqs)
    .slice(0, 3)
    .map(f => `- ${f.question}: ${f.answer}`)
    .join('\n');

  return `RECENT CONVERSATION:
${recentHistory}

RELEVANT FAQs:
${relevantFAQs}

CUSTOMER MESSAGE: ${userMessage}

Please provide a helpful response. If the question is complex or requires technical expertise, suggest escalating to a mechanic.`;
}

/**
 * Find relevant FAQs based on user message
 */
function findRelevantFAQs(userMessage: string, faqs: FAQ[]): FAQ[] {
  const messageLower = userMessage.toLowerCase();

  return faqs
    .map(faq => ({
      faq,
      score: calculateRelevanceScore(messageLower, faq),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.faq);
}

/**
 * Calculate relevance score
 */
function calculateRelevanceScore(message: string, faq: FAQ): number {
  let score = 0;

  // Check keywords
  faq.keywords.forEach(keyword => {
    if (message.includes(keyword.toLowerCase())) {
      score += 2;
    }
  });

  // Check question similarity
  const questionWords = faq.question.toLowerCase().split(' ');
  questionWords.forEach(word => {
    if (message.includes(word)) {
      score += 1;
    }
  });

  return score;
}

/**
 * Detect if escalation to mechanic is needed
 */
function detectEscalationNeeded(userMessage: string, response: string): boolean {
  const escalationKeywords = [
    'need mechanic',
    'contact mechanic',
    'speak to',
    'talk to',
    'urgent',
    'emergency',
    'critical',
    'dangerous',
    'safety',
    'specialist',
  ];

  const messageAndResponse = (userMessage + ' ' + response).toLowerCase();

  return escalationKeywords.some(keyword => messageAndResponse.includes(keyword));
}

/**
 * Calculate response confidence
 */
function calculateResponseConfidence(response: string): number {
  const confidenceIndicators = {
    high: ['definitely', 'certainly', 'clearly', 'obviously', 'absolutely'],
    medium: ['likely', 'probably', 'typically', 'usually', 'generally'],
    low: ['might', 'could', 'may', 'possibly', 'perhaps'],
  };

  const responseLower = response.toLowerCase();

  let confidence = 0.5;

  if (confidenceIndicators.high.some(word => responseLower.includes(word))) {
    confidence = 0.9;
  } else if (confidenceIndicators.low.some(word => responseLower.includes(word))) {
    confidence = 0.4;
  }

  return confidence;
}

/**
 * Default FAQs
 */
export const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'faq_1',
    question: 'What does Check Engine light mean?',
    answer: 'The Check Engine light indicates that your vehicle\'s onboard diagnostic system has detected a problem. It could be something minor like a loose gas cap or something more serious. We recommend getting a diagnostic scan to identify the exact issue.',
    category: 'warning-lights',
    keywords: ['check engine', 'light', 'warning'],
  },
  {
    id: 'faq_2',
    question: 'How often should I change my oil?',
    answer: 'Most modern vehicles require an oil change every 5,000-7,500 miles or every 6 months, whichever comes first. Check your vehicle\'s manual for specific recommendations.',
    category: 'maintenance',
    keywords: ['oil change', 'maintenance', 'service'],
  },
  {
    id: 'faq_3',
    question: 'What is OBD-II diagnostic?',
    answer: 'OBD-II (On-Board Diagnostics) is a system that monitors your vehicle\'s engine, emissions, and transmission. A diagnostic scan reads error codes to help identify problems.',
    category: 'diagnostics',
    keywords: ['obd', 'diagnostic', 'scan'],
  },
  {
    id: 'faq_4',
    question: 'How much does a typical repair cost?',
    answer: 'Repair costs vary widely depending on the issue, vehicle brand, and parts needed. Simple repairs might cost $50-200, while major repairs can cost $500-2000+. We provide cost estimates after diagnosis.',
    category: 'pricing',
    keywords: ['cost', 'price', 'repair'],
  },
  {
    id: 'faq_5',
    question: 'How long does a repair take?',
    answer: 'Repair time depends on the complexity of the issue. Simple repairs might take 1-2 hours, while major repairs can take several days. We provide time estimates after diagnosis.',
    category: 'timeline',
    keywords: ['time', 'how long', 'duration'],
  },
];

/**
 * Session management
 */
const chatSessions = new Map<string, ChatSession>();

export function createChatSession(clientId: string, diagnosticId?: string): ChatSession {
  const session: ChatSession = {
    id: `session_${Date.now()}`,
    clientId,
    diagnosticId,
    messages: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  chatSessions.set(session.id, session);
  return session;
}

export function getChatSession(sessionId: string): ChatSession | undefined {
  return chatSessions.get(sessionId);
}

export function addMessageToSession(sessionId: string, message: ChatMessage): void {
  const session = chatSessions.get(sessionId);
  if (session) {
    session.messages.push(message);
    session.updatedAt = new Date();
  }
}

export function escalateSession(sessionId: string, mechanicId: string): void {
  const session = chatSessions.get(sessionId);
  if (session) {
    session.status = 'escalated';
    session.escalatedToMechanic = mechanicId;
    session.updatedAt = new Date();
  }
}
