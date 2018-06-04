const ParserC = require("parsimmon");

const optWS = ParserC.optWhitespace;
const WS = ParserC.whitespace;

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
        App : (r) => r.Value.sepBy1(WS).wrap(optWS, optWS).wrap(ParserC.string("("), ParserC.string(")")).map(
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
        Cmd : (r) => ParserC.alt(r.intro, r.apply, r.check, r.conv, r.letTerm, r.idtac)
        intro : () => ParserC.string("intro").result({type : "intro"}),
        apply : () => ParserC.seqMap(
                optWS.then(ParserC.string("apply")).skip(optWS),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(2),
                (icon, xs) => {type : "apply", caller : xs[0], callee : xs[1]}
            ),
        check : () => ParserC.seqMap(
                optWS.then(ParserC.string("check")).skip(optWS),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(1),
                (icon, xs) => {type : "check", term : xs[0]}
            ),
        conv : () => ParserC.seqMap(
                optWS.then(ParserC.string("conv")).skip(optWS),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(1),
                (icon, xs) => {type : "conv", term : xs[0]}
            ),        
        letTerm : () => ParserC.seqMap(
                optWS.then(ParserC.string("letterm")).skip(WS),
                langTerm.Variable.wrap(optWS, WS).skip(ParserC.string(":=").skip(optWS)),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(1),
                (icon, vname, vbinding) => {type : "let", bind : toID(vname), term : vbinding[0]}

        ),
        idtac : () => ParserC.string("idtac").result({type: "idtac"})
    }
);

const langTactic = ParserC.createLanguage(
    {



    }
)


const langTTactic = ParserC.createLanguage({



})

const langTTactic = ParserC.createLanguage({
    
})