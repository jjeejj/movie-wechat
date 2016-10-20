var crypto = require('crypto');
/**
 * 和微信专有的工具方法
 */
'use strict';
var template = require('./tpl');

/**
 * 回复的消息
 * @param  {[type]} content 消息字符串
 * @param  {[type]} message 接收微信回复的对象
 * @return {[type]}   回复的xml
 */
exports.tpl = function (content,message) {
	var info = {};
	var type = 'text';
	var fromUserName = message.FromUserName; //接收者账号---openID
	var toUserName = message.ToUserName;// 开发者微信号

	//如果 content 是数组 则是图文消息
	if(Array.isArray(content)){
		type = 'news';
	}

	console.log('回复的文本内容为：================',content);
	type = content.type || type;

	info.content = content;
	info.createTime = Date.now();
	info.msgType = type;
	info.fromUserName = toUserName;
	info.toUserName = fromUserName;

	console.log('info=======================',info);
	return template.replyTemplate(info);
}

//生成一个随机字符串
var _createNonce = function () {
	return Math.random().toString(36).substr(2,15)
}

//生成一个时间戳
var _createTimesTamp = function () {
	return parseInt(Date.now() / 1000,10) + ''; //转为字符串
}
//生成签名
var _sign = function (noncestr,timestamp,jsapi_ticket,url) {
	var params = [
		'noncestr='+noncestr,
		'timestamp='+timestamp,
		'jsapi_ticket='+jsapi_ticket,
		'url='+url
	];

	console.log('params',params);

	var str = params.sort().join('&');
	var sha1sum = crypto.createHash('sha1');
	sha1sum.update(str);

	return sha1sum.digest('hex');
}
//jssdk的签名算法
exports.sign = function (jsapi_ticket,url) {
	var noncestr = _createNonce();//随机字符串
	var timestamp = _createTimesTamp();//时间戳
	var signature = _sign(noncestr,timestamp,jsapi_ticket,url);

	return {
		noncestr:noncestr,
		timestamp:timestamp,
		signature:signature
	}
}