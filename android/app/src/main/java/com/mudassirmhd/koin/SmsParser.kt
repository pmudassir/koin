package com.mudassirmhd.koin

/**
 * Parses Indian bank SMS messages to extract transaction details.
 * Supports major banks: SBI, HDFC, ICICI, Axis, Kotak, Federal, etc.
 */
object SmsParser {

    data class ParsedTransaction(
        val amount: Double,
        val merchant: String,
        val type: String, // "debit" or "credit"
        val account: String,
        val timestamp: Long = System.currentTimeMillis()
    )

    // Common debit keywords
    private val DEBIT_KEYWORDS = listOf(
        "debited", "debit", "spent", "paid", "withdrawn", "purchase",
        "transferred", "sent", "payment", "charged", "dr", "txn"
    )

    // Common credit keywords
    private val CREDIT_KEYWORDS = listOf(
        "credited", "credit", "received", "refund", "cashback",
        "deposited", "cr"
    )

    // Amount patterns (Indian format)
    private val AMOUNT_PATTERNS = listOf(
        Regex("""(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE),
        Regex("""([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:Rs\.?|INR|₹)""", RegexOption.IGNORE_CASE),
        Regex("""(?:amount|amt|rs|inr)[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE),
        Regex("""(?:debited|credited|spent|paid|received|transferred)\s+(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE)
    )

    // Account number patterns
    private val ACCOUNT_PATTERNS = listOf(
        Regex("""(?:a/?c|acct?|account)\s*(?:no\.?\s*)?(?:xx|x+|\*+)?\s*(\d{4,})""", RegexOption.IGNORE_CASE),
        Regex("""(?:xx|x+|\*+)(\d{4})""", RegexOption.IGNORE_CASE),
        Regex("""(?:card)\s*(?:ending|no\.?\s*)?\s*(?:xx|x+|\*+)?\s*(\d{4})""", RegexOption.IGNORE_CASE)
    )

    // Merchant/payee patterns
    private val MERCHANT_PATTERNS = listOf(
        Regex("""(?:at|to|VPA|UPI|@)\s+([A-Za-z0-9\s\.\-&']+?)(?:\s+on|\s+ref|\s+upi|\.|$)""", RegexOption.IGNORE_CASE),
        Regex("""(?:paid to|transferred to|sent to)\s+([A-Za-z0-9\s\.\-&']+?)(?:\s+on|\s+ref|\.|\s+vpa|$)""", RegexOption.IGNORE_CASE),
        Regex("""(?:Info:\s*)([A-Za-z0-9\s\.\-&']+?)(?:\s*$|\.)""", RegexOption.IGNORE_CASE)
    )

    // Bank sender IDs (short codes)
    private val BANK_SENDERS = listOf(
        "SBIINB", "SBIIN", "HDFCBK", "ICICIB", "AXISBK", "KOTAKB",
        "IDFCFB", "FEDERL", "BOIIND", "CANBNK", "PNBSMS", "YESBNK",
        "INDBNK", "UCOBNK", "BOBSMS", "CENTBK", "SCBANK", "CITIBK",
        "AMEX", "PAYTM", "GPAY", "PHONEPE", "JUSPAY", "RAZPAY",
        "AD-", "BZ-", "BW-", "DM-", "VM-", "JD-", "AX-", "BP-",
        "TD-", "TM-", "VK-", "JK-", "LD-"
    )

    /**
     * Check if an SMS is a banking/transaction message
     */
    fun isBankingSms(sender: String, body: String): Boolean {
        val upperSender = sender.uppercase()
        val upperBody = body.uppercase()

        // Check sender
        val isBankSender = BANK_SENDERS.any { upperSender.contains(it) }

        // Check body for transaction keywords
        val hasAmountKeyword = upperBody.contains("RS") || upperBody.contains("INR") ||
                upperBody.contains("₹") || upperBody.contains("DEBITED") ||
                upperBody.contains("CREDITED") || upperBody.contains("SPENT")

        val hasTransactionKeyword = DEBIT_KEYWORDS.any { upperBody.contains(it.uppercase()) } ||
                CREDIT_KEYWORDS.any { upperBody.contains(it.uppercase()) }

        return (isBankSender || hasAmountKeyword) && hasTransactionKeyword
    }

    /**
     * Parse a bank SMS message and extract transaction details
     */
    fun parse(body: String): ParsedTransaction? {
        val amount = extractAmount(body) ?: return null
        val type = detectTransactionType(body)
        val merchant = extractMerchant(body)
        val account = extractAccount(body)

        return ParsedTransaction(
            amount = amount,
            merchant = merchant,
            type = type,
            account = account
        )
    }

    private fun extractAmount(body: String): Double? {
        for (pattern in AMOUNT_PATTERNS) {
            val match = pattern.find(body)
            if (match != null) {
                val amountStr = match.groupValues[1].replace(",", "")
                val amount = amountStr.toDoubleOrNull()
                if (amount != null && amount > 0 && amount < 10_000_000) {
                    return amount
                }
            }
        }
        return null
    }

    private fun detectTransactionType(body: String): String {
        val lowerBody = body.lowercase()
        val debitScore = DEBIT_KEYWORDS.count { lowerBody.contains(it) }
        val creditScore = CREDIT_KEYWORDS.count { lowerBody.contains(it) }
        return if (creditScore > debitScore) "credit" else "debit"
    }

    private fun extractMerchant(body: String): String {
        for (pattern in MERCHANT_PATTERNS) {
            val match = pattern.find(body)
            if (match != null) {
                val merchant = match.groupValues[1].trim()
                if (merchant.length in 2..50 && !merchant.all { it.isDigit() }) {
                    return cleanMerchantName(merchant)
                }
            }
        }
        return "Unknown"
    }

    private fun extractAccount(body: String): String {
        for (pattern in ACCOUNT_PATTERNS) {
            val match = pattern.find(body)
            if (match != null) {
                return "XX${match.groupValues[1]}"
            }
        }
        return ""
    }

    private fun cleanMerchantName(name: String): String {
        return name
            .replace(Regex("""\s+"""), " ")
            .replace(Regex("""[^\w\s\.\-&']"""), "")
            .trim()
            .take(40)
    }
}
