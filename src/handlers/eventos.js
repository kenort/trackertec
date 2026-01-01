import { json, error } from "../utils/response";
import { procesarEvento } from "./eventosHandler";

export async function eventosHandler(request, env) {
    const body = await request.json();

    if (!body.tipo || !body.cuenta_codigo) {
        return error("tipo y cuenta_codigo son obligatorios");
    }

    // Adaptamos HTTP → evento normalizado
    const evento = {
        event_id: body.event_id,
        tipo: body.tipo,
        cuenta: body.cuenta_codigo,
        origen: body.origen ?? "http",
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        fecha: body.fecha_evento ?? new Date().toISOString(),
        payload: body.payload ?? {}
    };

    await procesarEvento(env.DB, evento);

    return json({ ok: true });
}

import {
    listarEventos,
    obtenerUltimoEvento
} from "../services/eventosService";

export async function listarEventosHandler(request, env) {
    const { searchParams } = new URL(request.url);

    const cuenta = searchParams.get("cuenta");
    const tipo = searchParams.get("tipo");
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);

    const eventos = await listarEventos(env.DB, {
        cuenta,
        tipo,
        limit,
        offset
    });

    return json(eventos);
}

export async function eventosPorCuentaHandler(request, env, cuenta) {
    const eventos = await listarEventos(env.DB, { cuenta });
    return json(eventos);
}

export async function ultimoEventoHandler(request, env, cuenta) {
    const evento = await obtenerUltimoEvento(env.DB, cuenta);

    if (!evento) {
        return error("No hay eventos", 404);
    }

    return json(evento);
}

