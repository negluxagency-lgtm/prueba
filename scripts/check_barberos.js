const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envMap = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
        envMap[key.trim()] = value.join('=').trim();
    }
});

async function checkBarberos() {
    const supabase = createClient(
        envMap.NEXT_PUBLIC_SUPABASE_URL,
        envMap.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile, error: pError } = await supabase
        .from('perfiles')
        .select('*')
        .limit(1);

    if (pError) {
        console.error('Error fetching one profile:', pError);
    } else if (profile && profile.length > 0) {
        console.log('Sample PROFILE Row Keys:', Object.keys(profile[0]));
    }

    const { data, error } = await supabase
        .from('barberos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching one barber:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample BARBER Row Keys:', Object.keys(data[0]));
    } else {
        console.log('No barbers found in the entire table.');
    }
}

checkBarberos();
