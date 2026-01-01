import { error } from "../utils/response";
import { hashKey } from "../utils/apiKey";

export async function authMiddleware(request, env) {
    const publicPaths = ["/status"];

    const url = new URL(request.url);
    if (publicPaths.includes(url.pathname)) {
        return null;
    }

    try {
        // Crear tabla api_keys si no existe (para desarrollo local)
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                nombre TEXT,
                key_hash TEXT NOT NULL,
                cuenta_codigo TEXT,
                role TEXT DEFAULT 'read' CHECK(role IN ('admin', 'write', 'read')),
                activo INTEGER DEFAULT 1,
                creado_en TEXT
            )
        `).run();
    } catch (e) {
        // Ignorar errores de creación (tabla ya existe)
    }

    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
        return error("API Key requerida", 401);
    }

    const keyHash = await hashKey(apiKey);

    const result = await env.DB.prepare(`
        SELECT cuenta_codigo, role, id
        FROM api_keys
        WHERE key_hash = ? AND activo = 1
    `).bind(keyHash).first();

    if (!result) {
        return error("API Key inválida", 403);
    }

    // 👇 Inyectamos la cuenta y role en el request
    request.cuenta = result.cuenta_codigo;
    request.role = result.role;
    request.apiKeyId = result.id;

    return null;
}



