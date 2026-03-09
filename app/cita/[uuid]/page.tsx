import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import CancelButton from './CancelButton'
import EditDateButton from './EditDateButton'
import { Calendar, Clock, Scissors, User, AlertCircle, XCircle } from 'lucide-react'
import { getProxiedUrl } from '@/utils/url-helper'

interface PageProps {
    params: Promise<{ uuid: string }>
}

export default async function CitaPage(props: PageProps) {
    const { uuid } = await props.params

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: cita, error } = await supabase
        .from('citas')
        .select('id, Nombre, Dia, Hora, servicio, barbero, Precio, cancelada, confirmada, uuid, barberia_id')
        .eq('uuid', uuid)
        .single()

    if (error || !cita) notFound()

    // Fetch shop name and logo
    const { data: shop } = await supabase
        .from('perfiles')
        .select('nombre_barberia, logo_url')
        .eq('id', cita.barberia_id)
        .single()

    const shopName = shop?.nombre_barberia || 'la barbería'
    const shopLogo = shop?.logo_url ? getProxiedUrl(shop.logo_url) : null

    const today = new Date().toISOString().split('T')[0]
    const isExpired = cita.Dia < today
    const isCancelled = !!cita.cancelada

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.04),transparent_60%)] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-7 shadow-2xl">

                    {isExpired && !isCancelled && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
                                <AlertCircle className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Enlace Caducado</h1>
                            <p className="text-zinc-500 text-sm">Este enlace estaba vinculado a una cita que ya ha pasado.</p>
                        </div>
                    )}

                    {isCancelled && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                                <XCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Cita Cancelada</h1>
                            <p className="text-zinc-500 text-sm">Esta cita ya fue cancelada. Contacta con la barbería para nueva reserva.</p>
                        </div>
                    )}

                    {!isExpired && !isCancelled && (
                        <>
                            {shopLogo && (
                                <div className="flex justify-center mb-6">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl bg-zinc-900">
                                        <img 
                                            src={shopLogo} 
                                            alt={shopName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2 leading-tight">
                                Tu cita con <span className="text-amber-500">{shopName}</span>
                            </h1>
                            <p className="text-zinc-500 text-xs mb-6">Gestiona tu reserva a continuación.</p>

                            <div className="space-y-3 mb-7">
                                {cita.Nombre && (
                                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                                        <User className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <span className="text-white text-sm font-bold">{cita.Nombre}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                                    <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span className="text-white text-sm font-bold capitalize">{formatDate(cita.Dia)}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span className="text-white text-sm font-bold">{cita.Hora?.substring(0, 5)}</span>
                                </div>
                                {cita.servicio && (
                                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                                        <Scissors className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <span className="text-white text-sm font-bold">{cita.servicio}</span>
                                    </div>
                                )}
                                {cita.barbero && (
                                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                                        <User className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <span className="text-zinc-300 text-sm">Barbero: <span className="font-bold text-white">{cita.barbero}</span></span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <EditDateButton uuid={uuid} currentDia={cita.Dia} currentHora={cita.Hora} />
                                <CancelButton uuid={uuid} />
                            </div>

                            <p className="text-center text-zinc-700 text-[10px] mt-6">
                                Al cambiar la fecha, la cita quedará pendiente de confirmación.
                            </p>
                        </>
                    )}
                </div>

                <p className="text-center text-zinc-800 text-[9px] mt-6 tracking-widest uppercase">
                    Powered by Nelux · app.nelux.es
                </p>
            </div>
        </div>
    )
}

export async function generateMetadata(props: PageProps) {
    const { uuid } = await props.params
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: cita } = await supabase.from('citas').select('barberia_id').eq('uuid', uuid).single()
    const { data: shop } = cita ? await supabase.from('perfiles').select('nombre_barberia').eq('id', cita.barberia_id).single() : { data: null }

    const shopName = shop?.nombre_barberia || 'Barbería'

    return {
        title: `Cita con ${shopName} · Nelux`,
        description: `Consulta y gestiona tu reserva en ${shopName}.`,
        robots: 'noindex'
    }
}
