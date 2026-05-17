import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function getCoresByFabricoId(fabricoId) {
    const response = await api.get(`/cores/fabrico/${fabricoId}`);
    return unwrap(response);
}

export async function createCor(payload) {
    const response = await api.post("/cores", payload);
    return unwrap(response);
}
