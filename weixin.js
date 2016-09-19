'use strict';
var config = require('./config');
var Wechat = require('./wechat/wechat');

var wechatApi = new Wechat(config.wechat);

///微信回复处理逻辑
exports.reply = function *(next) {
	var message = this.weixin.message;

	if(message.MsgType === 'event'){ //事件推送
		//关注事件
		if(message.Event === 'subscribe'){
			//扫码关注事件
			if(message.EventKey){
				console.log('扫二维码进来：'+ message.EventKey+' '+message.Ticket);
			}
			console.log('哈哈，你订阅了这个号');
			
			this.body = '哈哈，你订阅了这个号';

		}else if(message.Event === 'unsubscribe'){//取消关注
			console.log('取消关注');
			this.body = '';
		}else if(message.Event === 'LOCATION'){//上报地理位置，此处可以接入百度地图api进行地址位置转换
			console.log('您上报了地址位置');
			this.body = '您上报的地址位置经纬的经纬度为：'+ message.Longitude + '/'+ message.Latitude + '.精确度为：'+message.Precision
		}else if(message.Event === 'CLICK'){//用户点击自定义菜单后，微信会把点击事件推送给开发者，请注意，点击菜单弹出子菜单，不会产生上报
			console.log('您点击了菜单');
			this.body = '您点击了菜单：'+ message.EventKey;
		}else if(message.Event === 'VIEW'){//点击菜单跳转链接时的事件推送
			console.log('点击菜单跳转链接');
			this.body = '点击菜单跳转链接'+ message.EventKey;
		}else if(message.Event === 'SCAN'){
			console.log('关注后扫描二维码');
			this.body = '关注后扫描二维码：'+ message.EventKey +';' + message.Ticket;
		}
	}else if(message.MsgType === 'text'){ //接收普通文本消息 ----并回复内容
		var content = message.Content;//用户输的文本内容

		var reply = '那个，你说的：'+ content + '太复杂';

		//文本自定义回复
		if(content === '1'){
			reply = '我是第一';
		}else if(content === '2'){
			reply = '我是第二';
		}else if(content === '3'){
			reply = '我是第三';
		}else if(content === '4'){
			reply = [{
					title:'技术改变世界',
					description:'这是个描述',
					picUrl:'http://img0.bdstatic.com/img/image/fengjing01.jpg',
					url:'http://mp.weixin.qq.com/wiki/home/index.html'
				},
				{
					title:'nodejs 开发微信',
					description:'开发微信',
					picUrl:'http://img0.bdstatic.com/img/image/fengjing01.jpg',
					url:'http://nodejs.org'
				}
			]
		}else if(content ==='5'){ //上传图片---回复图片
			var data = yield wechatApi.uploadMaterial('image',__dirname + '/material/test.jpg');
			reply = {
				type:'image',
				mediaId:data.media_id
				// mediaId:'3HEzOhLm1D_B1MKZV__EFD5vbeYZsmcTCY3IQcbLoYuTco_gM8dYcp9ZH3ZyVn9z' //3天失效

			} 
		}else if(content ==='6'){ //回复音乐
			// var data = yield wechatApi.uploadMaterial('image',__dirname + '/material/test.jpg');
			reply = {
				type:'music',
				title:'这是音乐',
				description:'好听的音乐',
				musicURL:'http://sc1.111ttt.com/2016/1/09/11/202111800253.mp3',
				// mediaId:data.media_id
				thumbMediaId:'51vMuvtjJPgRANObEqruZejEhGv0X7tLaKwZJ0v-_PNAIdsP0vFsK3AQlOSbqTIe'

			} 
		}else if(content === '10'){ //上传图文素材---最多8段
			var newPicData = yield wechatApi.uploadMaterial('pic',__dirname + '/material/test.jpg',{}); //上传图文用的图片素材
			// var picData = yield wechatApi.uploadMaterial('image',__dirname + '/material/test.jpg',{}); //上传图片素材--封面

			var media = {
			   "articles": [{
			   "title": '示例',
		       // "thumb_media_id": picData.media_id,
		       "thumb_media_id": 'qHjGwCQ95p9tPlmN394S2pSZT7PClRkTZJQ87HGTNvg',
		       "author": 'jiang',
		       "digest": '摘要',
		       "show_cover_pic":1,
		       "content": '这是内容'+newPicData.url,
		       "content_source_url": 'http://mp.weixin.qq.com/wiki/10/10ea5a44870f53d79449290dfd43d006.html'
				}]
			}

			/**
			 * 图片素材返回值================ {"url":"http://mmbiz.qpic.cn/mmbiz_jpg/A1yMDaYL4J
OmfX5v9oibOVnBVmynpibcX00BTO9opyAPJYxyHplR4o8ictjHjfl0NRrgjU622yxounliaITU5GVryw
/0"}
图片素材返回值================ {"media_id":"qHjGwCQ95p9tPlmN394S2pSZT7PClRkTZJQ87HGTNvg","url":"http://mmbiz.qpic.cn/mmbiz_jpg/A1yMDaYL4JOmfX5v9oibOVnBVmynpibcX
0D7FSSicQ4azXWHJYync0LHxMOicCaYzNFo0eBxqPsYnibHFGh6mVHYg6g/0?wx_fmt=jpeg"}
图片素材返回值================ {"media_id":"qHjGwCQ95p9tPlmN394S2o0Q6_r5cXNEiJNT
UmJB3pA"}
			 */

			//上传图文
			var newsData = yield wechatApi.uploadMaterial('news',media,{}); //返回时图文的消息 media_id

			/**
			 * 获取图文素材返回值================ {"news_item":[{"title":"示例","author":"jiang","d
igest":"摘要","content":"这是内容http://mmbiz.qpic.cn/mmbiz_jpg/A1yMDaYL4JOmfX5v
9oibOVnBVmynpibcX00BTO9opyAPJYxyHplR4o8ictjHjfl0NRrgjU622yxounliaITU5GVryw/0","c
ontent_source_url":"http://mp.weixin.qq.com/wiki/10/10ea5a44870f53d79449290dfd43
d006.html","thumb_media_id":"qHjGwCQ95p9tPlmN394S2pSZT7PClRkTZJQ87HGTNvg","show_
cover_pic":1,"url":"http://mp.weixin.qq.com/s?__biz=MzA4ODg2NTI1OA==&mid=1000000
10&idx=1&sn=7ef0184d1238e8e0cdee646a8ac1ae21#rd","thumb_url":"http://mmbiz.qpic.
cn/mmbiz_jpg/A1yMDaYL4JOmfX5v9oibOVnBVmynpibcX0D7FSSicQ4azXWHJYync0LHxMOicCaYzNF
o0eBxqPsYnibHFGh6mVHYg6g/0?wx_fmt=jpeg"}],"create_time":1474246503,"update_time"
:1474246503}
			 */
			//获取该图文素材

			var data = yield wechatApi.fetchMaterial(newsData.media_id,'news',{});

			console.log(data);

			var items = data.news_item;
			var news;//回复的图文消息
			items.forEach(function (item) {
				news.push({
					title:item.title,
					description:item.digest,
					picUrl:item.thumb_url,
					url:item.url
				})
			})

			reply = news;
		}
		console.log('文本回复内容===============',reply);
		this.body = reply;
	}

	yield next;
}