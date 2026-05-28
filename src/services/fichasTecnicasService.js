import api from "./api";

export const getFichaTecnicaByFabrico = async (fabricoId) => {
    const response = await api.get(`/fichas-tecnicas/fabrico/${fabricoId}`);
    return response.data;
};

export const updateEtapaFichaTecnica = async (id, novaEtapa) => {
    const response = await api.put(`/fichas-tecnicas/${id}`, {
        etapa_atual_id: novaEtapa,
    });
    return response.data;
};
