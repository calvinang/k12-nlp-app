
import { FlaggedText } from "./flaggedText";
import { TextSentiment } from "./textSentiment";


export class NlpAnalysis {
  constructor(public originalText: string, 
    public normalizedText: string,
    public negativeTextInstances:FlaggedText[],
    public afinnSentiment: TextSentiment,
    public senticonSentiment: TextSentiment,
    public patternSentiment: TextSentiment) 
    {}

}