'use strict'
var config = require('../config');
var Wechat = require('../wechat/wechat');
var menu = require('./menu');
var wechatApi = new Wechat(config.wechat);
var path = require('path');

// wechatApi.delMenu().then(function(){
// 		return wechatApi.createMenu(menu);
// })
// .then(function(msg){
// 	console.log(msg);
// });

exports.reply = function *(next){

	var message = this.weixin;
	if(message.MsgType === 'event'){
		if(message.Event === 'subscribe'){
			if(message.EventKey){
				console.log('扫二维码进来：'+message.EventKey+' '+message.ticket);
			}
			this.body = '哈哈，你订阅了这个号';
		}else if(message.Event === 'unsubscribe'){
			this.body = '';
			console.log('无情取关');
		}else if(message.Event === 'LOCATION'){
			this.body  = '您上报的位置是:'+message.Latitude+'/'+message.Longitude+'-'+message.Precision;
		}else if(message.Event === 'CLICK'){
			this.body = '您点击了菜单' + message.EventKey;
		}else if(message.Event === 'SCAN'){
			console.log('关注后扫二维码'+message.EventKey+' '+message.Ticket);
			this.body = '看到你扫了一下';
		}else if(message.Event === 'VIEW'){
			this.body = '您点击了菜单中的链接：'+message.EventKey;
		}else if(message.Event === 'scancode_push'){
			console.log(message.ScanCodeInfo)
			console.log(message.ScanCodeInfo.ScanResult)
			this.body = '您点击了菜单中：'+message.EventKey;
		}else if(message.Event === 'scancode_waitmsg'){
			console.log(message.ScanCodeInfo)
			this.body = '您点击了菜单中：'+message.EventKey;
		}else if(message.Event === 'pic_sysphoto'){
			console.log(message.SendPicsInfo)
			this.body = '您点击了菜单中：'+message.EventKey;
		}else if(message.Event === 'pic_photo_or_album'){
			console.log(message.SendPicsInfo)
			this.body = '您点击了菜单中：'+message.EventKey;
		}else if(message.Event === 'pic_weixin'){
			console.log(message.SendPicsInfo)
			this.body = '您点击了菜单中：'+message.EventKey;
		}else if(message.Event === 'location_select'){
			console.log(message.SendLocationInfo)
			this.body = '您点击了菜单中：'+message.EventKey;
		}		
	}else if(message.MsgType === 'text'){
		var content  = message.Content;
		var reply  = '你说的'+message.Content+'太复杂了';
		if(content === '1'){
			reply = '你回复的第一条信息';
		}else if(content === '2'){
			reply = '你回复的第二条信息';
		}else if(content === '3'){
			var data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'../001.jpg'));

			reply = {
				type:'image',
				mediaId:data.media_id,
			}
			
		}else if(content === '4'){
			var data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'../001.jpg'),{type:'image'});
			reply = {
				type:'image',
				mediaId:data.media_id,
			}
		}else if(content === '5'){
			var data = yield wechatApi.uploadMaterial('video',path.join(__dirname,'../2.mp4'),{type:'video',description:"{\"title\":\"this is a title\",\"introduction\":\"this is instroduction\"}"});
			
			reply = {
				type:'video',
				title: '视频的标题',
				description:'视频的描述',
				mediaId:data.media_id,
			}
		}else if(content === '6'){
			var picData = yield wechatApi.uploadMaterial('image',path.join(__dirname,'../001.jpg'),{});

			var article = {
				articles : [{
					title : '这个是标题',
					thumb_media_id : picData.media_id,
					author : '这是作者',
					digest : '这是摘要',
					show_cover_pic : 1,
					content : '这是内容所以要长长长长长长长长长长',
					content_source_url : 'http://www.pcyy.cn'
				}]
			}
			var data = yield wechatApi.uploadMaterial('news',article,{});
			
			data = yield wechatApi.fetchMaterial('news',data.media_id,{});
			console.log(data);
			var items = data.news_item;
			var news =[];
			
			items.forEach(function(item){
				news.push({
					title : item.title,
					description:item.description,
					picUrl : picData.url,
					url : item.url,
				})
			});
			reply = news;
		}else if(content === '7'){
			var data = yield wechatApi.countMaterial();	
			var opts = {
				type : 'image',
				offset: 0,
				count : 10,
			};
			data = yield wechatApi.batchgetMaterial(opts);
			console.log(data);
			reply = 'data done';
		}else if (content === '8'){
			var name = 'test';
			var data = yield wechatApi.moveGroups([message.FromUserName],'2');
			console.log(data);
			data = yield wechatApi.fetchGroups();
			console.log(data);
			reply = 'create done';

		}else if (content === '9'){
			var data = yield wechatApi.remarkUser(message.FromUserName,'pangzi');
			console.log(data);
			if(data.errcode === 0){
				reply = 'pangzi';
			}
		}else if(content === '10'){
			var data = yield wechatApi.getUserInfo([message.FromUserName]);
			console.log(data);
			reply = 'aaa';
		}else if(content === '11'){
			var data = yield wechatApi.delMenu(menu);
			console.log(data);
			reply = 'aaa';
		}
		this.body = reply;
	}else if(message.MsgType === 'image'){
		this.body = '原来你也是图片';
	}
	yield next;
}