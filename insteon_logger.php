#!/usr/bin/php5
<?php
require_once 'includes.php';

define("MY_DEVICE_ID", 137);
define("INSTEON_HUB_IP", "192.168.2.125");
define("INSTEON_HUB_PORT", 9761);

define( 'DEBUG_INSTEON', FALSE );
//define( 'DEBUG_INSTEON', TRUE );


class console{
	public static function log($msg, $arr=array()){
		$str = vsprintf($msg, $arr);
		fprintf(STDERR, "$str\n");
	}
}

if(version_compare(PHP_VERSION, "5.3.0", '<')){
	// tick use required as of PHP 4.3.0
	declare(ticks = 1);
}

pcntl_signal(SIGTERM, "signal_handler");
pcntl_signal(SIGHUP, "signal_handler");
pcntl_signal(SIGINT, "signal_handler");

if(version_compare(PHP_VERSION, "5.3.0", '>=')){
	pcntl_signal_dispatch();
	console::log("Signal dispatched");
}

//  PVTODO: Restart TCP connection on lost.
//  PVTODO: Receive multiple packets, get length and parse sepearately
//  PVTODO: Handle Broken packets
//  PVDONE: Status request, not working
//			Poll All-Link Database numbers and store
//			Interpret CMD1 & CMD2 as All-Link Number and Status

$errors = 0;

// Inf loop till signal
while (true) {
	try {
		$transport = new SocketTransport(array(INSTEON_HUB_IP),INSTEON_HUB_PORT);
		$inst_hub = new InsteonHub(INSTEON_HUB_IP,INSTEON_HUB_PORT);

		if ($inst_hub) {

			$last = strtotime(date("Y-m-d H:i:s"));
			echo date("Y-m-d H:i:s").": ".UpdateLink(MY_DEVICE_ID)." My Link Updated <br/>\r\n";

			// Inf loop till signal or error
			while (true) {
				$errors = 0;
				$message = $inst_hub->getMessage(); 
				if ($deviceID = setDeviceID($message)) { 		// No device founds so use my_id as callerID
					$message['callerID'] = $deviceID;
				} else {
					$message['callerID'] = MY_DEVICE_ID;
				}
				print_r($message);
				if (!array_key_exists('commandID', $message)) $message['commandID'] = COMMAND_UNKNOWN;
				logEvent($message);
				if ($message['inout'] == COMMAND_IO_RECV) {
					echo date("Y-m-d H:i:s").": ".'Update Status: '.json_encode(UpdateStatus($message['callerID'], array ( 'deviceID' => $deviceID, 'commandID' => $message['commandID'])))."</br>\n";
					echo date("Y-m-d H:i:s").": ".'Update Link: '.UpdateLink ($deviceID, LINK_UP, $message['callerID'], $message['commandID'])."</br>\n";
				}
				
				// Update My Link 
				if (timeExpired($last, 15)) {
					echo date("Y-m-d H:i:s").": ".UpdateLink(MY_DEVICE_ID)." My Link Updated <br/>\r\n";
				}
			}
		}
	}
	catch (Exception $e) {
		$errors = $errors + 1;
		echo "Retry: ".$errors." ".$e->getMessage();
		unset ($inst_hub);
		sleep(30 * $errors);
	}
	
}	

function setDeviceID(&$log){


	$deviceID = null;
	$mysql='SELECT `id`, `typeID` FROM `ha_mf_devices` WHERE `code` ="'.$log['code'].'" AND `unit` ="'.$log['unit'].'"';
	if ($rowdevice = FetchRow($mysql)) {
		$log['deviceID'] = $rowdevice['id'];
		$log['callerID'] = $rowdevice['id'];
		$log['typeID'] = $rowdevice['typeID'];
		$deviceID = $rowdevice['id'];
	}
	unset($log['code']);
	unset($log['unit']);
	
	return $deviceID ;
	
}

function cleanup(){
	global $inst_hub;
	echo "Cleaning up\n";
	unset ($inst_hub);
	exit (1);
}

function signal_handler($signo){
	console::log("Caught a signal %d", array($signo));
	switch ($signo) {
	 case SIGINT:
	 	// handle restart tasks
	 	cleanup();
	 	break;
	 case SIGTERM:
	 	// handle shutdown tasks
	 	cleanup();
	 	break;
	 case SIGHUP:
	 	// handle restart tasks
	 	cleanup();
	 	break;
	 default:
	 	fprintf(STDERR, "Unknown signal ". $signo);
	}
}
?>