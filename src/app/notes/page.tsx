import EntityList from '@/components/EntityList';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NotesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');
  
  return <EntityList type="Note" title="Notes" page={page} />;
}