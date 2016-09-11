'use strict';

var ejs = require('ejs');

// var heredoc = require('heredoc');

//6种回复消息模板
var tpl = `<xml>
				<ToUserName><![CDATA[<%= content.toUserName %>]]></ToUserName>
				<FromUserName><![CDATA[<%= content.fromUserName %>]]></FromUserName>
				<CreateTime><%= content.createTime %></CreateTime>
				<MsgType><![CDATA[<%= content.msgType %>]]></MsgType>
				<% if(content.msgType === 'text'){ %>
					<Content><![CDATA[<%= content.content %>]]></Content>
				<% } else if(content.msgType === 'image'){%>
					<Image>
						<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
					</Image>
				<% } else if(content.msgType === 'voice'){%>
					<Voice>
						<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
					</Voice>
				<% } else if(content.msgType === 'video'){%>
					<Video>
						<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
						<Title><![CDATA[<%= content.title %>]]></Title>
						<Description><![CDATA[<%= content.description %>]]></Description>
					</Video> 
				<% } else if(content.msgType === 'music'){%>
					<Music>
						<Title><![CDATA[<%= content.title %>]]></Title>
						<Description><![CDATA[<%= content.description %>]]></Description>
						<MusicUrl><![CDATA[<%= content.musicUrl %>]]></MusicUrl>
						<HQMusicUrl><![CDATA[<%= content.hqMusicUrl %>]]></HQMusicUrl>
						<ThumbMediaId><![CDATA[<%= content.thumbMediaId %>]]></ThumbMediaId>
					</Music>
				<% } else if(content.msgType === 'news'){ %>
					<ArticleCount><%= content.length %></ArticleCount>
					<Articles>
						<% conetnt.forEach(function(item){ %>
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

// console.log(compiled);

var info = { content: '哈哈，你订阅了这个号',
  createTime: 1473293989940,
  msgType: 'text',
  fromUserName: 'gh_496233586c0a',
  toUserName: 'o6lccuJ8kO8h0TWW2KY6ayxIVSqc' }


  console.log(replyTemplate({content:info}));