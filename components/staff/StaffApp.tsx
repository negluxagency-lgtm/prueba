'use client'

import React, { useState, useEffect } from 'react'
import StaffLogin from './StaffLogin'
import StaffDashboard from './StaffDashboard'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

// Define the Barber type based on the fetch in page.tsx
export interface StaffBarber {
    id: string
    nombre: string
    hasPin?: boolean
    foto?: string // URL string
    horario_semanal?: any // JSONB schedule
}

interface StaffAppProps {
    shopData: {
        id: string
        nombre_barberia: string
        logo_url?: string
        'CIF/NIF'?: string
        Direccion?: string
        telefono?: string
        correo?: string
        plan?: string
    }
    barbers: StaffBarber[]
    slug: string
}

export default function StaffApp({ shopData, barbers, slug }: StaffAppProps) {
    // Use lazy initialization for state to avoid hydration mismatch if possible, 
    // or just default to null and let the effect set it immediately.
    const [authenticatedBarber, setAuthenticatedBarber] = useState<StaffBarber | null>(null)

    useEffect(() => {
        // Hydrate from localStorage on mount
        const storedBarberId = localStorage.getItem(`staff_auth_${slug}`)
        if (storedBarberId) {
            const barber = barbers.find(b => b.id === storedBarberId)
            if (barber) {
                setAuthenticatedBarber(barber)
            } else {
                localStorage.removeItem(`staff_auth_${slug}`)
            }
        }
    }, [slug, barbers])

    const handleLoginSuccess = (barber: StaffBarber) => {
        localStorage.setItem(`staff_auth_${slug}`, barber.id)
        setAuthenticatedBarber(barber)
    }

    const handleLogout = () => {
        localStorage.removeItem(`staff_auth_${slug}`)
        setAuthenticatedBarber(null)
    }



    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
            <AnimatePresence mode="wait">
                {!authenticatedBarber ? (
                    <motion.div
                        key="login"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <StaffLogin
                            shopData={shopData}
                            barbers={barbers}
                            onLoginSuccess={handleLoginSuccess}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <StaffDashboard
                            shopData={shopData}
                            barber={authenticatedBarber}
                            onLogout={handleLogout}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
