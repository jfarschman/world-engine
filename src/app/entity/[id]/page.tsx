import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import JournalSession from '@/components/JournalSession';
import { resolveKankaMentions } from '@/lib/utils';
import parse, { domToReact } from 'html-react-parser';
import EntityLink from '@/components/EntityLink';
import NewPostForm from '@/components/NewPostForm';
import DeleteButton from '@/components/DeleteButton';
import { deleteEntity, deletePost } from '@/app/actions';
import FeatureButton from '@/components/FeatureButton';
import EntityEditableBlock from '@/components/EntityEditableBlock';
import EditButton from '@/components/EditButton';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EntityPage({ params, searchParams }: PageProps) {
  const { id: idStr } = await params;
  const { open } = await searchParams;
  const id = parseInt(idStr);

  if (isNaN(id)) return notFound();

  // 1. CHECK LOGIN STATUS
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('lore_session');

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: {
      character: true,
      location: true,
      organisation: true,
      family: true,
      race: true,
      note: true,
      posts: {
        orderBy: { position: 'asc' }
      }
    }
  });

  if (!entity) return notFound();

  // 2. PARSER LOGIC
  const parseContent = (htmlString: string) => {
    return parse(htmlString, {
      replace: (domNode) => {
        if (domNode.type === 'tag' && domNode.name === 'a') {
          const href = domNode.attribs.href;
          const title = domNode.attribs.title;
          
          let entityId = null;

          if (title) {
            const titleMatch = title.match(/[:#](\d+)/); 
            if (titleMatch) entityId = parseInt(titleMatch[1]);
          }

          if (!entityId && href) {
             const hrefMatch = href.match(/entity\/(\d+)/); 
             if (hrefMatch) entityId = parseInt(hrefMatch[1]);
          }

          if (entityId) {
            return (
              <EntityLink id={entityId} name={title || 'Entity'}>
                {/* @ts-ignore */}
                {domToReact(domNode.children)}
              </EntityLink>
            );
          }
        }
        
        // Handle Tiptap Mentions in Read-Only Mode
        if (
          domNode.type === 'tag' && 
          domNode.name === 'span' && 
          domNode.attribs['data-type'] === 'mention'
        ) {
          const id = parseInt(domNode.attribs['data-id']);
          const label = domNode.attribs['data-label'];

          if (id) {
            return (
              <EntityLink id={id} name={label || 'Entity'}>
                {label}
              </EntityLink>
            );
          }
        }
      }
    });
  };

  const contentHtml = entity.entry ? resolveKankaMentions(entity.entry) : '';

  const renderAttributes = () => {
    switch (entity.type) {
      case 'Character':
        return (
          <>
            <Attribute label="Title" value={entity.character?.title} />
            <Attribute label="Age" value={entity.character?.age} />
            <Attribute label="Sex" value={entity.character?.sex} />
            <Attribute label="Status" value={entity.character?.is_dead ? "Deceased 💀" : "Alive"} />
          </>
        );
      case 'Location':
        return <Attribute label="Status" value={entity.location?.is_destroyed ? "Destroyed 🏚️" : "Standing"} />;
      case 'Organisation':
        return <Attribute label="Status" value={entity.organisation?.is_defunct ? "Defunct" : "Active"} />;
      case 'Family':
        return <Attribute label="Status" value={entity.family?.is_extinct ? "Extinct" : "Extant"} />;
      case 'Race':
        return <Attribute label="Status" value={entity.race?.is_extinct ? "Extinct" : "Living"} />;
      case 'Note':
        return <Attribute label="Category" value={entity.note?.type || "General Note"} />;
      default:
        return null;
    }
  };

  return (
    <EntityEditableBlock entity={entity} isLoggedIn={isLoggedIn}>
      
      <div className="space-y-6 pt-2">
        
        {/* HEADER SECTION */}
        <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
           <div>
             <div className="flex items-center space-x-2 text-sm text-slate-500 uppercase tracking-widest font-semibold mb-1">
               <span>{entity.type}</span>
               {entity.is_private && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded text-xs">Private</span>}
             </div>
             <h1 className="text-4xl font-extrabold text-slate-900">{entity.name}</h1>
           </div>

           {/* ACTION BUTTONS (Only if Logged In) */}
           {isLoggedIn && (
            <div className="flex items-center space-x-2">
               {/* 1. Feature Star */}
               <FeatureButton id={entity.id} isFeatured={entity.is_featured} />
               
               {/* 2. NEW EDIT BUTTON */}
               <EditButton 
                 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
               />

               {/* 3. Delete Trash Can */}
               <DeleteButton 
                 id={entity.id} 
                 action={deleteEntity} 
                 className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
               />
            </div>
           )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Main Entry Text */}
            {entity.entry && (
               <div className="prose prose-slate max-w-none text-slate-800 bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                 {parseContent(contentHtml)}
               </div>
            )}

            {/* Posts / Journal Sessions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                Journal Entries & Logs
              </h3>
              
              {isLoggedIn && <NewPostForm entityId={entity.id} />}

              {entity.posts.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-100">
                  {entity.posts.map(post => (
                    <div key={post.id} className="px-4 relative group">
                      
                      {isLoggedIn && (
                         <div className="absolute top-4 right-12 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteButton 
                              id={post.id} 
                              action={deletePost} 
                              className="bg-white p-1 text-slate-400 hover:text-red-600 rounded-full shadow-sm border border-slate-200" 
                            />
                         </div>
                      )}

                      <JournalSession 
                        id={post.id} 
                        name={post.name} 
                        initialOpen={open === post.id.toString()}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                 <p className="text-slate-400 italic p-4 text-center border border-dashed border-slate-200 rounded-lg">
                   No entries yet.
                 </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                {entity.image_uuid && entity.image_ext ? (
                  <img 
                    src={`/gallery/${entity.image_uuid}.${entity.image_ext}`} 
                    alt={entity.name}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                ) : (
                   <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                      <span className="text-6xl font-bold">{entity.name.charAt(0)}</span>
                   </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-slate-700">
                Attributes
              </div>
              <div className="divide-y divide-slate-100">
                {renderAttributes()}
                <Attribute label="Updated" value={new Date(entity.updatedAt).toLocaleDateString()} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </EntityEditableBlock>
  );
}

function Attribute({ label, value }: { label: string, value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center px-4 py-3 text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-900 font-semibold text-right">{value}</span>
    </div>
  );
}