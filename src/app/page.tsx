
import LandingScreen from "@/components/LandingScreen";
import { redirect } from "next/navigation";

// Dynamic rendering - no caching
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ date?: string, hall?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const hallSlug = params.hall;
  const selectedDate = params.date;

  // Legacy Redirect Logic
  if (hallSlug) {
    if (selectedDate) {
      redirect(`/${hallSlug}/${selectedDate}`);
    } else {
      redirect(`/${hallSlug}`);
    }
  }

  return (
    <main className="min-h-screen-ios-safe bg-transparent overflow-hidden">
      <LandingScreen />
    </main>
  );
}
