package com.mudassirmhd.koin

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * NotificationListenerService that captures payment app notifications.
 * Supports: Google Pay, PhonePe, Paytm, Amazon Pay, CRED, etc.
 */
class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "KoinNotifListener"

        // Payment app package names
        private val PAYMENT_APPS = setOf(
            "com.google.android.apps.nbu.paisa.user",  // Google Pay
            "com.phonepe.app",                           // PhonePe
            "net.one97.paytm",                          // Paytm
            "in.amazon.mShop.android.shopping",         // Amazon Pay
            "com.dreamplug.androidapp",                 // CRED
            "in.org.npci.upiapp",                       // BHIM
            "com.whatsapp",                             // WhatsApp Pay (notifications from WhatsApp)
            "com.samsung.android.spay",                 // Samsung Pay
            "com.freecharge.android",                   // FreeCharge
            "com.mobikwik_new",                         // MobiKwik
        )

        // Keywords indicating a successful payment notification
        private val PAYMENT_KEYWORDS = listOf(
            "paid", "sent", "debited", "transferred", "payment successful",
            "money sent", "you paid", "transaction successful", "payment of",
            "rs", "inr", "₹"
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val packageName = sbn.packageName ?: return
            
            // Only process payment app notifications
            if (packageName !in PAYMENT_APPS) return

            val extras = sbn.notification?.extras ?: return
            val title = extras.getCharSequence("android.title")?.toString() ?: ""
            val text = extras.getCharSequence("android.text")?.toString() ?: ""
            val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""

            val fullText = "$title $text $bigText"
            
            Log.d(TAG, "Payment app notification from: $packageName")
            Log.d(TAG, "Title: $title, Text: $text")

            // Check if it's a payment notification
            val lowerText = fullText.lowercase()
            val isPayment = PAYMENT_KEYWORDS.any { lowerText.contains(it) }
            
            if (!isPayment) {
                Log.d(TAG, "Not a payment notification, skipping")
                return
            }

            // Parse the notification text
            val parsed = SmsParser.parse(fullText)
            if (parsed == null) {
                Log.d(TAG, "Could not parse notification")
                return
            }

            // Skip credit notifications
            if (parsed.type == "credit") {
                Log.d(TAG, "Credit notification, skipping")
                return
            }

            val appName = getAppName(packageName)
            
            Log.d(TAG, "Parsed: amount=${parsed.amount}, merchant=${parsed.merchant}, app=$appName")

            TransactionBridgeModule.emitTransaction(
                context = applicationContext,
                amount = parsed.amount,
                merchant = parsed.merchant,
                account = appName,
                smsBody = fullText,
                sender = appName
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Not needed
    }

    private fun getAppName(packageName: String): String {
        return when (packageName) {
            "com.google.android.apps.nbu.paisa.user" -> "Google Pay"
            "com.phonepe.app" -> "PhonePe"
            "net.one97.paytm" -> "Paytm"
            "in.amazon.mShop.android.shopping" -> "Amazon Pay"
            "com.dreamplug.androidapp" -> "CRED"
            "in.org.npci.upiapp" -> "BHIM"
            "com.freecharge.android" -> "FreeCharge"
            "com.mobikwik_new" -> "MobiKwik"
            else -> packageName
        }
    }
}
