import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageCircle, AlertCircle } from 'lucide-react';

interface AIChatbotProps {
  diagnosticContext?: {
    brand: string;
    model: string;
    issue: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
}

export function AIChatbot({ diagnosticContext }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          confidence: data.confidence,
        },
      ]);

      if (data.shouldEscalate) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content:
              'This issue requires expert attention. Would you like to connect with a mechanic?',
            timestamp: new Date(),
          },
        ]);
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    sendMessageMutation.mutate({
      sessionId: sessionId || undefined,
      message: input,
      diagnosticContext,
    });

    setInput('');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] shadow-xl flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Support Assistant</CardTitle>
            <CardDescription className="text-xs">
              Ask questions about your vehicle
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Hi! How can I help you today?</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.confidence !== undefined && message.role === 'assistant' && (
                <div className="mt-1 flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className="text-xs py-0 h-5"
                  >
                    {Math.round(message.confidence * 100)}% confidence
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}

        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg rounded-bl-none">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <form onSubmit={handleSendMessage} className="border-t p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sendMessageMutation.isPending}
            className="text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={sendMessageMutation.isPending || !input.trim()}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          💡 Tip: Ask about symptoms, maintenance, or repairs
        </p>
      </form>
    </Card>
  );
}
