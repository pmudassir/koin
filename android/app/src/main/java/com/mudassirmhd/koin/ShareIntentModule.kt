package com.mudassirmhd.koin

import android.app.Activity
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

/**
 * Native module that handles incoming Android share intents.
 * Reads shared text or image data and makes it available to React Native.
 */
class ShareIntentModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "KoinShareIntent"
    }

    override fun getName(): String = "ShareIntentModule"

    /**
     * Check if the app was opened via a share intent and return the shared data
     */
    @ReactMethod
    fun getSharedData(promise: Promise) {
        try {
            val activity = reactContext.currentActivity ?: run {
                promise.resolve(null)
                return
            }

            val intent = activity.intent
            val action = intent.action
            val type = intent.type

            if (action != Intent.ACTION_SEND || type == null) {
                promise.resolve(null)
                return
            }

            when {
                type.startsWith("text/") -> {
                    val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT) ?: ""
                    val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: ""
                    
                    val result = Arguments.createMap().apply {
                        putString("type", "text")
                        putString("text", sharedText)
                        putString("subject", subject)
                    }
                    
                    // Clear the intent so we don't process it again
                    activity.intent = Intent()
                    
                    promise.resolve(result)
                }
                type.startsWith("image/") -> {
                    val imageUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                    if (imageUri == null) {
                        promise.resolve(null)
                        return
                    }

                    // Use ML Kit for OCR
                    performOCR(imageUri, activity, promise)
                    
                    // Clear the intent
                    activity.intent = Intent()
                }
                else -> {
                    promise.resolve(null)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting shared data", e)
            promise.reject("ERROR", e.message)
        }
    }

    private fun performOCR(imageUri: Uri, activity: Activity, promise: Promise) {
        try {
            val inputStream = activity.contentResolver.openInputStream(imageUri)
            if (inputStream == null) {
                promise.resolve(null)
                return
            }

            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (bitmap == null) {
                promise.resolve(null)
                return
            }

            val image = InputImage.fromBitmap(bitmap, 0)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val ocrText = visionText.text
                    
                    // Parse amount from OCR text
                    val amount = parseAmountFromOCR(ocrText)
                    val merchant = parseMerchantFromOCR(ocrText)

                    val result = Arguments.createMap().apply {
                        putString("type", "image")
                        putString("ocrText", ocrText)
                        putDouble("amount", amount)
                        putString("merchant", merchant)
                    }
                    
                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "OCR failed", e)
                    // Return the image URI even if OCR fails
                    val result = Arguments.createMap().apply {
                        putString("type", "image")
                        putString("ocrText", "")
                        putDouble("amount", 0.0)
                        putString("merchant", "")
                    }
                    promise.resolve(result)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error performing OCR", e)
            promise.reject("OCR_ERROR", e.message)
        }
    }

    private fun parseAmountFromOCR(text: String): Double {
        // Look for Indian currency patterns
        val patterns = listOf(
            Regex("""(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE),
            Regex("""([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:Rs\.?|INR|₹)""", RegexOption.IGNORE_CASE),
            Regex("""(?:paid|sent|debited|amount)[:\s]*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE)
        )

        for (pattern in patterns) {
            val match = pattern.find(text)
            if (match != null) {
                val amountStr = match.groupValues[1].replace(",", "")
                val amount = amountStr.toDoubleOrNull()
                if (amount != null && amount > 0 && amount < 10_000_000) {
                    return amount
                }
            }
        }
        return 0.0
    }

    private fun parseMerchantFromOCR(text: String): String {
        val patterns = listOf(
            Regex("""(?:to|paid to|sent to)\s+([A-Za-z][A-Za-z\s\.\-&']{1,40})""", RegexOption.IGNORE_CASE),
            Regex("""(?:at)\s+([A-Za-z][A-Za-z\s\.\-&']{1,40})""", RegexOption.IGNORE_CASE)
        )

        for (pattern in patterns) {
            val match = pattern.find(text)
            if (match != null) {
                val merchant = match.groupValues[1].trim()
                if (merchant.length >= 2) {
                    return merchant.take(40)
                }
            }
        }
        return "Shared Transaction"
    }

    /**
     * Clear the current intent (after processing)
     */
    @ReactMethod
    fun clearIntent() {
        reactContext.currentActivity?.intent = Intent()
    }
}
