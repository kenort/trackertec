import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { requireRole } from "./middleware/roleValidator";
import { eventosHandler } from "./handlers/eventos";
import { listarEventosHandler } from "./handlers/listarEventos";
import { statusHandler } from "./handlers/health";
import { error } from "./utils/response";
import {
    crearApiKeyAdmin,
    revocarApiKeyAdmin
} from "./handlers/adminApiKeys";
import {
    obtenerNotificacionesHandler,
    marcarNotificacionLeidaHandler,
    marcarTodasLeidasHandler,
    contadorNotificacionesHandler
} from "./handlers/notificaciones";
import {
    obtenerResumenPorTipo,
    obtenerSerieTemporal,
    obtenerTopCuentas,
    obtenerEstadisticas
} from "./handlers/analytics";



export async function router(request, env) {
    // 🔐 Middleware de autenticación
    const auth = await authMiddleware(request, env);
    if (auth instanceof Response) {
        return auth;
    }

    // 🚦 Middleware de rate limiting
    const rateLimit = await rateLimitMiddleware(request, env);
    if (rateLimit instanceof Response) {
        return rateLimit;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // ✅ Health check
    if (pathname === "/status" && method === "GET") {
        return statusHandler();
    }

    // 📥 Crear evento (REST) - Requiere role 'write' o 'admin'
    if (pathname === "/eventos" && method === "POST") {
        const roleCheck = requireRole("write")(request);
        if (roleCheck instanceof Response) return roleCheck;
        return eventosHandler(request, env);
    }

    // 📤 Listar eventos - Requiere role 'read', 'write' o 'admin'
    if (pathname === "/eventos" && method === "GET") {
        const roleCheck = requireRole("read")(request);
        if (roleCheck instanceof Response) return roleCheck;
        return listarEventosHandler(request, env);
    }

    // 🔔 Notificaciones
    if (pathname === "/notificaciones" && method === "GET") {
        return obtenerNotificacionesHandler(request, env);
    }

    if (pathname === "/notificaciones/marcar-leida" && method === "POST") {
        return marcarNotificacionLeidaHandler(request, env);
    }

    if (pathname === "/notificaciones/marcar-todas-leidas" && method === "POST") {
        return marcarTodasLeidasHandler(request, env);
    }

    if (pathname === "/notificaciones/contador" && method === "GET") {
        return contadorNotificacionesHandler(request, env);
    }

    // 📊 Analytics
    if (pathname === "/analytics/resumen-por-tipo" && method === "GET") {
        return obtenerResumenPorTipo(request, env);
    }

    if (pathname === "/analytics/serie-temporal" && method === "GET") {
        return obtenerSerieTemporal(request, env);
    }

    if (pathname === "/analytics/top-cuentas" && method === "GET") {
        return obtenerTopCuentas(request, env);
    }

    if (pathname === "/analytics/estadisticas" && method === "GET") {
        return obtenerEstadisticas(request, env);
    }

    // 🔑 Admin API Keys - Requiere role 'admin'
    if (pathname === "/admin/api-keys" && method === "POST") {
        const roleCheck = requireRole("admin")(request);
        if (roleCheck instanceof Response) return roleCheck;
        return crearApiKeyAdmin(request, env);
    }

    if (pathname === "/admin/api-keys/revoke" && method === "POST") {
        const roleCheck = requireRole("admin")(request);
        if (roleCheck instanceof Response) return roleCheck;
        return revocarApiKeyAdmin(request, env);
    }

    return error("Not Found", 404);
}
