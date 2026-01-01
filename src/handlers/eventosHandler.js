import { guardarEvento } from "../services/eventosService";

export async function procesarEvento(db, evento) {
    if (!evento.cuenta || !evento.tipo) {
        throw new Error("Evento inválido");
    }

    await guardarEvento(db, evento);
}

