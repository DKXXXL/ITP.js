# ITP.js
A Theorem Prover. Thanks to *Type Theory and Formal Proof* and *flow.js*. 


[![Build Status](https://travis-ci.org/DKXXXL/ITP.js.svg?branch=master)](https://travis-ci.org/DKXXXL/ITP.js)
[![Coverage Status](https://coveralls.io/repos/github/DKXXXL/ITP.js/badge.svg)](https://coveralls.io/github/DKXXXL/ITP.js)

[Website.](https://dkxxxl.github.io/ITP.js/index.html) or [Try me.](https://dkxxxl.github.io/ITP.js/tryme.html)

## Build
``` 
> git clone ... 
...
> npm run buildtest
...
> node .\lib\front\node.interface.js
    # Now you are running the program 
``` 

## Usage
* I am emulating what Coq does.
* The whole system is upon the library "repl" provided by node.js, so most of the command of node.js is still accessible
* It's a theorem prover for Type Theory, only
* Two modes, normal & proof mode.
* In normal mode, you can
    * addDef *varName*:*Type*.
        * then you would enter proof mode
        * don't forget the period at the end
    * addAxiom *varName*:*Type*.
    * printDef.
    * printScript.
* In proof mode,
    * each sentence you put (because you have to put a peroid at the end of every line, let's call it sentence) are all tactics, and you cannot put in the sentence which was valid in the normal mode
    * idtac. 
        * do nothing
    * check [*term*].
        * by giving the *term* to the requiring type in the goal. The square bracket is necessary.
    * intro.
        * when you are proving a (forall ...) format. It will put the quantified variable into the context.
    * apply [*term*] [*term*].
        * Now you have two subgoals, prove the first term and prove the second term respectively.