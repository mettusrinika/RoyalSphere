export interface AIProvider {

  generateText(
    prompt: string,
  ): Promise<string>;

  generateEmbedding?(
    text: string,
  ): Promise<number[]>;

}