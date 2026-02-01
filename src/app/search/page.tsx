import { Suspense } from 'react';
import SearchClient from './search-client';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading search...</div>}>
      <SearchClient />
    </Suspense>
  );
}