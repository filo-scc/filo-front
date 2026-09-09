import api from "./api";

const semFabricoId = (data) => {
    const payload = { ...(data || {}) };
    delete payload.fabrico_id;
    return payload;
};

export const getParceiros = async () => {
    try {
        const response = await api.get("/parceiros");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar parceiros:", error);
        throw error;
    }
};

export const getParceiroById = async (id) => {
    const response = await api.get(`/parceiros/${id}`);
    return response.data;
};

export const createParceiro = async (data) => {
    try {
        const response = await api.post("/parceiros", semFabricoId(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao cadastrar um parceiro: ", error);
        throw error;
    }
};

export const updateParceiro = async (id, data) => {
    try {
        const response = await api.put(`/parceiros/${id}`, semFabricoId(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar parceiro:", error);
        throw error;
    }
};

export const excluirParceiro = async (id) => {
    await api.delete(`/parceiros/${id}`);
};

export const getParceirosByCategoria = async (categoria) => {
    try {
        const response = await api.get(`/parceiros/categoria/${encodeURIComponent(categoria)}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar parceiros por categoria:", error);
        throw error;
    }
};