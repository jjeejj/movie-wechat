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