import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Point {
    x: number
    y: number
}

interface Area {
    width: number
    height: number
    x: number
    y: number
}

interface ImageCropperDialogProps {
    isOpen: boolean
    imageSrc: string
    onClose: () => void
    onCropComplete: (croppedAreaPixels: Area) => void
    aspectRatio?: number
}

export function ImageCropperDialog({
    isOpen,
    imageSrc,
    onClose,
    onCropComplete,
    aspectRatio = 3 / 1 // Banner panorámico por defecto
}: ImageCropperDialogProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels)
    }, [])

    const handleConfirm = () => {
        if (croppedAreaPixels) {
            onCropComplete(croppedAreaPixels)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Recortar Banner
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cropper Container */}
                        <div className="relative w-full h-[400px] sm:h-[500px] bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropCompleteInternal}
                                onZoomChange={setZoom}
                                classes={{
                                    containerClassName: 'w-full h-full'
                                }}
                            />
                        </div>

                        {/* Controls & Actions */}
                        <div className="p-5 bg-zinc-950 border-t border-zinc-800 space-y-6">
                            
                            {/* Zoom Slider */}
                            <div className="flex items-center gap-4 px-2">
                                <ZoomOut className="w-5 h-5 text-zinc-500" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <ZoomIn className="w-5 h-5 text-zinc-500" />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-5 py-2.5 rounded-xl font-black text-sm bg-amber-500 text-black hover:bg-amber-400 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Check size={18} /> Aplicar Recorte
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
