import { Injectable } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class ClaudeProvider
  implements AIProvider {

  async generateText(
    prompt: string,
  ): Promise<string> {

    return '';
  }

}
