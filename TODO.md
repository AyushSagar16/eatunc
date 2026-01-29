# UNC Dining: Authentication + Macro Tracker Implementation Plan

> **Comprehensive task list for adding student-only authentication, onboarding, meal macro cart, daily calorie tracker, and dashboard to the UNC Dining application.**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Milestone 1: Authentication Infrastructure](#milestone-1-authentication-infrastructure)
4. [Milestone 2: Onboarding Flow](#milestone-2-onboarding-flow)
5. [Milestone 3: Meal Macro Cart](#milestone-3-meal-macro-cart)
6. [Milestone 4: Daily Calorie Tracker](#milestone-4-daily-calorie-tracker)
7. [Milestone 5: Dashboard & Analytics](#milestone-5-dashboard--analytics)
8. [Milestone 6: Testing & Quality Assurance](#milestone-6-testing--quality-assurance)
9. [Milestone 7: Migration & Rollout](#milestone-7-migration--rollout)
10. [User Experience Flow](#user-experience-flow)

---

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 16+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + RLS)
- **State Management**: Zustand (client-side cart/UI state)
- **Date Handling**: Timezone-safe with `America/New_York`

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth Method | Email Magic Link | More secure than passwords, no password management, seamless UNC email verification |
| Domain Validation | Dual-layer (client + DB trigger) | Cannot be bypassed; client UX + server enforcement |
| Cart Persistence | Zustand + localStorage + optional DB sync | Fast UX with optional cross-device sync for logged-in users |
| Timezone | Store as `timestamptz`, display in `America/New_York` | Server-side timezone safety, client renders local |

### New Route Structure

```
/                         # Landing (existing)
/auth/login               # Login page
/auth/callback            # Magic link callback
/onboarding               # Onboarding flow (protected, first-login only)
/dashboard                # User dashboard (protected)
/dashboard/settings       # Edit profile/targets
/[hall]/[date]            # Menu pages (existing, add cart functionality)
```

---

## Database Schema

### New Tables Overview

```
profiles          - User onboarding data and targets
meal_logs         - Daily meal entries (parent)
meal_log_items    - Individual food items in each meal log
user_cart         - Optional persistent cart per user
```

### SQL Schema Definitions

```sql
-- ============================================
-- TABLE: profiles
-- Stores user onboarding data and daily targets
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    daily_calories_target INTEGER NOT NULL DEFAULT 2000,
    daily_protein_target INTEGER NOT NULL DEFAULT 50,
    daily_carbs_target INTEGER NOT NULL DEFAULT 250,
    daily_fat_target INTEGER NOT NULL DEFAULT 65,
    dietary_preferences TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick profile lookup
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_onboarding ON profiles(id) WHERE onboarding_completed = FALSE;

-- ============================================
-- TABLE: meal_logs
-- Parent table for daily meal entries
-- ============================================
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date, meal_type, created_at) -- Allow multiple of same meal type
);

-- Indexes for efficient querying
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date DESC);
CREATE INDEX idx_meal_logs_date_range ON meal_logs(user_id, log_date) 
    WHERE log_date >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- TABLE: meal_log_items
-- Individual food items within a meal log
-- ============================================
CREATE TABLE meal_log_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
    recipe_number INTEGER NOT NULL REFERENCES master_food_items(recipe_number),
    servings DECIMAL(4,2) NOT NULL DEFAULT 1.0 CHECK (servings > 0),
    -- Denormalized for historical accuracy (menu items may change)
    food_name TEXT NOT NULL,
    calories_per_serving INTEGER NOT NULL,
    protein_per_serving DECIMAL(6,2) NOT NULL,
    carbs_per_serving DECIMAL(6,2) NOT NULL,
    fat_per_serving DECIMAL(6,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for meal item queries
CREATE INDEX idx_meal_log_items_meal ON meal_log_items(meal_log_id);

-- ============================================
-- TABLE: user_cart (optional persistent cart)
-- ============================================
CREATE TABLE user_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipe_number INTEGER NOT NULL REFERENCES master_food_items(recipe_number),
    servings DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recipe_number)
);

CREATE INDEX idx_user_cart_user ON user_cart(user_id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cart ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS: profiles
-- ============================================
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Profile created on signup via trigger"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS: meal_logs
-- ============================================
CREATE POLICY "Users can view own meal logs"
    ON meal_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
    ON meal_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
    ON meal_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
    ON meal_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- RLS: meal_log_items
-- ============================================
CREATE POLICY "Users can view own meal log items"
    ON meal_log_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM meal_logs 
            WHERE meal_logs.id = meal_log_items.meal_log_id 
            AND meal_logs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own meal log items"
    ON meal_log_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_logs 
            WHERE meal_logs.id = meal_log_items.meal_log_id 
            AND meal_logs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own meal log items"
    ON meal_log_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM meal_logs 
            WHERE meal_logs.id = meal_log_items.meal_log_id 
            AND meal_logs.user_id = auth.uid()
        )
    );

-- ============================================
-- RLS: user_cart
-- ============================================
CREATE POLICY "Users can manage own cart"
    ON user_cart FOR ALL
    USING (auth.uid() = user_id);
```

### Database Functions & Triggers

```sql
-- ============================================
-- FUNCTION: Validate UNC email domain
-- Called by trigger on auth.users insert
-- ============================================
CREATE OR REPLACE FUNCTION validate_unc_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS NULL THEN
        RAISE EXCEPTION 'Email is required';
    END IF;
    
    IF NOT (
        NEW.email LIKE '%@unc.edu' OR 
        NEW.email LIKE '%@ad.unc.edu'
    ) THEN
        RAISE EXCEPTION 'Only @unc.edu and @ad.unc.edu email addresses are allowed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (requires Supabase dashboard or migration)
CREATE TRIGGER validate_email_before_signup
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION validate_unc_email();

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, onboarding_completed)
    VALUES (NEW.id, NEW.email, FALSE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: Calculate daily totals
-- ============================================
CREATE OR REPLACE FUNCTION get_daily_totals(
    p_user_id UUID,
    p_date DATE
)
RETURNS TABLE (
    total_calories INTEGER,
    total_protein DECIMAL,
    total_carbs DECIMAL,
    total_fat DECIMAL,
    meal_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM((mli.calories_per_serving * mli.servings)::INTEGER), 0) as total_calories,
        COALESCE(SUM(mli.protein_per_serving * mli.servings), 0) as total_protein,
        COALESCE(SUM(mli.carbs_per_serving * mli.servings), 0) as total_carbs,
        COALESCE(SUM(mli.fat_per_serving * mli.servings), 0) as total_fat,
        COUNT(DISTINCT ml.id)::INTEGER as meal_count
    FROM meal_logs ml
    LEFT JOIN meal_log_items mli ON ml.id = mli.meal_log_id
    WHERE ml.user_id = p_user_id
    AND ml.log_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get weekly/monthly trends
-- ============================================
CREATE OR REPLACE FUNCTION get_macro_trends(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    log_date DATE,
    total_calories INTEGER,
    total_protein DECIMAL,
    total_carbs DECIMAL,
    total_fat DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ml.log_date,
        COALESCE(SUM((mli.calories_per_serving * mli.servings)::INTEGER), 0),
        COALESCE(SUM(mli.protein_per_serving * mli.servings), 0),
        COALESCE(SUM(mli.carbs_per_serving * mli.servings), 0),
        COALESCE(SUM(mli.fat_per_serving * mli.servings), 0)
    FROM meal_logs ml
    LEFT JOIN meal_log_items mli ON ml.id = mli.meal_log_id
    WHERE ml.user_id = p_user_id
    AND ml.log_date >= CURRENT_DATE - p_days
    GROUP BY ml.log_date
    ORDER BY ml.log_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Milestone 1: Authentication Infrastructure

### Acceptance Criteria
- [ ] Users can only sign up with `@unc.edu` or `@ad.unc.edu` emails
- [ ] Magic link authentication works end-to-end
- [ ] Protected routes redirect unauthenticated users
- [ ] Auth state persists across page refreshes
- [ ] Logout functionality works correctly

### Tasks

#### 1.1 Supabase Auth Configuration
- [ ] Configure Supabase Auth settings in dashboard:
  - Enable Email provider
  - Configure magic link email template
  - Set redirect URLs for local/production
  - Disable signup with non-UNC domains (additional layer)

**Files to modify:**
- Supabase Dashboard > Authentication > Providers
- Supabase Dashboard > Authentication > Email Templates

#### 1.2 Database Setup
- [ ] Create migration for email validation trigger

**Files to create:**
- `supabase/migrations/001_auth_email_validation.sql`

```sql
-- Migration: 001_auth_email_validation.sql
-- See schema above for validate_unc_email function and trigger
```

#### 1.3 Auth Utilities & Hooks
- [ ] Create Supabase auth client for browser
- [ ] Create Supabase auth client for server components
- [ ] Create auth context provider
- [ ] Create useAuth hook with session state

**Files to create:**
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server component client
- `src/lib/supabase/middleware.ts` - Auth middleware helpers
- `src/providers/AuthProvider.tsx` - Auth context provider
- `src/hooks/useAuth.ts` - Auth hook

**Pseudocode for client.ts:**
```typescript
// Create browser client with cookie-based session
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 1.4 Login Page
- [ ] Create login page with email input
- [ ] Client-side email domain validation (UX only)
- [ ] Magic link request flow
- [ ] Loading/success/error states
- [ ] Link to return to home

**Files to create:**
- `src/app/auth/login/page.tsx`
- `src/components/auth/LoginForm.tsx`

**Email validation regex:**
```typescript
const isValidUNCEmail = (email: string): boolean => {
  return /^[^\s@]+@(unc\.edu|ad\.unc\.edu)$/i.test(email);
};
```

#### 1.5 Auth Callback Handler
- [ ] Handle magic link callback
- [ ] Exchange code for session
- [ ] Redirect to dashboard or onboarding

**Files to create:**
- `src/app/auth/callback/route.ts`

**Pseudocode:**
```typescript
// Handle the OAuth/magic link callback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createServerClient(...)
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  // Check if onboarding complete, redirect accordingly
  return redirect('/dashboard') // or /onboarding
}
```

#### 1.6 Auth Middleware
- [ ] Create Next.js middleware for route protection
- [ ] Define protected routes pattern
- [ ] Redirect unauthenticated users to login

**Files to create/modify:**
- `src/middleware.ts`

**Protected routes pattern:**
```typescript
const protectedRoutes = ['/dashboard', '/onboarding']
```

#### 1.7 Auth UI Components
- [ ] Create UserMenu component (avatar, name, logout)
- [ ] Create AuthButton (login CTA for logged-out state)
- [ ] Integrate into header/layout

**Files to create:**
- `src/components/auth/UserMenu.tsx`
- `src/components/auth/AuthButton.tsx`

**Files to modify:**
- `src/app/layout.tsx` - Add AuthProvider wrapper
- `src/components/LandingScreen.tsx` - Add login CTA

#### 1.8 Logout Functionality
- [ ] Implement logout action
- [ ] Clear session and redirect

**Files to modify:**
- `src/components/auth/UserMenu.tsx`

---

## Milestone 2: Onboarding Flow

### Acceptance Criteria
- [ ] First-time users are redirected to onboarding after login
- [ ] Onboarding collects all required fields
- [ ] Users cannot access dashboard until onboarding is complete
- [ ] Onboarding data is saved to profiles table
- [ ] Users can edit their profile later in settings

### Tasks

#### 2.1 Database Migration
- [ ] Create profiles table and related functions

**Files to create:**
- `supabase/migrations/002_profiles_table.sql`

#### 2.2 Onboarding Page
- [ ] Create multi-step onboarding form
- [ ] Step 1: Calorie & Macro targets (with presets)
- [ ] Step 2: Dietary preferences (multi-select)
- [ ] Step 3: Allergies (multi-select)
- [ ] Progress indicator
- [ ] Skip/default option for each step
- [ ] Submit and redirect to dashboard

**Files to create:**
- `src/app/onboarding/page.tsx`
- `src/components/onboarding/OnboardingForm.tsx`
- `src/components/onboarding/MacroTargetStep.tsx`
- `src/components/onboarding/DietaryPreferencesStep.tsx`
- `src/components/onboarding/AllergiesStep.tsx`
- `src/components/onboarding/ProgressIndicator.tsx`

**Dietary preference options:**
```typescript
const DIETARY_PREFERENCES = [
  'vegetarian',
  'vegan', 
  'halal',
  'kosher',
  'gluten-free',
  'dairy-free',
  'low-sodium',
  'organic',
  'sustainable'
] as const;
```

**Allergen options:**
```typescript
const ALLERGENS = [
  'milk',
  'egg',
  'fish',
  'shellfish',
  'tree-nuts',
  'peanut',
  'wheat',
  'soy',
  'sesame'
] as const;
```

**Common calorie presets:**
```typescript
const CALORIE_PRESETS = [
  { label: 'Weight Loss', calories: 1500, protein: 100, carbs: 150, fat: 50 },
  { label: 'Maintenance', calories: 2000, protein: 75, carbs: 250, fat: 65 },
  { label: 'Muscle Gain', calories: 2500, protein: 150, carbs: 300, fat: 80 },
  { label: 'Custom', calories: null, protein: null, carbs: null, fat: null }
];
```

#### 2.3 Onboarding Server Action
- [ ] Create server action to save onboarding data
- [ ] Validate all inputs
- [ ] Update profiles table with onboarding_completed = true

**Files to create:**
- `src/app/onboarding/actions.ts`

**Pseudocode:**
```typescript
'use server'

export async function completeOnboarding(formData: OnboardingData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Validate inputs
  // Update profile
  await supabase.from('profiles').update({
    daily_calories_target: formData.calories,
    daily_protein_target: formData.protein,
    daily_carbs_target: formData.carbs,
    daily_fat_target: formData.fat,
    dietary_preferences: formData.dietaryPreferences,
    allergies: formData.allergies,
    onboarding_completed: true
  }).eq('id', user.id)
  
  redirect('/dashboard')
}
```

#### 2.4 Onboarding Gate
- [ ] Check onboarding status in middleware/layout
- [ ] Redirect incomplete users from dashboard to onboarding
- [ ] Redirect complete users from onboarding to dashboard

**Files to modify:**
- `src/middleware.ts` - Add onboarding check

#### 2.5 Settings Page
- [ ] Create settings page for editing profile
- [ ] Reuse onboarding form components
- [ ] Save changes action

**Files to create:**
- `src/app/dashboard/settings/page.tsx`
- `src/components/settings/ProfileForm.tsx`
- `src/app/dashboard/settings/actions.ts`

---

## Milestone 3: Meal Macro Cart

### Acceptance Criteria
- [ ] Users can add menu items to cart with quantity
- [ ] Cart shows running totals (calories, protein, carbs, fat)
- [ ] Cart persists across page navigations
- [ ] Users can adjust quantities, remove items, clear cart
- [ ] Cart can be saved as a meal to daily log
- [ ] Optional: Cart syncs to database for logged-in users

### Tasks

#### 3.1 Cart State Management
- [ ] Create Zustand store for cart state
- [ ] Implement localStorage persistence
- [ ] Cart actions: add, remove, update quantity, clear

**Files to create:**
- `src/stores/cartStore.ts`

**Pseudocode:**
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  recipe_number: number
  food_name: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'servings'>) => void
  removeItem: (recipe_number: number) => void
  updateServings: (recipe_number: number, servings: number) => void
  clearCart: () => void
  getTotals: () => { calories: number, protein: number, carbs: number, fat: number }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.recipe_number === item.recipe_number)
        if (existing) {
          return {
            items: state.items.map(i => 
              i.recipe_number === item.recipe_number 
                ? { ...i, servings: i.servings + 1 }
                : i
            )
          }
        }
        return { items: [...state.items, { ...item, servings: 1 }] }
      }),
      // ... other actions
    }),
    { name: 'meal-cart' }
  )
)
```

#### 3.2 Cart UI Components
- [ ] Create floating cart button with item count badge
- [ ] Create cart drawer/modal
- [ ] Cart item row with quantity controls
- [ ] Totals summary
- [ ] Save to log button
- [ ] Clear cart button

**Files to create:**
- `src/components/cart/CartButton.tsx`
- `src/components/cart/CartDrawer.tsx`
- `src/components/cart/CartItem.tsx`
- `src/components/cart/CartTotals.tsx`
- `src/components/cart/SaveMealButton.tsx`

#### 3.3 Add to Cart Integration
- [ ] Add "Add to Cart" button to FoodCard
- [ ] Add "Add to Cart" button to FoodModal
- [ ] Show toast/feedback on add

**Files to modify:**
- `src/components/FoodCard.tsx`
- `src/components/FoodModal.tsx`

#### 3.4 Cart in Layout
- [ ] Add CartButton to menu page layouts
- [ ] Conditionally show for logged-in users only

**Files to modify:**
- `src/app/[hall]/[date]/layout.tsx` or relevant layout

#### 3.5 Save Cart to Daily Log
- [ ] Create server action to save cart as meal
- [ ] Select meal type (breakfast/lunch/dinner/snack)
- [ ] Create meal_log and meal_log_items entries
- [ ] Clear cart after successful save
- [ ] Show confirmation

**Files to create:**
- `src/app/api/meal-logs/route.ts` (or server action)

**Files to modify:**
- `src/components/cart/SaveMealButton.tsx`

---

## Milestone 4: Daily Calorie Tracker

### Acceptance Criteria
- [ ] Dashboard shows today's totals vs targets
- [ ] Remaining budget is calculated correctly
- [ ] Users can view logged meals for today
- [ ] Users can remove individual items or entire meals
- [ ] Warning shown when exceeding targets
- [ ] Support for multiple meals per day
- [ ] All dates are timezone-safe (America/New_York)

### Tasks

#### 4.1 Database Migration
- [ ] Create meal_logs and meal_log_items tables
- [ ] Create daily totals function
- [ ] Add RLS policies

**Files to create:**
- `supabase/migrations/003_meal_logs.sql`

#### 4.2 Daily Log API/Actions
- [ ] Get today's logs with items
- [ ] Delete meal log
- [ ] Delete individual meal log item
- [ ] Get daily totals

**Files to create:**
- `src/lib/api/mealLogs.ts`
- `src/app/api/meal-logs/[id]/route.ts`
- `src/app/api/meal-logs/today/route.ts`

#### 4.3 Today's Log Component
- [ ] Show list of today's meals grouped by meal type
- [ ] Each meal expandable to show items
- [ ] Delete buttons per item and per meal
- [ ] Empty state when no meals logged

**Files to create:**
- `src/components/tracker/TodaysMeals.tsx`
- `src/components/tracker/MealCard.tsx`
- `src/components/tracker/MealItem.tsx`

#### 4.4 Daily Budget Display
- [ ] Show target vs consumed for each macro
- [ ] Show remaining values
- [ ] Progress bars for visual feedback
- [ ] Warning styling when over budget

**Files to create:**
- `src/components/tracker/DailyBudget.tsx`
- `src/components/tracker/MacroProgressBar.tsx`

#### 4.5 Timezone Handling
- [ ] Use server-side date calculation for "today"
- [ ] Store all timestamps as UTC
- [ ] Convert to America/New_York for display

**Files to create:**
- `src/lib/utils/timezone.ts`

**Pseudocode:**
```typescript
export function getTodayInET(): string {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/New_York' 
  }); // Returns YYYY-MM-DD
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}
```

---

## Milestone 5: Dashboard & Analytics

### Acceptance Criteria
- [ ] Dashboard shows today's summary prominently
- [ ] Historical trends for 7/14/30 days
- [ ] Charts for calories and macros over time
- [ ] Streak/adherence tracking (optional)
- [ ] Top foods by frequency (optional)
- [ ] Empty states for new users
- [ ] Efficient queries with proper indexes

### Tasks

#### 5.1 Dashboard Layout
- [ ] Create dashboard page structure
- [ ] Header with user greeting and date
- [ ] Grid layout for widgets

**Files to create:**
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/layout.tsx`

#### 5.2 Today Summary Widget
- [ ] Fetch today's totals
- [ ] Display vs targets with progress rings/bars
- [ ] Link to detailed meal log
- [ ] Quick action to add meal

**Files to create:**
- `src/components/dashboard/TodaySummary.tsx`

#### 5.3 Trend Charts
- [ ] Fetch historical data (7/14/30 days toggle)
- [ ] Line chart for calories over time
- [ ] Stacked bar or multi-line for macros
- [ ] Use lightweight chart library (e.g., Recharts or custom SVG)

**Files to create:**
- `src/components/dashboard/TrendChart.tsx`
- `src/components/dashboard/MacroTrendChart.tsx`
- `src/components/dashboard/DateRangeToggle.tsx`

**Dependencies to add:**
```json
"recharts": "^2.x"
```

#### 5.4 Streak/Adherence Widget (Optional)
- [ ] Calculate days meeting calorie target
- [ ] Display current streak
- [ ] Show weekly adherence percentage

**Files to create:**
- `src/components/dashboard/StreakWidget.tsx`
- `src/lib/utils/streaks.ts`

#### 5.5 Top Foods Widget (Optional)
- [ ] Query most frequently logged items
- [ ] Display top 5 with counts

**Files to create:**
- `src/components/dashboard/TopFoodsWidget.tsx`

#### 5.6 Empty States
- [ ] Design empty state for new users
- [ ] Guide to log first meal
- [ ] Quick links to menu pages

**Files to create/modify:**
- `src/components/dashboard/EmptyDashboard.tsx`

#### 5.7 Dashboard API
- [ ] Create efficient endpoint for dashboard data
- [ ] Single query for all dashboard data
- [ ] Cache/memoize where appropriate

**Files to create:**
- `src/app/api/dashboard/route.ts`

---

## Milestone 6: Testing & Quality Assurance

### Acceptance Criteria
- [ ] Unit tests for macro calculation logic
- [ ] Integration tests for auth gate
- [ ] Integration tests for onboarding gate
- [ ] E2E test for critical user flow
- [ ] All tests passing in CI

### Tasks

#### 6.1 Testing Setup
- [ ] Install testing dependencies (Vitest, Testing Library)
- [ ] Configure test environment
- [ ] Set up test utilities and mocks

**Dependencies to add:**
```json
"vitest": "^1.x",
"@testing-library/react": "^14.x",
"@testing-library/user-event": "^14.x",
"@playwright/test": "^1.x"
```

**Files to create:**
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/test/mocks/supabase.ts`
- `playwright.config.ts`

#### 6.2 Unit Tests - Cart & Macros
- [ ] Test cart add/remove/update logic
- [ ] Test macro total calculations
- [ ] Test serving size multiplications
- [ ] Test edge cases (empty cart, 0 servings)

**Files to create:**
- `src/stores/__tests__/cartStore.test.ts`
- `src/lib/utils/__tests__/macros.test.ts`

**Example test cases:**
```typescript
describe('cartStore', () => {
  it('should add item with default serving of 1')
  it('should increment servings when adding existing item')
  it('should calculate correct totals for multiple items')
  it('should handle decimal servings correctly')
  it('should clear all items')
})
```

#### 6.3 Integration Tests - Auth
- [ ] Test login redirect for unauthenticated users
- [ ] Test protected route access with session
- [ ] Test logout flow

**Files to create:**
- `src/app/auth/__tests__/auth.integration.test.ts`

#### 6.4 Integration Tests - Onboarding
- [ ] Test redirect to onboarding for new users
- [ ] Test redirect away from onboarding for completed users
- [ ] Test onboarding form submission

**Files to create:**
- `src/app/onboarding/__tests__/onboarding.integration.test.ts`

#### 6.5 E2E Tests
- [ ] Complete flow: Login → Onboarding → Menu → Add to Cart → Save → Dashboard
- [ ] Test on different screen sizes

**Files to create:**
- `e2e/user-flow.spec.ts`

**E2E test outline:**
```typescript
test('complete user journey', async ({ page }) => {
  // 1. Navigate to home, click login
  // 2. Enter UNC email, submit
  // 3. Handle magic link (mock or real)
  // 4. Complete onboarding steps
  // 5. Navigate to menu
  // 6. Add items to cart
  // 7. Save cart as meal
  // 8. Verify on dashboard
})
```

#### 6.6 Type Safety
- [ ] Ensure all new types are in database.types.ts
- [ ] Run type generation from Supabase
- [ ] Fix any type errors

**Commands:**
```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```

---

## Milestone 7: Migration & Rollout

### Acceptance Criteria
- [ ] All migrations run successfully on production
- [ ] Feature flags allow gradual rollout
- [ ] Rollback plan documented
- [ ] Monitoring in place
- [ ] User documentation/onboarding copy ready

### Tasks

#### 7.1 Migration Preparation
- [ ] Test migrations on staging
- [ ] Backup production database
- [ ] Schedule maintenance window if needed

#### 7.2 Environment Variables
- [ ] Add any new env vars to Vercel
- [ ] Document all required env vars

**Required variables:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (for admin operations)
```

#### 7.3 Feature Flags (Optional)
- [ ] Implement feature flag for meal cart
- [ ] Allow gradual rollout to % of users

**Files to create:**
- `src/lib/featureFlags.ts`

#### 7.4 Run Migrations
- [ ] Deploy migration 001 (auth validation)
- [ ] Deploy migration 002 (profiles)
- [ ] Deploy migration 003 (meal logs)
- [ ] Verify all tables and RLS policies

**Migration order:**
```bash
# Via Supabase CLI
supabase db push
# Or apply individually
supabase migration up 001_auth_email_validation
supabase migration up 002_profiles_table
supabase migration up 003_meal_logs
```

#### 7.5 Deploy Application
- [ ] Deploy to Vercel staging
- [ ] Smoke test all flows
- [ ] Deploy to production
- [ ] Monitor error tracking

#### 7.6 Documentation
- [ ] Update README with new features
- [ ] Create user guide for tracking features
- [ ] Document API endpoints

**Files to modify:**
- `README.md`

**Files to create:**
- `docs/user-guide.md`
- `docs/api.md`

#### 7.7 Rollback Plan
- [ ] Document steps to rollback migrations
- [ ] Document steps to disable features via flags
- [ ] Test rollback on staging

**Rollback commands:**
```sql
-- Emergency: Disable all new RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_items DISABLE ROW LEVEL SECURITY;

-- Drop tables (data loss!)
DROP TABLE meal_log_items;
DROP TABLE meal_logs;
DROP TABLE user_cart;
DROP TABLE profiles;
```

---

## User Experience Flow

### Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Landing   │────▶│   Login     │────▶│  Magic Link     │
│   (Home)    │     │   Page      │     │  Sent Screen    │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                  │
                    ┌─────────────────────────────┘
                    ▼
            ┌───────────────┐
            │ Email Click   │
            │ (Callback)    │
            └───────┬───────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│  Onboarding   │       │   Dashboard   │
│  (First Time) │       │  (Returning)  │
└───────┬───────┘       └───────────────┘
        │
        ▼
┌───────────────┐
│  Onboarding   │
│  Step 1:      │
│  Macro Goals  │
└───────┬───────┘
        ▼
┌───────────────┐
│  Onboarding   │
│  Step 2:      │
│  Dietary      │
└───────┬───────┘
        ▼
┌───────────────┐
│  Onboarding   │
│  Step 3:      │
│  Allergies    │
└───────┬───────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐
│   Dashboard   │◀───▶│   Settings    │
│               │     │ (Edit Profile)│
└───────┬───────┘     └───────────────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐
│   Menu Page   │────▶│   Food Modal  │
│   (Browse)    │     │   (Details)   │
└───────┬───────┘     └───────┬───────┘
        │                     │
        │  ┌──────────────────┘
        ▼  ▼
┌───────────────┐
│  Cart Drawer  │
│  (Add Items)  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  Save Meal    │
│  Modal        │
│  (Select Type)│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Dashboard   │
│  (Updated     │
│   Totals)     │
└───────────────┘
```

### Screen-by-Screen Details

#### 1. Landing Page (Existing, Modified)
- **Current**: Shows dining hall cards
- **Add**: Login CTA button in header
- **Add**: "Track your meals" promotional section
- **Logged-in**: Show user avatar/menu instead of login CTA

#### 2. Login Page (`/auth/login`)
- **Header**: UNC Dining logo
- **Form**:
  - Email input with placeholder "your-onyen@unc.edu"
  - Client-side validation: Show error for non-UNC emails before submit
  - "Send Magic Link" button
- **States**:
  - Default: Email input + button
  - Loading: Button disabled, spinner
  - Success: "Check your email" message with email address shown
  - Error: Error message (invalid email, rate limit, etc.)
- **Footer**: Link back to home

#### 3. Magic Link Email
- Subject: "Sign in to UNC Dining"
- Body: Branded email with "Sign In" button
- Link expires in 1 hour

#### 4. Auth Callback (`/auth/callback`)
- Loading spinner while processing
- Auto-redirect to dashboard or onboarding
- Error state if link expired/invalid

#### 5. Onboarding (`/onboarding`)
- **Progress bar**: 3 steps indicator
- **Step 1 - Macro Targets**:
  - Preset buttons (Weight Loss, Maintenance, Muscle Gain, Custom)
  - Custom inputs for calories, protein, carbs, fat
  - Helpful tips/recommendations
  - "Next" button
- **Step 2 - Dietary Preferences**:
  - Multi-select checkbox grid
  - Options: Vegetarian, Vegan, Halal, Kosher, Gluten-Free, etc.
  - Optional skip
  - "Next" button
- **Step 3 - Allergies**:
  - Multi-select checkbox grid
  - Standard allergens: Milk, Egg, Peanut, Tree Nuts, etc.
  - Optional skip
  - "Complete Setup" button
- **Animation**: Smooth transitions between steps

#### 6. Dashboard (`/dashboard`)
- **Header**: Greeting ("Good morning, [Name]"), date, user menu
- **Today's Summary Card**:
  - Circular progress for calories
  - Horizontal bars for protein/carbs/fat
  - Numbers: "1,234 / 2,000 kcal"
  - Remaining: "766 kcal left"
  - Warning badge if over limit
- **Today's Meals Section**:
  - Grouped by meal type (Breakfast, Lunch, etc.)
  - Each meal expandable
  - Shows items with macros
  - Delete buttons
  - Empty state: "No meals logged yet. Browse menus →"
- **Trending Charts**:
  - 7/14/30 day toggle
  - Line chart for calories
  - Secondary chart for macro breakdown
- **Quick Actions**:
  - "Browse Menus" button
  - "Edit Goals" link

#### 7. Menu Page (Existing, Modified)
- **Existing**: Food cards, filters, search
- **Add**: "Add to Cart" button on each food card
- **Add**: Floating cart button (bottom right)
- **Add**: Cart badge with item count
- **Add**: Visual feedback on add (toast, animation)

#### 8. Cart Drawer (Slide-in Overlay)
- **Header**: "Your Meal" with item count
- **Item List**:
  - Food name
  - Macro summary
  - Quantity selector (+/-)
  - Delete button
- **Totals Bar**:
  - Calories | Protein | Carbs | Fat
  - Compare to remaining budget if logged in
- **Actions**:
  - "Clear Cart" (secondary)
  - "Save to Log" (primary, requires auth)
- **Empty State**: "Your cart is empty. Add items from the menu."

#### 9. Save Meal Modal
- **Trigger**: Click "Save to Log" in cart
- **Content**:
  - Date: Today (display only)
  - Meal Type: Radio group (Breakfast, Lunch, Dinner, Snack)
  - Optional notes input
  - Summary of what will be logged
- **Actions**:
  - "Cancel"
  - "Save Meal"
- **Success**: Toast notification, cart clears, optional redirect to dashboard

#### 10. Settings Page (`/dashboard/settings`)
- **Sections**:
  - Macro Targets (editable, reuses onboarding components)
  - Dietary Preferences (editable)
  - Allergies (editable)
  - Account (email display, logout)
- **Save**: Auto-save or explicit save button with confirmation

### Error States & Edge Cases

| Scenario | Handling |
|----------|----------|
| Non-UNC email entered | Client-side: Inline error before submit. Server-side: Signup rejected |
| Magic link expired | Show error with option to resend |
| Session expired | Redirect to login with "Session expired" message |
| Cart items unavailable | Show warning, allow saving anyway with note |
| Network error saving meal | Show error, preserve cart, allow retry |
| Over daily limit | Warning badge, still allow logging |
| No meals logged | Empty state with helpful CTA |
| User closes before completing onboarding | Redirect back to onboarding on next visit |

### Accessibility Considerations
- All forms keyboard navigable
- Focus management on modals
- ARIA labels on interactive elements
- Color contrast meets WCAG AA
- Loading states announced to screen readers

---

## Summary & Dependencies

### NPM Packages to Add
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.x",
    "zustand": "^4.x",
    "recharts": "^2.x"
  },
  "devDependencies": {
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "@playwright/test": "^1.x"
  }
}
```

### Files to Create (Summary)

**Auth (10 files)**
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/providers/AuthProvider.tsx`
- `src/hooks/useAuth.ts`
- `src/app/auth/login/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/UserMenu.tsx`
- `src/components/auth/AuthButton.tsx`
- `src/middleware.ts`

**Onboarding (8 files)**
- `src/app/onboarding/page.tsx`
- `src/app/onboarding/actions.ts`
- `src/components/onboarding/OnboardingForm.tsx`
- `src/components/onboarding/MacroTargetStep.tsx`
- `src/components/onboarding/DietaryPreferencesStep.tsx`
- `src/components/onboarding/AllergiesStep.tsx`
- `src/components/onboarding/ProgressIndicator.tsx`

**Cart (6 files)**
- `src/stores/cartStore.ts`
- `src/components/cart/CartButton.tsx`
- `src/components/cart/CartDrawer.tsx`
- `src/components/cart/CartItem.tsx`
- `src/components/cart/CartTotals.tsx`
- `src/components/cart/SaveMealButton.tsx`

**Tracker (6 files)**
- `src/lib/api/mealLogs.ts`
- `src/lib/utils/timezone.ts`
- `src/components/tracker/TodaysMeals.tsx`
- `src/components/tracker/MealCard.tsx`
- `src/components/tracker/MealItem.tsx`
- `src/components/tracker/DailyBudget.tsx`
- `src/components/tracker/MacroProgressBar.tsx`

**Dashboard (9 files)**
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/settings/page.tsx`
- `src/app/dashboard/settings/actions.ts`
- `src/components/dashboard/TodaySummary.tsx`
- `src/components/dashboard/TrendChart.tsx`
- `src/components/dashboard/MacroTrendChart.tsx`
- `src/components/dashboard/DateRangeToggle.tsx`
- `src/components/dashboard/EmptyDashboard.tsx`

**Database (3 migrations)**
- `supabase/migrations/001_auth_email_validation.sql`
- `supabase/migrations/002_profiles_table.sql`
- `supabase/migrations/003_meal_logs.sql`

**Testing (8 files)**
- `vitest.config.ts`
- `playwright.config.ts`
- `src/test/setup.ts`
- `src/test/mocks/supabase.ts`
- `src/stores/__tests__/cartStore.test.ts`
- `src/lib/utils/__tests__/macros.test.ts`
- `src/app/auth/__tests__/auth.integration.test.ts`
- `e2e/user-flow.spec.ts`

### Files to Modify (Summary)
- `src/app/layout.tsx` - Add AuthProvider
- `src/components/LandingScreen.tsx` - Add login CTA
- `src/components/FoodCard.tsx` - Add to cart button
- `src/components/FoodModal.tsx` - Add to cart button
- `src/lib/database.types.ts` - Regenerate from Supabase
- `package.json` - Add dependencies
- `README.md` - Update documentation

### Estimated Timeline

| Milestone | Estimated Effort |
|-----------|------------------|
| 1. Auth Infrastructure | 2-3 days |
| 2. Onboarding Flow | 1-2 days |
| 3. Meal Cart | 2-3 days |
| 4. Daily Tracker | 2-3 days |
| 5. Dashboard | 3-4 days |
| 6. Testing | 2-3 days |
| 7. Migration & Rollout | 1-2 days |
| **Total** | **13-20 days** |

---

*Last updated: January 29, 2026*
