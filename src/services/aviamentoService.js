import api from "./api";

const sanitizeCatalogPayload = (payload = {}) => {
    const { ...rest } = payload;
    return rest;
};

export const getAviamentos = async () => {
    try {
        const response = await api.get("/aviamentos");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar aviamentos:", error);
        return [];
    }
};

export const getAviamentoById = async (aviamentoId) => {
    try {
        const response = await api.get(`/aviamentos/${aviamentoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar aviamento por id:", error);
        return null;
    }
};

export const createAviamento = async (data) => {
    try {
        const response = await api.post("/aviamentos", sanitizeCatalogPayload(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao criar aviamento:", error);
        throw error;
    }
};

export const updateAviamento = async (aviamentoId, data) => {
    try {
        const response = await api.put(`/aviamentos/${aviamentoId}`, sanitizeCatalogPayload(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar aviamento:", error);
        throw error;
    }
};

export const deleteAviamento = async (aviamentoId) => {
    try {
        const response = await api.delete(`/aviamentos/${aviamentoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao deletar aviamento:", error);
        throw error;
    }
};
