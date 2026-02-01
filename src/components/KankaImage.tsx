'use client';

interface KankaImageProps {
  uuid: string;
  ext: string | null;
  alt: string;
}

export default function KankaImage({ uuid, ext, alt }: KankaImageProps) {
  // If there's no image or extension, don't render anything
  if (!uuid || !ext) return null;

  return (
    <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
      <img
        src={`/gallery/${uuid}.${ext}`}
        alt={alt}
        loading="lazy"
        className="w-full h-auto block"
      />
    </div>
  );
}