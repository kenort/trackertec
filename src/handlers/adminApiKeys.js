import { json, error } from "../utils/response";
import { generarApiKey, hashKey } from "../utils/apiKey";

export async function crearApiKeyAdmin(request, env) {
    // ✅ x-admin-key ya fue validada por adminKeyValidator middleware
    
    const body = await request.json();
    const { cuenta_codigo, nombre, role } = body;

    if (!cuenta_codigo) {
        return error("cuenta_codigo requerido");
    }

    // Validar role (admin, write, read)
    const validRoles = ["admin", "write", "read"];
    const assignedRole = validRoles.includes(role) ? role : "read";

    const apiKey = await generarApiKey();
    const keyHash = await hashKey(apiKey);

    await env.DB.prepare(`
    INSERT INTO api_keys (id, key_hash, cuenta_codigo, nombre, role, creado_en)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(
        crypto.randomUUID(),
        keyHash,
        cuenta_codigo,
        nombre || null,
        assignedRole
    ).run();

    // ⚠️ SOLO AQUÍ se devuelve la clave en claro
    return json({
        api_key: apiKey,
        cuenta_codigo,
        nombre,
        role: assignedRole
    });
}

export async function revocarApiKeyAdmin(request, env) {
    // ✅ x-admin-key ya fue validada por adminKeyValidator middleware
    
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

