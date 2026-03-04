package com.mudassirmhd.koin

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native bridge module for transaction auto-detection.
 * Emits events to JS when transactions are detected from SMS or notifications.
 */
class TransactionBridgeModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "KoinTransactionBridge"
        private const val EVENT_NAME = "onTransactionDetected"

        // Static reference so SmsBroadcastReceiver and NotificationListener can emit events
        private var sharedReactContext: ReactApplicationContext? = null

        fun emitTransaction(
            context: Context,
            amount: Double,
            merchant: String,
            account: String,
            smsBody: String,
            sender: String
        ) {
            val ctx = sharedReactContext ?: return

            if (!ctx.hasActiveReactInstance()) {
                Log.w(TAG, "React instance not active, cannot emit event")
                return
            }

            try {
                val params = Arguments.createMap().apply {
                    putDouble("amount", amount)
                    putString("merchant", merchant)
                    putString("account", account)
                    putString("smsBody", smsBody)
                    putString("sender", sender)
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                    putString("source", if (sender.contains("Pay") || sender.contains("CRED") || sender.contains("BHIM")) "notification" else "sms")
                }

                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(EVENT_NAME, params)

                Log.d(TAG, "Emitted transaction: $merchant = $amount")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit event", e)
            }
        }
    }

    override fun getName(): String = "TransactionBridgeModule"

    override fun initialize() {
        super.initialize()
        sharedReactContext = reactContext
    }

    override fun invalidate() {
        super.invalidate()
        if (sharedReactContext == reactContext) {
            sharedReactContext = null
        }
    }

    /**
     * Check if notification listener permission is granted
     */
    @ReactMethod
    fun isNotificationListenerEnabled(promise: Promise) {
        try {
            val contentResolver = reactContext.contentResolver
            val enabledListeners = Settings.Secure.getString(contentResolver, "enabled_notification_listeners") ?: ""
            val isEnabled = enabledListeners.contains(reactContext.packageName)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Open notification listener settings
     */
    @ReactMethod
    fun openNotificationListenerSettings() {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open notification settings", e)
        }
    }

    /**
     * Check if SMS permission is granted
     */
    @ReactMethod
    fun isSmsPermissionGranted(promise: Promise) {
        try {
            val result = reactContext.checkSelfPermission(android.Manifest.permission.RECEIVE_SMS) == 
                android.content.pm.PackageManager.PERMISSION_GRANTED
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Request SMS permission
     */
    @ReactMethod
    fun requestSmsPermission() {
        val activity = reactContext.currentActivity ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            activity.requestPermissions(
                arrayOf(
                    android.Manifest.permission.RECEIVE_SMS,
                    android.Manifest.permission.READ_SMS
                ),
                1001
            )
        }
    }

    /**
     * Get both permission statuses at once
     */
    @ReactMethod
    fun getPermissionStatuses(promise: Promise) {
        try {
            val contentResolver = reactContext.contentResolver
            val enabledListeners = Settings.Secure.getString(contentResolver, "enabled_notification_listeners") ?: ""
            val notifEnabled = enabledListeners.contains(reactContext.packageName)
            
            val smsGranted = reactContext.checkSelfPermission(android.Manifest.permission.RECEIVE_SMS) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED

            val result = Arguments.createMap().apply {
                putBoolean("notificationListener", notifEnabled)
                putBoolean("smsPermission", smsGranted)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
