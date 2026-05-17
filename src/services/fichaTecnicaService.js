import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function createFichaTecnica(payload) {
    const response = await api.post("/fichas-tecnicas", payload);
    return unwrap(response);
}

export async function getFichaTecnicaById(id) {
    const response = await api.get(`/fichas-tecnicas/${id}`);
    return unwrap(response);
}
