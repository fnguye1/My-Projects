#!/bin/sh
':' //; exec "$(command -v nodejs || command -v babel-node)" "$0" "$@"

let fs = require ('fs')

if (process.argv.length <= 2) {
console.log("Usage: " + __filename + " SOME_FILE")
process.exit(-1)
}

let filename = process.argv[2]

fs.readFile(filename, 'utf8', function(err, data) {
  if (err) throw err
  console.log('Print: ' + filename + ' content....')
  console.log(data)
})
