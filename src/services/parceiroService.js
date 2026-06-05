import api from "./api";

export const getParceirosByFabrico = async (fabricoId) => {
    try {
        const response = await api.get(`/parceiros/fabrico/${fabricoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar parceiros do fabrico:", error);
        throw error;
    }
};

export const getParceiroById = async (id) => {
    const response = await api.get(`/parceiros/${id}`);
    return response.data;
};

export const createParceiro = async (data) => {
    try {
        const response = await api.post("/parceiros", data);
        return response.data;
    } catch (error) {
        console.error("Erro ao cadastrar um parceiro: ", error);
        throw error;
    }
};

export const updateParceiro = async (id, data) => {
    try {
        const response = await api.put(`/parceiros/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar parceiro:", error);
        throw error;
    }
};

export const excluirParceiro = async (id) => {
    await api.delete(`/parceiros/${id}`);
};
