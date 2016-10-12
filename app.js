'use strict';

var Koa = require('koa');

var log4js = require('log4js');//日志

var wechat = require('./wechat/g.js');

var config = require('./config');

var reply = require('./wx/reply');



var app = Koa();

//日志
// log4js.configure(config.log4js);
// var logger = log4js.getLogger('log_date');
// logger.setLevel('INFO');
// app.use(log4js.connectLogger(logger,{level:logger.levels.INFO}));


//中间件
app.use(wechat(config.wechat));


app.listen(3001);

console.log('koa server is starting on 3001........');


