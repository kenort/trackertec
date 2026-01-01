import { json, error } from "../utils/response";

export async function listarEventosHandler(request, env) {
    try {
        const url = new URL(request.url);

        const cuenta = url.searchParams.get("cuenta");
        const tipo = url.searchParams.get("tipo");
        const limit = Number(url.searchParams.get("limit") || 50);

        let query = `SELECT * FROM eventos WHERE 1=1`;
        const params = [];

        if (cuenta) {
            query += ` AND cuenta_codigo = ?`;
            params.push(cuenta);
        }

        if (tipo) {
            query += ` AND tipo = ?`;
            params.push(tipo);
        }

        query += ` ORDER BY fecha_evento DESC LIMIT ?`;
        params.push(limit);

        const { results } = await env.DB.prepare(query)
            .bind(...params)
            .all();

        return json(results);
    } catch (err) {
        console.error(err);
        return error("Error listando eventos", 500);
    }
}
