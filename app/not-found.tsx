import Link from 'next/link'
import { ArrowLeft, Scissors } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col items-center justify-center p-6 selection:bg-amber-500/30">
            <div className="relative w-full max-w-md text-center">
                
                {/* Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Scissors size={40} className="text-amber-500 -rotate-45" />
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-rose-500 mb-4 tracking-tighter">
                        404
                    </h1>
                    
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Parece que te has perdido</h2>
                    
                    <p className="text-zinc-400 mb-10 max-w-sm">
                        La página que buscas no existe o ha sido movida. Al igual que con un mal corte de pelo, a veces hay que empezar de nuevo.
                    </p>

                    <Link 
                        href="/" 
                        className="group flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-amber-500/50 px-6 py-3 rounded-xl transition-all font-medium active:scale-95"
                    >
                        <ArrowLeft size={18} className="text-zinc-400 group-hover:text-amber-500 transition-colors group-hover:-translate-x-1" />
                        <span>Volver a la portada</span>
                    </Link>
                </div>

            </div>
        </div>
    )
}
