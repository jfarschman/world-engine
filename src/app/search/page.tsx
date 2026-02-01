import { Suspense } from 'react';
import SearchClient from './search-client';

export default function SearchPage() {
  return (
    // This boundary tells Next.js: "Don't render the search client until the URL is ready"
    <Suspense fallback={<div className="text-center p-8">Loading search...</div>}>
      <SearchClient />
    </Suspense>
  );
}