import { error } from "../utils/response";

/**
 * Valida si el role del request tiene permiso para la acción
 * @param {string} requiredRole - El role requerido ('admin', 'write', 'read')
 * @returns {function} Middleware que retorna error si no tiene permiso
 */
export function requireRole(requiredRole) {
    return (request) => {
        const roleHierarchy = { admin: 3, write: 2, read: 1 };
        const userRoleLevel = roleHierarchy[request.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredLevel) {
            return error(`Permiso denegado. Se requiere role: ${requiredRole}`, 403);
        }

        return null;
    };
}
