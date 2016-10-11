'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var _ = require('lodash');

var fs = require('fs');

//微信api接口
var prefix = 'https://api.weixin.qq.com/cgi-bin/'; //api. 前缀
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';//mp.
var api = {
	access_token:prefix+'token?grant_type=client_credential&appid=APPID&secret=APPSECRET', //获取access_token
	temporary:{
		upload:prefix + 'media/upload?access_token=ACCESS_TOKEN&type=TYPE', //新增临时素材
		fetch:'media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID' ////获取临时素材
	},
	permanent:{ //永久素材
		uploadNews:prefix+'material/add_news?access_token=ACCESS_TOKEN',//新增图文素材
		uploadNewsPic:prefix+'media/uploadimg?access_token=ACCESS_TOKEN',//上传图文消息中用的图片
		upload:prefix +'material/add_material?access_token=ACCESS_TOKEN',//上传其他素材---（image，voice，video，thumb）上传video素材需在多post一个表单数据(同一个地址)
		// uploadVideo:prefix + 'material/add_material?access_token=ACCESS_TOKEN"'//
		fetch:prefix+'material/get_material?access_token=ACCESS_TOKEN', //获取永久素材
		delete:prefix+'material/del_material?access_token=ACCESS_TOKEN', //删除永久素材
		updateNews:prefix + 'material/update_news?access_token=ACCESS_TOKEN', //更新永久图文素材
		materialCount:prefix + 'material/get_materialcount?access_token=ACCESS_TOKEN',//获取永久素材各个类型的总数
		materialList:prefix +'material/batchget_material?access_token=ACCESS_TOKEN'//分类型获取永久素材的列表
	},
	group:{ //微信用户分组
		creat:prefix + 'groups/create?access_token=ACCESS_TOKEN',//创建分组
		fetch:prefix +'groups/get?access_token=ACCESS_TOKEN',//查询所有分组
		update:prefix +'groups/update?access_token=ACCESS_TOKEN',//更新分组名
		delete:prefix +'groups/delete?access_token=ACCESS_TOKEN',//删除分组，删除分组后，所有该分组内的用户自动进入默认分组
		fetchByOpenId:prefix + 'groups/getid?access_token=ACCESS_TOKEN',//查询用户所在分组
		move:prefix +'groups/members/update?access_token=ACCESS_TOKEN',//移动用户分组
		moveBatch:prefix +'groups/members/batchupdate?access_token=ACCESS_TOKEN'//批量移动用户分组
	},
	tag:{ //微信用户标签 ,标签功能目前支持公众号为用户打上最多三个标签
		create:prefix + 'tags/create?access_token=ACCESS_TOKEN',//创建标签
		fetch:prefix +'tags/get?access_token=ACCESS_TOKEN',//查询所有标签
		update:prefix +'tags/update?access_token=ACCESS_TOKEN',//更新标签名。请注意不能和其他标签重名
		delete:prefix +'tags/delete?access_token=ACCESS_TOKEN', //删除标签,当某个标签下的粉丝超过10w时，后台不可直接删除标签。此时，开发者可以对该标签下的openid列表，先进行取消标签的操作，直到粉丝数不超过10w后，才可直接删除该标签。
		fetchUserByTagId:prefix +'user/tag/get?access_token=ACCESS_TOKEN',//获取标签下粉丝列表
		fetchTagListsByOpenId:prefix + 'tags/getidlist?access_token=ACCESS_TOKEN',//获取用户身上的标签列表
		batchtag:prefix +'tags/members/batchtagging?access_token=ACCESS_TOKEN',//批量为用户打标签
		batchuntag:prefix +'tags/members/batchuntagging?access_token=ACCESS_TOKEN',//批量为用户取消标签
		getblacklist:prefix +'tags/members/getblacklist?access_token=ACCESS_TOKEN',//黑名单列表
		batchblacklist:prefix +'tags/members/batchblacklist?access_token=ACCESS_TOKEN',//拉黑一批用户	
		batchunblacklist:prefix+'tags/members/batchunblacklist?access_token=ACCESS_TOKEN'//取消拉黑一批用户
	},

	user:{ //用户信息
		remark:prefix + 'user/info/updateremark?access_token=ACCESS_TOKEN',//对指定用户设置备注名，该接口暂时开放给微信认证的服务号
		fetch:prefix +'user/info?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN', //获取用户基本信息
		batchFetch:prefix +'user/info/batchget?access_token=ACCESS_TOKEN',//批量获取用户基本信息
		userList:prefix + 'user/get?access_token=ACCESS_TOKEN' //获取用户列表
	},
	mass:{  //群发
		sendByGroupOrTag:prefix + 'message/mass/sendall?access_token=ACCESS_TOKEN',//群发接口，根据标签进行群发 ，根据分组进行群发
		uploadvideo:'https://file.api.weixin.qq.com/cgi-bin/media/uploadvideo?access_token=ACCESS_TOKEN',//群发视频之前需要调用该接口，获得群发视频的media_id
		sendByOpendIds:prefix + 'message/mass/send?access_token=ACCESS_TOKEN',//根据OpenID列表群发【订阅号不可用，服务号认证后可用】
		delete: prefix + 'message/mass/delete?access_token=ACCESS_TOKEN',//删除群发【订阅号与服务号认证后均可用】
		preview: prefix + 'message/mass/preview?access_token=ACCESS_TOKEN',//预览接口【订阅号与服务号认证后均可用】
		status: prefix + 'message/mass/get?access_token=ACCESS_TOKEN' //查询群发消息发送状态
	},
	menu:{ //菜单
		create: prefix + 'menu/create?access_token=ACCESS_TOKEN',//创建菜单
		addConditional: prefix + 'menu/addconditional?access_token=ACCESS_TOKEN',//创建个性化菜单
		fetch:prefix + 'menu/get?access_token=ACCESS_TOKEN',//获取菜单--查询已经创建的菜单
		delete:prefix +'menu/delete?access_token=ACCESS_TOKEN',//删除菜单，调用此接口会删除默认菜单及全部个性化菜单。
		delconditional:prefix +'menu/delconditional?access_token=ACCESS_TOKEN',//删除个性化菜单
		previewConditional:prefix +'menu/trymatch?access_token=ACCESS_TOKEN',//预览个性化菜单
		current:prefix +'get_current_selfmenu_info?access_token=ACCESS_TOKEN',//获取自定义菜单配置
	},
	qrcode:{ //二维码用户扫描带场景值二维码时，可能推送以下两种事件：
			//如果用户还未关注公众号，则用户可以关注公众号，关注后微信会将带场景值关注事件推送给开发者。
			//如果用户已经关注公众号，在用户扫描后会自动进入会话，微信也会将带场景值扫描事件推送给开发者。
		create:prefix +'qrcode/create?access_token=TOKEN',//创建二维码ticket
		show:mpPrefix +'showqrcode?ticket=TICKET'//获取二维码的地址
	},
	shorturl:{//将一条长链接转成短链接。主要使用场景： 开发者用于生成二维码的原链接（商品、支付二维码等）
		//太长导致扫码速度和成功率下降，将原长链接通过此接口转成短链接再生成二维码将大大提升扫码速度和成功率。
		create:prefix+'shorturl?access_token=ACCESS_TOKEN'
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

//素材接口

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
	var fetchUrl = api.temporary.fetch; //默认临时的

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
				var options = {
					method:'get',
					url:fetchUrl,
					json:true
				}
				if(permanent){
					options.method='post',
					options.body = form
				}
				request(options).then(function (reponse) {
					var _data = reponse.body;
					console.log("获取 "+type+" 素材返回值================",JSON.stringify(_data));
					if(_data){
						resolve(_data)
					}else{
						throw new Error('fetch material fail')
					}
				}).catch(function (err) {
					reject(err);
				})		
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
	options.offset  = options.offset || 0;
	options.count  = options.count || 20;

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

//分组接口

/**
 * 创建用户分组
 * @param  {[string]} name 分组的名字
 * @return {[type]}    Promise
 */
Wechat.prototype.createGroup = function (name) {
	var that = this;

	var createGroupUrl = api.group.creat;

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					createGroupUrl = createGroupUrl.replace('ACCESS_TOKEN',data.access_token);
					//POST数据格式：json
					//POST数据例子：{"group":{"name":"test"}}

					var form = {
						group:{
							"name":name
						}
					}
					request({
						method:'post',
						url:createGroupUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log("创建用户分组================",JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('createGroup fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})

	})
}

/**
 * 获取所有的分组
 * @return {[type]} [description]
 */
Wechat.prototype.fetchGroups = function () {
	var that = this;

	var fetchGroupUrl = api.group.fetch;

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					fetchGroupUrl = fetchGroupUrl.replace('ACCESS_TOKEN',data.access_token);
					
					request({
						method:'get',
						url:fetchGroupUrl,
						json:true,
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log("获取所有的用户分组================",JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('createGroup fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})

	})
}

/**
 *根据用户的openi获取用户所在的分组
 * @param  {[type]} openid 用户的唯一标识
 * @return {[type]}      
 */
Wechat.prototype.fetchGroupByOpenId = function (openid) {
	var that = this;

	var fetchGroupByOpenIdUrl = api.group.fetchByOpenId;

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					fetchGroupByOpenIdUrl = fetchGroupByOpenIdUrl.replace('ACCESS_TOKEN',data.access_token);
					//POST数据格式：json
					//POST数据例子：{"openid":"od8XIjsmk6QdVTETa9jLtGWA6KBc"}
					
					var form = {
						"openid":openid
					}
					request({
						method:'post',
						url:fetchGroupByOpenIdUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`获取${openid}所在分组用户分组================`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('createGroup fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})

	})
}

/**
 * 更新分组
 * @param  {[type]} groupId 分组的id
 * @param  {[type]} name   分组的名字
 * @return {[type]}         [description]
 */
Wechat.prototype.updateGroup = function (groupId,name) {
	var that = this;

	var updateGroupUrl = api.group.update;

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					updateGroupUrl = updateGroupUrl.replace('ACCESS_TOKEN',data.access_token);
					//POST数据格式：json
					//POST数据例子：{"group":{"id":108,"name":"test2_modify2"}}
					
					var form = {
						"group":{
							"id":groupId,
							"name":name
						}
					}
					request({
						method:'post',
						url:updateGroupUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`修改${groupId}分组名字为${name}================`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('updateGroup fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})

	})
}
/**
 * 为某一用户移动分组
 * 把批量移动也和并在一起
 * @param  {[type]} openids 用户唯一标识符
 * @param  {[type]} to_groupid    分组id
 * @return {[type]}         [description]
 */
Wechat.prototype.moveGroup = function (openids,to_groupid) {
	var that = this;

	var moveGroupUrl = api.group.move;

	var form = {
		"to_groupid":to_groupid
	};

	if(_.isArray(openids)){ //批量移动
		moveGroupUrl = api.group.moveBatch;
		//POST数据格式：json
		//POST数据例子：{"openid_list":["oDF3iYx0ro3_7jD4HFRDfrjdCM58","oDF3iY9FGSSRHom3B-0w5j4jlEyY"],"to_groupid":108}
		 form.openid_list = openids;
				
	}else{
		//POST数据格式：json
		//POST数据例子：{"openid":"oDF3iYx0ro3_7jD4HFRDfrjdCM58","to_groupid":108}
		form.openid = openids;
	}

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					moveGroupUrl = moveGroupUrl.replace('ACCESS_TOKEN',data.access_token);
					
					request({
						method:'post',
						url:moveGroupUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`把用户${openids}移动到分组的为${to_groupid}================`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('moveGroup fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})

	})
}

/**
 * 批量移动用户分组
 * @param  {[type]} openid_list 用户唯一标识符openid的列表（size不能超过50）
 * @param  {[type]} to_groupid  	分组id
 * @return {[type]}             [description]
 */
Wechat.prototype.moveBatchGroup = function (openid_list,to_groupid) {
	var that = this;

	var moveBatchGroupUrl = api.group.moveBatch;

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					moveBatchGroupUrl = moveBatchGroupUrl.replace('ACCESS_TOKEN',data.access_token);
					//POST数据格式：json
					//POST数据例子：{"openid_list":["oDF3iYx0ro3_7jD4HFRDfrjdCM58","oDF3iY9FGSSRHom3B-0w5j4jlEyY"],"to_groupid":108}
					
					var form = {
						"openid_list":openid_list,
						"to_groupid":to_groupid
					}
					request({
						method:'post',
						url:moveBatchGroupUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`批量用户移动到分组的为${to_groupid}================`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('moveGroup fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})

	})
}

/**
 * 删除分组 注意本接口是删除一个用户分组，删除分组后，所有该分组内的用户自动进入默认分组。
 * @param  {[type]} groupid 	分组的id
 * @return {[type]}         [description]
 */
Wechat.prototype.deteleGroup = function (groupid) {
	var that = this;

	var deteleGroupUrl = api.group.delete;

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					deteleGroupUrl = deteleGroupUrl.replace('ACCESS_TOKEN',data.access_token);
					//POST数据格式：json
					//POST数据例子：{"group":{"id":108}}
					
					var form = {
						"group":{
							"id":groupid
						}
					}
					request({
						method:'post',
						url:deteleGroupUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`删除用户分组${groupid}================`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('deteleGroup fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})

	})
}

//用户信息接口

/**
 * 
 * 指定用户设置备注名，该接口暂时开放给微信认证的服务号
 * @param  {[type]} openid 指定用户的用户标识
 * @param  {[type]} remark新的备注名，长度必须小于30字符
 * @return {[type]}        [description]
 */
Wechat.prototype.remarkUser = function (openid,remark) {
	var that = this;

	var remarkUserUrl = api.user.remark;

	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					remarkUserUrl = remarkUserUrl.replace('ACCESS_TOKEN',data.access_token);
					/**
					POST数据格式：json
					POST数据例子：
					{
						"openid":"oDF3iY9ffA-hqb2vVvbr7qxf6A0Q",
						"remark":"pangzi"
					}
					*/
					
					var form = {
						"openid":openid,
						"remark":"姜"
					}
					request({
						method:'post',
						url:remarkUserUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`为指定用户${openid}设置备注名${remark} 成功================`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('remarkUser fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 获取用户基本信息
 * 分单个获取，和批量获取
 * openids 为数组是为批量获取，为字符串是为单个获取
 * @param  {[type]} openids 用户的标识，对当前公众号唯一
 * @param  {[type]} lang    国家地区语言版本，zh_CN 简体，zh_TW 繁体，en 英语，默认为zh-CN
 * @return {[type]}         [description]
 */
Wechat.prototype.fetchUsers = function (openids,lang) {
	var that = this;

	lang = lang || 'zh-CN';

	var fetchUsersUrl = api.user.fetch; //默认为单个获取
	var options = {
		json:true
	}


	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {

					if(_isArray(openids)){
						fetchUsersUrl = api.user.batchFetch;
						options.method = 'post';
						options.body= {
							"user_list":openids,
							"lang":lang
						}
					}else{
					
						fetchUsersUrl = fetchUsersUrl.replace('OPENID',openids).replace('zh_CN',lang);
					}

					fetchUsersUrl = fetchUsersUrl.replace('ACCESS_TOKEN',data.access_token);
					options.url = fetchUsersUrl;


					request(options).then(function (reponse) {
						var _data = reponse.body;
						console.log(`获取用户基本信息成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('fetchUsers fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 获取用户列表
 * @param  {[type]} next_openid 第一个拉取的OPENID，不填默认从头开始拉取
 * @return {[type]}             [description]
 */
Wechat.prototype.getUsersList = function (next_openid) {
	var that = this;

	var getUserListUrl = api.user.userList; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {

					
					getUserListUrl = getUserListUrl.replace('ACCESS_TOKEN',data.access_token);

					if(next_openid){
						getUserListUrl += '&next_openid='+next_openid
					}
					
					request({
						method:'get',
						url:getUserListUrl,
						json:true
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`获取用户列表成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('getUsersList fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}


//群发接口

/**
 * 群发信息接口
 * 根据分组id或标签id
 * @param  {[type]} type   消息类型
 * @param  {[type]} message 群发的消息
 * @param  {[type]} groupId 用户分组ID
 * @param  {[type]} tagId  用户标签id
 * @return {[type]}         [description]
 */
Wechat.prototype.sendByGroupOrTag = function (type,message,groupId,tagId) {
	var that = this;

	//群发的json
	var msg = {
		"filter":{
		      "is_to_all":false, //默认不是群发所有人
	   	  },
	   	 "msgtype":type
	}

	msg[type] = message;

	//发送对象的判断
	if(tagId){
		msg.filter.tag_id = tagId; //标签发送优先
	}else if(groupId){
		msg.filter.group_id = groupId; //分组发送
	}else{
		msg.filter.is_to_all = true;//发送所有
	}

	var sendByGroupOrTagUrl = api.mass.sendByGroupOrTag; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					sendByGroupOrTagUrl = sendByGroupOrTagUrl.replace('ACCESS_TOKEN',data.access_token);

					
					request({
						method:'post',
						url:sendByGroupOrTagUrl,
						json:true,
						body:msg
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`群发信息成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('sendByGroupOrTag fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 群发视频之前进行上传视频，获取群发视频的media_id
 * @param  {[type]} content 内容
 * @return {[type]}         [description]
 */
Wechat.prototype.massUploadvideo = function (content) {
	var that = this;

	var uploadvideo = api.mass.uploadvideo; 
	
	return new Promise(function (resolve,reject) {
		
				request({
					method:'post',
					url:uploadvideo,
					json:true,
					body:content
				}).then(function (reponse) {
					var _data = reponse.body;
					console.log(`群发视频之前进行上传视频，获取群发视频的media_id===============`,JSON.stringify(_data));
					if(_data){
						resolve(_data)
					}else{
						throw new Error('uploadvideo fail')
					}
				}).catch(function (err) {
					reject(err);
				})	
	})
}

/**
 * 根据openIds 列表进行群发
 * @param  {[type]} type   类型
 * @param  {[type]} message 群发内容
 * @param  {[type]} openIds opensid列表，
 * @return {[type]}         [description]
 */
Wechat.prototype.sendByOpendIds = function (type,message,openIds) {
	var that = this;

	//群发的json
	var msg = {
		"touser":openIds,
	   	"msgtype":type
	}

	msg[type] = message;


	var sendByOpendIdsUrl = api.mass.sendByOpendIds; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					sendByOpendIdsUrl = sendByOpendIdsUrl.replace('ACCESS_TOKEN',data.access_token);

					
					request({
						method:'post',
						url:sendByOpendIdsUrl,
						json:true,
						body:msg
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`根据openIds 列表进行群发===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('sendByOpendIds fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 删除群发
 * 1、只有已经发送成功的消息才能删除
 *	2、删除消息是将消息的图文详情页失效，已经收到的用户，还是能在其本地看到消息卡片。
 *	3、删除群发消息只能删除图文消息和视频消息，其他类型的消息一经发送，无法删除。
 *	4、如果多次群发发送的是一个图文消息，那么删除其中一次群发，就会删除掉这个图文消息也，导致所有群发都失效
 * 或
 * 查询群发消息发送状态
 *
 *
 * 预览接口发送的消息不能删除和查看发送状态
 * @param  {[type]} msg_id 微信群发后的返回的ID
 * @param  {[type]} flag 功能选择 1 为删除群发，2：为查询群发状态
 * @return {[type]}       
 */
Wechat.prototype.deleteMassOrGetMassStatus = function (msg_id,flag) {
	var that = this;

	var deleteMassOrGetMassStatusUrl = api.mass.delete;  //默认为删除群发

	if(flag === 2){
		deleteMassOrGetMassStatusUrl = api.mass.status;
	}
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					deleteMassOrGetMassStatusUrl = deleteMassOrGetMassStatusUrl.replace('ACCESS_TOKEN',data.access_token);
			
					request({
						method:'post',
						url:deleteMassOrGetMassStatusUrl,
						json:true,
						body:{
							"msg_id":msg_id
						}
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log( (flag ===2 )? '查询':'删除'+`群发 ${msg_id} 成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('deleteMassOrGetMassStatus fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 群发预览功能
 * @param  {[type]} type   预览消息类型
 * @param  {[type]} message 预览消息
 * @param  {[type]} openId  预览人的openid
 * @param  {[type]} wxname  预览人的微信名字
 * 了满足第三方平台开发者的需求，在保留对openID预览能力的同时，
 * 增加了对指定微信号发送预览的能力，但该能力每日调用次数有限制（100次），请勿滥用。
 * towxname和touser同时赋值时，以towxname优先
 * @return {[type]}         [description]
 */
Wechat.prototype.previewMass = function (type,message,openId,wxname) {
	var that = this;

	//群发的json
	var msg = {
	   	"msgtype":type
	}

	msg[type] = message;

	if(wxname){
		msg.towxname = wxname
	}else{
		msg.touser = openId;
	}

	var previewMassUrl = api.mass.preview; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					previewMassUrl = previewMassUrl.replace('ACCESS_TOKEN',data.access_token);
		
					request({
						method:'post',
						url:previewMassUrl,
						json:true,
						body:msg
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`${openId},${wxname} 预览成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('previewMass fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}
/**
 * 创建菜单
 * 菜单标题，不超过16个字节，子菜单不超过40个字节
 * @param  {[type]} menu 菜单对象
 * @return {[type]}   
 */
Wechat.prototype.createMenu = function (menu) {
	var that = this;


	var createMenuUrl = api.menu.create; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					createMenuUrl = createMenuUrl.replace('ACCESS_TOKEN',data.access_token);
		
					request({
						method:'post',
						url:createMenuUrl,
						json:true,
						body:menu
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`创建菜单成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('createMenu fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}
/**
 * 自定义菜单查询接口
 * 在设置了个性化菜单后，使用本自定义菜单查询接口可以获取默认菜单和全部个性化菜单信息。
 * @return {[type]} [description]
 */
Wechat.prototype.fetchMenu = function () {
	var that = this;


	var fetchMenuUrl = api.menu.fetch;
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					fetchMenuUrl = fetchMenuUrl.replace('ACCESS_TOKEN',data.access_token);
		
					request({
						method:'get',
						url:fetchMenuUrl,
						json:true,
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`获取菜单信息成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('fetchMenu fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 删除菜单
 * 在个性化菜单时，调用此接口会删除默认菜单及全部个性化菜单。
 * @return {[type]} [description]
 */
Wechat.prototype.deleteMenu = function () {
	var that = this;


	var deleteMenuUrl = api.menu.delete; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					deleteMenuUrl = deleteMenuUrl.replace('ACCESS_TOKEN',data.access_token);
		
					request({
						method:'get',
						url:deleteMenuUrl,
						json:true,
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`删除菜单成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('deleteMenu fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 获取自定义菜单配置接口
 * 如果公众号是通过API调用设置的菜单，则返回菜单的开发配置，
 * 而如果公众号是在公众平台官网通过网站功能发布菜单，则本接口返回运营者设置的菜单配置。
 * @return {[type]} [description]
 */
Wechat.prototype.currentMenu = function () {
	var that = this;


	var currentMenuUrl = api.menu.current; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					currentMenuUrl = currentMenuUrl.replace('ACCESS_TOKEN',data.access_token);
		
					request({
						method:'get',
						url:currentMenuUrl,
						json:true,
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`获取菜单配置成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('currentMenuUrl fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}
/**
 * 创建二维码ticket
 * @param  {[type]} qr ：临时：{"expire_seconds": 604800, "action_name": "QR_SCENE", "action_info": {"scene": {"scene_id": 123}}}
 * 永久： {"action_name": "QR_LIMIT_SCENE", "action_info": {"scene": {"scene_id": 123}}} 
 * 或{"action_name": "QR_LIMIT_STR_SCENE", "action_info": {"scene": {"scene_str": "123"}}}
 * @return {[type]}    [description]
 */
Wechat.prototype.createQrcode = function (qr) {
	var that = this;

	var createQrcodeUrl = api.qrcode.create; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					createQrcodeUrl = createQrcodeUrl.replace('ACCESS_TOKEN',data.access_token);
		
					request({
						method:'post',
						url:createQrcodeUrl,
						json:true,
						body:qr
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`创建二维码ticket成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('createQrcodeUrl fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

/**
 * 通过ticket换取二维码
 * @param  {[type]} ticket 二维码ticket
 * @return {[type]}      uri
 */
Wechat.prototype.showQrcode = function (ticket) {

	var showQrcodeUrl = api.qrcode.show; 

	return showQrcodeUrl.replace('TICKET',encodeURI(ticket));
}

/**
 * 长链接转短链接接口
 * @param  {[type]} url   需要转换的长链接
 * @param  {[type]} action action 此处填long2short，代表长链接转短链接
 * @return {[type]}         [description]
 */
Wechat.prototype.createShortUrl = function (url,action) {
	var that = this;

	action = action || 'long2short'

	var createShortUrl = api.shorturl.create; 
	
	return new Promise(function (resolve,reject) {
			that
				.fetchAccessToken()
				.then(function (data) {
					createShortUrl = createShortUrl.replace('ACCESS_TOKEN',data.access_token);
					
					var form = {
						action:action,
						long_url:url
					};
					request({
						method:'post',
						url:createShortUrl,
						json:true,
						body:form
					}).then(function (reponse) {
						var _data = reponse.body;
						console.log(`长链接转短链接接成功===============`,JSON.stringify(_data));
						if(_data){
							resolve(_data)
						}else{
							throw new Error('createShortUrl fail')
						}
					}).catch(function (err) {
						reject(err);
					})	
				})
	})
}

module.exports = Wechat;
