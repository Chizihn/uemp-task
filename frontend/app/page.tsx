import { FullPageSpinner } from "@/components/shared/full-page-spinner";

// proxy.ts redirects every request to "/" (authenticated or not) before this
// ever renders — this is just a safe fallback for the brief moment in between.
export default function Home() {
  return <FullPageSpinner />;
}
