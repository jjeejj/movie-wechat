'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');

var fs = require('fs');

//微信api接口
var prefix = 'https://api.weixin.qq.com/cgi-bin/'; //前缀
var api = {
	access_token:prefix+'token?grant_type=client_credential&appid=APPID&secret=APPSECRET',
	temporary:{
		upload:prefix + 'media/upload?access_token=ACCESS_TOKEN&type=TYPE' //新增临时素材
	},
	permanent:{ //永久素材
		uploadNews:prefix+'material/add_news?access_token=ACCESS_TOKEN',//新增图文素材
		uploadNewsImg:prefix+'media/uploadimg?access_token=ACCESS_TOKEN',//上传图文消息中用的图片
		upload:prefix +'material/add_material?access_token=ACCESS_TOKEN',//上传其他素材---（image，voice，video，thumb）
		uploadVideo:prefix + 'material/add_material?access_token=ACCESS_TOKEN"'//上传video素材需在多post一个表单数据
	}

}

/**
 * 构造函数
 * 直接微信进行交互的业务逻辑
 * @param {[type]} opts [description]
 */
function Wechat(opts) {
	var that = this;
	// this.access_token = '';
	// this.expires_in = '';
	this.appID = opts.appID;
	this.appsecret = opts.appsecret;
	//获取票据的方法
	this.getAccessToken = opts.getAccessToken;
	//存储票据的方法
	this.saveAccessToken = opts.saveAccessToken;

	//执行获取票据的方法
	this.fetchAccessToken();
}

/**
 * 获取票据的方法
 * @return {[type]} [description]
 */
Wechat.prototype.fetchAccessToken = function () {
	var that = this;
	//判断实例换对象是否有access_token 和 expires_in 切且是否过期
	if(that.access_token && that.expires_in){
		if(that.isValidAccessToken(this)){
			return  Promise.resolve(this)
		}
	}
	//在文件判断，是否重新获取
	this.getAccessToken()
		.then(function (data) {
			try{
				data = JSON.parse(data)
			}catch(e){
				return that.updateAccessToken();
			}
			//判断有效性
			if(that.isValidAccessToken(data)){
				return Promise.resolve(data);
			}else{
				return that.updateAccessToken();
			}
		}).then(function (data) {
			that.access_token = data.access_token;
			that.expires_in = data.expires_in;
			that.saveAccessToken(data);
			return  Promise.resolve(data)
		})
}

/**
 * 验证 access_toekn 是否有效 
 * @param  {[type]}  data Wechat构造函数实例换的对象，实例化对象上有验证的属性，或者data数据对象
 * @return {Boolean}      
 */
Wechat.prototype.isValidAccessToken =function (data) {

	if(!data || !data.access_token || !data.expires_in){
		return false;
	}

	var access_toekn = data.access_token;
	var expires_in = data.expires_in; //过期时间
	var now =  Date.now();

	if(now <expires_in){
		return true
	}else{
		return false;
	}
}


/**
 * update access_token
 * @return  Promise
 */
Wechat.prototype.updateAccessToken = function () {
	var appID = this.appID;
	var appsecret = this.appsecret;

	var access_token_url = api.access_token.replace('APPID',appID).replace('APPSECRET',appsecret);

	return new Promise(function (resolve,reject) {
		request({
			url:access_token_url,
			json:true
		}).then(function (response) {
			var data = response.body;
			var now = Date.now();
			//自定义过期时间----提前20s
			var expires_in = now + (data.expires_in -20) * 1000;

			data.expires_in = expires_in;

			resolve(data)
		})	
	})

}

//回复消息
Wechat.prototype.reply = function () {
	var content = this.body;
	var message = this.weixin.message;
	//xml话回复的内容
	var xml = util.tpl(content,message);
	this.status = 200;
	this.type = 'application/xml';

	console.log('this is reply xml:===============',xml);
	this.body = xml;

}

/**
 *上传临时素材
 * @param  {String} type 素材类型
 *  图片（image）: 2M，支持bmp/png/jpeg/jpg/gif格式
 *	语音（voice）：2M，播放长度不超过60s，支持AMR\MP3格式
 *	视频（video）：10MB，支持MP4格式
 *	缩略图（thumb）：64KB，支持JPG格式
 *
 * 
 * @param  {String} filepath 文件路径
 * @return {Promise}   Primise
 */
Wechat.prototype.uploadTempMaterial = function (type,filepath) {
	var that = this;
	var form = {
		media:fs.createReadStream(filepath)
	}

	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.temporary.upload.replace('ACCESS_TOKEN',data.access_token).replace('TYPE',type);
				request({
					method:'post',
					url:url,
					json:true,
					formData:form
				}).then(function (reponse) {
					var _data = reponse.body;
					console.log("图片素材返回值================",JSON.stringify(_data));
					if(_data){
						resolve(_data)
					}else{
						throw new Error('upload material fail')
					}
				}).catch(function (err) {
					reject(err);
				})
			})
	})
}

module.exports = Wechat;
