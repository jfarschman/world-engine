import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import JournalSession from '@/components/JournalSession';
import RichTextRenderer from '@/components/RichTextRenderer';
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

  // 2. FETCH ENTITY WITH OPTIMIZED RELATIONS
  // We strictly select only the fields we need for display to reduce payload size.
  const simpleEntitySelect = {
    id: true,
    name: true,
    image_uuid: true,
    image_ext: true,
    focal_x: true,
    focal_y: true,
  };

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      character: { 
        include: { 
          race: {
            include: { entity: { select: { id: true, name: true } } }
          }, 
          families: {
            include: { 
              family: {
                include: { entity: { select: { id: true, name: true } } } 
              } 
            }
          },
          organisations: {
            include: { 
              organisation: {
                include: { entity: { select: { id: true, name: true } } } 
              } 
            }
          }
        } 
      },
      location: true, 
      organisation: { 
        include: { 
          members: {
            include: { 
              character: {
                include: { entity: { select: simpleEntitySelect } } 
              } 
            }
          }
        } 
      },
      family: {
        include: {
          members: {
            include: {
              character: {
                include: { entity: { select: simpleEntitySelect } }
              }
            }
          }
        }
      },
      race: true,
      note: true,
      posts: {
        where: isLoggedIn ? undefined : { is_private: false },
        orderBy: { createdAt: 'desc' },
      }
    }
  });

  if (!entity) return notFound();

  // Privacy Check
  if (entity.is_private && !isLoggedIn) {
    return notFound();
  }

  // 3. FETCH LISTS FOR EDIT DROPDOWNS (Only for DM)
  let locations: { id: number; name: string }[] = [];
  let races: { id: number; name: string }[] = [];
  let families: { id: number; name: string }[] = [];
  let orgs: { id: number; name: string }[] = [];

  if (isLoggedIn) {
    [locations, races, families, orgs] = await Promise.all([
      prisma.entity.findMany({ 
        where: { type: 'Location' }, 
        orderBy: { name: 'asc' }, 
        select: { id: true, name: true } 
      }),
      prisma.entity.findMany({ 
        where: { type: 'Race' }, 
        orderBy: { name: 'asc' }, 
        select: { id: true, name: true } 
      }),
      prisma.entity.findMany({ 
        where: { type: 'Family' }, 
        orderBy: { name: 'asc' }, 
        select: { id: true, name: true } 
      }),
      prisma.entity.findMany({ 
        where: { type: 'Organisation' }, 
        orderBy: { name: 'asc' }, 
        select: { id: true, name: true } 
      }),
    ]);
  }

  // 4. HELPER: EXTRACT NAMES
  const getJoinedNames = (list: any[], key: string) => {
    if (!list || !Array.isArray(list)) return null;
    return list
      .map((item) => item[key]?.entity?.name)
      .filter(Boolean)
      .join(', ');
  };

  const renderAttributes = () => {
    switch (entity.type) {
      case 'Character':
        return (
          <>
            <Attribute label="Role" value={entity.character?.role || "NPC"} />
            <Attribute label="Title/Class" value={entity.character?.title} />
            <Attribute label="Age" value={entity.character?.age} />
            <Attribute label="Race" value={entity.character?.race?.entity?.name} />
            <Attribute label="Family" value={getJoinedNames(entity.character?.families || [], 'family')} />
            <Attribute label="Organisation" value={getJoinedNames(entity.character?.organisations || [], 'organisation')} />
            {entity.character?.is_dead && <Attribute label="Status" value="💀 Deceased" />}
          </>
        );
      case 'Location':
        return (
          <>
            <Attribute label="Parent Location" value={entity.parent?.name} />
            {entity.location?.is_destroyed && <Attribute label="Status" value="🔥 Destroyed" />}
          </>
        );
      case 'Organisation':
        return (
          <>
            <Attribute label="Members" value={entity.organisation?.members?.length || 0} />
            {entity.organisation?.is_defunct && <Attribute label="Status" value="❌ Defunct" />}
          </>
        );
      case 'Family':
        return (
          <>
            <Attribute label="Members" value={entity.family?.members?.length || 0} />
            {entity.family?.is_extinct && <Attribute label="Status" value="⚰️ Extinct" />}
          </>
        );
      case 'Race':
        return (
           <>
            {entity.race?.is_extinct && <Attribute label="Status" value="⚰️ Extinct" />}
           </>
        );
      case 'Note':
        return <Attribute label="Category" value={entity.note?.type} />;
      default:
        return null;
    }
  };

  // --- MEMBER LIST LOGIC ---
  const members = entity.type === 'Organisation' 
    ? entity.organisation?.members 
    : entity.type === 'Family' 
    ? entity.family?.members 
    : null;

  return (
    <EntityEditableBlock 
      entity={entity} 
      isLoggedIn={isLoggedIn}
      lists={{ locations, races, families, orgs }}
    >
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

           {/* ACTION BUTTONS */}
           {isLoggedIn && (
            <div className="flex items-center space-x-2">
               <FeatureButton id={entity.id} isFeatured={entity.is_featured} />
               <EditButton className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" />
               <DeleteButton id={entity.id} action={deleteEntity} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" />
            </div>
           )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Main Entry Text */}
            {entity.entry && (
               <div className="prose prose-slate max-w-none text-slate-800 bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                 <RichTextRenderer content={entity.entry} />
               </div>
            )}

            {/* MEMBERS LIST (Compact Grid) */}
            {members && members.length > 0 && (
              <div className="space-y-3">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center">
                   Members 
                   <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                     {members.length}
                   </span>
                 </h3>
                 <div className="grid grid-cols-3 gap-2">
                   {members.map((m: any) => {
                     const char = m.character?.entity;
                     if (!char) return null;
                     return (
                       <Link 
                         key={m.id} 
                         href={`/entity/${char.id}`}
                         className="group block bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                       >
                         {/* IMAGE (Square) */}
                         <div className="aspect-square bg-slate-100 relative">
                            {char.image_uuid ? (
                              <img 
                                src={`/gallery/${char.image_uuid}.${char.image_ext}`} 
                                alt={char.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                style={{
                                  objectPosition: `${char.focal_x || 50}% ${char.focal_y || 50}%`
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xl">
                                {char.name.charAt(0)}
                              </div>
                            )}
                         </div>
                         
                         {/* TEXT FOOTER */}
                         <div className="p-2 border-t border-slate-100">
                           <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600">
                             {char.name}
                           </p>
                           {m.role ? (
                             <p className="text-[10px] text-slate-500 truncate mt-0.5">{m.role}</p>
                           ) : (
                             <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Member</p>
                           )}
                         </div>
                       </Link>
                     );
                   })}
                 </div>
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
                        isLoggedIn={isLoggedIn}
                        isPrivate={post.is_private} 
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
                  className="w-full aspect-square rounded-lg object-cover bg-slate-100"
                  style={{
                    objectPosition: `${entity.focal_x || 50}% ${entity.focal_y || 50}%`
                  }}
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