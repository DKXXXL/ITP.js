import {debug, warn} from "../globalDef"
import {consoleCons} from "./repl.ITP3"

const repl = require('repl');

const stdoutput = (str) => (process.stdout.write(str + "\n"), str)
const stderr = (str) => (process.stderr.write(str + "\n"), str)

const consoleCo = consoleCons(stdoutput, stderr);

consoleCo.run(""); // Initialization.

function delegateConsole(cmd, context, filename, callback){
    debug("newcmd");
    consoleCo.run(cmd);

    callback(null, "");
}

const replServer = repl.start({ prompt: '> ', eval: delegateConsole });
