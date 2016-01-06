#!/bin/sh
':' //; exec "$(command -v nodejs || command -v babel-node)" "$0" "$@"

let fs = require('fs')
let path = require('path');


if (process.argv.length <= 2) {
console.log("Usage: " + __filename + " SOME_PATH")
process.exit(-1)
}


let filePath = process.argv[2]
let isRescr = process.argv[3]

function ls (argv) {
fs.readdir(argv, function(err, files) { 
    for (let file of files) {
        let fileName = path.join(argv + '/', file)
        fs.stat(fileName, function (err, stats) {
            if (err) throw err
            if (stats.isDirectory()){
                if(isRescr == '-R'){
                        ls(fileName)
                }
            } else {
                console.log(fileName)
            }
        }) 
        }
})
}

ls(filePath)
 