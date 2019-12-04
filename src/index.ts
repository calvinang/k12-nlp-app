import express from "express";
import path from "path";
import bodyParser from "body-parser";
import natural, { Tokenizer } from "natural";
import { NlpAnalysis } from "./nlp/NlpAnalysis";
import { NlpTextAnalyzer } from "./nlp/NlpTextAnalyzer";
const port = 8080; // default port to listen

var app = express();

// set the view engine to ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// use res.render to load up an ejs view file
// define a route handler for the default home page
app.get( "/", ( req: any, res: any ) => {
    req;
    res.render('./pages/index'); 
} );

app.post("/submit-essay", (req: any, res: any) => { 
    let essayText: string = req.body.essayText;
    console.log(essayText);
    let analysis: NlpAnalysis = NlpTextAnalyzer.getAnalysis(essayText);
 
    res.render('./pages/analyze', analysis);
    
});
// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );