<?php
require_once 'includes.php';

define("MY_DEVICE_ID", 214);
/*
	 Process can execute following commands
	 1) Store data to HA_Database

	 Called from
	 1) ARD-Coop

	 Expecting
	 1) Type
	 2) Fields matching the above query

	 // 8/9/2015 Now receiving for Axis Cam
 */

if (isset($_GET["Message"])) {
	$sdata=$_GET["Message"];
} else {
	$sdata = file_get_contents("php://input");
}

$file = 'log/arduino.log';
$current = file_get_contents($file);
$current .= date("Y-m-d H:i:s").": ".$sdata."\n";
file_put_contents($file, $current);

if (!($sdata=="")) { 					//import_event
	$rcv_message = json_decode($sdata, $assoc = TRUE);
//print_r($rcv_message);

	$message['deviceID'] = $rcv_message['Device'];
	$message['commandID'] = $rcv_message['Command'];
	if (!array_key_exists('InOut', $rcv_message)) $rcv_message['InOut'] = 1;
	$message['inout'] = $rcv_message['InOut'];
	if (!array_key_exists('Status', $rcv_message)) $rcv_message['Status'] = null;
	if (array_key_exists('Value', $rcv_message)) {
		$message['data'] = $rcv_message['Value'];
	} else {
		$message['data'] = $rcv_message['Status'];
	}
	$device = getDevice($message['deviceID']);
	$message['typeID'] = $device['typeID'];
	//$message['message'] = $sdata;
	$message['callerID'] = MY_DEVICE_ID;
	$message['message'] = $rcv_message;

	$properties = array();
	if ($message['inout'] == COMMAND_IO_RECV) {
		if ($message['commandID'] == COMMAND_PING || $message['commandID'] == COMMAND_SET_RESULT) {
		if ($message['typeID'] == DEV_TYPE_ARDUINO_MODULES) {
			// Extended Data is there
			if (array_key_exists('M',$rcv_message['ExtData'])) $properties['Memory']['value'] = $rcv_message['ExtData']['M'];
			if (array_key_exists('U',$rcv_message['ExtData']))$properties['Uptime']['value'] = $rcv_message['ExtData']['U'];
		}
		if ($message['typeID'] == DEV_TYPE_LIGHT_SENSOR_ANALOG) {
			// Extended Data is there
			if (array_key_exists('V',$rcv_message['ExtData'])) $properties['Value']['value'] = $rcv_message['ExtData']['V'];
			if (array_key_exists('S',$rcv_message['ExtData'])) $properties['Setpoint']['value'] = $rcv_message['ExtData']['S'];
			if (array_key_exists('T',$rcv_message['ExtData'])) $properties['Threshold']['value'] = $rcv_message['ExtData']['T'];
		}
		if ($message['typeID'] == DEV_TYPE_AUTO_DOOR) {
			// Extended Data is there
			if (array_key_exists('P',$rcv_message['ExtData'])) $properties['Power']['value'] = $rcv_message['ExtData']['P'];
			if (array_key_exists('D',$rcv_message['ExtData'])) $properties['Direction']['value'] = $rcv_message['ExtData']['D'];
			if (array_key_exists('T',$rcv_message['ExtData'])) $properties['Top Switch']['value'] = $rcv_message['ExtData']['T'];
			if (array_key_exists('B',$rcv_message['ExtData'])) $properties['Bottom Switch']['value'] = $rcv_message['ExtData']['B'];
		}
		if ($message['typeID'] ==  DEV_TYPE_THERMOSTAT_ARD_HEAT || $message['typeID'] == DEV_TYPE_THERMOSTAT_ARD_COOL) {
			// Extended Data is there
			if (array_key_exists('V',$rcv_message['ExtData'])) $properties['Temperature']['value'] = $rcv_message['ExtData']['V'];
			if (array_key_exists('R',$rcv_message['ExtData'])) $properties['IsRunning']['value'] = $rcv_message['ExtData']['R'];
			if (array_key_exists('S',$rcv_message['ExtData'])) $properties['Setpoint']['value'] = $rcv_message['ExtData']['S'];
			if (array_key_exists('T',$rcv_message['ExtData'])) $properties['Threshold']['value'] = $rcv_message['ExtData']['T'];
		}
		if ($message['typeID'] == DEV_TYPE_WATER_LEVEL) {
			// Extended Data is there
			if (array_key_exists('V',$rcv_message['ExtData'])) $properties['Value']['value'] = $rcv_message['ExtData']['V'];
			if (array_key_exists('S',$rcv_message['ExtData'])) $properties['Setpoint']['value'] = $rcv_message['ExtData']['S'];
			if (array_key_exists('T',$rcv_message['ExtData'])) $properties['Threshold']['value'] = $rcv_message['ExtData']['T'];
		}
		if ($message['typeID'] == DEV_TYPE_TEMP_HUMIDITY) {
			if (array_key_exists('T',$rcv_message['ExtData'])) $properties['Temperature']['value'] = $rcv_message['ExtData']['T'];
			if (array_key_exists('H',$rcv_message['ExtData'])) $properties['Humidity']['value'] = $rcv_message['ExtData']['H'];
		}
		}
		$properties['Status']['value'] = $rcv_message['Status'];
		
		$device['previous_properties'] = getDeviceProperties(Array('deviceID' => $message['deviceID']));
		$properties['Link']['value'] = LINK_UP;
		$device['properties'] = $properties;
		
		$error_message = (array_key_exists('ExtData', $rcv_message) ? implode(" - ", $rcv_message['ExtData'] ) : null);
		$message['result'] = updateDeviceProperties(array( 'callerID' => $message['callerID'], 'deviceID' => $message['deviceID'] , 'commandID' => $message['commandID'], 'message' => $error_message, 'device' => $device));
	}
	logEvent($message);
}
?>
