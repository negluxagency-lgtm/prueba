const { createClient } = require('@supabase/supabase-js');

async function verifyMetrics() {
    const supabase = createClient('https://liyoivvgmtkzyttrlotk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeW9pdnZnbXRrenl0dHJsb3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE2NjE2MSwiZXhwIjoyMDgzNzQyMTYxfQ.2_xfq6aHiAk_He24w6PVSgTS-eNWxkiV6gjqalRctTY');
    
    const barberia_id = 'a26a0490-621b-43fe-b0e6-dd73f49632f2';
    const mes = '2026-02';

    console.log('--- METRICAS MENSUALES ---');
    const { data: mensual, error: errM } = await supabase
        .from('metricas_mensuales')
        .select('*')
        .eq('barberia_id', barberia_id)
        .eq('mes', mes)
        .single();
    
    if (errM) console.error(errM);
    else console.log(JSON.stringify(mensual, null, 2));

    console.log('\n--- METRICAS DIARIAS (Sample) ---');
    const { data: diarias, error: errD } = await supabase
        .from('metricas_diarias')
        .select('dia, no_shows')
        .eq('barberia_id', barberia_id)
        .gte('dia', `${mes}-01`)
        .lte('dia', `${mes}-28`)
        .limit(10);
    
    if (errD) console.error(errD);
    else console.log(JSON.stringify(diarias, null, 2));
}

verifyMetrics();
