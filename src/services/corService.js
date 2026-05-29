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

export async function getCoresByFabricoId(fabricoId) {
    const response = await api.get(`/cores/fabrico/${fabricoId}`);
    return unwrap(response);
}

export async function createCor(payload) {
    const response = await api.post("/cores", payload);
    return unwrap(response);
}
