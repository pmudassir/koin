import { Category } from "../models/Transaction";
import { getItem, setItem } from "../storage/mmkv";
import { categorize } from "../utils/categorization";

const USER_OVERRIDES_KEY = "category_user_overrides";

// ─── User Override Learning ───────────────────────────────

interface OverrideEntry {
  category: Category;
  count: number;
}

/**
 * Get user's manual category overrides (learned from edits)
 */
export function getUserOverrides(): Record<string, OverrideEntry> {
  return getItem<Record<string, OverrideEntry>>(USER_OVERRIDES_KEY) || {};
}

/**
 * Record when user manually changes a category for a merchant
 */
export function recordCategoryOverride(
  merchant: string,
  category: Category,
): void {
  const key = merchant.toLowerCase().trim();
  const overrides = getUserOverrides();
  const existing = overrides[key];
  overrides[key] = {
    category,
    count: (existing?.count || 0) + 1,
  };
  setItem(USER_OVERRIDES_KEY, overrides);
}

// ─── App Source Detection ─────────────────────────────────

interface AppSource {
  app: string;
  defaultCategory?: Category;
}

const APP_PATTERNS: Array<{ pattern: RegExp; source: AppSource }> = [
  { pattern: /swiggy/i, source: { app: "Swiggy", defaultCategory: "Food" } },
  { pattern: /zomato/i, source: { app: "Zomato", defaultCategory: "Food" } },
  {
    pattern: /uber\s?eats/i,
    source: { app: "UberEats", defaultCategory: "Food" },
  },
  { pattern: /uber/i, source: { app: "Uber", defaultCategory: "Transport" } },
  { pattern: /ola/i, source: { app: "Ola", defaultCategory: "Transport" } },
  {
    pattern: /rapido/i,
    source: { app: "Rapido", defaultCategory: "Transport" },
  },
  {
    pattern: /amazon/i,
    source: { app: "Amazon", defaultCategory: "Shopping" },
  },
  {
    pattern: /flipkart/i,
    source: { app: "Flipkart", defaultCategory: "Shopping" },
  },
  { pattern: /google\s*pay|gpay/i, source: { app: "GooglePay" } },
  { pattern: /phonepe/i, source: { app: "PhonePe" } },
  { pattern: /paytm/i, source: { app: "Paytm" } },
  { pattern: /supermoney/i, source: { app: "SuperMoney" } },
  { pattern: /cred/i, source: { app: "CRED", defaultCategory: "Bills" } },
  {
    pattern: /myntra/i,
    source: { app: "Myntra", defaultCategory: "Shopping" },
  },
  {
    pattern: /bigbasket|blinkit|zepto/i,
    source: { app: "Groceries", defaultCategory: "Groceries" },
  },
];

function detectAppSource(text: string): AppSource | null {
  for (const { pattern, source } of APP_PATTERNS) {
    if (pattern.test(text)) return source;
  }
  return null;
}

// ─── UPI VPA Analysis ─────────────────────────────────────

const VPA_CATEGORY_HINTS: Array<{ pattern: RegExp; category: Category }> = [
  {
    pattern:
      /food|cafe|coffee|restaurant|biryani|pizza|burger|kitchen|bakery|sweet|chai|tea|juice|dhaba/i,
    category: "Food",
  },
  {
    pattern: /petrol|fuel|diesel|cab|taxi|auto|parking|toll|uber|ola|rapido/i,
    category: "Transport",
  },
  {
    pattern:
      /grocery|mart|kirana|supermarket|vegetable|fruit|bigbasket|blinkit|zepto/i,
    category: "Groceries",
  },
  {
    pattern:
      /shop|mall|store|fashion|cloth|wear|shoes|electronics|amazon|flipkart|myntra/i,
    category: "Shopping",
  },
  {
    pattern:
      /bill|recharge|broadband|airtel|jio|vodafone|electricity|water|gas|netflix|spotify/i,
    category: "Bills",
  },
  {
    pattern:
      /hospital|clinic|doctor|medical|pharmacy|pharma|health|dental|lab|gym/i,
    category: "Health",
  },
  {
    pattern:
      /movie|cinema|theater|theatre|pvr|inox|concert|game|pub|bar|lounge/i,
    category: "Entertainment",
  },
];

function categorizeFromVPA(vpa: string): Category | null {
  const localPart = vpa.split("@")[0].toLowerCase();
  for (const { pattern, category } of VPA_CATEGORY_HINTS) {
    if (pattern.test(localPart)) return category;
  }
  return null;
}

// ─── Transaction Context Clues ────────────────────────────

interface ContextClue {
  pattern: RegExp;
  category: Category;
  priority: number; // higher = more confident
}

const CONTEXT_CLUES: ContextClue[] = [
  // Income indicators
  {
    pattern: /salary\s*(credited|received)/i,
    category: "Transfer",
    priority: 10,
  },
  { pattern: /refund/i, category: "Shopping", priority: 5 },

  // Bill indicators
  { pattern: /emi|loan|installment/i, category: "Bills", priority: 8 },
  {
    pattern: /electricity|water\s*bill|gas\s*bill|broadband/i,
    category: "Bills",
    priority: 9,
  },
  { pattern: /subscription|renewal|premium/i, category: "Bills", priority: 7 },
  { pattern: /recharge|prepaid|postpaid/i, category: "Bills", priority: 8 },

  // Food indicators (from context, not merchant)
  {
    pattern: /order\s*(from|at|placed)|food\s*order|delivery\s*charge/i,
    category: "Food",
    priority: 6,
  },
  {
    pattern: /dine|dining|restaurant|cafe|coffee/i,
    category: "Food",
    priority: 7,
  },

  // Transport indicators
  {
    pattern: /ride|trip\s*(completed|ended)|fare|toll\s*charge/i,
    category: "Transport",
    priority: 7,
  },
  { pattern: /fuel|petrol|diesel|filled/i, category: "Transport", priority: 8 },

  // Shopping indicators
  {
    pattern: /order\s*(delivered|shipped|placed)|item|product/i,
    category: "Shopping",
    priority: 4,
  },

  // Health indicators
  {
    pattern: /appointment|consultation|prescription|medicine|test\s*report/i,
    category: "Health",
    priority: 8,
  },

  // Entertainment
  {
    pattern: /ticket|booking|show|movie|event/i,
    category: "Entertainment",
    priority: 5,
  },
];

function detectCategoryFromContext(
  text: string,
): { category: Category; priority: number } | null {
  let best: { category: Category; priority: number } | null = null;

  for (const clue of CONTEXT_CLUES) {
    if (clue.pattern.test(text)) {
      if (!best || clue.priority > best.priority) {
        best = { category: clue.category, priority: clue.priority };
      }
    }
  }
  return best;
}

// ─── Main Smart Categorization ────────────────────────────

interface SmartCategorizeResult {
  category: Category;
  confidence: "high" | "medium" | "low";
  source: string; // what determined the category
}

/**
 * Smart categorization using full OCR text analysis
 */
export function smartCategorize(
  merchant: string,
  ocrText?: string,
): SmartCategorizeResult {
  const merchantNorm = merchant.toLowerCase().trim();
  const fullText = ocrText || merchant;

  // 1. Check user overrides first (highest priority — they manually corrected this before)
  const overrides = getUserOverrides();
  if (overrides[merchantNorm] && overrides[merchantNorm].count >= 1) {
    return {
      category: overrides[merchantNorm].category,
      confidence: "high",
      source: `User learned: ${merchantNorm} → ${overrides[merchantNorm].category}`,
    };
  }

  // 2. Check app source (e.g., Swiggy screenshot → Food)
  const appSource = detectAppSource(fullText);
  if (appSource?.defaultCategory) {
    return {
      category: appSource.defaultCategory,
      confidence: "high",
      source: `App source: ${appSource.app}`,
    };
  }

  // 3. Check UPI VPA in the OCR text
  const vpaMatch = fullText.match(/([a-zA-Z0-9._-]+@[a-zA-Z]+)/);
  if (vpaMatch) {
    const vpaCategory = categorizeFromVPA(vpaMatch[1]);
    if (vpaCategory) {
      return {
        category: vpaCategory,
        confidence: "medium",
        source: `VPA hint: ${vpaMatch[1]}`,
      };
    }
  }

  // 4. Analyze context clues in OCR text
  const contextResult = detectCategoryFromContext(fullText);
  if (contextResult && contextResult.priority >= 6) {
    return {
      category: contextResult.category,
      confidence: contextResult.priority >= 8 ? "high" : "medium",
      source: `Context clue (priority ${contextResult.priority})`,
    };
  }

  // 5. Fall back to keyword-based categorization
  const basicCategory = categorize(merchant);
  if (basicCategory !== "Others") {
    return {
      category: basicCategory,
      confidence: "medium",
      source: `Keyword match: ${merchant}`,
    };
  }

  // 6. Try categorizing from OCR text if merchant didn't match
  if (ocrText) {
    const contextFallback = detectCategoryFromContext(ocrText);
    if (contextFallback) {
      return {
        category: contextFallback.category,
        confidence: "low",
        source: `Context fallback (priority ${contextFallback.priority})`,
      };
    }
  }

  // 7. If it's a payment app without context, likely a Transfer
  if (appSource && !appSource.defaultCategory) {
    // Payment apps (GPay, PhonePe, etc.) without clear merchant → likely personal transfer
    return {
      category: "Transfer",
      confidence: "low",
      source: `Payment app: ${appSource.app} (assumed transfer)`,
    };
  }

  return {
    category: "Others",
    confidence: "low",
    source: "No match found",
  };
}
