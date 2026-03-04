package com.mudassirmhd.koin

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.util.Log

/**
 * BroadcastReceiver that listens for incoming SMS messages.
 * Filters for banking/transaction SMS and forwards parsed data to React Native.
 */
class SmsBroadcastReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "KoinSmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (messages.isNullOrEmpty()) return

            // Group message parts by sender (multi-part SMS)
            val groupedMessages = messages.groupBy { it.displayOriginatingAddress ?: "Unknown" }

            for ((sender, parts) in groupedMessages) {
                val fullBody = parts.joinToString("") { it.displayMessageBody ?: "" }
                
                if (fullBody.isBlank()) continue
                
                Log.d(TAG, "SMS from: $sender")

                // Check if it's a banking SMS
                if (!SmsParser.isBankingSms(sender, fullBody)) {
                    Log.d(TAG, "Not a banking SMS, skipping")
                    continue
                }

                // Parse the SMS
                val parsed = SmsParser.parse(fullBody) ?: continue
                
                Log.d(TAG, "Parsed transaction: amount=${parsed.amount}, merchant=${parsed.merchant}, type=${parsed.type}")

                // Only process debits (expenses)
                if (parsed.type == "credit") {
                    Log.d(TAG, "Credit transaction, skipping")
                    continue
                }

                // Send to React Native via the native module
                TransactionBridgeModule.emitTransaction(
                    context = context,
                    amount = parsed.amount,
                    merchant = parsed.merchant,
                    account = parsed.account,
                    smsBody = fullBody,
                    sender = sender
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SMS", e)
        }
    }
}
