import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { BluetoothService } from '../services/bluetooth.service';
import BackgroundFetch from "cordova-plugin-background-fetch";

@Component({
  selector: 'app-scan',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class ScanPage implements OnInit {
  SCAN_INTERVAL_MS = 10 * 1000;
  static API_KEY = "AIzaSyBKnXX1tDjr7tcx3qb_JfaJ4OPPNirQN0w";
  constructor(
    private router: Router,
    private zone: NgZone,
    private bluetooth: BluetoothService,
    private api: ApiService,
  ) { }
  devices = [];
  scanTimeout: number = 0;
  message = ""
  async ngOnInit() {
    this.login();
    let ctx = this;
    const ready = async function () {
      // init bluetooth

      const initResult = await ctx.initBle();
      console.log('initResult', initResult.status);
      // Your BackgroundFetch event handler.
      let onEvent = async (taskId) => {
        console.log('[BackgroundFetch] event received from ionic: ', taskId);
        localStorage.setItem("background", "good")
        // Required: Signal completion of your task to native code
        // If you fail to do this, the OS can terminate your app
        // or assign battery-blame for consuming too much background-time
        BackgroundFetch.finish(taskId);
      };

      // Timeout callback is executed when your Task has exceeded its allowed running-time.
      // You must stop what you're doing immediately BackgroundFetch.finish(taskId)
      let onTimeout = async (taskId) => {
        console.log('[BackgroundFetch] TIMEOUT: ', taskId);
        BackgroundFetch.finish(taskId);
      };

      // Configure the plugin.
      let status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15,
          stopOnTerminate: false,
          enableHeadless: true,
        },
        onEvent,
        onTimeout);
      BackgroundFetch.scheduleTask({
        taskId: 'cordova-background-fetch',
        delay: 5000,       // milliseconds
        forceAlarmManager: true,
        periodic: true,
        stopOnTerminate: false,
        enableHeadless: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
      });
      console.log('[BackgroundFetch] configure, status: ', status);
    };
    // wait for device ready event
    document.addEventListener('deviceready', ready, false);
  }
  login() {
    console.log("start login")
    let token = localStorage.getItem("token")
    console.log("token", token)
    if (token == null) {
      this.api.login().subscribe((data) => {
        console.log("Finished login", data)
      })
    }
  }


  initBle(): Promise<any> {
    return new Promise((resolve, reject) => {
      const params = {
        request: true,
        statusReceiver: false,
        restoreKey: 'bluetoothleplugin',
      };

      const cb = function (res) {
        console.log(`bluetoothle.initialize finished with status ${res.status}`);
        resolve(res);
      };

      this.bluetooth.initialize(cb, params);
    });
  }
  async startScan(): Promise<void> {
    let ctx = this;
    //set empty list
    ctx.zone.run(() => {
      this.devices = [];
    })
    let scanSuccess = (result) => {
      //add only backjoy devices
      console.log(`startScan finished with result`, result);
      if (!this.devices.some(function (device) {
        return device.address === result.address;
      })) {
        ctx.zone.run(() => {
          let temp = result;
          temp.active = false
          this.devices.push(temp)

        });
      }
    }
    ctx.bluetooth.startScan(scanSuccess)
    //stop scan after 10 seconds
    this.scanTimeout = window.setTimeout(() => {
      if (this.devices.length == 0) {
        this.message = "no devices found"
      }
      ctx.bluetooth.isScanning((result) => {
        if (result.isScanning) {
          ctx.bluetooth.stopScan((data) => {
            console.log("stopScan success")
          }, (err) => {
            console.log("stopScan error:", err)
          })
        }
      });
    }, this.SCAN_INTERVAL_MS)
  }
  connect(device) {
    let ctx = this;
    let onConnect = (result) => {
      console.log("discovered", result)
      ctx.zone.run(() => {
        device.active = true;
      });
    }
    let onConnectError = (err) => {
      console.log("Connection error", err)
    }
    this.bluetooth.isScanning((result) => {
      if (result.isScanning) {
        clearTimeout(this.scanTimeout)
        this.bluetooth.stopScan((data) => {
          this.bluetooth.connect(onConnect, onConnectError, device);
        },
          (err) => {
            console.log("err in stopScan", err)
          });
      }
      else {
        this.bluetooth.connect(onConnect, onConnectError, device);
      }
    });
  }
  async closeConnection(device) {
    console.log(device)
    if (device == null) {
      return;
    }
    await this.bluetooth.isConnected(device).then((data: any) => {
      if (data.isConnected) {
        this.bluetooth.close().then((data) => {
          this.zone.run(() => {
            if (device != null) {
              device.active = false;
            }
          })
        });
      }
    })
  }
}
