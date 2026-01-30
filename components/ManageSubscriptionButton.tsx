'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ManageSubscriptionButton({ 
  className = "", 
  variant = "outline" 
}: { 
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}) {
  const [loading, setLoading] = useState(false)

  const handlePortal = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con Stripe')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'No se pudo abrir el portal de facturación')
      setLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handlePortal} 
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirigiendo...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Gestionar Suscripción
        </>
      )}
    </Button>
  )
}
