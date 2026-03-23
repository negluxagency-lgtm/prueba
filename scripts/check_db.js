const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

async function run() {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/servicios?select=*&limit=1`, { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY } });
    const data = await res.json();
    console.log("servicios data:", data);

    const res2 = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/barberos?select=*&limit=1`, { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY } });
    const data2 = await res2.json();
    console.log("barberos data:", data2);
    
    const req4 = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pg_trigger?select=*`, {
        method: 'GET',
        headers: { 
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    console.log("pg_trigger status:", req4.status);
    console.log("pg_trigger error:", await req4.text());
}

run();
