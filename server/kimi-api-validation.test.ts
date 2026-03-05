import { describe, it, expect } from 'vitest';
import { ENV } from './_core/env';

describe('Kimi API Key Validation', () => {
  it('should have KIMI_API_KEY configured', () => {
    expect(ENV.kimiApiKey).toBeDefined();
    expect(ENV.kimiApiKey.length).toBeGreaterThan(0);
  });

  it('should validate Kimi API key format', () => {
    // Kimi API keys typically start with 'sk-' or similar
    expect(ENV.kimiApiKey).toMatch(/^[a-zA-Z0-9\-_]+$/);
  });

  it('should test Kimi API connection', async () => {
    if (!ENV.kimiApiKey) {
      console.warn('Skipping Kimi API test - key not configured');
      return;
    }

    try {
      console.log('Testing Kimi API with key:', ENV.kimiApiKey.substring(0, 20) + '...');
      const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.kimiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshot-v1-128k',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant.',
            },
            {
              role: 'user',
              content: 'Say "OK" in one word.',
            },
          ],
          temperature: 0.1,
          max_tokens: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Kimi API Error:', data);
      }

      expect(response.ok).toBe(true);
      expect(data.choices).toBeDefined();
      expect(data.choices[0]?.message?.content).toBeDefined();
    } catch (error) {
      console.error('Kimi API Connection Error:', error);
      throw error;
    }
  }, { timeout: 30000 });
});
