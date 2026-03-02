export interface ParsedTransaction {
  amount: number | null;
  merchant: string | null;
  type: 'paid' | 'received' | 'unknown';
}

/**
 * Parse UPI payment text like:
 * - "Paid ₹250 to ZOMATO"
 * - "Sent ₹500 to Rahim"
 * - "Received ₹1,000 from Raj"
 * - "₹300 paid to Starbucks Coffee"
 * - "Payment of Rs.450 to Amazon"
 * - "Debited ₹180 for Uber ride"
 */
export function parseUPIText(text: string): ParsedTransaction {
  const result: ParsedTransaction = {
    amount: null,
    merchant: null,
    type: 'unknown',
  };

  if (!text || typeof text !== 'string') return result;

  // Determine type
  const lowerText = text.toLowerCase();
  if (lowerText.includes('paid') || lowerText.includes('sent') || lowerText.includes('debited')) {
    result.type = 'paid';
  } else if (lowerText.includes('received') || lowerText.includes('credited')) {
    result.type = 'received';
  }

  // Extract amount — handle ₹, Rs, Rs., INR patterns
  const amountPatterns = [
    /[₹]\s*([\d,]+(?:\.\d{1,2})?)/,        // ₹250 or ₹1,250.50
    /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,      // Rs.250 or Rs 250
    /INR\s*([\d,]+(?:\.\d{1,2})?)/i,        // INR 250
    /(?:of|for)\s*[₹]?\s*([\d,]+(?:\.\d{1,2})?)/i, // "of 250" or "for ₹250"
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract merchant name
  const merchantPatterns = [
    /(?:to|from|for|at)\s+(.+?)(?:\s+on|\s+via|\s+ref|\s*$)/i,
    /(?:paid|sent|received)\s+.*?(?:to|from)\s+(.+?)(?:\s+on|\s+via|\s*$)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.merchant = match[1].trim().replace(/[.!?]+$/, '');
      break;
    }
  }

  return result;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('₹', '₹');
}

/**
 * Format amount without currency symbol
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
