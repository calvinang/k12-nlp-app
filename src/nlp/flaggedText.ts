export class FlaggedText {
  //"Sentence " + sentenceIndex + " [" + sentence + "], word " + wordIndex + " [" + word + "] is a flagged word.<br/><br/>"  
  constructor(public sentence: string,
    public sentenceIndex: number,
    public word: string,
    public wordIndex: number) {}
    
}