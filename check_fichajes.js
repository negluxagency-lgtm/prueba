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
    console.log("--- DIAGNÓSTICO DE FICHAJES_LOGS ---");

    // 1. Verificar registros actuales y el ID máximo
    const res = await fetch(`${SUPABASE_URL}/rest/v1/fichajes_logs?select=id&order=id.desc&limit=5`, {
        headers: { 'apikey': SERVICE_KEY }
    });
    const logs = await res.json();
    console.log("Últimos 5 IDs en fichajes_logs:", logs.map(l => l.id));

    if (logs.length > 0) {
        const maxId = logs[0].id;
        console.log(`ID máximo encontrado: ${maxId}`);
    } else {
        console.log("No hay registros en fichajes_logs.");
    }

    // 2. Intentar un insert de prueba para ver el error exacto y si podemos forzar un ID o ver qué pasa
    const testPayload = {
        barbero_id: 1, // Usamos un ID dummy si es entero, o UUID si es UUID
        tipo: 'entrada'
    };

    console.log("\nIntentando insert de prueba...");
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/fichajes_logs`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(testPayload)
    });

    console.log(`Estado: ${insertRes.status}`);
    const resultText = await insertRes.text();
    console.log("Resultado:", resultText);
}

run().catch(console.error);
