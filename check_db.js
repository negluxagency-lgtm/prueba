const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

async function run() {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${env.SUPABASE_SERVICE_ROLE_KEY}`);
    const data = await res.json();
    console.log("schema facturas:", JSON.stringify(data.definitions.facturas.properties, null, 2));
    console.log("schema emi:", JSON.stringify(data.definitions.facturas_emitidas.properties, null, 2));
}

run();
