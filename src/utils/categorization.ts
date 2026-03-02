import { Category } from '../models/Transaction';

// Known merchant → category mapping
const MERCHANT_CATEGORY_MAP: Record<string, Category> = {
  // Food & Drinks
  zomato: 'Food',
  swiggy: 'Food',
  starbucks: 'Food',
  'starbucks coffee': 'Food',
  mcdonalds: 'Food',
  "mcdonald's": 'Food',
  dominos: 'Food',
  "domino's": 'Food',
  kfc: 'Food',
  'burger king': 'Food',
  'pizza hut': 'Food',
  dunkin: 'Food',
  'cafe coffee day': 'Food',
  chaayos: 'Food',

  // Transport
  uber: 'Transport',
  'uber india': 'Transport',
  ola: 'Transport',
  rapido: 'Transport',
  metro: 'Transport',
  petrol: 'Transport',
  'indian oil': 'Transport',
  'hp petrol': 'Transport',
  'bharat petroleum': 'Transport',

  // Groceries
  bigbasket: 'Groceries',
  blinkit: 'Groceries',
  zepto: 'Groceries',
  dmart: 'Groceries',
  'nature\'s basket': 'Groceries',
  'more supermarket': 'Groceries',
  reliance: 'Groceries',

  // Shopping
  amazon: 'Shopping',
  flipkart: 'Shopping',
  myntra: 'Shopping',
  ajio: 'Shopping',
  nykaa: 'Shopping',
  meesho: 'Shopping',

  // Bills
  airtel: 'Bills',
  jio: 'Bills',
  vi: 'Bills',
  vodafone: 'Bills',
  'electricity bill': 'Bills',
  'water bill': 'Bills',
  'gas bill': 'Bills',
  netflix: 'Bills',
  spotify: 'Bills',
  'amazon prime': 'Bills',
  hotstar: 'Bills',

  // Health
  apollo: 'Health',
  '1mg': 'Health',
  pharmeasy: 'Health',
  netmeds: 'Health',
  pharmacy: 'Health',
  medplus: 'Health',
};

// Common person name patterns (Indian context)
const PERSON_NAME_PATTERNS = [
  /^(mr|mrs|ms|dr|shri)\.?\s/i,
  /^[A-Z][a-z]+\s[A-Z][a-z]+$/,  // Two capitalized words
];

export function categorize(merchant: string): Category {
  // Check known merchants first
  const normalized = merchant.toLowerCase().trim();
  if (MERCHANT_CATEGORY_MAP[normalized]) {
    return MERCHANT_CATEGORY_MAP[normalized];
  }

  // Partial match
  for (const [key, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }

  // Check if it looks like a person name → Transfer
  for (const pattern of PERSON_NAME_PATTERNS) {
    if (pattern.test(merchant.trim())) {
      return 'Transfer';
    }
  }

  return 'Others';
}

export function getCategoryForMerchant(merchant: string): Category {
  return categorize(merchant);
}
