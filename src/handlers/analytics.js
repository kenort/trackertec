import { json, error } from "../utils/response";

/**
 * Registrar evento en analytics
 * Se llama automáticamente cuando se crea un evento
 */
export async function registrarAnalyticsHandler(env, cuenta_codigo, tipo, fecha) {
    try {
        // Agrupar por hora
        const fechaHora = new Date(fecha);
        fechaHora.setMinutes(0, 0, 0);

        await env.DB.prepare(`
            INSERT INTO analytics (cuenta_codigo, evento_tipo, fecha_hora, cantidad)
            VALUES (?, ?, ?, 1)
            ON CONFLICT(cuenta_codigo, evento_tipo, fecha_hora) 
            DO UPDATE SET cantidad = cantidad + 1
        `).bind(cuenta_codigo, tipo, fechaHora.toISOString()).run();
    } catch (err) {
        console.error("Error registrando analytics:", err);
    }
}

/**
 * Obtener resumen de eventos por tipo
 */
export async function obtenerResumenPorTipo(request, env) {
    if (!request.cuenta) {
        return error("No autorizado", 401);
    }

    const url = new URL(request.url);
    const dias = parseInt(url.searchParams.get("dias") || "7");

    try {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);

        const result = await env.DB.prepare(`
            SELECT evento_tipo as tipo, SUM(cantidad) as total
            FROM analytics
            WHERE cuenta_codigo = ? AND fecha_hora >= ?
            GROUP BY evento_tipo
            ORDER BY total DESC
        `).bind(request.cuenta, fechaLimite.toISOString()).all();

        return json({
            periodo_dias: dias,
            data: result.results || []
        });
    } catch (err) {
        return error(`Error obteniendo resumen: ${err.message}`, 500);
    }
}

/**
 * Obtener serie temporal de eventos
 */
export async function obtenerSerieTemporal(request, env) {
    if (!request.cuenta) {
        return error("No autorizado", 401);
    }

    const url = new URL(request.url);
    const dias = parseInt(url.searchParams.get("dias") || "7");
    const tipo = url.searchParams.get("tipo"); // Opcional

    try {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);

        let query = `
            SELECT 
                strftime('%Y-%m-%d %H:00:00', fecha_hora) as hora,
                evento_tipo as tipo,
                SUM(cantidad) as cantidad
            FROM analytics
            WHERE cuenta_codigo = ? AND fecha_hora >= ?
        `;
        const params = [request.cuenta, fechaLimite.toISOString()];

        if (tipo) {
            query += ` AND evento_tipo = ?`;
            params.push(tipo);
        }

        query += ` GROUP BY hora, tipo ORDER BY hora ASC`;

        const result = await env.DB.prepare(query).bind(...params).all();

        return json({
            periodo_dias: dias,
            tipo_filtro: tipo || null,
            data: result.results || []
        });
    } catch (err) {
        return error(`Error obteniendo serie temporal: ${err.message}`, 500);
    }
}

/**
 * Obtener top cuentas
 */
export async function obtenerTopCuentas(request, env) {
    // Este endpoint es para admin o la propia cuenta
    if (!request.role || request.role !== 'admin') {
        return error("Se requiere role admin", 403);
    }

    const url = new URL(request.url);
    const dias = parseInt(url.searchParams.get("dias") || "7");
    const limite = parseInt(url.searchParams.get("limite") || "10");

    try {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);

        const result = await env.DB.prepare(`
            SELECT cuenta_codigo, SUM(cantidad) as total_eventos
            FROM analytics
            WHERE fecha_hora >= ?
            GROUP BY cuenta_codigo
            ORDER BY total_eventos DESC
            LIMIT ?
        `).bind(fechaLimite.toISOString(), limite).all();

        return json({
            periodo_dias: dias,
            data: result.results || []
        });
    } catch (err) {
        return error(`Error obteniendo top cuentas: ${err.message}`, 500);
    }
}

/**
 * Obtener estadísticas generales
 */
export async function obtenerEstadisticas(request, env) {
    if (!request.cuenta) {
        return error("No autorizado", 401);
    }

    const url = new URL(request.url);
    const dias = parseInt(url.searchParams.get("dias") || "7");

    try {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);

        // Total eventos
        const total = await env.DB.prepare(`
            SELECT SUM(cantidad) as total
            FROM analytics
            WHERE cuenta_codigo = ? AND fecha_hora >= ?
        `).bind(request.cuenta, fechaLimite.toISOString()).first();

        // Evento más frecuente
        const topTipo = await env.DB.prepare(`
            SELECT evento_tipo, SUM(cantidad) as total
            FROM analytics
            WHERE cuenta_codigo = ? AND fecha_hora >= ?
            GROUP BY evento_tipo
            ORDER BY total DESC
            LIMIT 1
        `).bind(request.cuenta, fechaLimite.toISOString()).first();

        // Promedio por día
        const promedio = await env.DB.prepare(`
            SELECT AVG(cantidad_diaria) as promedio
            FROM (
                SELECT DATE(fecha_hora) as dia, SUM(cantidad) as cantidad_diaria
                FROM analytics
                WHERE cuenta_codigo = ? AND fecha_hora >= ?
                GROUP BY dia
            )
        `).bind(request.cuenta, fechaLimite.toISOString()).first();

        return json({
            periodo_dias: dias,
            estadisticas: {
                total_eventos: total?.total || 0,
                evento_mas_frecuente: topTipo?.evento_tipo || null,
                eventos_tipo_frecuente: topTipo?.total || 0,
                promedio_eventos_por_dia: Math.round(promedio?.promedio || 0)
            }
        });
    } catch (err) {
        return error(`Error obteniendo estadísticas: ${err.message}`, 500);
    }
}
