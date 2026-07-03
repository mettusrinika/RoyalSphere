import { Injectable } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class GeminiProvider
  implements AIProvider {

  async generateText(
    prompt: string,
  ): Promise<string> {

    /**
     * Future:
     * Gemini SDK
     */

    return '';
  }

}