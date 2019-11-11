var utils = require("utils");
var CASPER = require('casper');
var myUA = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:47.0) Gecko/20100101 Firefox/50.0';
var casper = CASPER.create({
	pageSettings:{
		//userAgent: myUA,
		customHeaders: {
			'User-Agent': myUA,
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate',
			'Accept-Language': 'en',
		},
		loadImages: false,
		loadPlugins: false,
		webSecurityEnabled: false,
		viewportSize: {
        width: 1280,
        height: 1024
    }
	},
});

var fn = casper.cli.get("fn")
var bot_setting_file_name = fn;
var bot_setting = require('./' + bot_setting_file_name);

var wineUrl_home = "http://www.whisky.fr/en/";

var account_info = bot_setting.settings.account_info; 
var proc_count = bot_setting.settings.proc_count;
var wait_gap = bot_setting.settings.wait_gap;
var target_url = bot_setting.settings.target_url;
var payment_url = bot_setting.settings.payment_url;

logMsg("Wine Bot launch!");
casper.start(wineUrl_home, function() {
	logMsg("Open Home Page Then Login");
}).viewport(1280,1024);

casper.then(function() {
	addCartProc();
});

casper.run(function() {
	logMsg("proc end. ");
	logMsg("---------------------------------------------------------------------------");
	this.exit();
});

function addCartProc() {
	// Login Proc. 
	casper.waitForSelector("div[class='hi-notice']", function(){
		logMsg("Login by : " + account_info.mail);

		casper.evaluate(function(account_info) {
			document.querySelector("#email").value = account_info.mail;
			document.querySelector("#pass").value = account_info.password;
			document.querySelector("#send2").click();
		}, account_info);

	}, onTimeoutFunc, 10000);

	casper.waitForSelector("div[class='hi-notice'] > span[class='fname-customer']", function(){
		logMsg("Login Success : " + account_info.mail);
		goTargetPage();
	}, onTimeoutFunc, 10000);

}

function goTargetPage() {
	var current = 0;

	while(current < proc_count) {
		exec(wait_gap);
		current++;
	}

	function exec(wait_gap) {
		casper.thenOpen(target_url, function() {
			logMsg("Go to Target : " + target_url);
			rtn = casper.evaluate(function() {
				var rtn = {userName: '', targetName: ''};
				var fname = document.querySelector("div[class='hi-notice'] > span[class='fname-customer']").textContent
					var name = document.querySelector("div[class='hi-notice'] > span[class='name-customer']").textContent
					rtn.userName = fname.trim() + name.trim();
				rtn.targetName = document.querySelector("h1[itemprop='name']").textContent;
				return rtn;
			});

			logMsg("Login User Name : " + rtn.userName);
			logMsg("target name : " + rtn.targetName);
		}).then(checkSellStatus);

		casper.wait(wait_gap);
	}
}

function goBuy() {
	logMsg("Exec add to cart process.");
	is_buy = true;

	casper.waitForSelector("div[class=add-to-cart] > button[id*=button-]", function(){
		logMsg("Click add to cart.");
		casper.evaluate(function() {
			var rtn = {};

			// click add to cart. 
			document.querySelector("div[class=add-to-cart] > button[id*=button-]").click();
			//casper.capture('/home/mjohnh/bot_wine/test_c_s.png');

			// click cover plate. 
			document.querySelector("div[id=acp-overlay]").click();
		});

		this.wait(1000);
	})

}

function checkSellStatus() {
	// 0: undef, 1: soon-available, 2: in-stock.
	var sellStatus = 0;

	//casper.capture('/home/mjohnh/bot_wine/test_c.png');
	if (this.exists("div[class='price-box-block'] > p[class*='soon-available']")) {
		sellStatus = 1;
		logMsg('This item is soon-available.');
	}
	else if (this.exists("div[class='price-box-block'] > p[class*='in-stock']")) {
		sellStatus = 2;
		logMsg('This item is in stock.');
		goBuy(sellStatus);
	}
	else {
		sellStatus = 0;
		logMsg('This item is not found.');
	}
	
	return sellStatus;
}

function getInfo() {
	//var userInfo = document.querySelector("div[class='hi-notice']").textContent;
	var userInfo = document.querySelector("div[class='hi-notice']").textContent;
	return userInfo;
}

function logMsg(msg) {
	var d = new Date();
	console.log(d + " : " + msg);
}

var onTimeoutFunc = function() {
	logMsg("Open page fail!");
	casper.echo(JSON.stringify([]));
	casper.exit();
};

