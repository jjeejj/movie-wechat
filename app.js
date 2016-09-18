'use strict';

var Koa = require('koa');

var wechat = require('./wechat/g.js');

var config = require('./config');

var weixin = require('./weixin');



var app = Koa();

//中间件
app.use(wechat(config.wechat));


app.listen(3001);

console.log('koa server is starting on 3001........');


