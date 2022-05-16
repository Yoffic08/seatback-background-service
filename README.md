# seatback-background-service




background service is in folder android.

Insert mac address in line 81  and a url to api(the url in code is not valid) at line 89  at BackgroundFetchHeadlessTask class

Insert your ip at resources/android/network_security_config.xml


for testing use:


Connect to device once and then you can exit the app


log: adb logcat -s TSBackgroundFetch 

start the service(not necessary but if you in a rush): adb shell cmd jobscheduler run -f io.ionic.starter  999
