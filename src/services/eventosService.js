export async function guardarEvento(db, evento) {
    const stmt = db.prepare(`
    INSERT INTO eventos (event_id, tipo, cuenta_codigo, origen, lat, lng, fecha_evento, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
        evento.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        evento.tipo,
        evento.cuenta,
        evento.origen || "http",
        evento.lat || null,
        evento.lng || null,
        evento.fecha,
        JSON.stringify(evento.payload || {})
    ).run();
}

export async function listarEventos(db, {
    cuenta,
    tipo,
    limit = 50,
    offset = 0
}) {
    let query = `
    SELECT *
    FROM eventos
    WHERE 1 = 1
  `;
    const params = [];

    if (cuenta) {
        query += " AND cuenta_codigo = ?";
        params.push(cuenta);
    }

    if (tipo) {
        query += " AND tipo = ?";
        params.push(tipo);
    }

    query += `
    ORDER BY fecha_evento DESC
    LIMIT ? OFFSET ?
  `;

    params.push(limit, offset);

    const { results } = await db
        .prepare(query)
        .bind(...params)
        .all();

    return results;
}

export async function obtenerUltimoEvento(db, cuenta) {
    const { results } = await db.prepare(`
    SELECT *
    FROM eventos
    WHERE cuenta_codigo = ?
    ORDER BY fecha_evento DESC
    LIMIT 1
  `).bind(cuenta).all();

    return results[0] || null;
}
