import { authMiddleware } from "./middleware/auth";
import { eventosHandler } from "./handlers/eventos";
import { listarEventosHandler } from "./handlers/listarEventos";
import { statusHandler } from "./handlers/health";
import { error } from "./utils/response";
import {
    crearApiKeyAdmin,
    revocarApiKeyAdmin
} from "./handlers/adminApiKeys";



export async function router(request, env) {
    // 🔐 Middleware de autenticación
    const auth = await authMiddleware(request, env);
    if (auth instanceof Response) {
        return auth;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // ✅ Health check
    if (pathname === "/status" && method === "GET") {
        return statusHandler();
    }

    // 📥 Crear evento (REST)
    if (pathname === "/eventos" && method === "POST") {
        return eventosHandler(request, env);
    }

    // 📤 Listar eventos
    if (pathname === "/eventos" && method === "GET") {
        return listarEventosHandler(request, env);
    }

    // 🔑 Admin API Keys
    if (pathname === "/admin/api-keys" && method === "POST") {
        return crearApiKeyAdmin(request, env);
    }

    if (pathname === "/admin/api-keys/revoke" && method === "POST") {
        return revocarApiKeyAdmin(request, env);
    }

    return error("Not Found", 404);
}
