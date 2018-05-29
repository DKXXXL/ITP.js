
const repl = require('repl');

const replServer = repl.start({ prompt: '> ' });

// I need first class continuation

let onePromptEnd = undefined;
let continueOnConsole = undefined;
let currentInput = undefined;
let waitForPrompt = undefined;
// string -> string

//function inputgeneralHandler() {
//        onePromptEnd(cont(input));
//        return input;
//        
//}
//

//function myEval(cmd, context, filename, callback) {
//  // callback(null, cmd);
//  onePromptEnd = function(cc) {
//      continueOnConsole = cc;
//      callback();
//  };
//  continueOnConsole(cmd);
//  
//}

//function* inputgeneralHandlerGen(){
//    while(true){
//        onePromptEnd(cont(input));
//        const hint = yield input;
//    }
//}

async function inputgeneralHandler(s){
    let C = undefined;
    const input = await (new Promise(cont => continueOnConsole = cont;))
    return input;
}

function inputggg(s) {
    const input = inputgeneralHandler(s);
    if(typeof input === 'string') {
        return input;
    } else {
        waitForPrompt();
    }

}


function myEval(cmd, context, filename, callback) {
  // callback(null, cmd);
  waitForPrompt = function(cc) {
      continueOnConsole = cc;
      callback();
  };
  continueOnConsole(cmd);
}

function test() {
    while(true) {
        
    }
}