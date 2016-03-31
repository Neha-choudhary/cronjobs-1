<?php
//define( 'DEBUG_YAHOOWEATHER', TRUE );
if (!defined('DEBUG_YAHOOWEATHER')) define( 'DEBUG_YAHOOWEATHER', FALSE );
if (!defined('DEBUG_WBUG')) define( 'DEBUG_WBUG', FALSE );

define('IMAGE_CACHE',"/images/yahoo/");
define('FRONT_DIR',"/images/yahoo/");

// 
//  Part of commandfactory
//
function getYahooWeather($params) {

	$station = $params['commandvalue'];
	$deviceID = $params['deviceID'];

	$row = FetchRow("SELECT * FROM ha_mi_oauth20 where id ='YAHOO'");
	$credentials['method'] = $row['method'];
	$credentials['client_id'] = $row['clientID'];
	$credentials['secret'] = $row['secret'];

	$url = "https://query.yahooapis.com/v1/yql";
	$args = array();
	$args["q"] = 'select * from weather.forecast where woeid in (12773052) and u="c"';
	// $args["diagnostics"] = "true";
	// $args["debug"] = "true";
	$args["format"] = "json";

	$get = RestClient::get($url,$args,$credentials,30);

	if (DEBUG_YAHOOWEATHER) echo "<pre>";
	//if (DEBUG_YAHOOWEATHER) echo "response: ".$response;
	$error = false;
	if ($get->getresponsecode()!=200) $error=true;
	if (!$error) {
		$device['previous_properties'] = getDeviceProperties(Array('deviceID' => $deviceID));
		$result = json_decode($get->getresponse());
		if (DEBUG_YAHOOWEATHER) print_r($result);
		$feedback['result'] =  json_encode(json_decode($get->getresponse(), true));
		if (!isset($result->{'query'}->{'results'})) {
			$error = true;
		} else {
			$result = $result->{'query'}->{'results'}->{'channel'};
			$properties['Temperature']['value'] = $result->{'item'}->{'condition'}->{'temp'};
		$properties['Humidity']['value'] =  $result->{'atmosphere'}->{'humidity'};
		$properties['Status']['value'] = STATUS_ON;
		$device['properties'] = $properties;
		$feedback['updateDeviceProperties'] = updateDeviceProperties(array('callerID' => $params['callerID'], 'deviceID' => $deviceID, 'device' => $device));

		$array['deviceID'] = $deviceID;
		$array['mdate'] = date("Y-m-d H:i:s",strtotime( $result->{'item'}->{'pubDate'}));
		$array['temp'] = $result->{'item'}->{'condition'}->{'temp'};
		$array['humidity'] = $result->{'atmosphere'}->{'humidity'};
		$array['pressure'] = $result->{'atmosphere'}->{'pressure'};
		$array['rising'] = $result->{'atmosphere'}->{'rising'};
		$array['visibility'] = $result->{'atmosphere'}->{'visibility'};
		$array['chill'] = $result->{'wind'}->{'chill'};
		$wd = $result->{'wind'}->{'direction'};
		if($wd>=348.75&&$wd<=360) $wdt="N";
		if($wd>=0&&$wd<11.25) $wdt="N";
		if($wd>=11.25&&$wd<33.75) $wdt="NNE";
		if($wd>=33.75&&$wd<56.25) $wdt="NE";
		if($wd>=56.25&&$wd<78.75) $wdt="ENE";
		if($wd>=78.75&&$wd<101.25) $wdt="E";
		if($wd>=101.25&&$wd<123.75) $wdt="ESE";
		if($wd>=123.75&&$wd<146.25) $wdt="SE";
		if($wd>=146.25&&$wd<168.75) $wdt="SSE";
		if($wd>=168.75&&$wd<191.25) $wdt="S";
		if($wd>=191.25&&$wd<213.75) $wdt="SSW";
		if($wd>=213.75&&$wd<236.25) $wdt="SW";
		if($wd>=236.25&&$wd<258.75) $wdt="WSW";
		if($wd>=258.75&&$wd<281.25) $wdt="W";
		if($wd>=281.25&&$wd<303.75) $wdt="WNW";
		if($wd>=303.75&&$wd<326.25) $wdt="NW";
		if($wd>=326.25&&$wd<348.75) $wdt="NNW";
		$array['direction'] = $wdt;
		$array['speed'] = $result->{'wind'}->{'speed'};
		$array['code'] = $result->{'item'}->{'condition'}->{'code'};
		$array['text'] = $result->{'item'}->{'condition'}->{'text'};
		$array['typeID'] = DEV_TYPE_TEMP_HUMIDITY;
		// Get night or day
		$tpb = time();
		$tsr = strtotime(preg_replace("/:(\d) /",":0$1 ",$result->{'astronomy'}->{'sunrise'}));
		$tss = strtotime(preg_replace("/:(\d) /",":0$1 ",$result->{'astronomy'}->{'sunset'}));
		if ($tpb>$tsr && $tpb<$tss) { $daynight = 'd'; } else { $daynight = 'n'; }
		$image = $result->{'item'}->{'condition'}->{'code'}.$daynight.'.png';
		cache_image(IMAGE_CACHE.$image, 'http://l.yimg.com/a/i/us/nws/weather/gr/'.$image);
		$array['link1'] = FRONT_DIR.$image;

		$array['class'] = "";
		if ($daynight == "d") {
			$array['class'] = "w-day";
		} else {
			$array['class'] = "w-night";
		}
		$row = FetchRow("SELECT `severity` FROM `ha_weather_codes` WHERE `code` =".$result->{'item'}->{'condition'}->{'code'});
		if ($row['severity'] == SEVERITY_DANGER) {
			$array['class'] = SEVERITY_DANGER_CLASS;
		}
		if ($row['severity'] == SEVERITY_WARNING) {
			$array['class'] = SEVERITY_WARNING_CLASS;
		}
		PDOupdate("ha_weather_extended", $array, array( 'deviceID' => $deviceID));

		unset($array);
		$i = 0;
		foreach ($result->{'item'}->{'forecast'} as $forecast) {
			//print_r($forecast);
			$array['deviceID'] = $deviceID;
			$array['mdate'] = date("Y-m-d H:i:s",strtotime($forecast->{'date'}));
			$array['day'] = $forecast->{'day'};
			//if ($i == 0) $array['day'] = $array['day'];
			//if ($i == 1) $array['day'] = "Tomorrow";
			$array['low'] = $forecast->{'low'};
			$array['high'] = $forecast->{'high'};
			$array['text'] = $forecast->{'text'};
			$array['code'] = $forecast->{'code'};
			$image = $forecast->{'code'}.'s.png';
			cache_image(IMAGE_CACHE.$image, 'http://l.yimg.com/a/i/us/nws/weather/gr/'.$image);
			$array['link1'] = FRONT_DIR.$image;
			$row = FetchRow("SELECT `severity` FROM `ha_weather_codes` WHERE `code` = ".$forecast->{'code'});
			$array['class'] = "";
			if ($row['severity'] == SEVERITY_DANGER) {
				$array['class'] = SEVERITY_DANGER_CLASS;
			}
			if ($row['severity'] == SEVERITY_WARNING) {
				$array['class'] = SEVERITY_WARNING_CLASS;
			}
			PDOupdate("ha_weather_forecast", $array, array('id' => $i));
//			PDOinsert("ha_weather_forecast", $array);
			$i++;
		}
		}
	}
	if ($error) {
		$feedback['error'] = $get->getresponsecode();
		$properties['Status']['value'] = STATUS_ERROR;
		$device['properties'] = $properties;
		$feedback['updateDeviceProperties'] = updateDeviceProperties(array('callerID' => $params['callerID'], 'deviceID' => $deviceID, 'device' => $device));
	}

	if (DEBUG_YAHOOWEATHER) echo "</pre>";
	return $feedback;
}


function cache_image($file, $url, $hours = 168) {
	//vars

	// Has to run on vlosite
//	$file = $_SERVER['DOCUMENT_ROOT'].$file ;
	$file = '/home/www/vlohome'.$file ;

//echo "***".$file.CRLF;

	$current_time = time(); 
	$expire_time = $hours * 60 * 60; 

	if(file_exists($file)) {
		$file_time = filemtime($file);
		if($current_time - $expire_time < $file_time) {
			return true;
		}
	}

	$content = get_url($url);
	file_put_contents($file, $content);
	return true;
}

function get_url($url) {
	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$url);
	curl_setopt($ch,CURLOPT_RETURNTRANSFER,1); 
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,5);
	$content = curl_exec($ch);
	curl_close($ch);
	return $content;
}

function loadWeather($station) {

	ini_set('max_execution_time',30);

	$mydeviceID = array("KBHM" => 65 , "KEET" => 66);
	$retry = 5;
        $success = False;

        while ($retry > 0 && !$success) {
            try {

            	$url= WEATHER_URL.$station.".xml";
            	$get = restClient::get($url);
            	$feedback = ($get->getresponsecode()==200 ? TRUE : FALSE);
            	if ($feedback) {
            		$xml = new SimpleXMLElement($get->getresponse());
					$device['previous_properties'] = getDeviceProperties(Array('deviceID' => $mydeviceID[$station]));
					$properties['Temperature']['value'] = $xml->temp_c;
					$properties['Humidity']['value'] = $xml->relative_humidity;
					$properties['Status']['value'] = STATUS_ON;
					$device['properties'] = $properties;
					updateDeviceProperties(array('callerID' => 'MY_DEVICE_ID', 'deviceID' => $mydeviceID[$station], 'device' => $device));
                	$success = true; 
            	}
        	}
            catch (Exception $e) {
                //Error trapping
                //My.Application.Log.WriteException(exc, TraceEventType.Error, "Error reading data from" & My.Settings.WeatherUrl & MyStation & ".xml", 301)
                 echo 'Caught exception: ',  $e->getMessage(), "\n";
			} 
			$retry = $retry - 1;
		}
	return ($success ? true : false);
}
?>
