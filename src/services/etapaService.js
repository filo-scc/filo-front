import api from "./api";

// Buscar todas as etapas de um fabrico
export const getAllEtapasByFabricoId = (fabricoId) => {
    return api.get(`/etapas/fabrico/${fabricoId}`);
};
