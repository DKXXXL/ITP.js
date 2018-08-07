import {debug, warn} from "../globalDef"
import {consoleIO} from "./repl.brow.ITP3"

const repl = require('repl');

const stdoutput = (str) => (process.stdout.write(str + "\n"), str)
const stderr = (str) => (process.stderr.write(str + "\n"), str)

// consoleCo : GR<UDEF>
const consoleCo = consoleIO(stdoutput, stderr)();
// Initialization 
consoleCo.next();

function delegateConsole(cmd, context, filename, callback){
    debug("newcmd");
    consoleCo.next(cmd);
    callback(null, "");
}

const replServer = repl.start({ prompt: '> ', eval: delegateConsole });
