import type React from 'react'
import {
    VeganIcon,
    VegetarianIcon,
    GlutenFreeIcon,
    HalalIcon,
    LocalIcon,
    OrganicIcon,
    SmartChoiceIcon,
    SustainableSeafoodIcon,
    CoolfoodIcon,
} from './DietaryIcons'

/**
 * Maps database dietary preference strings to their corresponding icon components.
 * Keys are lowercase and match the format stored in the database.
 */
export const DIETARY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'vegan': VeganIcon,
    'vegetarian': VegetarianIcon,
    'made without gluten': GlutenFreeIcon,
    'halal': HalalIcon,
    'local': LocalIcon,
    'organic': OrganicIcon,
    'smart choice': SmartChoiceIcon,
    'sustainable seafood': SustainableSeafoodIcon,
    'coolfood': CoolfoodIcon,
}

/**
 * Parses a comma-separated string of dietary preferences into an array of lowercase strings.
 * @param preferencesString - The raw dietary preferences string from the database (e.g., "Vegan, Organic, Local")
 * @returns An array of lowercase preference strings, or an empty array if input is null/empty
 */
export function parseDietaryPreferences(preferencesString: string | null): string[] {
    if (!preferencesString) return []
    return preferencesString.split(',').map(p => p.trim().toLowerCase())
}

/**
 * Parses a comma-separated string of allergens into an array of lowercase strings.
 * @param allergensString - The raw allergens string from the database (e.g., "Milk, Eggs, Wheat")
 * @returns An array of lowercase allergen strings, or an empty array if input is null/empty
 */
export function parseAllergens(allergensString: string | null): string[] {
    if (!allergensString) return []
    return allergensString.split(',').map(a => a.trim().toLowerCase())
}
