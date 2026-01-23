import Link from 'next/link'

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center shadow-2xl">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8 text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Enlace no válido</h1>
                <p className="text-zinc-400 mb-8">
                    El enlace de verificación ha caducado, ya ha sido usado o no es válido. Por favor, intenta registrarte o iniciar sesión de nuevo.
                </p>
                <Link
                    href="/inicio"
                    className="block w-full rounded-md bg-zinc-800 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                    Volver al Login
                </Link>
            </div>
        </div>
    )
}
