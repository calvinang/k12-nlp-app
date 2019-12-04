
import { FlaggedText } from "./flaggedText";


export class NlpAnalysis {
  constructor(public originalText: string, 
    public spellCheckedText: string,
    public negativeTextInstances:FlaggedText[],
    public satTextInstances: FlaggedText[], 
    public afinnSentiment: string,
    public senticonSentiment: string,
    public patternSentiment: string) 
    {}

}