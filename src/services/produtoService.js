import api from "./api";

export const getProdutos = async () => {
    try {
        const response = await api.get("/produtos");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        throw error;
    }
};

export const getProdutosByFabrico = async (fabricoId) => {
    try {
        const response = await api.get(`/produtos/fabrico/${fabricoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar produtos do fabrico:", error);
        throw error;
    }
};
