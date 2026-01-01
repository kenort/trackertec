import { json, error } from "../utils/response";

export const cuentasHandler = {

    async create(request, env) {
        const body = await request.json();
        const { codigo, nombre, direccion, telefono, lat, lng } = body;

        if (!codigo || !nombre) {
            return error("codigo y nombre son obligatorios");
        }

        await env.DB.prepare(`
        INSERT INTO cuentas (codigo, nombre, direccion, telefono, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
            codigo,
            nombre,
            direccion || null,
            telefono || null,
            lat || null,
            lng || null
        ).run();

        return json({ ok: true });
    },

    async list(env) {
        const { results } = await env.DB
            .prepare("SELECT * FROM cuentas ORDER BY created_at DESC")
            .all();

        return json(results);
    }

};
