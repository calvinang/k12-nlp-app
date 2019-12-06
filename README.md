# k12-nlp-app
K12 NLP Demo App

## Contributors/Ideators
- Rick Parris (Team Lead/Dev)
- Amanda Ferguson
- Calvin Ang (Dev)  
- Casey Swan
- Heather Queen
- Rachael Woolbright

## Background
A Node.js web application that takes in text and performs basic NLP operations on the text, including the following:
- Normalization of text, including spell check and expansion of contractions and other filtering
- Detection of negative key words
- Sentiment analysis using three vocabulary models

Results are reported in the form of feedback following text submission as well as in the form of an e-mail notification should any negative elements be detected in the text. For demo purposes, the destination e-mail address is currently hardwired to k12testnlp@gmail.com.  

## Third-Party APIs Employed
- Node.js https://nodejs.org/en/ - HTTP server using Javascript server-side
- Express.js https://expressjs.com/ - Minimal web framework
- EJS https://ejs.co/ - templating engine similar to syntax employed by classic Microsoft Active Server Pages
- Natural Node https://github.com/NaturalNode/natural - Tokenization, Spellcheck, and Sentiment modules
- Nodemailer https://nodemailer.com/about/ - E-mail module for Node.js applications
- Typescript https://www.typescriptlang.org/ - Object-oriented, type-safe wrapper for Javascript that transpiles to Javascript

## Other Third-Party Elements
- SCOWL http://wordlist.aspell.net/# / https://sourceforge.net/projects/wordlist/files/SCOWL/2019.10.06/scowl-2019.10.06.tar.gz/download?use_mirror=astuteinternet - source for spellcheck word lists

## Known Caveats
- E-mails are sent using gmail's server and are currently blocked 95% of the time by K12's firewall. It worked from the Crowne Plaza in Herndon, VA as well as with a mobile device.
- Entering a single sentence containing only one or two words with no ending punctuation results in a thrown exception. (Tokenizer bug?)
- Spellcheck is limited to the first suggestion

## Potential Enhancements 
- Run-on typo correction ("amstressful" should become "am stressful") 
- Configurable flagged word lists
- Spellcheck corrections based on parts-of-speech rather than simply the first suggestion
