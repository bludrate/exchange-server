"use strict";

var request = require('request');

module.exports = function(id) {
  return new Promise(function(resolve, reject) {
      request.post({
          headers: {
              'content-type' : 'application/x-www-form-urlencoded',
              'referer' : 'http://minfin.com.ua/currency/auction/usd/buy/kiev/',
              Host:' minfin.com.ua',
              Connection:' keep-alive',
              Pragma:' no-cache',
              Origin:'http://minfin.com.ua',
              'User-Agent':' Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36',
              'Content-Type':' application/x-www-form-urlencoded',
              Accept: '*/*',
              Referer: 'http://minfin.com.ua/currency/auction/usd/buy/kiev/',
              Cookie:'minfincomua_region=0;'
          },
          url:     'http://minfin.com.ua/modules/connector/connector.php?action=auction-get-contacts&bid=' + (Number(id) + 1) + '&r=true',
          body:    "bid=" + id + "&action=auction-get-contacts&r=true"
      }, function(error, response, body){
          if (error || response.statusCode !== 200) {
              reject(error || response.statusCode);
          } else {
              resolve(JSON.parse(body).data);
          }
      });
  });
};