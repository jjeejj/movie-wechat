'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var _ = require('lodash');

var fs = require('fs');

//微信api接口
var prefix = 'https://api.weixin.qq.com/cgi-bin/'; //前缀
var api = {
	access_token:prefix+'token?grant_type=client_credential&appid=APPID&secret=APPSECRET', //获取access_token
	temporary:{
		upload:prefix + 'media/upload?access_token=ACCESS_TOKEN&type=TYPE', //新增临时素材
		fetch:'media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID' ////获取临时素材
	},
	permanent:{ //永久素材
		uploadNews:prefix+'material/add_news?access_token=ACCESS_TOKEN',//新增图文素材
		uploadNewsPic:prefix+'media/uploadimg?access_token=ACCESS_TOKEN',//上传图文消息中用的图片
		upload:prefix +'material/add_material?access_token=ACCESS_TOKEN',//上传其他素材---（image，voice，video，thumb）上传video素材需在多post一个表单数据
		// uploadVideo:prefix + 'material/add_material?access_token=ACCESS_TOKEN"'//
		fetch:prefix+'material/get_material?access_token=ACCESS_TOKEN', //获取永久素材
		delete:prefix+'material/del_material?access_token=ACCESS_TOKEN', //删除永久素材
		updateNews:prefix + 'material/update_news?access_token=ACCESS_TOKEN', //更新永久图文素材
		materialCount:prefix + 'material/get_materialcount?access_token=ACCESS_TOKEN',//获取永久素材各个类型的总数
		materialList::prefix +'material/batchget_material?access_token=ACCESS_TOKEN'//分类型获取永久素材的列表
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
 *上传素材
 *临时素材和永久素材
 *
 *  @param  {String} type 素材类型
 *  图片（image）: 2M，支持bmp/png/jpeg/jpg/gif格式
 *	语音（voice）：2M，播放长度不超过60s，支持AMR\MP3格式
 *	视频（video）：10MB，支持MP4格式
 *	缩略图（thumb）：64KB，支持JPG格式
 *	图文中的图片 (pic)
 *	图文 （news）
 *
 * 
 * @param  {String} material 文件路径/或图文的数组信息
 * @param  {String} permanent 配置选项，永久临时素材之分 --如果传值就是永久类型  permanent  会包含永久素材特有的参数
 * @return {Promise}   Promise
 */
Wechat.prototype.uploadMaterial = function (type,material,permanent) {
	var that = this;

	var form = {};
	var uploadUrl = api.temporary.upload;//默认为临时素材

	if(permanent){
		uploadUrl = api.permanent.upload;
		_.extend(form,permanent)
	}
	if(type === 'pic'){ //为图文消息中上传的图片
		uploadUrl = api.permanent.uploadNewsPic;
	}

	if(type === 'news'){//图文
		uploadUrl = api.permanent.uploadNews;
		form = material;//图文消息内容
	}else{
		form.media = fs.createReadStream(material);
	}
	
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				uploadUrl = uploadUrl.replace('ACCESS_TOKEN',data.access_token);
				if(!permanent){ //临时素材
					uploadUrl =uploadUrl.replace('TYPE',type);
				}else{
					form.access_token = data.access_token;
				}

				//发送请求的配置项
				var options = {
					method:'post',
					url:uploadUrl,
					json:true
				}

				if(type === 'news'){ //一般的消息
					options.body = form;
				}else{ //文件上传
					options.formData = form;
				}
				request(options).then(function (reponse) {
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

/**
 * 获取素材
 * 永久的和临时的
 * 视频文件不支持https下载，调用该接口需http协议。
 * @param  {[type]} mediaId  素材ID
 * @param  {[type]} type    素材类型
 * @param  {[type]} permanent 配置选项，永久临时素材之分 --如果传值就是永久类型  permanent  会包含永久素材特有的参数
 * @return {[type]}         Promise  获取素材的URL
 */
Wechat.prototype.fetchMaterial = function (mediaId,type,permanent) {
	var that = this;
	var form  = {};
	var fetchUrl = api.temporary.fetch;

	if(permanent){
		fetchUrl = api.permanent.fetch;
	}

	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				fetchUrl = fetchUrl.replace('ACCESS_TOKEN',data.access_token);
				if(!permanent){ //临时素材
					fetchUrl =fetchUrl.replace('MEDIA_ID',mediaId);
					if(type === 'video'){
						fetchUrl = fetchUrl.replace('https://','http://')
					}
				}else{
					form.media_id = mediaId;
				}

				resolve(fetchUrl)			
			})
	})

}

/**
 * 删除永久素材
 * @param  {[type]} mediaId 素材ID
 * @return {[type]}         [description]
 */
Wechat.prototype.deleteMaterial = function (mediaId) {
	var that = this;
	var form  = {
		"media_id":mediaId
	};
	var deteleUrl = api.permanent.detele;

	
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				deteleUrl = deteleUrl.replace('ACCESS_TOKEN',data.access_token);
				request({
					method:'post',
					url:deteleUrl,
					json:true,
					body:form
				}).then(function (reponse) {
					var _data = reponse.body;
					console.log("删除素材返回值================",JSON.stringify(_data));
					if(_data){
						resolve(_data)
					}else{
						throw new Error('delete material fail')
					}
				}).catch(function (err) {
					reject(err);
				})			
			})
	})
}

/**
 * 更新永久图文素材
 * @param  {[type]} mediaId 素材ID
 * @param  {[type]} news   图文内容
 * @return {[type]}      Promise 
 */
Wechat.prototype.updateNewsMaterial = function (mediaId,news) {
	var that = this;
	var form  = {
		"media_id":mediaId
	};

	_extend(form,news);

	var updateNewsUrl = api.permanent.updateNews;

	
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				updateNewsUrl = updateNewsUrl.replace('ACCESS_TOKEN',data.access_token);
				request({
					method:'post',
					url:updateNewsUrl,
					json:true,
					body:form
				}).then(function (reponse) {
					var _data = reponse.body;
					console.log("素更新永久图文素材================",JSON.stringify(_data));
					if(_data){
						resolve(_data)
					}else{
						throw new Error('update news material fail')
					}
				}).catch(function (err) {
					reject(err);
				})			
			})
	})
}

/*
获取素材每个类型的总数
永久素材
 */
Wechat.prototype.getMaterialCount = function () {
	var that = this;
	
	var materialCountUrl = api.permanent.materialCount;

	
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				materialCountUrl = materialCountUrl.replace('ACCESS_TOKEN',data.access_token);
				request({
					method:'get',
					url:materialCountUrl,
					json:true
				}).then(function (reponse) {
					var _data = reponse.body;
					console.log("获取素材每个类型的总数================",JSON.stringify(_data));
					if(_data){
						resolve(_data)
					}else{
						throw new Error('getMaterialCount fail')
					}
				}).catch(function (err) {
					reject(err);
				})			
			})
	})
}

/**
 * 分类型获取永久素材的列表
 * @param  {[type]} type   素材的类型，图片（image）、视频（video）、语音 （voice）、图文（news）
 * @param  {[type]} offset 从全部素材的该偏移位置开始返回，0表示从第一个素材 返回
 * @param  {[type]} count  返回素材的数量，取值在1到20之间
 * @return {[type]}        [description]
 */

/**
 * 分类型获取永久素材的列表
 * @param  {[type]} options 配置项
 * @return {[type]}         [description]
 */
Wechat.prototype.getMaterialList = function (options) {
	var that = this;


	options.type  = options.type || 'image';
	options.offset  = options.type || 0;
	options.count  = options.type || 20;

	var materialListUrl = api.permanent.materialList;

	
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				materialListUrl = materialListUrl.replace('ACCESS_TOKEN',data.access_token);
				request({
					method:'post',
					url:materialListUrl,
					json:true,
					body:options
				}).then(function (reponse) {
					var _data = reponse.body;
					console.log("分类型获取永久素材的列表================",JSON.stringify(_data));
					if(_data){
						resolve(_data)
					}else{
						throw new Error('getMaterialList fail')
					}
				}).catch(function (err) {
					reject(err);
				})			
			})
	})
}
module.exports = Wechat;
