'use strict';

var ejs = require('ejs');

// var heredoc = require('heredoc');

//6种回复消息模板
var tpl = `<xml>
				<ToUserName><![CDATA[<%= toUserName %>]]></ToUserName>
				<FromUserName><![CDATA[<%= fromUserName %>]]></FromUserName>
				<CreateTime><%= createTime %></CreateTime>
				<MsgType><![CDATA[<%= msgType %>]]></MsgType>
				<% if(msgType === 'text'){ %>
					<Content><![CDATA[<%= content %>]]></Content>
				<% } else if(msgType === 'image'){%>
					<Image>
						<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
					</Image>
				<% } else if(msgType === 'voice'){%>
					<Voice>
						<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
					</Voice>
				<% } else if(msgType === 'video'){%>
					<Video>
						<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
						<Title><![CDATA[<%= content.title %>]]></Title>
						<Description><![CDATA[<%= content.description %>]]></Description>
					</Video>
				<% } else if(msgType === 'music'){%>
					<Music>
						<Title><![CDATA[<%= content.title %>]]></Title>
						<Description><![CDATA[<%= content.description %>]]></Description>
						<MusicUrl><![CDATA[<%= content.musicUrl %>]]></MusicUrl>
						<HQMusicUrl><![CDATA[<%= content.hqMusicUrl %>]]></HQMusicUrl>
						<ThumbMediaId><![CDATA[<%= content.thumbMediaId %>]]></ThumbMediaId>
					</Music>
				<% } else if(msgType === 'news'){ %>
					<ArticleCount><%= content.length %></ArticleCount>
					<Articles>
						<% content.forEach(function(item){ %>
							<item>
								<Title><![CDATA[<%= item.title %>]]></Title>
								<Description><![CDATA[<%= item.description %>]]></Description>
								<PicUrl><![CDATA[<%= item.picUrl %>]]></PicUrl>
								<Url><![CDATA[<%= item.url %>]]></Url>
							</item>
						<% }) %>
					</Articles>
				<% } %>
			</xml>`;

var replyTemplate = ejs.compile(tpl);


var htmlTpl = `
<doctype html>
<html>
	<head>
		<title>查电影</title>
		<meta name="viewport" content="width=device-width,initial-sacle=1,maxinum-scale=1.0,minmum=1.0">
	</head>
	<body>
		<button type="button" id="search">点击录音，查询信息</button>
		<p id="title"></p>
		<p id="year"></p>
		<p id="directors"></p>
		<div id="poster"></div>
		<p id="info"></p>
		<script src="//cdn.bootcss.com/zepto/1.2.0/zepto.min.js"></script>
		<script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
		<script>
			wx.config({
			    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
			    appId: '<%= appID %>', // 必填，公众号的唯一标识
			    timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
			    nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
			    signature: '<%= signature %>',// 必填，签名，见附录1
			    jsApiList: [
					'onMenuShareTimeline',
					'onMenuShareAppMessage',
					'onMenuShareQQ',
					'onMenuShareWeibo',
					'onMenuShareQZone',
					'startRecord',
					'stopRecord',
					'onVoiceRecordEnd',
					'playVoice',
					'pauseVoice',
					'stopVoice',
					'onVoicePlayEnd',
					'uploadVoice',
					'downloadVoice',
					'chooseImage',
					'previewImage',
					'uploadImage',
					'downloadImage',
					'translateVoice',
					'getNetworkType',
					'openLocation',
					'getLocation',
					'hideAllNonBaseMenuItem',
					'showAllNonBaseMenuItem',
					'closeWindow'
			    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
			});
			wx.ready(function(){
			    //config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，
			    //config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
				wx.checkJsApi({
				    jsApiList: ['startRecord','stopRecord','translateVoice','onMenuShareAppMessage'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
				    success: function(res) {
				        // 以键值对的形式返回，可用的api值true，不可用为false
				        // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
				        console.log('res',res);
				    }
				});

				//分享内容
				var shareContent = {
					title: '默认', // 分享标题
				    desc: '默认描述', // 分享描述
				    link: '', // 分享链接
				    imgUrl: 'http://static.mukewang.com/static/img/index/logo.png', // 分享图标
				    type: 'link', // 分享类型,music、video或link，不填默认为link
				    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
				    success: function () {
				        // 用户确认分享后执行的回调函数
				        alert('分享成功')
				    },
				    cancel: function () {
				        // 用户取消分享后执行的回调函数
				        alert('取消分享')
				    }
				}
				//分享给朋友接口
				wx.onMenuShareAppMessage(shareContent);

				//预览接口
				var slideImgs = {
					current: '', // 当前显示图片的http链接
    				urls: [] // 需要预览的图片http链接列表
				};

				//点击标题事件
				var isRecording = false; //默认没有录制
				var btn = $('#search');

				btn.on('click',function(){

					if(!isRecording){ //判断是否开始录音
						isRecording = true;
						btn.text('正在录音.....');
						console.log('开始录音了。。。。。。。。。。。');
						wx.startRecord({
							cancel:function () { //用户取消不让使用麦克风
								alert('没有权限录音');
								btn.text('点击录音，查询信息');
							}
						}); //开启录音

						return;
					}

					isRecording = false ;
					btn.text('点击录音，查询信息')
					wx.stopRecord({ //停止录音

					    success: function (res) {
					    	console.log('停止录音了。。。。。。。。。。。');
					    	console.log('录音了res。。。。。。。。。。。',res);
					        var localId = res.localId; //本地录音的标识
					        wx.translateVoice({ //识别音频
							    localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
							    isShowProgressTips: 1, // 默认为1，显示进度提示
							    success: function (res) {
							    	console.log('予语音识别结果',res);
							        // window.alert(res.translateResult); // 语音识别的结果
							        var result = res.translateResult;
							        //ajax请求数据
							        $.ajax({
							        	type:'GET',
							        	url:'https://api.douban.com/v2/movie/search?q='+result,
							        	jsonp:'callback',
							        	dataType:'jsonp',
							        	success:function (data) {
							        		// alert(data.total)
							        		if(!data || data.total == 0){
												$("#info").text("没有对应的查询结果");
							        		}else{
							        			$("#info").text(''); //如果有结果把这句没有结果的提示清除
							        			var subject = data.subjects[0];
							        			$("#title").text(subject.title);//标题
							        			$("#year").text(subject.year);//年份
							        			$("#directors").text(subject.directors.name);//导演
							        			$("#poster").html('<img src="'+subject.images.large+'"/>');//海报

							        			//分享的文案
							        			shareContent.title = subject.title;
							        			shareContent.desc = data.title;
							        			shareContent.link = subject.alt;
							        			shareContent.imgUrl = subject.images.large;
							        			shareContent.type = 'link';
							        			wx.onMenuShareAppMessage(shareContent);

							        			//预览的内容
												slideImgs.current = subject.images.large;
												data.subjects.forEach(function (item) {
													slideImgs.urls.push(item.images.large)
												});
							        		}

							        	},
							        	error:function (xhr, type) {
							        		console.log('请求失败');
							        	},
							        	complete:function (xhr, status) {
							        		console.log('请求完成');
							        	}

							        })

							    },
							    fail:function () {
							    	window.alert('您说的我听不懂');
							    }
							});
					    },
					    fail:function (res) {
					    	console.log('失败返回的：',res);
					    	window.alert('录音失败，请点击重新录音');
					    }
					});
				});

				//预览图片
				$('#poster').on('click',function () {
					wx.previewImage(slideImgs);
				})
			});
			//配置失败接口
			wx.error(function(res){
			    // config信息验证失败会执行error函数，如签名过期导致验证失败，

			  //具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
			  console.log('config error res',res);
			});

		</script>
	</body>
</html>`;

// var htmlTpl = ejs.compile(html);
// console.log(compiled);

//暴露一个对象
exports = module.exports = {
	replyTemplate:replyTemplate,
	htmlTpl:htmlTpl
}