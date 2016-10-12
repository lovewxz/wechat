'use strict'

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var _ = require('lodash');
var prefix = "https://api.weixin.qq.com/cgi-bin/";
var fs = require('fs');
var api = {
	accessToken : prefix + 'token?grant_type=client_credential',
	temporary:{
		upload : prefix + 'media/upload?',
		fetch : prefix + 'media/get?',
	},
	permanent:{
		upload : prefix + 'material/add_material?',
		uploadNews : prefix + 'material/add_news?',
		uploadNewsPic : prefix + 'media/uploadimg?',
		fetch : prefix + 'material/get_material?',
		deleteMaterial : prefix + 'material/del_material?',
		updateMaterial : prefix + 'material/update_news?',
		count:prefix+'material/get_materialcount?',
		batchget:prefix+'material/batchget_material?'
	},
	group:{
		create : prefix+'groups/create?',
		fetch : prefix +'groups/get?',
		check : prefix + 'groups/getid?',
		update : prefix + 'groups/update?',
		move : prefix + 'groups/members/update?',
		batchmove : prefix + 'groups/members/batchupdate?',
		del : prefix + 'groups/delete?'
	},
	user:{
		remark : prefix+'user/info/updateremark?',
		usersingleinfo : prefix + 'user/info?',
		userlistinfo : prefix +'user/info/batchget?'
	},
	menu:{
		create : prefix+'menu/create?',
		fetch : prefix+'menu/get?',
		del : prefix+'menu/delete?',
		getcurrent:prefix+'get_current_selfmenu_info?'
	}
};



function Wechat(opts){
	var that = this;
	this.appID = opts.appID;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.fetchAccessToken();
	
}

Wechat.prototype.createMenu = function(menu){
	var that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.menu.create+'access_token='+data.access_token;
				var options ={
					method : 'POST',
					json : true,
					url : url,
					body : menu,
				}
				request(options).then(function(response){
					var _data =response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('create menu fails');
					}

				})
				.catch(function(err){
					reject(err);
				})
			})
	})
}



Wechat.prototype.fetchMenu = function(){
	var that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.menu.fetch+'access_token='+data.access_token;
				var options ={
					json : true,
					url : url
				}
				request(options).then(function(response){
					var _data =response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('fetch menu fails');
					}

				})
				.catch(function(err){
					reject(err);
				})
			})
	})
}


Wechat.prototype.delMenu = function(){
	var that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.menu.del+'access_token='+data.access_token;
				var options ={
					json : true,
					url : url
				}
				request(options).then(function(response){
					var _data =response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('delete menu fails');
					}

				})
				.catch(function(err){
					reject(err);
				})
			})
	})
}

Wechat.prototype.currentMenu = function(){
	var that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.menu.getcurrent+'access_token='+data.access_token;
				var options ={
					json : true,
					url : url
				}
				request(options).then(function(response){
					var _data =response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('getcurrent menu fails');
					}

				})
				.catch(function(err){
					reject(err);
				})
			})
	})
}



Wechat.prototype.fetchAccessToken = function(){

	var that = this;
	if(this.access_token && this.expires_in){
		if(this.isValidAceessToken(this)){
			return Promise.resolve(this);
		}
	}

	this.getAccessToken()
		.then(function(data){
			try{
				data = JSON.parse(data);
				
			}catch(e){
				that.updateAccessToken();
			}
			if(that.isValidAceessToken(data)){
				
				return Promise.resolve(data);
			}else{
				return that.updateAccessToken();
			}
		})
		.then(function(data){
			
			that.access_token = data.access_token;
			that.expires_in = data.expires_in;

			that.saveAccessToken(data);
			return Promise.resolve(data);
		})
}
Wechat.prototype.isValidAceessToken = function(data){
	if(!data || !data.access_token || !data.expires_in){
		return false;
	}
	var access_token = data.access_token;
	var expires_in = data.expires_in + 0;
	var now = (new Date().getTime()) + 0;
	
	if(now < expires_in){
		
		return true;
	}else{
		
		return false;
	}
}

Wechat.prototype.updateAccessToken = function(){
	var appID = this.appID;
	var appSecret = this.appSecret;
	var url = api.accessToken + "&appid=" +appID+"&secret="+appSecret;
	
	return new Promise(function(resolve,reject){
		request({url:url,json:true}).then(function(response){
			
			var data = response.body;
			
			var now = (new Date().getTime());
			var expires_in = now+(data.expires_in - 20) * 1000;
			data.expires_in = expires_in;
			
			resolve(data);
		});
	});
	

}

Wechat.prototype.uploadMaterial = function(type,material,permanent){
	var that = this;
	var form = {};
	var uploadUrl = api.temporary.upload;
	if(permanent){
		uploadUrl = api.permanent.upload; //永久素材的URL(不包括图文的)
		_.extend(form,permanent);//假如永久素材传递的是图文消息，也就是传递article数组，让form继承permanent对象
	}

	if(type === 'pic'){
		uploadUrl = api.permanent.uploadNewsPic; //如果是图文消息中的图片，则URL改变成图文消息的图片上传URL
	}

	if(type === 'news'){
		uploadUrl = api.permanent.uploadNews; //如果是图文消息，则URL改变成图文消息上传URL
		form = material;//FORM对象被传递进来的数组赋值，因为是图文消息，所以传进来的一定是article数组。

	}else{
		/**
			上传其他类型的数据是，必须POST一个表单ID为MEIDA的formData
			其中视频数据还要另外POST一个表单为description的表单
		**/	
		form.media = fs.createReadStream(material); //定义一个media属性，获得一个传入的路径，并且用FS生成一个可读的流,参数为传递的路径
	}
	
	
	return new Promise(function(resolve,reject){
		that
		 .fetchAccessToken()
		 .then(function(data){

		 	var url = uploadUrl + "access_token=" +data.access_token;
		 	if(!permanent){
		 		url += "&type="+type;
		 	}else{
		 		form.access_token = data.access_token;

		 	}

		 	var options ={
		 		method:'POST',
		 		url : url,
		 		json : true,
		 		
		 	}

		 	if(type === 'news'){
		 		options.body = form;
		 	}else{
		 		options.formData = form;
		 	}
		 	JSON.stringify(options.body);
		 	
		 	request(options).then(function(response){
				
				var _data = response.body;
				
				
				if(_data){
					resolve(_data);
					
				}else{
					throw new Error('upload material fails');
				}
			})
			.catch(function(err){
				reject(err);	
			})
		 })
		
	});
	

}
Wechat.prototype.countMaterial = function(){
	var that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.permanent.count + "access_token=" + data.access_token;
				var options = {
					method:'GET',
					url : url,
					json: true,
				}
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('count material error');
					}
				})
				.catch(function(err){
					reject(err);
				});
			})
	});
}

Wechat.prototype.batchgetMaterial = function(opts){
	var that  = this;
	var form = {
		type : opts.type || 'image',
		offset : opts.offset || 0,
		count : opts.count || 1
	}
	return new Promise(function(resolve,reject){

		that.fetchAccessToken()
			.then(function(data){
				var url = api.permanent.batchget + "access_token="+data.access_token; 
				var options = {
					method : 'POST',
					url : url,
					json : true,
					body : form,
				}
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('batchget material error');
					}
				})
				.catch(function(err){
					reject(err);
				});
			})

	});
}
Wechat.prototype.updateMaterial = function(mediaId,news){
	var that = this;
	var form = {
		media_id : mediaId,
	};
	_.extend(form,news);
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.permanent.updateMaterial + 'access_token=' + data.access_token;
				var options = {
					method : 'POST',
					url : url,
					json : true,
					body : form
				}
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(data);
					}else{
						throw new Error('update material error');
					}
				})
				.catch(function(err){
					reject(err);
				})
			})
	})
}
Wechat.prototype.deleteMaterial = function(mediaId){
	var that = this;
	var form = {
		media_id : mediaId,
	};
	return new Promise(function(resolve,reject){

		that.fetchAccessToken()
			.then(function(data){
				var url = api.permanent.deleteMaterial + 'access_token='+ data.access_token;
				var options = {
					method : 'POST',
					url : url,
					json : true,
					body : form,
				}
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('delete material error');
					}
				})
				.catch(function(err){
					reject(err);
				})
			})
	});
}

Wechat.prototype.fetchMaterial = function(type,mediaId,permanent){
	var that = this;
	var fetchUrl = api.temporary.fetch;
	if(permanent){
		fetchUrl = api.permanent.fetch;	
	}
	var form = {
		media_id : mediaId,
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = fetchUrl+"access_token="+data.access_token;
				var options = {
					method : 'POST',
					url : url,
					json : true,
				}
				if(!permanent){
					url += "&media_id="+mediaId;
					options.method = 'GET';
					if(type === 'video'){
						url.replace('https://','http://');
					}
				}else{
					options.body =  form;
				}
				
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('fetch material fails');
					}
				})
				.catch(function(err){
					reject(err);
				})
			})
	})

}
Wechat.prototype.createGroup = function(name){
	var that = this;
	var form = {
		group : {
			name : name,
		}
	}
	return new Promise(function(resolve,reject){	
		that.fetchAccessToken()
			.then(function(data){
				var url = api.group.create + "access_token=" + data.access_token;
				var options = {
					method : 'POST',
					url :url,
					json : true,
					body : form,
				}
				
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('createGroup error');
					}
				})
				.catch(function(err){
					reject(err);
				})
							
			})
	})
}
Wechat.prototype.checkGroup = function(openId){
	var that = this;
	var form = {
		openid : openId
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.group.check + "access_token=" + data.access_token;
				var options = {
					method : 'POST',
					url :url,
					json : true,
					body : form
				}
				
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('checkGroup error');
					}
				})
				.catch(function(err){
					reject(err);
				})
				
			})
	})
}

Wechat.prototype.updateGroup = function(id,name){
	var that = this;
	var form = {
		group : {
			id : id,
			name : name,
		}
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.group.update + "access_token=" + data.access_token;
				var options = {
					method : 'POST',
					url :url,
					json : true,
					body : form
				}
				
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('updateGroup error');
					}
				})
				.catch(function(err){
					reject(err);
				})
				
				
			})
	})
}

Wechat.prototype.moveGroups = function(openIds,to){
	var that = this;
	var form = {
		to_groupid : to,
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = '';
				if(_.isArray(openIds)){
					url = api.group.batchmove + "access_token=" + data.access_token;
					form.openid_list = openIds;
				}else{
					url = api.group.move + "access_token=" + data.access_token;
					form.openid = openIds;
				}
				
				var options = {
					method : 'POST',
					url :url,
					json : true,
					body : form
				}
				
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('moveGroup error');
					}
				})
				.catch(function(err){
					reject(err);
				})
				
				
			})
	})
}

Wechat.prototype.fetchGroups = function(){
	var that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.group.fetch + "access_token=" + data.access_token;
				var options = {
					method : 'GET',
					url :url,
					json : true,
				}
				
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('fetchGroups error');
					}
				})
				.catch(function(err){
					reject(err);
				})
				
				
			})
	})
}

Wechat.prototype.delGroup = function(id){
	var that = this;
	var form = {
		group : {
			id : id,
		}
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.group.del + "access_token=" + data.access_token;
				var options = {
					method : 'POST',
					url :url,
					json : true,
					body : form,
				}
				
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('delGroup error');
					}
				})
				.catch(function(err){
					reject(err);
				})
			
			})
	})
}
Wechat.prototype.remarkUser = function(openId,remark){
	var that = this;
	var form = {};
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url = api.user.remark + 'access_token='+data.access_token;
				form = {
					openid : openId,
					remark : remark,
				};
				var options = {
					method : 'POST',
					url : url,
					json : true,
					body : form
				}
				console.log(options);
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('remark User error');
					}
				})
				.catch(function(err){
					reject(err);
				})
			})
	})
}

Wechat.prototype.getUserInfo = function(openIds,lang){
	var that = this;
	lang = lang || 'zh_CN';
	
	var form = {
		user_list:[],
	};
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				
				var url = '';
				var options = {
					json : true,
				};
				if(_.isArray(openIds)){
					options.method = 'POST';
					openIds.forEach(function(item){
						form.user_list.push({
							openid : item,
							lang : lang
						})
					});
					options.body = form;

					options.url = api.user.userlistinfo + 'access_token=' + data.access_token;
				}else{

					options.url = api.user.usersingleinfo + 'access_token='+data.access_token+'&openid='+openIds+'&lang='+lang; 
					
				}
				
				console.log(options);
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('remark User error');
					}
				})
				.catch(function(err){
					reject(err);
				})
			})
	})

}

Wechat.prototype.reply = function(){
	var content  = this.body;
	var message = this.weixin;

	var xml = util.tpl(content,message);
	this.status = 200;
	this.type = 'application/xml';
	this.body = xml;
}

module.exports = Wechat;

