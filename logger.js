"use strict";

var fs = require('fs');
var df = require('./dateFormat');

class Logger {
    constructor(fileName){
        this.fileName = fileName;
    }

    log(title, data) {
        console.log.apply(null, Array.prototype.slice.call(arguments));

        this.writeFile(Array.prototype.map.call(arguments, JSON.stringify).join(': '));
    }

    writeFile(data) {
        var time = new Date();
        fs.appendFile(this.fileName, '(' + df(time, 'isoDateTime') + ') ' + data + '\n',  function(err) {
            if (err) {
                return console.error(err);
            }
        });
    }
}

module.exports = Logger;