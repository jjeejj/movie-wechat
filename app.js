'use strict';

var Koa = require('koa');

var log4js = require('log4js');//日志

var wechat = require('./wechat/g.js');

var config = require('./config');

var reply = require('./wx/reply');

var tpl = require('./wechat/tpl');//模板文件
var ejs = require('ejs');

var Wechat = require('./wechat/wechat');//Wechat对象

var util = require('./wechat/util');



var app = Koa();

//日志
// log4js.configure(config.log4js);
// var logger = log4js.getLogger('log_date');
// logger.setLevel('INFO');
// app.use(log4js.connectLogger(logger,{level:logger.levels.INFO}));

//html页面
app.use(function *(next) {
	if(this.url.indexOf('/movie') > -1){
		console.log('js sdk 页面');
        console.log('tpl',tpl);
        //实例化Wechat对象
        var wechatApi = new Wechat(config.wechat);
        //获取access_token
        var data = yield wechatApi.fetchAccessToken();

        var access_token = data.access_token;

        var ticketData = yield wechatApi.fetchTicket(access_token,'jsapi');

        var ticket = ticketData.ticket;//授权的票据

        var url = this.href.replace(':8000',''); //qq代理会出现8000端口

        var params = util.sign(ticket,url);

        params.appID = wechatApi.appID;

		this.body = ejs.render(tpl.htmlTpl,params);

		return;
	}

	yield next;

})
//中间件
app.use(wechat(config.wechat));


app.listen(3001);

console.log('koa server is starting on 3001........');


