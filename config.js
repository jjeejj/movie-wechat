'use strict';

var utils = require('./libs/utils');
var path = require('path');


var wechat_file = path.join(__dirname,'./config/wechat.json');

//配置文件
var config = {
	//微信的配置
	wechat:{
		appID:'wx4551be47f891ede2',
		appsecret:'d4624c36b6795d1d99dcf0547af5443d',
		token:'jjeejj',
		getAccessToken:function () {
			return utils.readFileAsync(wechat_file,'utf8');//返回一个Promise
		},
		saveAccessToken:function (data) { //传进来的是对象
			data = JSON.stringify(data);//字符串话

			return utils.writeFileAsync(wechat_file,data);//返回一个Promise
		}
	}
}

module.exports = config;