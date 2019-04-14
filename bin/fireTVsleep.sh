#! /bin/bash
/home/www/ha/bin/check-connected.sh "$1"
adb shell am force-stop com.rcreations.WebCamViewerPaid
adb shell am force-stop org.xbmc.kodi
adb shell am force-stop com.android.deskclock
case "$1" in
192.168.2.18) 
	adb shell am force-stop com.netflix.mediaclient
    ;;
192.168.2.30)
	adb shell am force-stop com.netflix.ninja
    ;;
*) echo Nothing Done
   ;;
esac
adb shell su -c am start -n com.android.deskclock/.ScreensaverActivity
#adb disconnect

