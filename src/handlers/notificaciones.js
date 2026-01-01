import { json, error } from "../utils/response";

/**
 * Crear una notificación
 */
export async function crearNotificacionHandler(request, env) {
    // Sin autenticación para este endpoint (se llama internamente)
    const body = await request.json();
    const { cuenta_codigo, titulo, mensaje, tipo, evento_id } = body;

    if (!cuenta_codigo || !titulo) {
        return error("cuenta_codigo y titulo requeridos");
    }

    const tiposValidos = ["info", "warning", "error", "critical"];
    const notificationType = tiposValidos.includes(tipo) ? tipo : "info";

    try {
        // Crear tabla si no existe (para desarrollo local)
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cuenta_codigo TEXT NOT NULL,
                titulo TEXT NOT NULL,
                mensaje TEXT,
                tipo TEXT DEFAULT 'info' CHECK(tipo IN ('info', 'warning', 'error', 'critical')),
                evento_id TEXT,
                leida INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (cuenta_codigo) REFERENCES cuentas(codigo)
            )
        `).run();

        // Crear índice si no existe
        await env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS idx_notifications_cuenta
            ON notifications (cuenta_codigo)
        `).run();

        await env.DB.prepare(`
            INSERT INTO notifications (cuenta_codigo, titulo, mensaje, tipo, evento_id, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(cuenta_codigo, titulo, mensaje || null, notificationType, evento_id || null).run();

        return json({ success: true });
    } catch (err) {
        return error(`Error creando notificación: ${err.message}`, 500);
    }
}

/**
 * Obtener notificaciones para una cuenta
 */
export async function obtenerNotificacionesHandler(request, env) {
    if (!request.cuenta) {
        return error("No autorizado", 401);
    }

    const url = new URL(request.url);
    const leidas = url.searchParams.get("leidas") === "false" ? 0 : null;
    const limite = parseInt(url.searchParams.get("limite") || "50");

    try {
        let query = `
            SELECT id, titulo, mensaje, tipo, evento_id, leida, created_at
            FROM notifications
            WHERE cuenta_codigo = ?
        `;
        const params = [request.cuenta];

        if (leidas !== null) {
            query += ` AND leida = ?`;
            params.push(leidas);
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(limite);

        const result = await env.DB.prepare(query).bind(...params).all();

        return json({
            data: result.results || [],
            count: result.results?.length || 0
        });
    } catch (err) {
        return error(`Error obteniendo notificaciones: ${err.message}`, 500);
    }
}

/**
 * Marcar notificación como leída
 */
export async function marcarNotificacionLeidaHandler(request, env) {
    if (!request.cuenta) {
        return error("No autorizado", 401);
    }

    const body = await request.json();
    const { notificacion_id } = body;

    if (!notificacion_id) {
        return error("notificacion_id requerido");
    }

    try {
        const result = await env.DB.prepare(`
            UPDATE notifications
            SET leida = 1
            WHERE id = ? AND cuenta_codigo = ?
        `).bind(notificacion_id, request.cuenta).run();

        if (result.meta.changes === 0) {
            return error("Notificación no encontrada", 404);
        }

        return json({ success: true });
    } catch (err) {
        return error(`Error actualizando notificación: ${err.message}`, 500);
    }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasLeidasHandler(request, env) {
    if (!request.cuenta) {
        return error("No autorizado", 401);
    }

    try {
        const result = await env.DB.prepare(`
            UPDATE notifications
            SET leida = 1
            WHERE cuenta_codigo = ? AND leida = 0
        `).bind(request.cuenta).run();

        return json({
            success: true,
            updated: result.meta.changes
        });
    } catch (err) {
        return error(`Error actualizando notificaciones: ${err.message}`, 500);
    }
}

/**
 * Obtener contador de notificaciones no leídas
 */
export async function contadorNotificacionesHandler(request, env) {
    if (!request.cuenta) {
        return error("No autorizado", 401);
    }

    try {
        const result = await env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE cuenta_codigo = ? AND leida = 0
        `).bind(request.cuenta).first();

        return json({
            unread_count: result?.count || 0
        });
    } catch (err) {
        return error(`Error obteniendo contador: ${err.message}`, 500);
    }
}
