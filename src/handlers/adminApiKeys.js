import { json, error } from "../utils/response";
import { generarApiKey, hashKey } from "../utils/apiKey";

export async function crearApiKeyAdmin(request, env) {
    // 🔐 Seguridad ADMIN
    if (request.headers.get("x-admin-key") !== env.ADMIN_KEY) {
        return error("Forbidden", 403);
    }

    const body = await request.json();
    const { cuenta_codigo, nombre } = body;

    if (!cuenta_codigo) {
        return error("cuenta_codigo requerido");
    }

    const apiKey = await generarApiKey();
    const keyHash = await hashKey(apiKey);

    await env.DB.prepare(`
    INSERT INTO api_keys (id, key_hash, cuenta_codigo, nombre)
    VALUES (?, ?, ?, ?)
  `).bind(
        crypto.randomUUID(),
        keyHash,
        cuenta_codigo,
        nombre || null
    ).run();

    // ⚠️ SOLO AQUÍ se devuelve la clave en claro
    return json({
        api_key: apiKey,
        cuenta_codigo,
        nombre
    });
}

export async function revocarApiKeyAdmin(request, env) {
    if (request.headers.get("x-admin-key") !== env.ADMIN_KEY) {
        return error("Forbidden", 403);
    }

    const body = await request.json();
    const { api_key } = body;

    if (!api_key) {
        return error("api_key requerida");
    }

    const keyHash = await hashKey(api_key);

    const result = await env.DB.prepare(`
    UPDATE api_keys
    SET activo = 0
    WHERE key_hash = ?
  `).bind(keyHash).run();

    if (result.meta.changes === 0) {
        return error("API Key no encontrada", 404);
    }

    return json({ revoked: true });
}

