import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function getGradesLiberadasByFabricoId() {
    const response = await api.get("/grades");
    return unwrap(response);
}
