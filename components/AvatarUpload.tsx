import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AvatarUploadProps {
    currentImageUrl?: string | null;
    onFileSelect: (file: File | null) => void;
    className?: string;
    loading?: boolean;
}

export function AvatarUpload({ currentImageUrl, onFileSelect, className, loading }: AvatarUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial preview from current URL
    useEffect(() => {
        if (!previewUrl && currentImageUrl) {
            setPreviewUrl(currentImageUrl);
        }
    }, [currentImageUrl, previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: Max 5MB, Image only
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error('La imagen no debe superar los 5MB');
            return;
        }

        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        onFileSelect(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onFileSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerClick = () => {
        if (!loading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={cn("relative flex flex-col items-center gap-3", className)}>
            <div
                onClick={triggerClick}
                className={cn(
                    "relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-900 shadow-xl cursor-pointer group overflow-hidden transition-all",
                    "hover:border-amber-500/50 hover:scale-105 active:scale-95",
                    loading ? "opacity-50 pointer-events-none" : ""
                )}
            >
                {/* Background / Placeholder */}
                <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="w-12 h-12 text-zinc-600 group-hover:text-amber-500/50 transition-colors" />
                    )}
                </div>

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Logo de la Barbería
                </span>
                {previewUrl && previewUrl !== currentImageUrl && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-950/20 px-2 py-0.5 rounded-full"
                    >
                        <X className="w-3 h-3" /> Eliminar cambio
                    </button>
                )}
            </div>
        </div>
    );
}
