import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export function getApiErrorMessage(error, fallback = "Ocorreu um erro inesperado.") {
    const message = error?.response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string" && message.trim()) return message;
    return fallback;
}

export async function getCores() {
    try {
        const response = await api.get("/cores");
        return unwrap(response);
    } catch (error) {
        console.error("Erro ao buscar cores:", error);
        return [];
    }
}

export async function createCor(payload) {
    try {
        const { ...cleanPayload } = payload ?? {};
        const response = await api.post("/cores", cleanPayload);
        return unwrap(response);
    } catch (error) {
        console.error("Erro ao criar cor:", error);
        throw error;
    }
}
