'use strict'

module.exports = {
	'button':[
		{
			'name':'点击事件',
			'type':'click',
			'key':'menu_key'
		},
		{
			'name':'点出菜单',
			'sub_button':[
				{
					'name':'跳转github'
					'type':'view',
					'url':'http://github.com'
				},
				{
					'name':'扫码推送事件扫码推送事件扫码推送事件',
					'type':'scancode_push',
					'key':'qr_scan'
				},
				{
					'name':'扫码带提示',
					'type':'scancode_waitmsg',
					'key':'qr_scan_wait'
				},
				{
					'name':'弹出系统拍照',
					'type':'pic_sysphoto',
					'key':'pic_photo'
				},
				{
					'name':'弹出拍照或者相册',
					'type':'pic_photo_or_album',
					'key':'pic_photoor_album'
				}

			]
		},
		{
			'name':'点出菜单2',
			'sub_button':[
				{
					'name':'弹出微信相册',
					'type':'pic_weixin',
					'key':'pic_weixin'
				},
				{
					'name':'地理位置选择',
					'type':'location_select',
					'key':'location_select'
				}
				// {
				// 	'name':'下发消息（除文本消息）',
				// 	'type':'media_id',
				// 	'media_id':''
				// },
				// {
				// 	'name':'跳转图文消息URL',
				// 	'type':'view_limited',
				// 	'media_id':''
				// }
			]
		}
	]
}