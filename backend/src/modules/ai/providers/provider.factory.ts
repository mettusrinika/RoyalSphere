import { Injectable } from '@nestjs/common';

import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { ClaudeProvider } from './claude.provider';
import { LocalProvider } from './local.provider';

@Injectable()
export class AIProviderFactory {

  constructor(
    private readonly openAI: OpenAIProvider,
    private readonly gemini: GeminiProvider,
    private readonly claude: ClaudeProvider,
    private readonly local: LocalProvider,
  ) {}

  getProvider(
    provider: 'openai' | 'gemini' | 'claude' | 'local',
  ) {

    switch (provider) {

      case 'openai':
        return this.openAI;

      case 'gemini':
        return this.gemini;

      case 'claude':
        return this.claude;

      default:
        return this.local;

    }

  }

}