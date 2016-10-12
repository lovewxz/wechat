var path = require('path');
var wechat_file = path.join(__dirname,'./config/wechat.txt');
var util = require('./libs/util');

var config = {
	wechat:{
		appID:'wx2e4428e24285652d',
		appSecret:'fe9852f1b7f5b5067d2aa0bb32cc2520',
		token:'testtokenyaojun',
		getAccessToken:function(){
			return util.readFileAsync(wechat_file);
		},
		saveAccessToken:function(data){
			data = JSON.stringify(data);
			
			return util.writeFileAsync(wechat_file,data);
		}
	}
};

module.exports = config;