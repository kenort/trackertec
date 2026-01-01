export async function guardarEvento(db, evento) {
    const stmt = db.prepare(`
    INSERT INTO eventos (cuenta, tipo, origen, detalle, lat, lng, fecha)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
        evento.cuenta,
        evento.tipo,
        evento.origen,
        evento.detalle,
        evento.lat,
        evento.lng,
        evento.fecha
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
