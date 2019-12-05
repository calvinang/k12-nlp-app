export class TextSentiment {
  constructor(
    public sentiment: string,     // Positive, negative, or neutral
    public sentence: string,
    public sentenceIndex: number,
    public sentenceScore: number
  ) {}
}