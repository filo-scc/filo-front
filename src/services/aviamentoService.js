import api from "./api";

export const getAviamentosByFabrico = async (fabricoId) => {
    const response = await api.get(`/aviamentos/fabrico/${fabricoId}`);
    return response.data;
};

export const deleteAviamento = async (aviamentoId) => {
    const response = await api.delete(`/aviamentos/${aviamentoId}`);
    return response.data;
};
