import { Injectable } from '@angular/core';
import { HistoryPacket } from '../models/history';
// declare const bluetoothle: any;
@Injectable({
  providedIn: 'root'
})
export class BluetoothService {


  private static historyPosturePosition = 4;
  private static heatMapPacketSize = 2;
  private static historyPacketSize = 5;
  private static manufacturerData = "21fc"
  device: any
  private static postureParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC120002",
    "characteristic": "00000000-8E22-4541-9D4C-21EDAE82ED19"
  }
  private static timeToBreakParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC120002",
    "characteristic": "4FB8BDFA-84D6-11EC-A8A3-0242AC120003"
  }
  private static historyTimestampParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC120008",
    "characteristic": "4FB8BDFA-84D6-11EC-A8A3-0242AC12000A"
  }
  private static historyLastTimestampParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC120008",
    "characteristic": "4FB8BDFA-84D6-11EC-A8A3-0242AC12000B"
  }
  private static historyParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC120008",
    "characteristic": "4FB8BDFA-84D6-11EC-A8A3-0242AC120009"
  }
  private static heatMapModeParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC12000C",
    "characteristic": "4FB8BDFA-84D6-11EC-A8A3-0242AC12000D"
  }
  private static heatMapReadParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC12000C",
    "characteristic": "4FB8BDFA-84D6-11EC-A8A3-0242AC12000C"
  }
  private static timeBetweenBreaksParams = {
    "service": "4FB8BDFA-84D6-11EC-A8A3-0242AC120006",
    "characteristic": "4FB8BDFA-84D6-11EC-A8A3-0242AC120007"
  }

  private static batteryParams = {
    "service": "180F",
    "characteristic": "2A19"
  }
  discover(success) {
    (<any>window).bluetoothle.discover(success, (err) => {

    },
      { address: this.device.address })
  }

  constructor() {

  }
  //scan will stop after 10 seconds
  startScan(success) {

    const scanParams = {
      services: [],
      allowDuplicates: false,
      scanMode: 2, //bluetoothle.SCAN_MODE_LOW_LATENCY,
      matchMode: 1, //bluetoothle.MATCH_MODE_AGGRESSIVE,
      matchNum: 3, //bluetoothle.MATCH_NUM_MAX_ADVERTISEMENT,
      callbackType: 1 //bluetoothle.CALLBACK_TYPE_ALL_MATCHES,
    };

    let scanError = (err) => {
      console.log("scan error", err)
    }
    console.log("startScan Invoked");
    (<any>window).bluetoothle.startScan((result) => {
      if (result.advertisement) {
        let advertisement = this.encodedStringToBytes(result.advertisement)
        let actual_manufacturerData = advertisement[19].toString(16) + advertisement[18].toString(16);
        if (actual_manufacturerData == BluetoothService.manufacturerData) {
          success(result)
        }
      }

    }, scanError, scanParams);
  }
  stopScan(success, error) {
    console.log('stopScan Invoked');
    (<any>window).bluetoothle.stopScan(success, error);
  }
  //connect and discover services
  connect(success, error, device) {
    return new Promise((resolve, reject) => {
      this.device = device;
      localStorage.setItem("device", JSON.stringify(this.device))
      let connectSuccess = (data) => {
        console.log("connect data", data);
        (<any>window).bluetoothle.discover(success, error, { address: this.device.address })
        resolve(data)
      }
      let connectError = (err) => {
        console.log("connect error", err)
        reject(err)
      }
      (<any>window).bluetoothle.connect(connectSuccess, connectError, { "address": this.device.address })
    });
  }
  isScanning(callback) {
    (<any>window).bluetoothle.isScanning(callback)
  }
  isConnected(device) {
    return new Promise((resolve, reject) => {

      (<any>window).bluetoothle.isConnected((data) => {
        return resolve(data)
      }, (err) => {
        console.log("isConnected error", err)
        return resolve(false)
      }, { address: device.address });
    });
  }
  //disconnect from device
  close() {
    return new Promise((resolve, reject) => {
      console.log("closing connection...");
      (<any>window).bluetoothle.close((data) => {
        localStorage.removeItem("device")
        resolve(data)
      }, (err) => { console.log("error in close", err) }, { address: this.device.address })
    });
  }
  readPosture(success, error) {
    this.subscribe(success, error, BluetoothService.postureParams,)

  }
  readTimeToBreak(success) {
    this.read(success, BluetoothService.timeToBreakParams)
  }
  writeHistoryTimestamp(success, value) {
    let params: any = BluetoothService.historyTimestampParams
    params.value = this.bytesToEncodedString(value)
    return this.write(success, params)
  }
  readHistoryTimestamp(success) {
    this.read(success, BluetoothService.historyTimestampParams)
  }
  readHistoryLastTimestamp(success) {
    this.read(success, BluetoothService.historyLastTimestampParams)
  }
  readHistory(success) {
    this.read(success, BluetoothService.historyParams)
  }
  readHeatMap(success, error) {
    this.read((data) => {
      if (data.value) {
        success(this.getHeatMap(data.value));
      }
    }, BluetoothService.heatMapReadParams)
  }
  subscribeHeatMap(success, error) {
    this.subscribe((data) => {
      if (data.value) {
        success(this.getHeatMap(data.value));
      }
    }, error, BluetoothService.heatMapReadParams)
  }

  writeHeatMapMode(success, value) {
    let params: any = BluetoothService.heatMapModeParams
    params.value = this.bytesToEncodedString(value)
    return this.write(success, params)
  }
  readHeatMapMode(success) {
    this.read(success, BluetoothService.heatMapModeParams)
  }
  writeTimeBetweenBreaks(success, value) {
    let params: any = BluetoothService.timeBetweenBreaksParams
    params.value = this.bytesToEncodedString(value)
    return this.write(success, params)
  }
  readTimeBetweenBreaks(success) {
    this.read(success, BluetoothService.timeBetweenBreaksParams)
  }
  readBatteryLevel(success) {
    this.read(success, BluetoothService.batteryParams)
  }
  subscribe(success, errorCb, params) {
    console.log("starting subscribe...");
    if (this.device == null) {
      this.device = JSON.parse(localStorage.getItem("device"))
    }
    params.address = this.device.address;
    (<any>window).bluetoothle.subscribe((data) => {
      if (data.value) {
        data.value = this.encodedStringToBytes(data.value)
      }
      success(data);
    }, (err) => {
      console.log("Read error", err)
      errorCb(err)
    },
      params)
  }
  read(success, params) {

    console.log("starting read...", params);
    if (this.device == null) {
      this.device = JSON.parse(localStorage.getItem("device"))
    }
    params.address = this.device.address;
    (<any>window).bluetoothle.read((data) => {
      if (data.value) {
        data.value = this.encodedStringToBytes(data.value)
      }
      success(data);
    }, (err) => {
      console.log("Read error", err)
    },
      params)
  }
  write(success, params) {
    if (this.device == null) {
      this.device = JSON.parse(localStorage.getItem("device"))
    }
    params.address = this.device.address;
    (<any>window).bluetoothle.write((data) => {
      success(data);
    }, (err) => {
      console.log("Write error", err)
    },
      params)
  }
  unsubscribePosture(success) {
    this.unsubscribe(success, BluetoothService.postureParams)
  }
  unsubscribeHeatMap(success) {
    this.unsubscribe(success, BluetoothService.heatMapReadParams)
  }
  unsubscribe(unsubscribeSuccess, params) {
    params.address = this.device.address;
    (<any>window).bluetoothle.unsubscribe(unsubscribeSuccess, (err) => {
      console.log("Error in unsubscribe", err)
    }, params);
  }

  initialize(cb: any, params) {
    //will be removed in main app. permission will be managed by service
    (<any>window).bluetoothle.requestPermission((data) => {

    }, (err) => {

    });
    console.log("window", (<any>window).bluetoothle);
    (<any>window).bluetoothle.initialize(cb, params)
  }
  bytesToEncodedString(value) {
    return (<any>window).bluetoothle.bytesToEncodedString(value);
  }
  encodedStringToBytes(value) {
    return (<any>window).bluetoothle.encodedStringToBytes(value)
  }

  getHistory(rawData: Uint8Array) {

    let result: HistoryPacket[] = [];
    for (let i = 1; i < rawData.length; i += BluetoothService.historyPacketSize) {
      let timestamp = this.getHistoryTimestamp(rawData, i, i + 3)

      let temp: HistoryPacket = {
        posture: rawData[i + BluetoothService.historyPosturePosition],
        timestamp: timestamp
      }
      result.push(temp);
    }
    return result
  }
  getHistoryTimestamp(rawData: Uint8Array, start: number, end: number) {
    return (rawData[end] << 24) + (rawData[end - 1] << 16) + (rawData[start + 1] << 8) + (rawData[start])
  }
  getHeatMap(rawData: any): any {

    let result = [];
    for (let i = 0; i < rawData.length; i += BluetoothService.heatMapPacketSize) {
      let sensor = this.getSensor(rawData, i);
      result.push(sensor);
    }
    return result;
  }
  getSensor(rawData, start) {
    return rawData[start] + (rawData[start + 1] << 8);
  }
}
