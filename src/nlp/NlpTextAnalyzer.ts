import natural, { Tokenizer } from "natural";
import {FlaggedText} from './flaggedText';
import { NlpAnalysis } from "./NlpAnalysis";
import {SpellCheckDictionary } from "./spellCheckDictionary";
import { WordOverridesMap } from "./wordOverridesMap";
import { TextSentiment } from "./textSentiment";

declare module "natural" {

  class SentenceTokenizer  {
      tokenize(text: string) : string[];
  }
}

declare module "natural" {
  class SentimentAnalyzer {
    constructor(language: string, stemmer: any, type: string);
    getSentiment(words: string[]) : number;
  }
}
export class NlpTextAnalyzer { 
  private static  NEUTRAL_THRESHOLD : number = 0.05;

  static NegativeWords: Set<string> = new Set<string>(["depression", "depressed", "sad", "kill", "suicide", "alcohol", "drink", "shot"]);
  public static getFlaggedText(text: string, wordSet: Set<string>) : FlaggedText[] {
    let flaggedTextInstances: FlaggedText[]= [];  
    let sentenceTokenizer : natural.Tokenizer = new natural.SentenceTokenizer();
    let sentences: string[] = sentenceTokenizer.tokenize(text);
    sentences.forEach((sentence: string, sentenceIndex: number) => {
        let wordTokenizer : natural.Tokenizer = new natural.TreebankWordTokenizer();
        let words: string[] = wordTokenizer.tokenize(sentence);
        words.forEach((word: string, wordIndex: number) => {
            if (wordSet.has(word.toLowerCase())) {  
              let flaggedText: FlaggedText = new FlaggedText(sentence, sentenceIndex, word, wordIndex);
              flaggedTextInstances.push(flaggedText);
            }
        });
    });
    console.log(flaggedTextInstances)
    return flaggedTextInstances;
  }

  public static getNormalizedText(text: string) : string {
    let wordOverridesMap: WordOverridesMap = new WordOverridesMap(); 
    let resultantSentences : string[] = [];
    let alphabeticRegExp : any = /^[a-zA-Z]+$/;
    let spellcheck : natural.Spellcheck = new natural.Spellcheck(SpellCheckDictionary.Corpus);
    let sentenceTokenizer : natural.Tokenizer = new natural.SentenceTokenizer();
    let sentences: string[] = sentenceTokenizer.tokenize(text);
    sentences.forEach((sentence: string, sentenceIndex: number) => {
      // includes punctuation
      let wordTokenizer : natural.Tokenizer = new natural.TreebankWordTokenizer();
      let words: string[] = wordTokenizer.tokenize(sentence);
      let finalWords: string[] = [];
      words.forEach((word: string, wordIndex: number) => {
        let finalWord: string = word;
        if (wordOverridesMap.has(word.toLowerCase())) {
          finalWord = wordOverridesMap.get(word.toLowerCase());
        }

        if (alphabeticRegExp.test(word) && !spellcheck.isCorrect(word.toLowerCase())) {
          let corrections: string[] = spellcheck.getCorrections(word.toLowerCase(), 1);
          if (corrections.length != 0) {
            finalWord = corrections[0];
          }
        }

        finalWords.push(finalWord);
      });

      let finalSentence: string = finalWords.join(' ');
      resultantSentences.push(finalSentence);
    });
  
    let resultantText : string = resultantSentences.join(' ');
    return resultantText;
  }

  
  public static getSentiment(text: string, method: string) : TextSentiment {
    
    let stemmer : natural.Stemmer = natural.PorterStemmer;
    let analyzer :natural.SentimentAnalyzer = new natural.SentimentAnalyzer("English", stemmer, method);
    
      
    let sentenceTokenizer : natural.Tokenizer = new natural.SentenceTokenizer();
    let sentences: string[] = sentenceTokenizer.tokenize(text);
    let lowestSentiment : TextSentiment = new TextSentiment("negative", "", 0, 99999);
    let highestSentiment : TextSentiment = new TextSentiment("positive", "", 0, -99999);

    sentences.forEach((sentence: string, sentenceIndex: number) => {
      console.log(analyzer.getSentiment(["I", "like", "cherries"]));  
      let wordTokenizer : natural.Tokenizer = new natural.TreebankWordTokenizer();
      let words: string[] = wordTokenizer.tokenize(sentence);
      let sentiment: number = analyzer.getSentiment(words);  
      let sentimentText : string = this.getSentimentText(sentiment);
      if (sentiment <= lowestSentiment.sentenceScore)  {
        lowestSentiment = new TextSentiment(sentimentText, sentence, sentenceIndex, sentiment);
      }
      else if (sentiment >= highestSentiment.sentenceScore) {
        highestSentiment = new TextSentiment(sentimentText, sentence, sentenceIndex, sentiment);
      }
    });

    // lowest sentiment takes precedence if the score is negative
    if (lowestSentiment.sentenceScore < 0) {
      return lowestSentiment;
    }

    return highestSentiment;
  }

  private static getSentimentText(sentiment: number) : string {
    if (Math.abs(sentiment) > this.NEUTRAL_THRESHOLD) {
      return "Negative";
    }
    else if (sentiment > this.NEUTRAL_THRESHOLD) {
      return "Positive";
    }

    return "Neutral";
  }

  public static getAnalysis(text: string) : NlpAnalysis {
    let normalizedText : string = this.getNormalizedText(text);
    let negativeWordInstances : FlaggedText[] = this.getFlaggedText(normalizedText, NlpTextAnalyzer.NegativeWords);
    let afinnSentiment: TextSentiment = this.getSentiment(normalizedText, "afinn");
    let senticonSentiment: TextSentiment = this.getSentiment(normalizedText, "senticon");
    let patternSentiment: TextSentiment = this.getSentiment(normalizedText, "pattern");

    let analysis: NlpAnalysis = new NlpAnalysis(text, normalizedText, negativeWordInstances, afinnSentiment, senticonSentiment, patternSentiment);
    return analysis;
    
  }

}