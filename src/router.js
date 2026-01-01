import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { requireRole } from "./middleware/roleValidator";
import { requireAdminKey } from "./middleware/adminKeyValidator";
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



// CORS Headers
function addCorsHeaders(response) {
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-admin-key');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function router(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // 🔄 Manejar preflight requests (CORS)
    if (method === "OPTIONS") {
        return addCorsHeaders(new Response(null, { status: 204 }));
    }

    // ✅ Health check (sin autenticación)
    if (pathname === "/status" && method === "GET") {
        return addCorsHeaders(statusHandler());
    }

    // 🔑 Admin endpoints (validar x-admin-key ANTES de authMiddleware)
    if ((pathname === "/admin/api-keys" || pathname === "/admin/api-keys/revoke") && method === "POST") {
        const adminKeyCheck = requireAdminKey(request, env);
        if (adminKeyCheck instanceof Response) {
            return addCorsHeaders(adminKeyCheck);
        }

        if (pathname === "/admin/api-keys") {
            return addCorsHeaders(await crearApiKeyAdmin(request, env));
        }
        if (pathname === "/admin/api-keys/revoke") {
            return addCorsHeaders(await revocarApiKeyAdmin(request, env));
        }
    }

    // 🔐 Middleware de autenticación (para el resto de endpoints)
    const auth = await authMiddleware(request, env);
    if (auth instanceof Response) {
        return addCorsHeaders(auth);
    }

    // 🚦 Middleware de rate limiting
    const rateLimit = await rateLimitMiddleware(request, env);
    if (rateLimit instanceof Response) {
        return addCorsHeaders(rateLimit);
    }

    // 📥 Crear evento (REST) - Requiere role 'write' o 'admin'
    if (pathname === "/eventos" && method === "POST") {
        const roleCheck = requireRole("write")(request);
        if (roleCheck instanceof Response) return addCorsHeaders(roleCheck);
        return addCorsHeaders(await eventosHandler(request, env));
    }

    // 📤 Listar eventos - Requiere role 'read', 'write' o 'admin'
    if (pathname === "/eventos" && method === "GET") {
        const roleCheck = requireRole("read")(request);
        if (roleCheck instanceof Response) return addCorsHeaders(roleCheck);
        return addCorsHeaders(await listarEventosHandler(request, env));
    }

    // 🔔 Notificaciones
    if (pathname === "/notificaciones" && method === "GET") {
        return addCorsHeaders(await obtenerNotificacionesHandler(request, env));
    }

    if (pathname === "/notificaciones/marcar-leida" && method === "POST") {
        return addCorsHeaders(await marcarNotificacionLeidaHandler(request, env));
    }

    if (pathname === "/notificaciones/marcar-todas-leidas" && method === "POST") {
        return addCorsHeaders(await marcarTodasLeidasHandler(request, env));
    }

    if (pathname === "/notificaciones/contador" && method === "GET") {
        return addCorsHeaders(await contadorNotificacionesHandler(request, env));
    }

    // 📊 Analytics
    if (pathname === "/analytics/resumen-por-tipo" && method === "GET") {
        return addCorsHeaders(await obtenerResumenPorTipo(request, env));
    }

    if (pathname === "/analytics/serie-temporal" && method === "GET") {
        return addCorsHeaders(await obtenerSerieTemporal(request, env));
    }

    if (pathname === "/analytics/top-cuentas" && method === "GET") {
        return addCorsHeaders(await obtenerTopCuentas(request, env));
    }

    if (pathname === "/analytics/estadisticas" && method === "GET") {
        return addCorsHeaders(await obtenerEstadisticas(request, env));
    }

    return addCorsHeaders(error("Not Found", 404));
}
