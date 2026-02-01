import EntityList from '@/components/EntityList';

export default function JournalsPage() {
  // If your journals are type 'Session', change "Journal" to "Session" below
  return <EntityList type="Journal" title="Journals" />;
}