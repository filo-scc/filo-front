import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function getGradesLiberadas() {
    const response = await api.get("/fabrico-grades");
    return unwrap(response);
}