import { Injectable, Logger } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  async generateText(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(
          Number(process.env.AI_PROVIDER_TIMEOUT_MS || 20000),
        ),
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1200,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`Gemini API failed: ${response.status} ${detail.slice(0, 500)}`);
      throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new Error('Gemini returned malformed JSON');
    }
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((part: any) => part?.text || '')
      .join('')
      .trim();

    if (!text) throw new Error('Gemini returned an empty response');
    return text;
  }
}

