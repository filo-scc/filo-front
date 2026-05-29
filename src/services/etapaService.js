import api from "./api";

// Buscar todas as etapas de um fabrico
export const getAllEtapasByFabricoId = async (fabricoId) => {
    const response = await api.get(`/etapas/fabrico/${fabricoId}`);
    return response.data;
};
