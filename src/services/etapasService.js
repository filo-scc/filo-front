import api from "./api";

export const getEtapasByFabrico = async (fabricoId) => {
    const response = await api.get(`/etapas/fabrico/${fabricoId}`);
    return response.data;
};
