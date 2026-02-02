'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  initialImage?: string | null;
  initialX?: number;
  initialY?: number;
}

export default function ImageUploader({ initialImage, initialX = 50, initialY = 50 }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [focalPoint, setFocalPoint] = useState({ x: initialX, y: initialY });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFocalPoint({ x: 50, y: 50 }); 
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setFocalPoint({ x: Math.round(x), y: Math.round(y) });
  };

  return (
    <div className="space-y-4 border border-slate-200 p-4 rounded-md bg-slate-50">
      <h3 className="text-sm font-medium text-slate-700">Entity Image & Focal Point</h3>
      
      <input 
        type="file" 
        name="image_file" 
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {preview && (
        <div className="relative inline-block border border-slate-300 rounded-lg overflow-hidden group cursor-crosshair bg-slate-200">
          <img 
            ref={imageRef}
            src={preview} 
            alt="Preview" 
            onClick={handleImageClick}
            className="max-h-80 object-contain block"
          />
          <div 
            className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-sm transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            Click to set focal point
          </div>
        </div>
      )}

      <input type="hidden" name="focal_x" value={focalPoint.x} />
      <input type="hidden" name="focal_y" value={focalPoint.y} />
    </div>
  );
}