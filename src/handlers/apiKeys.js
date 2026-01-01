import { json, error } from "../utils/response";

export async function crearApiKeyHandler(request, env) {
    const body = await request.json();
    const { cuenta_codigo, nombre } = body;

    if (!cuenta_codigo) {
        return error("cuenta_codigo requerido");
    }

    const apiKey = "evk_" + crypto.randomUUID();

    await env.DB.prepare(`
    INSERT INTO api_keys (id, api_key, cuenta_codigo, nombre)
    VALUES (?, ?, ?, ?)
  `).bind(
        crypto.randomUUID(),
        apiKey,
        cuenta_codigo,
        nombre || null
    ).run();

    return json({ api_key: apiKey });
}
