import { json } from "../utils/response";

export function statusHandler() {
    return json({
        status: "ok",  
        service: "mqtt-backend",
        timestamp: new Date().toISOString()
    });
}

