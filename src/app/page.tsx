import { getAvailableDates, getFullMenusByDate } from "@/lib/api";
import DateSelector from "@/components/DateSelector";
import MenuContainer from "@/components/MenuContainer";
import { normalizeMealPeriod } from "@/lib/utils";

export const runtime = 'edge';
export const revalidate = 3600; // Cache the page for 1 hour

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  // Start fetching available dates
  const dateDataPromise = getAvailableDates();

  // If we have a date in params, fetch menu data in parallel
  let menuDataPromise = null;
  if (params.date) {
    menuDataPromise = getFullMenusByDate(params.date);
  }

  const { data: dateData } = await dateDataPromise;

  // Get unique dates
  const availableDates = Array.from(new Set(dateData?.map(d => d.menu_date) || []));
  const selectedDate = params.date || availableDates[0];

  if (!selectedDate) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-zinc-500">No menus available yet.</p>
        </div>
      </main>
    );
  }

  // Use parallel promise or fetch now if selectedDate was just determined
  const { data: menus, error: menuError } = menuDataPromise && params.date === selectedDate
    ? await menuDataPromise
    : await getFullMenusByDate(selectedDate);

  if (menuError) {
    return (
      <main className="min-h-screen bg-transparent py-24 px-6 flex items-center justify-center">
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
      </main>
    );
  }

  // Extract all unique meal periods and entries for this date
  const allEntries = (menus || []).flatMap(menu => (menu.menu_entries || []).map(entry => ({
    ...entry,
    meal_period_raw: entry.meal_period,
    meal_period: normalizeMealPeriod(entry.meal_period)
  })));

  const availablePeriods = Array.from(new Set(allEntries.map(e => e.meal_period)));

  // Sort periods logically
  const periodOrder = ['breakfast', 'lunch', 'lite-lunch', 'dinner'];
  availablePeriods.sort((a, b) => {
    const indexA = periodOrder.indexOf(a);
    const indexB = periodOrder.indexOf(b);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });

  return (
    <main className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none -z-10 dark:bg-blue-600/5" />

      <div className="relative">
        <MenuContainer
          key={selectedDate}
          allEntries={allEntries}
          availablePeriods={availablePeriods}
          availableDates={availableDates}
          selectedDate={selectedDate}
        />
      </div>
    </main>
  );
}
