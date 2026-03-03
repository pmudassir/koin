import { Category } from "../models/Transaction";

// Known merchant → category mapping
const MERCHANT_CATEGORY_MAP: Record<string, Category> = {
  // Food & Drinks
  zomato: "Food",
  swiggy: "Food",
  starbucks: "Food",
  "starbucks coffee": "Food",
  mcdonalds: "Food",
  "mcdonald's": "Food",
  dominos: "Food",
  "domino's": "Food",
  kfc: "Food",
  "burger king": "Food",
  "pizza hut": "Food",
  dunkin: "Food",
  "cafe coffee day": "Food",
  chaayos: "Food",
  subway: "Food",
  "taco bell": "Food",
  wendy: "Food",
  haldirams: "Food",
  barbeque: "Food",

  // Transport
  uber: "Transport",
  "uber india": "Transport",
  ola: "Transport",
  rapido: "Transport",
  metro: "Transport",
  petrol: "Transport",
  "indian oil": "Transport",
  "hp petrol": "Transport",
  "bharat petroleum": "Transport",
  "shell petrol": "Transport",

  // Groceries
  bigbasket: "Groceries",
  blinkit: "Groceries",
  zepto: "Groceries",
  dmart: "Groceries",
  "nature's basket": "Groceries",
  "more supermarket": "Groceries",
  reliance: "Groceries",
  "jio mart": "Groceries",
  "star bazaar": "Groceries",

  // Shopping
  amazon: "Shopping",
  flipkart: "Shopping",
  myntra: "Shopping",
  ajio: "Shopping",
  nykaa: "Shopping",
  meesho: "Shopping",
  "tata cliq": "Shopping",
  croma: "Shopping",

  // Bills
  airtel: "Bills",
  jio: "Bills",
  vi: "Bills",
  vodafone: "Bills",
  "electricity bill": "Bills",
  "water bill": "Bills",
  "gas bill": "Bills",
  netflix: "Bills",
  spotify: "Bills",
  "amazon prime": "Bills",
  hotstar: "Bills",
  "disney+": "Bills",
  "youtube premium": "Bills",

  // Health
  apollo: "Health",
  "1mg": "Health",
  pharmeasy: "Health",
  netmeds: "Health",
  pharmacy: "Health",
  medplus: "Health",
  practo: "Health",
};

// Keyword → category mapping (matches if any keyword is found in merchant name)
const KEYWORD_CATEGORY_MAP: Array<{ keywords: string[]; category: Category }> =
  [
    // Food & Drinks
    {
      keywords: [
        "coffee",
        "cafe",
        "café",
        "restaurant",
        "biryani",
        "pizza",
        "burger",
        "chicken",
        "food",
        "kitchen",
        "bakery",
        "sweet",
        "tea",
        "chai",
        "juice",
        "dhaba",
        "hotel",
        "eatery",
        "diner",
        "grill",
        "tandoori",
        "momos",
        "rolls",
        "shawarma",
        "noodle",
        "sushi",
        "ice cream",
        "dessert",
        "snack",
        "canteen",
        "mess",
        "tiffin",
        "paan",
        "bar",
      ],
      category: "Food",
    },
    // Transport
    {
      keywords: [
        "cab",
        "taxi",
        "ride",
        "auto",
        "rickshaw",
        "fuel",
        "petrol",
        "diesel",
        "parking",
        "toll",
        "bus",
        "train",
        "flight",
        "airline",
        "travel",
        "trip",
        "gas station",
      ],
      category: "Transport",
    },
    // Groceries
    {
      keywords: [
        "grocery",
        "supermarket",
        "mart",
        "provisions",
        "kirana",
        "vegetable",
        "fruit",
        "market",
        "store",
      ],
      category: "Groceries",
    },
    // Shopping
    {
      keywords: [
        "shop",
        "mall",
        "boutique",
        "fashion",
        "clothing",
        "wear",
        "shoes",
        "electronics",
        "gadget",
        "jewel",
        "optical",
        "furniture",
      ],
      category: "Shopping",
    },
    // Bills
    {
      keywords: [
        "bill",
        "recharge",
        "broadband",
        "internet",
        "electricity",
        "water",
        "gas",
        "rent",
        "emi",
        "insurance",
        "subscription",
        "premium",
        "telecom",
        "mobile",
      ],
      category: "Bills",
    },
    // Health
    {
      keywords: [
        "hospital",
        "clinic",
        "doctor",
        "medical",
        "pharmacy",
        "pharma",
        "health",
        "dental",
        "lab",
        "diagnostic",
        "medicine",
        "ayurvedic",
        "gym",
        "fitness",
      ],
      category: "Health",
    },
    // Entertainment
    {
      keywords: [
        "movie",
        "cinema",
        "theatre",
        "theater",
        "concert",
        "event",
        "game",
        "play",
        "amusement",
        "park",
        "club",
        "lounge",
        "pub",
      ],
      category: "Entertainment",
    },
  ];

// Common Indian names (first names) to help identify personal transfers
const COMMON_FIRST_NAMES = new Set([
  "rahul",
  "amit",
  "priya",
  "rohit",
  "ankit",
  "neha",
  "pooja",
  "ravi",
  "suresh",
  "rajesh",
  "arun",
  "vijay",
  "deepak",
  "sanjay",
  "manoj",
  "kumar",
  "singh",
  "sharma",
  "verma",
  "gupta",
  "patel",
  "khan",
  "mohammad",
  "ahmed",
  "ali",
  "abdul",
  "mohammed",
  "mudassir",
  "sinsarul",
  "akhil",
  "arjun",
  "karan",
  "nikhil",
  "vishal",
  "sachin",
  "gaurav",
  "akash",
  "ashish",
  "sumit",
  "vivek",
  "varun",
  "harsh",
  "tushar",
  "sneha",
  "divya",
  "swati",
  "anjali",
  "shruti",
  "nikita",
  "tanvi",
]);

export function categorize(merchant: string): Category {
  const normalized = merchant.toLowerCase().trim();

  // 1. Check exact merchant match
  if (MERCHANT_CATEGORY_MAP[normalized]) {
    return MERCHANT_CATEGORY_MAP[normalized];
  }

  // 2. Partial match against known merchants
  for (const [key, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }

  // 3. Keyword-based matching (BEFORE person name check)
  for (const { keywords, category } of KEYWORD_CATEGORY_MAP) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  // 4. Check if it looks like a personal transfer
  const words = normalized.split(/\s+/);
  const firstName = words[0];

  // Only classify as Transfer if:
  // - Has exactly 2-3 words AND
  // - First name looks like a common Indian name OR matches name patterns
  if (words.length >= 2 && words.length <= 4) {
    if (COMMON_FIRST_NAMES.has(firstName)) {
      return "Transfer";
    }
    // Check for title prefixes like Mr., Mrs., Dr.
    if (/^(mr|mrs|ms|dr|shri)\.?$/i.test(firstName)) {
      return "Transfer";
    }
  }

  return "Others";
}

export function getCategoryForMerchant(merchant: string): Category {
  return categorize(merchant);
}
