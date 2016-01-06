#!/bin/sh
':' //; exec "$(command -v nodejs || command -v babel-node)" "$0" "$@"

let fs = require('fs')


if (process.argv.length <= 2) {
console.log("Usage: " + __filename + " SOME_FILE")
process.exit(-1)
}

let fileName = process.argv[2]

fs.unlink(fileName)
