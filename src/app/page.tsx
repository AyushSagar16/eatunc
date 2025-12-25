import { getAvailableDates, getFullMenuByDateAndHall } from "@/lib/api";
import MenuContainer from "@/components/MenuContainer";
import MenuSkeleton from "@/components/MenuSkeleton";
import LandingScreen from "@/components/LandingScreen";
import { Suspense } from "react";

export const runtime = 'edge';
export const revalidate = 3600; // Cache the page for 1 hour

interface PageProps {
  searchParams: Promise<{ date?: string, hall?: string }>;
}

const HALL_MAP: Record<string, string> = {
  chase: 'Chase',
  lenoir: 'Top of Lenoir',
};

async function MenuContent({ date, hallSlug }: { date?: string, hallSlug: string }) {
  const selectedHall = HALL_MAP[hallSlug] || 'Chase';

  // Start fetching available dates
  const dateDataPromise = getAvailableDates();

  // Fetch menu data if date is present
  let menuDataPromise = null;
  if (date) {
    menuDataPromise = getFullMenuByDateAndHall(date, selectedHall);
  }

  const { data: dateData } = await dateDataPromise;

  // Get unique dates
  const availableDates = Array.from(new Set(dateData?.map(d => d.menu_date) || []));
  const selectedDate = date || availableDates[0];

  if (!selectedDate) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <p className="text-zinc-500">No menus available yet.</p>
      </div>
    );
  }

  // Use parallel promise or fetch now if selectedDate was just determined
  const { data: menu, error: menuError } = menuDataPromise && date === selectedDate
    ? await menuDataPromise
    : await getFullMenuByDateAndHall(selectedDate, selectedHall);

  if (menuError) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="max-w-sm w-full text-center p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Failed to load menus</h2>
          <p className="text-zinc-500 mb-8 text-sm">{menuError.message}</p>
          <a
            href={`/?date=${selectedDate}`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors w-full"
          >
            Retry Connection
          </a>
        </div>
      </div>
    );
  }

  // Extract entries from the single menu object
  const hallFilteredEntries = (menu?.menu_entries || []).map(entry => ({
    ...entry,
    meal_period_raw: entry.meal_period,
    meal_period: entry.meal_period,
    dining_hall: menu?.dining_hall
  }));

  const availablePeriods = Array.from(new Set(hallFilteredEntries.map(e => e.meal_period)));

  // Sort periods logically
  availablePeriods.sort((a, b) => {
    const getOrder = (p: string) => {
      const lower = p.toLowerCase();
      if (lower.includes('breakfast')) return 0;
      if (lower.includes('lite') || lower.includes('light')) return 2;
      if (lower.includes('lunch')) return 1;
      if (lower.includes('dinner')) return 3;
      return 99;
    };
    return getOrder(a) - getOrder(b);
  });

  return (
    <div className="relative">
      {/* Prominent Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 opacity-80">
            Eat UNC
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            {selectedHall}
          </h1>
        </div>
      </div>

      <MenuContainer
        key={`${selectedDate}-${selectedHall}`}
        allEntries={hallFilteredEntries}
        availablePeriods={availablePeriods}
        availableDates={availableDates}
        selectedDate={selectedDate}
        selectedHall={selectedHall}
      />
    </div>
  );
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const hallSlug = params.hall;
  const selectedDate = params.date;

  // If no hall is selected, show the landing selection screen
  if (!hallSlug) {
    return (
      <main className="min-h-screen bg-transparent overflow-hidden">
        <LandingScreen />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none -z-10 dark:bg-blue-600/5" />

      <Suspense
        key={`${selectedDate}-${hallSlug}`}
        fallback={
          <div className="relative">
            <MenuSkeleton />
          </div>
        }
      >
        <MenuContent date={selectedDate} hallSlug={hallSlug} />
      </Suspense>
    </main>
  );
}
