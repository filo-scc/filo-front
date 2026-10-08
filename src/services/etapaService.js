import api from "./api";

// Buscar todas as etapas do fabrico autenticado
export const getAllEtapas = async () => {
    const response = await api.get("/etapas");
    return response.data;
};
