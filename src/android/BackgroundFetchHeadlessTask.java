package com.transistorsoft.cordova.backgroundfetch;

import static android.bluetooth.BluetoothDevice.BOND_BONDED;
import static android.bluetooth.BluetoothDevice.BOND_BONDING;
import static android.bluetooth.BluetoothDevice.BOND_NONE;
import static android.bluetooth.BluetoothDevice.TRANSPORT_LE;
import static android.bluetooth.BluetoothGatt.GATT_SUCCESS;
import android.bluetooth.BluetoothGattCallback;
import androidx.appcompat.app.AppCompatActivity;
import java.util.ArrayList;
import java.util.List;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;
import com.transistorsoft.tsbackgroundfetch.BGTask;
import android.util.Log;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import java.util.UUID;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import android.os.Build;
import android.os.Looper;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

public class BackgroundFetchHeadlessTask implements HeadlessTask {
    Context mContext = null;
    BluetoothGatt gatt;

    @Override
    public void onFetch(Context context, BGTask task) {
        this.mContext = context;

        String taskId = task.getTaskId();
        boolean isTimeout = task.getTimedOut();
        if (isTimeout) {
            Log.d(BackgroundFetch.TAG, "My BackgroundFetchHeadlessTask TIMEOUT: " + taskId);
            BackgroundFetch.getInstance(context).finish(taskId);
            return;
        }
        Log.d(BackgroundFetch.TAG, "My BackgroundFetchHeadlessTask:  onFetchIgal: " + taskId);

        MyAsyncTask myAsyncTask = new MyAsyncTask();
        myAsyncTask.execute();
        // Just as in Javascript callback, you must signal #finish
        // BackgroundFetch.getInstance(context).finish(taskId);
    }

    class MyAsyncTask extends AsyncTask<Void, Void, Void> {
        BluetoothGatt mGatt = null;

        public BackgroundFetchHeadlessTask getOuter() {
            return BackgroundFetchHeadlessTask.this;
        }

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }

        @Override
        protected Void doInBackground(Void... params) {
            String MyPREFERENCES = "NativeStorage";
            SharedPreferences sharedpreferences = mContext.getSharedPreferences(MyPREFERENCES, Context.MODE_PRIVATE);
            String str = sharedpreferences.getString("token1", "");
            Log.d(BackgroundFetch.TAG, "pref.getString : " + str);
            BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
            BluetoothDevice device = bluetoothAdapter.getRemoteDevice("00:80:E1:26:28:96");

            Context context = this.getOuter().mContext;

            final BluetoothGattCallback bluetoothGattCallback = new BluetoothGattCallback() {
                public void sendToDb(byte[] posture) {
                    URL url = null;
                    try {
                        url = new URL("http://10.191.5.72:8084/v1.0/ai/record");
                        HttpURLConnection http = (HttpURLConnection) url.openConnection();
                        http.setRequestMethod("POST");
                        http.setDoOutput(true);
                        http.setRequestProperty("Accept", "application/json");
                        http.setRequestProperty("Authorization",
                                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJlbWFpbCI6ImlnYWxAc2VhdGJhY2suY28iLCJmdWxsX25hbWUiOiLXmdeS15DXnCDXodeZ15jXkdenIiwib3JnYW5pemF0aW9uIjoyLCJsYW5ndWFnZSI6ImVuZ2xpc2giLCJub3RpZmljYXRpb25fY291bnQiOjAsInBob25lIjoie1wibnVtYmVyXCI6XCIwNTQtNDI2LTA3MDJcIixcImludGVybmF0aW9uYWxOdW1iZXJcIjpcIis5NzIgNTQtNDI2LTA3MDJcIixcIm5hdGlvbmFsTnVtYmVyXCI6XCIwNTQtNDI2LTA3MDJcIixcImUxNjROdW1iZXJcIjpcIis5NzI1NDQyNjA3MDJcIixcImNvdW50cnlDb2RlXCI6XCJJTFwiLFwiZGlhbENvZGVcIjpcIis5NzJcIn0iLCJ0aW1lem9uZSI6IkFzaWEvSmVydXNhbGVtIiwiY291bnRyeSI6bnVsbCwiaWF0IjoxNjQ2ODQwNTUzLCJleHAiOjE2OTQxODc3NTN9.231CnTS7y-2j5mQq-G2ke5wwr1OIiKqgAtIJPnWx9i4");
                        String data = "test java";

                        byte[] out = data.getBytes(StandardCharsets.UTF_8);

                        OutputStream stream = http.getOutputStream();
                        stream.write(posture);

                        System.out.println(http.getResponseCode() + " " + http.getResponseMessage());
                        http.disconnect();
                        BackgroundFetch.getInstance(context).finish("cordova-background-fetch");
                    } catch (Exception e) {
                        Log.d(BackgroundFetch.TAG, "My BackgroundFetchHeadlessTask ERROR: " + e);
                        e.printStackTrace();
                    }
                }

                @Override
                public void onCharacteristicRead(BluetoothGatt gatt,
                        BluetoothGattCharacteristic characteristic,
                        int status) {
                    Log.d(BackgroundFetch.TAG, "onCharacteristicRead status: " + status);

                    int format = -1;
                    if (status == BluetoothGatt.GATT_SUCCESS) {
                        Log.d(BackgroundFetch.TAG,
                                "onCharacteristicRead BluetoothGatt.GATT_SUCCESS: " + BluetoothGatt.GATT_SUCCESS);
                        try {
                            Log.d(BackgroundFetch.TAG,
                                    String.format("Received characteristic: " + characteristic.toString()));
                            final byte[] posture = characteristic.getValue();
                            String str = "";
                            for (int i = 0; i < posture.length; i++) {
                                str += " " + posture[i] + " ,";
                            }
                            Log.d(BackgroundFetch.TAG, String.format("Received posture: " + str));
                            sendToDb(posture);
                            gatt.close();
                        } catch (Exception e) {
                            Log.d(BackgroundFetch.TAG, "My BackgroundFetchHeadlessTask ERROR: " + e);
                            e.printStackTrace();
                        }

                    }
                }

                @Override
                public void onServicesDiscovered(BluetoothGatt gatt, int status) {
                    Log.d(BackgroundFetch.TAG, "onServicesDiscovered" + status);
                    BluetoothGattCharacteristic bluetoothLeCharacteristic = gatt
                            .getService(UUID.fromString("4FB8BDFA-84D6-11EC-A8A3-0242AC120002"))
                            .getCharacteristic(UUID.fromString("00000000-8E22-4541-9D4C-21EDAE82ED19"));
                    if (bluetoothLeCharacteristic == null) {
                        Log.d(BackgroundFetch.TAG, "not found target service");
                        gatt.disconnect();
                    } else {
                        Log.d(BackgroundFetch.TAG, "found target service");
                        readCharacteristic(bluetoothLeCharacteristic, gatt);
                    }
                }

                @Override
                public void onConnectionStateChange(final BluetoothGatt gatt, final int status, final int newState) {

                    Log.d(BackgroundFetch.TAG, "BluetoothProfile.STATE_CONNECTED: " + BluetoothProfile.STATE_CONNECTED);
                    Log.d(BackgroundFetch.TAG, " GATT_SUCCESS: " + GATT_SUCCESS);
                    if (status == GATT_SUCCESS) {
                        if (newState == BluetoothProfile.STATE_CONNECTED) {
                            int bondstate = device.getBondState();

                            // Take action depending on the bond state
                            if (bondstate == BOND_NONE || bondstate == BOND_BONDED) {
                                Log.d(BackgroundFetch.TAG, "bondstate: " + bondstate + " BOND_NONE " + BOND_NONE
                                        + " BOND_BONDED " + BOND_BONDED);
                                // Connected to device, now proceed to discover it's services but delay a bit if
                                // needed
                                int delayWhenBonded = 0;
                                if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.N) {
                                    Log.d(BackgroundFetch.TAG, "delayWhenBonded = 1000");
                                    delayWhenBonded = 1000;
                                }
                                final int delay = bondstate == BOND_BONDED ? delayWhenBonded : 2000;
                                Log.d(BackgroundFetch.TAG, "delay = " + delay);
                                try {
                                    // Looper.prepare();
                                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                                        @Override
                                        public void run() {
                                            boolean ans = gatt.discoverServices();
                                            Log.d(BackgroundFetch.TAG, "discoverServices ans: " + ans);
                                        }
                                    }, delay);
                                    // Looper.loop();
                                } catch (Exception e) {
                                    Log.d(BackgroundFetch.TAG, "My BackgroundFetchHeadlessTask ERROR: " + e);
                                    e.printStackTrace();
                                }

                            } else if (bondstate == BOND_BONDING) {
                                // Bonding process in progress, let it complete
                                Log.d(BackgroundFetch.TAG, "waiting for bonding to complete");
                            }
                        }
                    } else {
                        Log.d(BackgroundFetch.TAG, "waiting for bonding to complete");
                        // An error happened...figure out what happened!
                        gatt.close();
                    }
                }

                public void readCharacteristic(BluetoothGattCharacteristic characteristic,
                        BluetoothGatt bluetoothGatt) {
                    if (bluetoothGatt == null) {
                        Log.d(BackgroundFetch.TAG, "BluetoothGatt not initialized");
                        return;
                    }
                    bluetoothGatt.readCharacteristic(characteristic);
                }
            };
            BluetoothGatt gatt = device.connectGatt(context, false, bluetoothGattCallback, TRANSPORT_LE);
            mGatt = gatt;
            // URL url = null;
            // try {
            // url = new URL("http://10.191.3.3:8084/v1.0/ai/record");
            // HttpURLConnection http = (HttpURLConnection) url.openConnection();
            // http.setRequestMethod("POST");
            // http.setDoOutput(true);
            // http.setRequestProperty("Accept", "application/json");
            // http.setRequestProperty("Authorization",
            // "Bearer
            // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJlbWFpbCI6ImlnYWxAc2VhdGJhY2suY28iLCJmdWxsX25hbWUiOiLXmdeS15DXnCDXodeZ15jXkdenIiwib3JnYW5pemF0aW9uIjoyLCJsYW5ndWFnZSI6ImVuZ2xpc2giLCJub3RpZmljYXRpb25fY291bnQiOjAsInBob25lIjoie1wibnVtYmVyXCI6XCIwNTQtNDI2LTA3MDJcIixcImludGVybmF0aW9uYWxOdW1iZXJcIjpcIis5NzIgNTQtNDI2LTA3MDJcIixcIm5hdGlvbmFsTnVtYmVyXCI6XCIwNTQtNDI2LTA3MDJcIixcImUxNjROdW1iZXJcIjpcIis5NzI1NDQyNjA3MDJcIixcImNvdW50cnlDb2RlXCI6XCJJTFwiLFwiZGlhbENvZGVcIjpcIis5NzJcIn0iLCJ0aW1lem9uZSI6IkFzaWEvSmVydXNhbGVtIiwiY291bnRyeSI6bnVsbCwiaWF0IjoxNjQ2ODQwNTUzLCJleHAiOjE2OTQxODc3NTN9.231CnTS7y-2j5mQq-G2ke5wwr1OIiKqgAtIJPnWx9i4");

            // String data = "test java";

            // byte[] out = data.getBytes(StandardCharsets.UTF_8);

            // OutputStream stream = http.getOutputStream();
            // stream.write(out);

            // System.out.println(http.getResponseCode() + " " + http.getResponseMessage());
            // http.disconnect();
            // BackgroundFetch.getInstance(context).finish("cordova-background-fetch");
            // } catch (Exception e) {
            // Log.d(BackgroundFetch.TAG, "My BackgroundFetchHeadlessTask ERROR: " + e);
            // e.printStackTrace();
            // }
            return null;
        }

        @Override
        protected void onPostExecute(Void result) {
            super.onPostExecute(result);
        }

    }
}
