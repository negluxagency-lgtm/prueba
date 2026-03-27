import supabaseAdmin from '../lib/supabaseAdmin'

async function checkSchema() {
    console.log('--- Verificando esquema de tabla barberos ---')
    const { data, error } = await supabaseAdmin
        .from('barberos')
        .select('id, nombre, pin, intentos_fallidos, bloqueado_hasta')
        .limit(1)

    if (error) {
        console.error('Error detectado:', error.message)
        if (error.message.includes('bloqueado_hasta')) {
            console.log('CONFIRMADO: La columna bloqueado_hasta NO existe.')
        }
    } else {
        console.log('Esquema correcto. Columnas detectadas:', Object.keys(data[0] || {}))
    }
}

checkSchema()
