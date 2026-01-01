import { error } from "../utils/response";
import { hashKey } from "../utils/apiKey";

export async function authMiddleware(request, env) {
    const publicPaths = ["/status", "/admin/api-keys", "/admin/api-keys/revoke"];

    const url = new URL(request.url);
    if (publicPaths.includes(url.pathname)) {
        return null;
    }

    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
        return error("API Key requerida", 401);
    }

    const keyHash = await hashKey(apiKey);

    const { results } = await env.DB.prepare(`
        SELECT cuenta_codigo
        FROM api_keys
        WHERE key_hash = ? AND activo = 1
    `).bind(keyHash).first();

    if (!results.length) {
        return error("API Key inválida", 403);
    }

    // 👇 Inyectamos la cuenta en el request
    request.cuenta = results[0].cuenta_codigo;

    return null;
}



