<?php
require_once 'includes.php';
define("MY_DEVICE_ID", 272);
/*
	 Process can execute following commands
	 1) Store data to HA_Database
	 Called from
	 1) esp8266 Hub
	 Expecting
	 1) Type
	 2) Fields matching the above query
	 // 8/9/2015 Now receiving for Axis Cam
 */
$file = 'log/esp.log';
$current = file_get_contents($file);
if (empty($sdata)) {
  $current .= date("Y-m-d H:i:s").":Get ".json_encode($_GET)."\n";
  $sdata = json_encode($_GET);
} else {
  $current .= date("Y-m-d H:i:s").":Post ".$sdata."\n";
}
file_put_contents($file, $current);
$sdata = $_GET;
// esp.php?device=270&param=Temperature&value=26.00
// esp.php?device=291&param=Status&value=0
if (!($sdata=="")) { 					//import_event
	$rcv_message = $sdata;
	$message['deviceID'] = $rcv_message['device'];
	$message['inout'] = COMMAND_IO_RECV;
	$message['commandID'] = COMMAND_SET_RESULT;
	$properties = array();
	$properties[str_replace('_', ' ', $rcv_message['param'])]['value'] = $rcv_message['value'];
	$message['callerID'] = MY_DEVICE_ID;
	$message['data'] = $rcv_message['value'];
	$message['message'] = $sdata;
	if ($message['inout'] == COMMAND_IO_RECV) {
		$device['previous_properties'] = getDeviceProperties(Array('deviceID' => $message['deviceID']));
		$properties['Link']['value'] = LINK_UP;
		$device['properties'] = $properties;
		$message['result'] = updateDeviceProperties(array( 'callerID' => $message['callerID'], 'deviceID' => $message['deviceID'] , 'commandID' => $message['commandID'], 'device' => $device));
	}
	logEvent($message);
}
?>
