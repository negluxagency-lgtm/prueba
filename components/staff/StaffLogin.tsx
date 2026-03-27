'use client'

import React, { useState } from 'react'
import { StaffBarber } from './StaffApp'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowLeft, Check, X, Loader2, Camera, Upload } from 'lucide-react'
import { setBarberPin, updateBarberPhoto, verifyBarberPin } from '@/app/actions/staff'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StaffLoginProps {
    shopData: { id: string, nombre_barberia: string, logo_url?: string }
    barbers: StaffBarber[]
    onLoginSuccess: (barber: StaffBarber) => void
}

export default function StaffLogin({ shopData, barbers, onLoginSuccess }: StaffLoginProps) {
    const [selectedBarber, setSelectedBarber] = useState<StaffBarber | null>(null)
    const [pinEntry, setPinEntry] = useState<string>('')
    const [isCreatingPin, setIsCreatingPin] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const [showPhotoModal, setShowPhotoModal] = useState(false)

    const handleSelectBarber = (barber: StaffBarber) => {
        setSelectedBarber(barber)
        setPinEntry('')
        setErrorMsg('')
        setIsCreatingPin(!barber.hasPin) // If no pin exists in DB (hasPin is false), they must create it
    }

    const handleNumberClick = (num: number) => {
        if (pinEntry.length < 4) {
            setPinEntry(prev => prev + num.toString())
            setErrorMsg('')
        }
    }

    const handleDeleteClick = () => {
        setPinEntry(prev => prev.slice(0, -1))
        setErrorMsg('')
    }

    const clearSelection = () => {
        setSelectedBarber(null)
        setPinEntry('')
        setErrorMsg('')
    }

    // Effect to auto-verify when 4 digits are entered
    React.useEffect(() => {
        if (pinEntry.length === 4 && selectedBarber) {
            if (isCreatingPin) {
                // Let user press standard 'Check' button to confirm creation to avoid accidental saves
            } else {
                // Verify PIN
                verifyPin()
            }
        }
    }, [pinEntry])

    const verifyPin = async () => {
        if (!selectedBarber) return

        setIsSubmitting(true)
        setErrorMsg('')

        console.log('[StaffLogin] Verifying PIN via Server Action...')

        try {
            const result = await verifyBarberPin(selectedBarber.id, pinEntry)

            if (result.success) {
                console.log('[StaffLogin] PIN Match! Logging in...')
                onLoginSuccess(selectedBarber)
            } else {
                console.warn('[StaffLogin] PIN Mismatch:', result.error)
                setErrorMsg(result.error || 'PIN incorrecto. Inténtalo de nuevo.')
                setPinEntry('')
            }
        } catch (error) {
            console.error('[StaffLogin] Error verifying pin:', error)
            setErrorMsg('Error de conexión al verificar el PIN.')
            setPinEntry('')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const uploadPhoto = async (barberId: string): Promise<string | null> => {
        if (!photoFile) return null

        setIsUploadingPhoto(true)
        try {
            const fileExt = photoFile.name.split('.').pop()
            const fileName = `barber_${barberId}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('foto_barberos')
                .upload(filePath, photoFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('foto_barberos')
                .getPublicUrl(filePath)

            await updateBarberPhoto(barberId, publicUrl)
            return publicUrl
        } catch (error) {
            console.error('Error uploading photo:', error)
            toast.error('Error al subir la foto')
            return null
        } finally {
            setIsUploadingPhoto(false)
        }
    }

    const createPin = async () => {
        if (!selectedBarber || pinEntry.length !== 4) return

        setIsSubmitting(true)
        setErrorMsg('')

        try {
            const result = await setBarberPin(selectedBarber.id, pinEntry)
            if (result.success) {
                setShowPhotoModal(true)
            } else {
                setErrorMsg(result.error || 'Error al guardar el PIN')
                setPinEntry('')
            }
        } catch (err) {
            setErrorMsg('Error de conexión')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFinalize = async () => {
        if (!selectedBarber || !photoFile) return

        const photoUrl = await uploadPhoto(selectedBarber.id)
        if (photoUrl) {
            toast.success('Perfil configurado correctamente')
            const updatedBarber = {
                ...selectedBarber,
                hasPin: true,
                foto: photoUrl
            }
            onLoginSuccess(updatedBarber)
        }
    }

    // Numpad Array
    const numpad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'delete', 0, 'go']

    return (
        <div className="min-h-screen flex flex-col pt-12 md:pt-20 px-4 max-w-xl mx-auto items-center">
            {/* Header */}
            {!selectedBarber && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center w-full mb-10"
                >
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-[2rem] bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center mb-6 overflow-hidden">
                        {shopData.logo_url ? (
                            <img src={shopData.logo_url} alt={shopData.nombre_barberia} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-black text-amber-500">{shopData.nombre_barberia.charAt(0)}</span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-2">Portal <span className="text-amber-500">Staff</span></h1>
                    <p className="text-zinc-500 font-medium">Selecciona tu perfil para acceder</p>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {!selectedBarber ? (
                    /* Barber Selection Grid */
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full"
                    >
                        {barbers.map(barber => (
                            <button
                                key={barber.id}
                                onClick={() => handleSelectBarber(barber)}
                                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-amber-500/5 active:scale-95 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex items-center justify-center mb-2 group-hover:border-amber-500 transition-colors text-xl font-black text-zinc-500 group-hover:text-amber-500">
                                    {barber.foto ? (
                                        <img src={barber.foto} alt={barber.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        barber.nombre.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <span className="font-bold text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{barber.nombre}</span>
                            </button>
                        ))}
                    </motion.div>
                ) : (
                    /* PIN Pad View */
                    <motion.div
                        key="numpad"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-sm flex flex-col items-center mt-4"
                    >
                        <button
                            onClick={clearSelection}
                            className="absolute top-6 left-6 p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>

                        <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-zinc-800 overflow-hidden flex items-center justify-center mb-4 text-3xl font-black text-zinc-500 relative group/photo">
                            {selectedBarber.foto ? (
                                <img src={selectedBarber.foto} alt={selectedBarber.nombre} className="w-full h-full object-cover" />
                            ) : (
                                selectedBarber.nombre.charAt(0).toUpperCase()
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{selectedBarber.nombre}</h2>

                        <div className="flex items-center gap-2 mb-8 text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm font-bold tracking-widest uppercase">
                                {isCreatingPin ? 'Crea un nuevo PIN (4 dígitos)' : 'Introduce tu PIN'}
                            </span>
                        </div>

                        {/* PIN Dots */}
                        <div className="flex justify-center gap-4 mb-10 w-full px-8">
                            {[0, 1, 2, 3].map((index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "w-5 h-5 rounded-full transition-all duration-300",
                                        pinEntry.length > index
                                            ? "bg-amber-500 scale-125 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                            : "bg-zinc-800 border border-zinc-700"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Error Message Container */}
                        <div className="min-h-[80px] flex items-center justify-center w-full px-4 mb-2">
                            <AnimatePresence mode="wait">
                                {errorMsg && (
                                    <motion.p
                                        key="error"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-red-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-center leading-relaxed"
                                    >
                                        {errorMsg}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
                            {numpad.map((key, i) => (
                                <button
                                    key={i}
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        if (key === 'delete') handleDeleteClick()
                                        else if (key === 'go') {
                                            if (isCreatingPin) createPin()
                                            else verifyPin()
                                        }
                                        else handleNumberClick(key as number)
                                    }}
                                    className={cn(
                                        "h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black transition-all active:scale-90",
                                        typeof key === 'number' ? "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white" : "",
                                        key === 'delete' ? "text-zinc-500 hover:text-red-500 bg-transparent" : "",
                                        key === 'go' && isCreatingPin ? "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_10px_20px_rgba(245,158,11,0.3)] disabled:opacity-50" : "",
                                        key === 'go' && !isCreatingPin ? "opacity-0 pointer-events-none" : "" // Hide 'go' if not creating, auto-verify handles it
                                    )}
                                >
                                    {key === 'delete' && <X className="w-8 h-8" />}
                                    {key === 'go' && !isSubmitting && <Check className="w-8 h-8" />}
                                    {key === 'go' && isSubmitting && <Loader2 className="w-6 h-6 animate-spin" />}
                                    {typeof key === 'number' && key}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Photo Upload Modal */}
            <AnimatePresence>
                {showPhotoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] w-full max-w-sm text-center shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Camera className="w-10 h-10 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">¡PIN Configurado!</h3>
                            <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed">Para completar tu perfil, selecciona una foto profesional para que tus clientes te reconozcan.</p>

                            <div className="flex flex-col gap-6">
                                <div className="relative group mx-auto">
                                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden bg-black/40 group-hover:border-amber-500/50 transition-colors">
                                        {photoPreview ? (
                                            <img src={photoPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>

                                <button
                                    onClick={handleFinalize}
                                    disabled={!photoFile || isUploadingPhoto}
                                    className="w-full bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/10"
                                >
                                    {isUploadingPhoto ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Finalizar Registro <Check className="w-5 h-5" /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
