import { error } from "../utils/response";

/**
 * Rate Limiting Middleware
 * Límites por minuto según el role:
 * - admin: 1000 req/min
 * - write: 500 req/min  
 * - read: 100 req/min
 */
export async function rateLimitMiddleware(request, env) {
    // Sin API Key (endpoints públicos), sin rate limit
    if (!request.apiKeyId) {
        return null;
    }

    const roleLimits = {
        admin: 1000,
        write: 500,
        read: 100
    };

    const limit = roleLimits[request.role] || 100;
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000).toISOString();

    // Contar requests en el último minuto
    const result = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM rate_limits
        WHERE api_key_id = ? AND timestamp > ?
    `).bind(request.apiKeyId, minuteAgo).first();

    const count = result?.count || 0;

    // Registrar nuevo request
    await env.DB.prepare(`
        INSERT INTO rate_limits (api_key_id, timestamp, requests_count)
        VALUES (?, ?, 1)
    `).bind(request.apiKeyId, now.toISOString()).run();

    // Limpiar registros antiguos (más de 1 hora)
    const hourAgo = new Date(now.getTime() - 3600000).toISOString();
    await env.DB.prepare(`
        DELETE FROM rate_limits
        WHERE timestamp < ?
    `).bind(hourAgo).run();

    // Verificar límite
    if (count >= limit) {
        return error(
            `Rate limit exceeded. Límite: ${limit} requests/minuto para role ${request.role}`,
            429
        );
    }

    return null;
}
