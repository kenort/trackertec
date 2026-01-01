import { json, error } from "../utils/response";
import { procesarEvento } from "./eventosHandler";
import { registrarAnalyticsHandler } from "./analytics";

export async function eventosHandler(request, env) {
    const body = await request.json();

    if (!body.tipo || !body.cuenta_codigo) {
        return error("tipo y cuenta_codigo son obligatorios");
    }

    // Crear tabla cuentas si no existe
    try {
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS cuentas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT NOT NULL UNIQUE,
                nombre TEXT NOT NULL,
                direccion TEXT,
                telefono TEXT,
                lat REAL,
                lng REAL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `).run();
    } catch (e) {
        // Tabla ya existe
    }

    // Crear la cuenta si no existe (para resolver foreign key constraint)
    try {
        await env.DB.prepare(`
            INSERT INTO cuentas (codigo, nombre)
            VALUES (?, ?)
        `).bind(body.cuenta_codigo, body.cuenta_codigo).run();
    } catch (e) {
        // Cuenta ya existe, ignorar
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
    
    // 📊 Registrar en analytics
    await registrarAnalyticsHandler(env, body.cuenta_codigo, body.tipo, evento.fecha);

    return json({ ok: true });
}

import {
    listarEventos,
    obtenerUltimoEvento
} from "../services/eventosService";

export async function listarEventosHandler(request, env) {
    try {
        // Crear tabla eventos si no existe
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                tipo TEXT NOT NULL,
                cuenta_codigo TEXT NOT NULL,
                origen TEXT,
                lat REAL,
                lng REAL,
                fecha_evento TEXT NOT NULL,
                payload TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (cuenta_codigo) REFERENCES cuentas(codigo)
            )
        `).run();
    } catch (e) {
        // Tabla ya existe
    }

    const { searchParams } = new URL(request.url);

    const cuenta = searchParams.get("cuenta") || request.cuenta;
    const tipo = searchParams.get("tipo");
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);

    const eventos = await listarEventos(env.DB, {
        cuenta,
        tipo,
        limit,
        offset
    });

    return json(eventos || []);
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

