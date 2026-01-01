/* import { router } from "./router";
import { MqttClientDO } from "./mqttClientDO";

export { MqttClientDO };

export default {
	async fetch(request, env) {
		// Arranca el cliente MQTT
		const id = env.MQTT_CLIENT.idFromName("global");
		const stub = env.MQTT_CLIENT.get(id);
		await stub.fetch("https://mqtt/init");

		return router.handle(request, env);
	}
}; */

import { router } from "./router";
import { MqttClientDO } from "./mqttClientDO";

export default {
	async fetch(request, env) {
		return router(request, env);
	}
};

export { MqttClientDO };

