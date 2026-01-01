import { error } from "../utils/response";

/**
 * Middleware para validar x-admin-key en endpoints administrativos
 * Se usa ANTES de requireRole para endpoints que usan x-admin-key
 */
export function requireAdminKey(request, env) {
    const adminKey = request.headers.get("x-admin-key");
    
    if (!adminKey) {
        return error("x-admin-key requerida", 401);
    }
    
    if (adminKey !== env.ADMIN_KEY) {
        return error("x-admin-key inválida", 403);
    }
    
    // Asignar role admin al request para que pase validaciones posteriores
    request.role = "admin";
    request.isAdminKeyAuth = true;
    
    return null;
}
