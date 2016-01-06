#!/bin/sh
':' //; exec "$(command -v nodejs || command -v babel-node)" "$0" "$@"

if (process.argv.length <= 2) {
console.log("Usage: " + __filename + " SOME_PARAM")
process.exit(-1)
}


let args = process.argv.slice(2)
console.log(args)
