import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function getFabricoById(fabricoId) {
    const response = await api.get(`/fabricos/${fabricoId}`);
    return unwrap(response);
}
