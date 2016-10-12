'use strict'

var sha1 = require('sha1'); 
var getRawBody = require('raw-body');
var Wechat = require('./wechat');
var util = require('./util');
module.exports = function(opts,handler){
	var wechat  = new Wechat(opts);
	return function *(next){
				var token = opts.token;
				var signature = this.query.signature;
				var timestamp = this.query.timestamp;
				var nonce = this.query.nonce;
				var echostr = this.query.echostr;
				var str = [token,timestamp,nonce].sort().join('');
				var sha = sha1(str);
				if(this.method === "GET"){
					if(sha === signature){
						this.body = echostr+'';
					}else{
						this.body = 'wrong';
					}
				}else if(this.method === "POST"){
					if(sha !== signature){
						return false;
					}
					var data = yield getRawBody(this.req,{
						length: this.length,
						limit:'1mb',
						encoding:this.charset 
					})//获取微信服务器发来的信息
					var content = yield util.parseXMLAsync(data); //转成对象的模式
					
					var message = util.formatMessage(content.xml); //转化成标准对象的模式
					console.log(message);
					this.weixin = message; //把微信服务器传来的信息挂载在这个中间件上
					yield handler.call(this,next);//改变作用域，吧控制权给外面的weixin.reply,并传入next

					wechat.reply.call(this);
				}
				
			}
}