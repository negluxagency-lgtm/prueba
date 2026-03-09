'use client'

import { useState } from 'react'
import { X, Copy, Check, Link2, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AppointmentLinkModalProps {
    uuid: string
    onClose: () => void
}

export function AppointmentLinkModal({ uuid, onClose }: AppointmentLinkModalProps) {
    const [copied, setCopied] = useState(false)
    const link = `https://app.nelux.es/cita/${uuid}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch {
            // Fallback for older browsers
            const ta = document.createElement('textarea')
            ta.value = link
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        }
    }

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 16 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-7 w-full max-w-md shadow-2xl relative"
                >
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-500/20">
                        <Link2 className="w-7 h-7 text-amber-500" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">
                        Enlace de Gestión
                    </h2>
                    <p className="text-zinc-500 text-xs mb-6 leading-relaxed">
                        Comparte este enlace con tu cliente para que pueda cancelar o gestionar su cita. <span className="text-amber-500/80 font-bold">Caduca automáticamente tras la fecha de la cita.</span>
                    </p>

                    {/* Link display */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-4 flex items-center gap-2 group">
                        <span className="flex-1 text-zinc-300 text-xs font-mono truncate">{link}</span>
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white shrink-0"
                            title="Abrir enlace"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    {/* Copy Button & Open Link */}
                    <div className="flex flex-col gap-2 w-full">
                        <button
                            onClick={handleCopy}
                            className={`
                                w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]
                                ${copied
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                                }
                            `}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    ¡Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copiar Enlace
                                </>
                            )}
                        </button>
                        
                        <a 
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 rounded-xl font-black text-black bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20 text-sm uppercase tracking-wide flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Guardar en una nueva pestaña
                        </a>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
