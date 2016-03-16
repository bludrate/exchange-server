"use strict";

var express = require('express');
var compress = require('compression');
var Parser = require('./parser');
var getNumber = require('./getNumber');
var Logger = require('./logger');

var logger = new Logger('./log.txt');
var app = express();
var parser = new Parser();

var port = 9000;

app.use(compress());

/**
 * @param res {Object}
 * @param req {Object}
 * @param req.query {Object}
 * @param req.query.currency {String}
 * @param req.query.city {String}
 * @param req.query.type {String}
 */
app.get('/auction', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Content-Type', 'application/json');

    var currency = req.query.currency;
    var city = req.query.city;
    var type = req.query.type;

    res.send(JSON.stringify( parser.data.auction[city][currency][type] ));
});

app.get('/data', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(parser.data));
});

app.get('/rates', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(parser.data.rates[ req.query.city ]));
});

app.get('/number', function(req, res) {
    var id = req.query.userId;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Content-Type', 'application/json');

    getNumber(id).then(function(number) {
        res.send(number);
    }, function(error) {
        logger.log('Get number', error);
    });
});

app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});