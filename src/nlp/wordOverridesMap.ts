export class WordOverridesMap extends Map<string, string> {
  // https://en.wikipedia.org/wiki/Wikipedia:List_of_English_contractions
  constructor() {
    super();
    this.set("n't", "not");
    this.set("'d", "would");
    this.set("'s", "is");
    this.set("'ve", "have");
    this.set("'ll", "wlll");
    this.set("'m", "am");
    this.set("'re", "are");
    this.set("kil", "kill");

    // takes care of "won't" case - a bit of a hack but "wo" is not a word anyway
    this.set("wo", "will")   

    // takes care of "can't" case
    this.set("ca", "can")
  }
}