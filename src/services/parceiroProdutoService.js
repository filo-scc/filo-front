import api from "./api";

const parceiroProdutoService = {
    buscarVinculo: async (parceiroId, produtoId) => {
        try {
            const response = await api.get(`/parceiros-produtos/${parceiroId}/${produtoId}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    },

    criar: async (parceiroId, produtoId, preco) => {
        const response = await api.post(`/parceiros-produtos/${parceiroId}/${produtoId}`, {
            preco: parseFloat(preco) || 0,
        });
        return response.data;
    },

    atualizar: async (parceiroId, produtoId, preco) => {
        const response = await api.put(`/parceiros-produtos/${parceiroId}/${produtoId}`, {
            preco: parseFloat(preco) || 0,
        });
        return response.data;
    },
};

export default parceiroProdutoService;
