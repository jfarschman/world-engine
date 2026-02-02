import EntityList from '@/components/EntityList';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function LocationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');
  
  return <EntityList type="Location" title="Locations" page={page} />;
}