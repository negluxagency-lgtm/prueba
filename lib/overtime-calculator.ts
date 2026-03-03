/**
 * Utilidad pura para calcular horas extra a partir de logs de fichaje y el horario semanal.
 * No tiene dependencias de red, es 100% determinista y testeable.
 */

export interface FichajeLogEntry {
    tipo: 'entrada' | 'salida' | 'pausa_inicio' | 'pausa_fin'
    timestamp_servidor: string
}

export interface TurnoSchedule {
    inicio: string // "HH:MM"
    fin: string    // "HH:MM"
}

export interface DiaSemanaSchedule {
    dia: number       // 0=domingo, 1=lunes … 6=sábado
    activo: boolean
    turnos: TurnoSchedule[]
}

/** Convierte "HH:MM" a minutos desde medianoche */
function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

/** Convierte Date a minutos desde medianoche */
function dateToMinutes(date: Date): number {
    return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}

/**
 * Dado un conjunto de logs de UN día y el horario_semanal del barbero,
 * calcula las horas extra.
 *
 * Regla: Solo hay horas extra si la última salida real supera en ≥30 min
 *        el fin del último turno activo ese día de la semana.
 *
 * @returns horas extra en decimal (0 si no hay, nunca negativo)
 */
export function calculateOvertimeForDay(
    logsOfDay: FichajeLogEntry[],
    horarioSemanal: DiaSemanaSchedule[],
    date: Date
): number {
    // 1. Obtener el día de la semana (0=domingo ... 6=sábado)
    const diaSemana = date.getDay()

    // 2. Buscar la configuración del horario para ese día
    const diaConfig = horarioSemanal.find(d => d.dia === diaSemana)

    // Si el día no está activo o no hay turnos → no hay horas extra
    if (!diaConfig || !diaConfig.activo || !diaConfig.turnos || diaConfig.turnos.length === 0) {
        return 0
    }

    // 3. Encontrar el fin del turno más tardío del día
    const finUltimoTurnoMinutos = Math.max(
        ...diaConfig.turnos.map(t => timeToMinutes(t.fin))
    )

    // 4. Filtrar y obtener la última salida real del día
    const salidas = logsOfDay.filter(l => l.tipo === 'salida')
    if (salidas.length === 0) return 0

    const ultimaSalida = salidas.reduce((latest, current) => {
        return new Date(current.timestamp_servidor) > new Date(latest.timestamp_servidor)
            ? current
            : latest
    })

    const horaSalidaReal = new Date(ultimaSalida.timestamp_servidor)
    const minutosRealSalida = dateToMinutes(horaSalidaReal)

    // 5. Calcular el exceso en minutos
    const excesoMinutos = minutosRealSalida - finUltimoTurnoMinutos

    // 6. Solo contar si el exceso es ≥ 30 minutos
    if (excesoMinutos < 30) return 0

    // 7. Las horas extra son el exceso total (no solo el exceso sobre los 30 min)
    return Math.round((excesoMinutos / 60) * 100) / 100
}

/**
 * Agrupa un array de logs por fecha (YYYY-MM-DD) en la zona horaria local (del servidor en el TS).
 */
export function groupLogsByDate(logs: FichajeLogEntry[]): Record<string, FichajeLogEntry[]> {
    const grouped: Record<string, FichajeLogEntry[]> = {}
    for (const log of logs) {
        const dateKey = log.timestamp_servidor.substring(0, 10) // YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(log)
    }
    return grouped
}
