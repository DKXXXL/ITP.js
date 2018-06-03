const ParserC = require("parsimmon");

const optWS = ParserC.optWhitespace;

const foldToApp = (xs) => xs.reduce((f, x) => {type : "apply", fun : f, arg : x});

const numberChar = "1234567890";
const abt = "qwertyuiopasdfghjklzxcvbnm";
const symbolChar = "!@#$%^&-_+="


const langTerm = ParserC.createLanguage(
    {
        Value : (self) => ParserC.alt(self. U1, self. U0, self.Lambda, self.Pi, self.App, self.Variable),
        U1 : () => ParserC.string("**").result({type: "U1"}),
        U0 : () => ParserC.string("*").result({type: "U0"}),
        Lambda : (r) => 
            ParserC.seqMap(
                ParserC.string("\\\\").then(optWS).then(r.Variable).skip(optWS).skip(ParserC.string(":"))
                optWS.then(r.Value).skip(optWS).skip(ParserC.string(",")),
                optWS.then(r.Value),
                (metaid, declty, body) => {type: "lambda", bind : toID(metaid), iT : declty, body : body}
            ),
        Pi : (r) => 
            ParserC.seqMap(
                ParserC.string("forall").then(optWS).then(r.Variable).skip(optWS).skip(ParserC.string(":"))
                optWS.then(r.Value).skip(optWS).skip(ParserC.string(",")),
                optWS.then(r.Value),
                (metaid, declty, body) => {type: "pi", bind : toID(metaid), iT : declty, body : body}
            ),
        App : (r) => ParserC.string("(").then(optWS).then(r.Value.sepBy1(optWS)).skip(optWS).skip(")").map(
                                        xs => {
                                            if(xs.length === 1) {
                                                return xs[0];
                                            } else {
                                                // xs.length > 1
                                                return foldToApp(xs);
                                            }
                                        } ),
        Variable : () => ParserC.oneOf(numberChar + abt + symbolChar).atLeast(1).map(xs => xs.reduce((x,y) => x + y)).map(x => {type:"var", n : toID(x)})               
    }
)

const langCommand = ParserC.createLanguage(
    {
        intro : pc => ParserC.string("intro").result({type : "intro"}),


    }
)

const langTactic = ParserC.createLanguage(
    {



    }
)


const langTTactic = ParserC.createLanguage({



})