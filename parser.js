'use strict';

var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var Logger = require('./logger');
var logger = new Logger('log.txt');

//http://minfin.com.ua/modules/connector/connector.php?action=auction-get-contacts&bid=11908407&r=true

var url = "http://minfin.com.ua/currency/auction/{currency}/{method}/{city}/";

var startTime = 0;

var stepTime = 300; //step between requests in ms

var methods = ['buy', 'sell'];

var currencies = ['usd', 'eur', 'rub', 'other'];

var eurUsd = ['usd-eur', 'eur-usd'];

var rateCurrencies = ['usd', 'eur', 'rub'];

var cities = ['kiev','kharkov','vinnitsa','dnepropetrovsk','donetsk','zhitomir','zaporozhye','ivano-frankovsk','kievobl','kirovograd','lugansk','lutsk','lvov','nikolaev','odessa','poltava','rovno','sumy','ternopol','uzhgorod','kherson','khmelnitskiy','cherkassy','chernigov','chernovtsy'];

class Parser {
    constructor() {
        var allDataCount = methods.length * ( currencies.length + eurUsd.length) * cities.length;
        this.data = {
            ready: -allDataCount + 1,
            auction: {},
            rates: {}
        };

        this.refreshTime =  allDataCount * 1000; //one request per second

        this.start();
        logger.log('parser started');
    }

    start() {
        cities.forEach( (city) => {
            this.data.auction[city] = {};
            this.data.rates[city] = {};
            currencies.forEach( (cur) => {
                this.data.auction[city][cur] = {};
                methods.forEach( (method) => {
                    setTimeout(() => {
                        this.init(city, cur, method);
                    }, startTime);

                    startTime+= stepTime;
                })
            });

            eurUsd.forEach( (cur) => {
                this.data.auction[city][cur] = {};
                setTimeout(() => {
                    this.init(city, cur, 'exchange');
                }, startTime);

                startTime+= stepTime;
            })
        });
    }

    init(city, currency, method) {
        this.getData(city, currency, method).then(() => {
            this.data.ready++;
            setTimeout(this.init.bind(this, city, currency, method), this.refreshTime);
        }, (err) => {
            logger.log('Error: getData', err);
            setTimeout(this.init.bind(this, city, currency, method), stepTime);
        });
    }

    loadPage(url) {
        return new Promise((resolve, reject) => {
            request({
                url: url,
                encoding: null,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36"
                }
            }, function (err, res, body) {
                if (err || res.statusCode !== 200) {
                    reject(err || url + '  statusCode: ' + res.statusCode);
                } else {
                    resolve(cheerio.load(body, {decodeEntities: false}));
                }
            });
        });
    }

    processData(city, currency, method, $) {
        if (method === methods[0] && ~rateCurrencies.indexOf(currency)) {
            this.data.rates[city][currency] = processRates($);
        }

        this.data.auction[city][currency][method] = processAuction($);

        return Promise.resolve();
    }

    getData(city, currency, method) {
        return this.loadPage(generateUrl(city, currency, method)).then(this.processData.bind(this, city, currency, method));
    }
}

function processAuction($) {
    var res = [];
    var rows = $('.js-deal-row-default');

    debugger;

    for (let i = 0, l = rows.length; i < l; i++) {
        res.push({
            rate: parseRate(rows[i]),
            time: parseTime(rows[i]),
            sum: parseSum(rows[i]),
            message: parseMessage(rows[i]),
            phone: parsePhone(rows[i])
        });
    }

    return res;

    function parsePhone(row) {
        var children = $('.au-dealer-phone', row)[0].children;

        return {
            number: children[0].data.trim().replace('&nbsp;', ' ') + 'XXX-X' + children[2].data.trim(),
            bid: children[1].attribs['data-bid-id']
        };
    }

    function parseMessage(row) {
        return $('.au-msg-wrapper', row)[0].children[0].data.trim();
    }

    function parseSum(row) {
        var text = $('.au-deal-sum', row)[0].children[0].data;
        var number = text.replace(/ /g, '');

        return Number(number);
    }

    function parseTime(row) {
        return $('.au-deal-time', row)[0].children[0].data;
    }

    function parseRate(row) {
        var text = $('.au-deal-currency', row)[0].children[0].data;
        return Number(text.replace(',','.'));
    }
}

function processRates($) {
    function parseRate(elem) {
        var text = elem.children[2].data;
        return parseFloat(text.trim().replace(',','.'));
    }

    var elems = $('.au-mid-buysell');

    return {
        buy: parseRate(elems[0]),
        sell: parseRate(elems[1])
    };
}

function generateUrl(city, currency, method) {
    return url.replace('{currency}', currency)
        .replace('{method}', method)
        .replace('{city}', city);
}

module.exports = Parser;

/*
* var mfSelectJSON = {
 "dfMfs0":{
 "name":"Все районы",
 "tags":[""]
 },
 "dfMfs1":{
 "name":"Голосеевский",
 "tags":["Голосеево","Дворец Украина","Палац Украіна","Палац Україна","Дворец Україна","Палац Украина","Теремки","Магелан","Т Е Р Е М К И","ТЦ Магелан","Олимпийская","Голосеевский","Демеевка","ВДНХ","Васильковская","Лыбидская","Лыбедская","океанплаза","OCEAN PLAZA","OCEANPLAZA","Либідська"]
 },
 "dfMfs2":{
 "name":"Дарницкий",
 "tags":["Дарницкий","Дарница","Дарницький","вырлица","черниговская, Дарница","Красный хутор","Бровары","рынок Юность","Юность","Позняки","П О З Н Я К И","харьковский","Гмыри","Алладин","Осокорки","Харёк"]
 },
 "dfMfs3":{
 "name":"Деснянский",
 "tags":["Деснянский","Троещино","Троещина","трощина","троя","деснянский","бальзака","флоренция"]
 },
 "dfMfs4":{
 "name":"Днепровский",
 "tags":["Днепровский","Лесная","Магнитагорская","воскресенка","Русановка","Лесная","Левобережная","Расковой","Ленинградская площадь","Ленинградская","Березняки"]
 },
 "dfMfs5":{
 "name":"Оболонский",
 "tags":["Оболонский","Куреневка","Оболонь","Минская","O B O L O N J","Героев Днепр","Героев Днепра","Луговая","Автозаводская","Минская","Пл. Шевченка","оболонь центр","петровка"]
 },
 "dfMfs6":{
 "name":"Печерский",
 "tags":["Печерский","Печерск","Дружбы Народов","центр, печерск.","Палац Спорту","Gulliver","Печерск, Голосеево","Бассейная"]
 },
 "dfMfs7":{
 "name":"Подольский",
 "tags":["Подольский","Подол","Петровка","КОНТРАКТОВАЯ","Воздвиженская","ул. Межигорская","подол куренёвка"]
 },
 "dfMfs8":{
 "name":"Святошинский",
 "tags":["Борщаговка","Героев Космоса","Нивки, Святошин","Академгородок","Святошинский","Святошино","Житомирская","Академ-Нивки","Академгородок","Окружная","Ирпень","Буча","софиевская борщаговка","ЖК.София"]
 },
 "dfMfs9":{
 "name":"Соломенский",
 "tags":["Соломенский","Соломенка","Интер","Вокзальная","Цирк","КПИ","Севастопольская","Большевик","Гарматная","караваевы дачи","Протасов","Гринченка","индустриальный","Шулявка","ЖД","Лепсе","ушинского","радиорынок","Саксаганського","Чоколовка","Турецкий городок","отрадный"]
 },
 "dfMfs10":{
 "name":"Шевченковский",
 "tags":["Куреневка","Крещатик","Артема","Шевченковский","Берестейская","Золотые ворота","Победы","Университет","Лукьяновка","НИВКИ", "Сырец,","Экскаваторная","Майдан","Хрещатик","Центр","Льва Толстого","НивкиСырец","Дорогожичи","Жилянская","Большая Житомирская","дорогожичи","цирк"]
 }*/