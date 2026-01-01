import mqtt from "mqtt";
import { normalizeEvento } from "./lib/normalizeEvento";
import { procesarEvento } from "./handlers/eventosHandler";

export class MqttClientDO {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.client = null;
    }

    // 🔌 Conecta al broker MQTT (HiveMQ Cloud)
    async connect() {
        if (this.client && this.client.connected) return;

        const url = `wss://${this.env.MQTT_HOST}:8884/mqtt`;
        console.log("🔌 Conectando a MQTT:", url);

        this.client = mqtt.connect(url, {
            username: this.env.MQTT_USER,
            password: this.env.MQTT_PASS,
            clientId: "cf-mqtt-client",
            keepalive: 30,
            reconnectPeriod: 5000,
            clean: false
        });

        this.client.on("connect", () => {
            console.log("✅ MQTT conectado");
            this.client.subscribe("eventos/+/+");
        });

        this.client.on("message", (topic, message) => {
            // IMPORTANTE: delegamos toda la lógica
            this.handleMessage(topic, message);
        });

        this.client.on("error", (err) => {
            console.error("❌ MQTT error", err);
        });
    }

    // 📥 Procesa cada mensaje MQTT recibido
    async handleMessage(topic, message) {
        try {
            const evento = normalizeEvento({
                topic,
                message: message.toString()
            });

            await procesarEvento(this.env.DB, evento);

            console.log(
                "📥 Evento guardado:",
                evento.cuenta,
                evento.tipo
            );
        } catch (err) {
            console.error("❌ Error procesando MQTT", err);
        }
    }

    // ⏰ Alarm: mantiene viva la conexión MQTT
    async alarm() {
        console.log("⏰ Alarm ejecutada - asegurando conexión MQTT");

        await this.connect();

        // Reprogramar cada 30 segundos
        await this.state.storage.setAlarm(Date.now() + 30_000);
    }

    // 🌐 Endpoint interno (health / activación)
    async fetch() {
        // Activar alarmas si aún no existen
        await this.state.storage.setAlarm(Date.now() + 1_000);

        await this.connect();

        return new Response("MQTT alive", { status: 200 });
    }
}

