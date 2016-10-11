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
			data = JSON.stringify(data,null,4);//字符串话----格式化排版

			return utils.writeFileAsync(wechat_file,data);//返回一个Promise
		}
	},
	//日志的配置
	log4js:{
		appenders:[
			{
				type:'conslole',//控制台输入
				category:'conslole'
			},
			{
				type:'dateFile',//文件输出
				filename:'./logs/data/access',
				category:'log_date',
				pattern:'-yyyy-MM-dd.log'

			},
			{
				type:'file',
				filename:'./logs/file/access',
				maxLogSize:1024,
				category:'log_file',
				backups:3
			}
		],
		replaceConsole:true,
		levels::{
			'log_file':'ALL',
			'log_date':'ALL',
		}
	}
}

module.exports = config;