'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var xml2js = require('xml2js');

/**
 * 读取文件内容
 * @param  {[type]} fpath   文件路径
 * @param  {[type]} encoding 编码
 * @return {[type]}       Promise
 */
exports.readFileAsync = function (fpath,encoding) {
	return new Promise(function (resolve,reject) {
		fs.readFile(fpath, {encoding:encoding}, function (err,data) {
			if(err){
				reject(err);
			}else{
				resolve(data);
			}
		});
	})
}
/**
 * 写入文件内容
 * @param  {[type]} fpath   文件路径
 * @param  {[type]} content 文件内容 --String
 * @return {[type]}       Promise
 */
exports.writeFileAsync = function (fpath,content) {
	return new Promise(function (resolve,reject) {
		fs.writeFile(fpath, content, function (err) {//默认编码 utf8
			if(err){
				reject(err);
			}else{
				resolve();
			}
		});
	})
}
/**
 * xml2js
 * parse xml to Obiect
 * @param  {[type]} data xml
 * @return {[type]}     Promise
 */
exports.parseXMLAsync = function (xml) {
	return new Promise(function (resolve,reject) {
		xml2js.parseString(xml,{trim:true},function (err,content) {
			if(err){
				reject(err)
			}else{
				resolve(content);
			}
		})
	})
}

/**
 * 格式化 xml2js 转化后的结果 value 是数组
 * @param  {[type]} result [description]
 * @return {[type]}     message object
 */
function formatMessage(result) {
	var message = {};
	if(typeof result === 'object'){
		var keys = Object.keys(result);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var item = result[key];

			if( !(item instanceof Array) || item.length ===0){
				continue;
			}
			if(item.length ===1){
				var value = item[0];
				if(typeof  value  === 'object'){
					message[key] = formatMessage(value);
				}else{
					message[key] = (value || '').trim();
				}
			}else{
				message[key] = [];
				for (var j = 0; j < item.length; j++) {
					//???????
					message[key].push(formatMessage(item[j]));
				}
			}
		}
	}

	return message;
}

exports.formatMessage =formatMessage;