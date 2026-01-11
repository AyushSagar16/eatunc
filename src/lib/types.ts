/**
 * Food Display Types
 * Data structures for the redesigned food display UI
 */

/**
 * Represents a food item with its nutritional information and metadata.
 * Used for rendering food cards in the display layout.
 */
export interface FoodItem {
    /** Display name of the food item */
    name: string;
    /** Calories per serving in kcal */
    calories: number;
    /** Protein content in grams */
    protein: number;
    /** Fat content in grams */
    fat: number;
    /** Carbohydrate content in grams */
    carbs: number;
    /** Station/location where the item is served (e.g., "Kitchen Table", "Griddle") */
    location: string;
    /** Filter tags for categorization (e.g., ["balanced", "high-protein", "low-cal"]) */
    tags: string[];
}

/**
 * Available meal periods for tabs
 */
export type MealPeriod = 'Breakfast' | 'Lunch' | 'Dinner';

/**
 * Available filter options for nutritional filtering
 */
export type FilterOption = 'protein' | 'calories' | 'fat' | 'carbs'

/**
 * Dietary preference filter options
 */
export type DietaryPreferenceOption =
    | 'vegan'
    | 'vegetarian'
    | 'gluten-free'
    | 'halal'
    | 'local'
    | 'organic'
    | 'smart-choice'
    | 'sustainable-seafood'
    | 'coolfood'

/**
 * Allergen filter options (exclusion filters)
 */
export type AllergenOption =
    | 'milk'
    | 'egg'
    | 'fish'
    | 'shellfish'
    | 'tree nuts'
    | 'peanut'
    | 'wheat'
    | 'soy'
    | 'sesame';

/**
 * Props for food display components
 */
export interface FoodDisplayProps {
    /** Currently selected dining hall */
    diningHall: string;
    /** Currently selected date */
    selectedDate: string;
    /** List of food items to display */
    items: FoodItem[];
}
