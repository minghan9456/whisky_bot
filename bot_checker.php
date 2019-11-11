<?php
date_default_timezone_set("Asia/Taipei");
$accountNum = $argv[1];

/*
exec("phantomjs -v", $ret);
exec("casperjs --version", $ret);
print_r($ret);exit;
*/

LogMsg("Start check Account{$accountNum} bot");
if ($accountNum) {
	$cart_cmd = "ps ax | grep 'casper' | grep 'wine.js' | grep 'bot_setting_account{$accountNum}'";
	exec($cart_cmd, $cart_ret);

	if ($cart_ret) array_pop($cart_ret);

	if ($cart_ret) {
		foreach($cart_ret as $proc) {
			$tmp_proc_info = explode(" ", $proc);

			for ($i=0; $i < sizeof($tmp_proc_info); $i++) if(! strcmp($tmp_proc_info[$i], "") ) unset($tmp_proc_info[$i]);

			$tmp_proc_info = array_values($tmp_proc_info);

			$proc_id = $tmp_proc_info[0];
			$time = $tmp_proc_info[5];
			$exeName = $tmp_proc_info[6];

			if ($exeName == "phantomjs" && ($time) && (strtotime($time) >= strtotime('00:30'))) {
				//kill proc. 
				LogMsg("kill bot cart{$accountNum}");
				$cmd = "kill -9 ".$proc_id;
				exec($cmd, $cart_ret);

				//redo. 
				LogMsg("exec bot cart{$accountNum}");
				execBot('cart', $accountNum);
			}
			else {
				LogMsg("cart bot status is good");
			}

		}
	}
	else {
		//exec. 
		LogMsg("exec bot cart{$accountNum}");
		execBot('cart', $accountNum);
	}

	$payment_cmd = "ps ax | grep 'casper' | grep 'wine_payment.js' | grep 'bot_setting_account{$accountNum}'";
	exec($payment_cmd, $payment_ret);

	if ($payment_ret) array_pop($payment_ret);

	if ($payment_ret) {
		foreach($payment_ret as $proc) {
			$tmp_proc_info = explode(" ", $proc);

			for ($i=0; $i < sizeof($tmp_proc_info); $i++) if(! strcmp($tmp_proc_info[$i], "") ) unset($tmp_proc_info[$i]);

			$tmp_proc_info = array_values($tmp_proc_info);
			//print_r($tmp_proc_info);

			$proc_id = $tmp_proc_info[0];
			$time = $tmp_proc_info[5];
			$exeName = $tmp_proc_info[6];

			if ($exeName == "phantomjs" && ($time) && (strtotime($time) >= strtotime('00:20'))) {
				//kill proc. 
				LogMsg("kill bot payment{$accountNum}");
				$cmd = "kill -9 ".$proc_id;
				exec($cmd, $payment_ret);

				//redo. 
				LogMsg("exec bot payment{$accountNum}");
				execBot('payment', $accountNum);
			}
			else {
				LogMsg("payment bot status is good");
			}

		}
	}
	else {
		//exec. 
		LogMsg("exec bot payment{$accountNum}");
		execBot('payment', $accountNum);
	}
}
LogMsg("---------------------------------------------------------------------------");
exit;

function LogMsg($msg) {
	$d = date("Ymd H:i:s");
	$str ="{$d} : {$msg}\n";

	echo($str);
	//file_put_contents("/var/www/html/space/.log.txt", $str, FILE_APPEND);
}

function execBot($execBotType, $accountNum) {
	$cmd = "";
	if ($execBotType == "cart") {
		$cmd = "/usr/local/bin/casperjs /home/mjohnh/bot_wine/wine.js --fn=bot_setting_account{$accountNum} >> /home/mjohnh/bot_wine/log/addCart{$accountNum}.log &"; 
	}
	else if ($execBotType == "payment") {
		$cmd = "/usr/local/bin/casperjs /home/mjohnh/bot_wine/wine_payment.js --fn=bot_setting_account{$accountNum} >> /home/mjohnh/bot_wine/log/payment{$accountNum}.log &";
	}

	if ($cmd && $accountNum) {
		exec($cmd, $ret);
	}
}
