import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function getGradesLiberadasByFabricoId(fabricoId) {
    const response = await api.get(`/fabrico-grades/fabrico/${fabricoId}`);
    return unwrap(response);
}
