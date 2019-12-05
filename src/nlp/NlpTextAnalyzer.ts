import natural, { Tokenizer, SentimentAnalyzer } from "natural";
import {FlaggedText} from './flaggedText';
import { NlpAnalysis } from "./NlpAnalysis";
import {SpellCheckDictionary } from "./spellCheckDictionary";
import { WordOverridesMap } from "./wordOverridesMap";
import { TextSentiment } from "./textSentiment";
import nodemailer from "nodemailer";

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
  private static sentimentAnalyzers: Map<string, natural.SentimentAnalyzer> 
    = new Map<string, natural.SentimentAnalyzer>();

  static NegativeWords: Set<string> = new Set<string>(["depression", "depressed", "sad", "kill", "suicide", "alcohol", "drink", "shot", 
    "toxic", "stress", "stressed", "misery", "hurts", "horrid", "failure", "pain", "help"]);
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


        if (alphabeticRegExp.test(finalWord) && !spellcheck.isCorrect(finalWord.toLowerCase())) {
          let corrections: string[] = spellcheck.getCorrections(finalWord.toLowerCase(), 1);
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
    
    if (NlpTextAnalyzer.sentimentAnalyzers.size == 0) {
      let stemmer : natural.Stemmer = natural.PorterStemmer;

      
      let afinnSentimentAnalyzer :natural.SentimentAnalyzer = new natural.SentimentAnalyzer("English", stemmer, "afinn");
      let senticonSentimentAnalyzer :natural.SentimentAnalyzer = new natural.SentimentAnalyzer("English", stemmer, "senticon");
      let patternSentimentAnalyzer :natural.SentimentAnalyzer = new natural.SentimentAnalyzer("English", stemmer, "pattern");
      NlpTextAnalyzer.sentimentAnalyzers.set("afinn", afinnSentimentAnalyzer);
      NlpTextAnalyzer.sentimentAnalyzers.set("senticon", senticonSentimentAnalyzer);
      NlpTextAnalyzer.sentimentAnalyzers.set("pattern", patternSentimentAnalyzer);
    }

    let analyzer : SentimentAnalyzer = NlpTextAnalyzer.sentimentAnalyzers.get(method);

    let sentenceTokenizer : natural.Tokenizer = new natural.SentenceTokenizer();
    let sentences: string[] = sentenceTokenizer.tokenize(text);
    let lowestSentiment : TextSentiment = new TextSentiment("negative", "", 0, 99999);
    let highestSentiment : TextSentiment = new TextSentiment("positive", "", 0, -99999);

    sentences.forEach((sentence: string, sentenceIndex: number) => {
      let wordTokenizer : natural.Tokenizer = new natural.TreebankWordTokenizer();
      let tokens: string[] = wordTokenizer.tokenize(sentence);

      // remove punctuation
      let alphabeticRegExp : any = /^[a-zA-Z]+$/;
      
      let words: string[] = [];
      tokens.forEach((token: string) => {
        if (alphabeticRegExp.test(token)) {
          words.push(token);
        }
      });
      
      let filteredSentence: string = words.join(' ');

      let sentiment: number = analyzer.getSentiment(words);  
      let sentimentText : string = this.getSentimentText(sentiment);

      if (sentiment <= lowestSentiment.sentenceScore)  {
        lowestSentiment = new TextSentiment(sentimentText, filteredSentence, sentenceIndex, sentiment);
      }
      
      if (sentiment >= highestSentiment.sentenceScore) {
        highestSentiment = new TextSentiment(sentimentText, filteredSentence, sentenceIndex, sentiment);
      }
    });

    // lowest sentiment takes precedence if the score is negative. If the score is considered Neutral, it will be reported
    // if it is < 0, thereby signifying a sentiment that leans towards being negative 
    if (lowestSentiment.sentenceScore < 0) {
      return lowestSentiment;
    }
 
    return highestSentiment;
  }

  private static getSentimentText(sentiment: number) : string {
    if (sentiment < 0 && Math.abs(sentiment) > this.NEUTRAL_THRESHOLD) {
      return "Negative";
    }
    else if (sentiment > this.NEUTRAL_THRESHOLD) {
      return "Positive";
    }

    return "Neutral";
  }

  public static sendEmail(analysis: NlpAnalysis) {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'k12testnlp@gmail.com',
        pass: 'gosqa!18'
      }
    });

    let negativeWordTextStrings : string[] = [];
    analysis.negativeTextInstances.forEach((negativeTextInstance: FlaggedText) => {
      negativeWordTextStrings.push(`[${negativeTextInstance.sentence}] ${negativeTextInstance.word}`)
    });

    let negativeWordText: string = negativeWordTextStrings.join('\n'); 
    
    let mailOptions = {
      from: 'k12testnlp@gmail.com',
      to: 'k12testnlp@gmail.com',
      subject: 'Essay Analysis Notification',
      text: `Dear Teacher,
      
      This message has been sent to inform you that an essay exhibiting potentially negative content has been submitted. Specifics are given below.

      Original Text:
      ${analysis.originalText}

      Normalized Text (spell-checked and filtered):
      ${analysis.normalizedText}

      Negative Words:
      ${negativeWordText}

      Sentiment Analysis:
      
      Afinn Model: ${analysis.afinnSentiment.sentiment} [${analysis.afinnSentiment.sentenceScore} ${analysis.afinnSentiment.sentence}]
      Senticon Model: ${analysis.senticonSentiment.sentiment} [${analysis.senticonSentiment.sentenceScore} ${analysis.senticonSentiment.sentence}]
      Pattern Model: ${analysis.patternSentiment.sentiment} [${analysis.patternSentiment.sentenceScore} ${analysis.patternSentiment.sentence}]
      `
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  public static getAnalysis(text: string) : NlpAnalysis {
    let normalizedText : string = this.getNormalizedText(text);
    let negativeWordInstances : FlaggedText[] = this.getFlaggedText(normalizedText, NlpTextAnalyzer.NegativeWords);
    let afinnSentiment: TextSentiment = this.getSentiment(normalizedText, "afinn");
    let senticonSentiment: TextSentiment = this.getSentiment(normalizedText, "senticon");
    let patternSentiment: TextSentiment = this.getSentiment(normalizedText, "pattern");

    let analysis: NlpAnalysis = new NlpAnalysis(text, normalizedText, negativeWordInstances, afinnSentiment, senticonSentiment, patternSentiment);

    if (negativeWordInstances.length > 0 || afinnSentiment.sentiment == "Negative" || 
      senticonSentiment.sentiment == "Negative" || patternSentiment.sentiment == "Negative") {
        this.sendEmail(analysis);
        analysis.emailSent = true;
    }
    return analysis;
    
  }

}