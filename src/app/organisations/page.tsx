import EntityList from '@/components/EntityList';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrganisationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');
  
  return <EntityList type="Organisation" title="Organisations" page={page} />;
}