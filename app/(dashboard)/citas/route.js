import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const citaDeWhatsapp = await request.json();
    
    // Esto aparecerá en la terminal de tu VS Code (tu ordenador)
    console.log("¡BOOM! Cita recibida desde el VPS:", citaDeWhatsapp);

    // Aquí es donde más adelante la guardarás en tu base de datos
    return NextResponse.json({ 
        status: "success", 
        message: "Cita recibida en localhost" 
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}