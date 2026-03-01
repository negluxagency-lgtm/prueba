'use client'

import React, { useState, useEffect } from 'react'
import { X, User, Phone, Mail, CheckCircle2, Download, Loader2, FileText } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'
import { cn } from '@/lib/utils'

interface InvoiceModalProps {
    isOpen: boolean
    onClose: () => void
    appointment: any
    shopData: {
        name: string
        address?: string
        phone?: string
        email?: string
        cif?: string
    }
    onUpdateCIF?: (cif: string) => Promise<void>
}

export function InvoiceModal({ isOpen, onClose, appointment, shopData, onUpdateCIF }: InvoiceModalProps) {
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        email: ''
    })
    const [shopCIF, setShopCIF] = useState('')
    const [isConfirmed, setIsConfirmed] = useState(false)

    useEffect(() => {
        if (appointment) {
            setClientData({
                name: appointment.Nombre || '',
                phone: String(appointment.Telefono || ''),
                email: ''
            })
            setShopCIF(shopData.cif || '')
            setIsConfirmed(false)
        }
    }, [appointment, isOpen, shopData.cif])

    if (!isOpen || !appointment) return null

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-800/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <FileText className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Generar Factura</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Servicio: {appointment.servicio}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {!isConfirmed ? (
                        <>
                            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                Confirma o edita los datos del cliente para la factura. Estos datos aparecerán en el documento final.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nombre Completo</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={clientData.name}
                                            onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                                            placeholder="Nombre del cliente"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Teléfono</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={clientData.phone}
                                            onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                                            placeholder="Teléfono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email (Opcional)</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                        <input
                                            type="email"
                                            value={clientData.email}
                                            onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1">CIF/NIF de tu Barbería (Se guardará para siempre)</label>
                                    <input
                                        type="text"
                                        value={shopCIF}
                                        onChange={(e) => setShopCIF(e.target.value.toUpperCase())}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                                        placeholder="Ej: B12345678"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        if (onUpdateCIF && shopCIF !== shopData.cif) {
                                            onUpdateCIF(shopCIF);
                                        }
                                        setIsConfirmed(true);
                                    }}
                                    className="w-full bg-white text-black font-black uppercase text-xs tracking-[0.15em] py-4 rounded-2xl hover:bg-amber-500 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 group"
                                >
                                    <span>Los datos son correctos</span>
                                    <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center border border-green-500/20 mx-auto mb-2">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div>
                                <h4 className="text-white text-xl font-black uppercase italic italic">¡Datos Confirmados!</h4>
                                <p className="text-zinc-500 text-sm font-medium mt-1 px-4">Haz clic abajo para descargar la factura oficial en PDF.</p>
                            </div>

                            <div className="space-y-3">
                                <PDFDownloadLink
                                    document={
                                        <InvoicePDF
                                            data={{
                                                shopName: shopData.name,
                                                shopAddress: shopData.address,
                                                shopPhone: shopData.phone,
                                                shopEmail: shopData.email,
                                                shopCIF: shopCIF,
                                                invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                                                date: appointment.Dia.split('-').reverse().join('/'),
                                                clientName: clientData.name,
                                                clientPhone: clientData.phone,
                                                clientEmail: clientData.email,
                                                serviceName: appointment.servicio,
                                                price: Number(appointment.Precio) || 0,
                                                timestamp: new Date().toLocaleString('es-ES'),
                                                creationTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                            }}
                                        />
                                    }
                                    fileName={`Factura_${clientData.name.replace(/\s+/g, '_')}_${appointment.Dia}.pdf`}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                                        "bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/20"
                                    )}
                                >
                                    {({ loading }) => (
                                        <>
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                            <span>{loading ? 'Preparando...' : 'Descargar Factura PDF'}</span>
                                        </>
                                    )}
                                </PDFDownloadLink>

                                <button
                                    onClick={() => setIsConfirmed(false)}
                                    className="w-full py-3 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                                >
                                    Volver a editar datos
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
