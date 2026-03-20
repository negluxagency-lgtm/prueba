const { createClient } = require('@supabase/supabase-js');

async function checkCitas() {
    const supabase = createClient('https://liyoivvgmtkzyttrlotk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeW9pdnZnbXRrenl0dHJsb3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE2NjE2MSwiZXhwIjoyMDgzNzQyMTYxfQ.2_xfq6aHiAk_He24w6PVSgTS-eNWxkiV6gjqalRctTY');
    
    // Check column names and some sample data
    const { data, error } = await supabase.from('citas').select('*').limit(10);
    if (error) {
        console.error('Error fetching citas:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]));
        console.log('Sample cancelada statuses:', data.map(c => ({ dia: c.Dia, cancelada: c.cancelada, confirmada: c.confirmada })));
        
        const noShows = data.filter(c => c.cancelada === true);
        console.log('No-shows in sample:', noShows.length);
    } else {
        console.log('No data found in citas table');
    }
}

checkCitas();
