import api from "./api";

export const getAviamentosByFabrico = async (fabricoId) => {
    const response = await api.get(`/aviamentos/fabrico/${fabricoId}`);
    return response.data;
};

export const getAviamentoById = async (aviamentoId) => {
    const response = await api.get(`/aviamentos/${aviamentoId}`);
    return response.data;
};

export const createAviamento = async (data) => {
    const response = await api.post("/aviamentos", data);
    return response.data;
};

export const updateAviamento = async (aviamentoId, data) => {
    const response = await api.put(`/aviamentos/${aviamentoId}`, data);
    return response.data;
};

export const deleteAviamento = async (aviamentoId) => {
    const response = await api.delete(`/aviamentos/${aviamentoId}`);
    return response.data;
};
