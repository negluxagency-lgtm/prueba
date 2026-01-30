import os

def create_stripe_portal_features():
    base_dir = os.getcwd()
    
    # 1. API Route Content
    api_route_content = """import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia', // Using latest as per best practice or user config
})

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stripe_customer_id from DB
    const { data: profile, error: profileError } = await supabase
      .from('perfiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found or customer ID missing' },
        { status: 404 }
      )
    }

    // Create Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Portal Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
"""

    # 2. Component Content
    component_content = """'use client'

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
"""

    # Define paths
    # Note: Assuming src directory exists based on previous task context
    api_path = os.path.join(base_dir, 'src', 'app', 'api', 'stripe', 'create-portal', 'route.ts')
    if not os.path.exists(os.path.join(base_dir, 'src')):
         api_path = os.path.join(base_dir, 'app', 'api', 'stripe', 'create-portal', 'route.ts')
         
    component_path = os.path.join(base_dir, 'components', 'ManageSubscriptionButton.tsx')
    if os.path.exists(os.path.join(base_dir, 'src')):
         component_path = os.path.join(base_dir, 'src', 'components', 'ManageSubscriptionButton.tsx')

    # Create directories
    os.makedirs(os.path.dirname(api_path), exist_ok=True)
    os.makedirs(os.path.dirname(component_path), exist_ok=True)

    # Write API Route
    with open(api_path, 'w', encoding='utf-8') as f:
        f.write(api_route_content)
    print(f"Created API Route: {api_path}")

    # Write Component
    with open(component_path, 'w', encoding='utf-8') as f:
        f.write(component_content)
    print(f"Created Component: {component_path}")

if __name__ == "__main__":
    create_stripe_portal_features()
