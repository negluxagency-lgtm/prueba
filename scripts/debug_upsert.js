const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
    console.log("--- INICIANDO DIAGNÓSTICO DE TRIGGERS ---");

    // 1. Obtener un ID de usuario real
    const userRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?select=id&limit=1`, {
        headers: { 'apikey': SERVICE_KEY }
    });
    const users = await userRes.json();
    if (!users.length) {
        console.error("No se encontraron usuarios en 'perfiles' para probar.");
        return;
    }
    const userId = users[0].id;
    console.log(`Usando userId de prueba: ${userId}`);

    const tables = ['perfiles', 'barberos', 'servicios'];
    
    for (const table of tables) {
        console.log(`\nProbando UPSERT en tabla: ${table}...`);
        
        let payload = { id: userId }; // perfiles solo necesita el id para upsert
        if (table === 'barberos') {
            payload = { barberia_id: userId, nombre: 'Test Barber Trigger' };
        } else if (table === 'servicios') {
            payload = { barberia_id: userId, nombre: 'Test Service Trigger', precio: 10, duracion: 30 };
        }

        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
        });

        const status = res.status;
        const text = await res.text();
        
        if (status >= 200 && status < 300) {
            console.log(`[OK] Tabla '${table}' funciona correctamente.`);
        } else {
            console.log(`[ERROR] Tabla '${table}' falló con estado ${status}:`);
            console.log(text);
        }
    }
}

run().catch(console.error);
