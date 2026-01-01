export function normalizeEvento({ topic, message }) {
    const [_, cuenta, tipo] = topic.split("/");
    const data = JSON.parse(message);

    return {
        cuenta,
        tipo,
        origen: data.origen ?? "mqtt",
        detalle: data.payload?.detalle ?? null,
        lat: data.payload?.lat ?? null,
        lng: data.payload?.lng ?? null,
        fecha: new Date().toISOString()
    };
}
