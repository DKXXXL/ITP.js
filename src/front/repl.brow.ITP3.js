//@flow

import {CONSOLE, defaultprintDef, defaultprintScript} from "./console.ITP3"
import {    
    parserForTTactic,
    parserForInstr} from "./parser.ITP3"
import {debug, warn} from "../globalDef"
import type {ID, Generator_, Dict, Option, IO, GR} from "../globalDef"
import type {Input, Output, Error, TTactic, stdIO, INSTRUCTION} from "./console.ITP3.js"

// const Fiber = require('fibers');

let INPUTSCRIPT = "";

const scriptGet : (() => string) = () => INPUTSCRIPT;

// const fiberY = () => {
//     const ret = Fiber.yield();
//     INPUTSCRIPT = INPUTSCRIPT + ret;
//     return ret;
// }
// type Input<K> = string => IO<K>;

const parserTTactic : string => TTactic = parserForTTactic;
const parserInstr : string => INSTRUCTION = parserForInstr;

const ask_for_input : Input<string> = 
    (s) => 
        function*() {
            const ret : string = yield;
            INPUTSCRIPT = INPUTSCRIPT + ret;
            return ret;
        }

const ask_for_input_tactic : Error => Input<TTactic> =
    (warn) =>
    (s) => 
        function*() {
            let ret_:string = "";
            let ret : TTactic | typeof undefined = undefined;
            while(ret === undefined) {
            try{
                
                ret_ = yield* ask_for_input(s)();
                ret = parserTTactic(ret_);
            } catch(err) {
                warn("Parsing TTactic failed");
                warn(JSON.stringify(err));
                continue;
            }

            }
        debug("Parsing TTactic success");
        return ret;

    }
const ask_for_input_instr : Error => Input<INSTRUCTION> =
    (warn) =>
    (s) => 
        function*() {
            let ret_:string = "";
            let ret : INSTRUCTION | typeof undefined = undefined;
            while(ret === undefined) {
            try{
                ret_ = yield* ask_for_input(s)();

                ret = parserInstr(ret_);
                if(ret === undefined) {
                    continue;
                }
            } catch(err) {
                warn("Parsing Instruction failed");
                warn(JSON.stringify(err));
                continue;
            }
            
        }
        debug("Parsing Instruction success");
        return ret;
    }

const consoleIO : (Output, Error) => IO<typeof undefined> = 
    (stdoutput, stderr) => 
        () => CONSOLE(
            {
                i : ask_for_input_tactic(stderr),
                iI :ask_for_input_instr(stderr),
                o : stdoutput,
                e : stderr,
                scripts : scriptGet,
            }
        );



module.exports = { consoleIO };

