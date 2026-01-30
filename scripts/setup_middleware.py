import os

def create_middleware():
    # Define content
    content = """import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This refreshes the auth token if expired
  await supabase.auth.getUser()

  return response
}
"""
    
    # Check for src directory
    base_dir = os.getcwd()
    has_src = os.path.isdir(os.path.join(base_dir, 'src'))
    
    if has_src:
        target_path = os.path.join(base_dir, 'src', 'utils', 'supabase', 'middleware.ts')
    else:
        target_path = os.path.join(base_dir, 'utils', 'supabase', 'middleware.ts')
        
    # Ensure directory exists
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    # Write file
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Successfully created middleware at: {target_path}")

if __name__ == "__main__":
    create_middleware()
