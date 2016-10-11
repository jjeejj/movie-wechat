'use strict';

var sha1 = require('sha1');
var Wechat = require('./wechat');

var getRawBody = require('raw-body');

var utils = require('../libs/utils');

var reply = require('../wx/reply'); //回复处理

//返回微信接入验证的生成器函数
module.exports = function (opts) {

	var wechat = new Wechat(opts);

	return function *(next) {
				var that = this;
				console.log(this.query);
				console.log('-----------------------验证开始');
				var token = opts.token;
				//携带的参数
				var signature = this.query.signature;
				var timestamp = this.query.timestamp;
				var nonce = this.query.nonce;
				var echostr = this.query.echostr;

				//字典排序,变为字符串
				var str = [timestamp,nonce,token].sort().join('');
				//sha1加密
				var sha = sha1(str);
				if(this.method === 'GET'){
					if(sha === signature){
						this.body = echostr +'';
						console.log('-----------------------验证成功');
					}else{
						this.body = 'fail';
						console.log('fail');
						console.log('-----------------------验证失败');
					}
				}else if(this.method === 'POST'){
					/**
					 * 之后的每次请求都会把这些参数带过来
					 * @type {String}
		
					{ 	signature: '40f0128874f1e8c082d2914364a23b79e32af682',
  						timestamp: '1473119593',
 						 nonce: '1917096816',
 						openid: 'o6lccuJ8kO8h0TWW2KY6ayxIVSqc' }
 					*/
					if(sha !== signature){ //每次post请求之前微信都会发送验证参数
						this.body = 'fail';
						return false;
					}else{
						console.log('===================Post数据开始');
						//post过来的原始数据
						// console.log('this request==========================',this.request);
						// console.log('this req==========================',this.req);
						var data = yield getRawBody(this.req,{ //TODO 用的是node中原始的请求
							length:this.req.length,
							limit:'1mb',
							encoding:this.req.charset
						});

						//解析成xml---返回一个Promise js Object
						var content = yield utils.parseXMLAsync(data);

						//格式化后的数据
						var message = utils.formatMessage(content.xml);

						console.log('---------------message:',message);
						this.weixin = {};
						this.weixin.message = message;//把接收的消息挂载到一个变量上

						console.log('-------------------------------------');

						yield reply.reply.call(this,next); //处理逻辑

						console.log('reply.reply处理成功------------------------');

						wechat.reply.call(this);
					}
				}

		}
}
