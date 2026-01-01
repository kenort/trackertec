export function generarApiKey() {
    return crypto.randomUUID().replace(/-/g, "");
}

export async function hashKey(key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hashBuffer)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}


