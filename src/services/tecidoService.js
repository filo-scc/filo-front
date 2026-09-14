import api from "./api";

const sanitizeCatalogPayload = (payload = {}) => {
    const { ...rest } = payload;
    return rest;
};

export const listarTecidos = async () => {
    try {
        const response = await api.get("/tecidos");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar tecidos:", error);
        return [];
    }
};

export const obterTecidoPorId = async (id) => {
    try {
        const response = await api.get(`/tecidos/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar tecido por id:", error);
        return null;
    }
};

export const criarTecido = async (dadosTecido) => {
    try {
        const response = await api.post("/tecidos", sanitizeCatalogPayload(dadosTecido));
        return response.data;
    } catch (error) {
        console.error("Erro ao criar tecido:", error);
        throw error;
    }
};

export const atualizarTecido = async (id, dadosTecido) => {
    try {
        const response = await api.put(`/tecidos/${id}`, sanitizeCatalogPayload(dadosTecido));
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar tecido:", error);
        throw error;
    }
};

export const deletarTecido = async (id) => {
    try {
        const response = await api.delete(`/tecidos/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao deletar tecido:", error);
        throw error;
    }
};
