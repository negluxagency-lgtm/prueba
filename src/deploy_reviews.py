import os

def materialize_files():
    base_dir = r"c:\Users\Usuario\nextjs\app\[slug]\review"
    os.makedirs(base_dir, exist_ok=True)
    
    # page.tsx
    page_content = """import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ReviewPageClient from './ReviewPageClient'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ReviewPage(props: PageProps) {
    const params = await props.params
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile, error } = await supabase
        .from('perfiles')
        .select('url_google, nombre_barberia')
        .eq('slug', params.slug)
        .single()

    if (error || !profile) {
        return notFound()
    }

    return (
        <ReviewPageClient 
            googleUrl={profile.url_google} 
            shopName={profile.nombre_barberia || 'la barbería'} 
        />
    )
}
"""

    client_content = """'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface ReviewPageClientProps {
    googleUrl: string | null
    shopName: string
}

export default function ReviewPageClient({ googleUrl, shopName }: ReviewPageClientProps) {
    const [rating, setRating] = useState<number>(0)
    const [hoverRating, setHoverRating] = useState<number>(0)
    const [submitted, setSubmitted] = useState<boolean>(false)

    const handleSubmit = () => {
        if (rating === 0) return

        if (rating >= 4 && googleUrl) {
            window.location.href = googleUrl
        } else {
            setSubmitted(true)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center selection:bg-amber-500/30">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
                    <h1 className="text-3xl font-black text-amber-500 mb-4">¡Gracias!</h1>
                    <p className="text-zinc-300">
                        Agradecemos tu valoración. Seguiremos trabajando duro para mejorar nuestro servicio y trato en {shopName}.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center selection:bg-amber-500/30">
            <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-10 rounded-2xl max-w-md w-full shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
                
                <h1 className="text-2xl md:text-3xl font-black mb-2">Valora tu experiencia</h1>
                <p className="text-zinc-400 mb-8 text-sm md:text-base">
                    ¿Qué te ha parecido el servicio y trato recibido en <strong className="text-white">{shopName}</strong>?
                </p>

                <div className="flex justify-center gap-2 mb-10">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star 
                                size={44} 
                                className={`transition-colors duration-200 ${(hoverRating || rating) >= star ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'}`} 
                            />
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                    Aceptar
                </button>
            </div>
        </div>
    )
}
"""

    with open(os.path.join(base_dir, "page.tsx"), "w", encoding="utf-8") as f:
        f.write(page_content)
    print("INFO: page.tsx materialized successfully.")

    with open(os.path.join(base_dir, "ReviewPageClient.tsx"), "w", encoding="utf-8") as f:
        f.write(client_content)
    print("INFO: ReviewPageClient.tsx materialized successfully.")

if __name__ == "__main__":
    print("Inicializando propulsores. Leyendo directiva feature_reviews...")
    materialize_files()
    print("Aterrizaje exitoso. Artefactos materializados.")
