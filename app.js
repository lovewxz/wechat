'use strict'

var Koa = require('koa');
var path = require('path');
var Wechat = require('./wechat/g'); 

var util = require('./libs/util');
var config = require('./config');
var weixin = require('./wx/weixin');



var app = new Koa();

app.use(Wechat(config.wechat,weixin.reply));

app.listen(1234);
console.log('listen:1234');