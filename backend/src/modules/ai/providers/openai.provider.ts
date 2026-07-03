import { Injectable } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class OpenAIProvider
  implements AIProvider {

  async generateText(
    prompt: string,
  ): Promise<string> {

    /**
     * Future:
     * OpenAI SDK
     */

    return '';
  }

}