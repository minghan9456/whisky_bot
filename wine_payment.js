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

logMsg("Wine Payment Bot launch!");
casper.start(wineUrl_home, function() {
	logMsg("Open Home Page Then Login");
}).viewport(1280,1024);

casper.then(function() {
	paymentProc();
});

casper.run(function() {
	logMsg("proc end. ");
	logMsg("---------------------------------------------------------------------------");
	this.exit();
});

function paymentProc() {
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
		goPaymentPage();
	}, onTimeoutFunc, 10000);
}

function goPaymentPage() {
	var current = 0;

	while(current < 1) {
		exec(wait_gap);
		current++;
	}

	function exec() {
		casper.thenOpen(payment_url, function() {
			logMsg("Go to Payment checkout page : " + payment_url);
		}).then(checkOrderStatus);
		casper.wait(wait_gap);
	}

	function checkOrderStatus() {
		// 0: undef, 1: soon-available, 2: in-stock.
		var orderStatus = 0;

		//casper.capture('/home/mjohnh/bot_wine/test_p.png');
		if (this.exists("ul[class=summary-items] > li > div[class=item-infos]")) {
			orderStatus = 1;
			logMsg('Exec order proc. ');
			payment(orderStatus);
		}
		else if (this.exists("div[class='cart-empty']")) {
			orderStatus = 2;
			logMsg('Cart is empty.');
		}
		else {
			orderStatus = 0;
			logMsg('This Cart order list is not found.');
		}
	
		return orderStatus;
	}

	function payment() {
		casper.waitForSelector("ul[class=summary-items] > li > div[class=item-infos]", function(){
			info = casper.evaluate(function() {
			var rtn = {
				order_list: [],
				Subtotal: 0,
				Shipping_fees: 0,
				TAX: 0,
				TOTAL: 0,
				bill_addr: "",
				shipping_addr: "",
				shipping_method: "",
			}
			var order_info_obj = document.querySelectorAll("div[class=summary-totals] tr td");
				if (order_info_obj.length) {
					rtn.Subtotal = order_info_obj[1].textContent.trim();
					rtn.Shipping_fees = order_info_obj[3].textContent.trim();
					rtn.TAX = order_info_obj[5].textContent.trim();
					rtn.TOTAL = order_info_obj[7].textContent.trim();
				}

				var order_list_obj = document.querySelectorAll("ul[class=summary-items] > li > div[class=item-infos]");
				for(var i = 0; i < order_list_obj.length; i++) {
					_name = order_list_obj[i].querySelector('h3').textContent.trim();
					p_obj = order_list_obj[i].querySelectorAll('p');
					var item = {
						'name': _name,
						'quantity': p_obj[0].textContent.trim(),
						'price': p_obj[1].textContent.trim(),
					}	

					rtn.order_list.push(item);
				}

				//select addr.
				document.querySelector('ul input[name=billing_address_id]').click();
				//summit
				document.querySelector("button[onclick='billing.save()']").click();

				return rtn;
			});

			casper.waitForSelector("div[id=billing-progress-opcheckout] address", function(){
				info2 = casper.evaluate(function() {
					var rtn = {
						bill_addr: "",
						shipping_addr: "",
					}

					rtn.bill_addr = document.querySelector("div[id=billing-progress-opcheckout] address").textContent.trim();
					rtn.shipping_addr = document.querySelector("div[id=shipping-progress-opcheckout] address").textContent.trim();

					//select ship method.
					document.querySelector("ul input[id=s_method_owebiashipping1_dhl_express_expworldwide_zone6]").click();
					//summit
					document.querySelector("button[onclick='shippingMethod.saveWithColissimo();']").click();

					return rtn;
				});
			});

			casper.waitForSelector("div[id=shipping_method-progress-opcheckout] dd", function(){
				info3 = casper.evaluate(function() {
					var rtn = {
						shipping_method: "",
					}

					rtn.shipping_method = document.querySelector("div[id=shipping_method-progress-opcheckout] dd").textContent.trim();

					//select payment method.
					document.querySelector("dt input[id=p_method_checkmo]").click();
					document.querySelector("button[onclick='payment.save()']").click();

					return rtn;
				});

			}).then(function() {
				info.bill_addr = info2.bill_addr;
				info.shipping_addr = info2.shipping_addr;
				info.shipping_method = info3.shipping_method;
				logMsg("Order Info : ");
				console.log(JSON.stringify(info));
				//casper.capture('/home/mjohnh/bot_wine/test_p_s.png');
			});

		});//end firsit wait for
	}
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
