'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageCropperDialog } from './ImageCropperDialog';
import { getCroppedImg } from '@/utils/cropImage';

interface BannerUploadProps {
    currentImageUrl?: string | null;
    onFileSelect: (file: File | null) => void;
    loading?: boolean;
    className?: string;
}

export function BannerUpload({ currentImageUrl, onFileSelect, loading, className }: BannerUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uncroppedUrl, setUncroppedUrl] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!previewUrl && currentImageUrl) {
            setPreviewUrl(currentImageUrl);
        }
    }, [currentImageUrl, previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 8MB');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setUncroppedUrl(objectUrl);
        setIsCropperOpen(true);
        // We delay calling onFileSelect and setting previewUrl until crop is confirmed
    };

    const handleCropComplete = async (croppedAreaPixels: any) => {
        try {
            if (!uncroppedUrl) return;
            const croppedFile = await getCroppedImg(uncroppedUrl, croppedAreaPixels);
            
            if (croppedFile) {
                const objectUrl = URL.createObjectURL(croppedFile);
                setPreviewUrl(objectUrl);
                onFileSelect(croppedFile);
                setIsCropperOpen(false);
            }
        } catch (e) {
            console.error(e);
            toast.error('Error al recortar la imagen');
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={cn('flex flex-col gap-2 w-full', className)}>
            <div
                onClick={() => !loading && fileInputRef.current?.click()}
                className={cn(
                    'relative w-full h-36 rounded-2xl border-2 border-dashed border-zinc-700 overflow-hidden cursor-pointer group transition-all',
                    'hover:border-amber-500/60',
                    loading ? 'opacity-50 pointer-events-none' : ''
                )}
            >
                {/* Background / Preview */}
                <div className="absolute inset-0 bg-zinc-800/60 flex items-center justify-center">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-amber-500/70 transition-colors">
                            <ImagePlus className="w-8 h-8" />
                            <span className="text-xs font-bold uppercase tracking-widest">Subir Banner</span>
                            <span className="text-[10px] text-zinc-600">Recomendado: 1200×400px · Máx. 8MB</span>
                        </div>
                    )}
                </div>

                {/* Hover overlay */}
                {previewUrl && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="flex flex-col items-center gap-2 text-white">
                            <ImagePlus className="w-7 h-7" />
                            <span className="text-xs font-bold uppercase tracking-widest">Cambiar Banner</span>
                        </div>
                    </div>
                )}

                {/* Loader */}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                )}
            </div>

            {/* Remove button */}
            {previewUrl && previewUrl !== currentImageUrl && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="self-start text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-950/20 px-2 py-0.5 rounded-full"
                >
                    <X className="w-3 h-3" /> Eliminar cambio
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {/* Modal de recorte */}
            {uncroppedUrl && (
                <ImageCropperDialog
                    isOpen={isCropperOpen}
                    imageSrc={uncroppedUrl}
                    onClose={() => setIsCropperOpen(false)}
                    onCropComplete={handleCropComplete}
                    aspectRatio={3 / 1} // Banner aspect ratio (apaisado)
                />
            )}
        </div>
    );
}
