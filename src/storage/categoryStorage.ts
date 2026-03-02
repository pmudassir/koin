import { getItem, setItem } from './mmkv';

export interface CustomCategory {
  name: string;
  icon: string; // MaterialIcons name
  color: string;
}

const CUSTOM_CATEGORIES_KEY = 'custom_categories';

export function getCustomCategories(): CustomCategory[] {
  return getItem<CustomCategory[]>(CUSTOM_CATEGORIES_KEY) || [];
}

export function addCustomCategory(category: CustomCategory): void {
  const categories = getCustomCategories();
  if (categories.some(c => c.name.toLowerCase() === category.name.toLowerCase())) {
    return; // Already exists
  }
  categories.push(category);
  setItem(CUSTOM_CATEGORIES_KEY, categories);
}

export function removeCustomCategory(name: string): void {
  const categories = getCustomCategories();
  setItem(
    CUSTOM_CATEGORIES_KEY,
    categories.filter(c => c.name !== name)
  );
}

// Available icons for custom categories
export const AVAILABLE_ICONS: { name: string; label: string }[] = [
  { name: 'coffee', label: 'Coffee' },
  { name: 'fitness-center', label: 'Gym' },
  { name: 'school', label: 'Education' },
  { name: 'pets', label: 'Pets' },
  { name: 'child-care', label: 'Kids' },
  { name: 'home', label: 'Home' },
  { name: 'flight', label: 'Travel' },
  { name: 'wifi', label: 'Internet' },
  { name: 'phone-iphone', label: 'Phone' },
  { name: 'local-gas-station', label: 'Fuel' },
  { name: 'checkroom', label: 'Clothing' },
  { name: 'card-giftcard', label: 'Gifts' },
  { name: 'savings', label: 'Savings' },
  { name: 'sports-esports', label: 'Gaming' },
  { name: 'music-note', label: 'Music' },
  { name: 'local-parking', label: 'Parking' },
  { name: 'local-laundry-service', label: 'Laundry' },
  { name: 'restaurant-menu', label: 'Dining' },
];
