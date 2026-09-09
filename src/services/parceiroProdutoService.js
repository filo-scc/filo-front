import api from "./api";

const normalizarPrecoOpcional = (preco) => {
    if (preco === null || preco === undefined || preco === "") return null;

    const valorNumerico = Number(String(preco).replace("R$", "").replace(",", ".").trim());
    return Number.isFinite(valorNumerico) && valorNumerico > 0 ? valorNumerico : null;
};

export const getVinculoParceiroProduto = async (parceiroId, produtoId) => {
    try {
        const response = await api.get(`/parceiros-produtos/${parceiroId}/${produtoId}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const criarParceiroProduto = async (parceiroId, produtoId, preco) => {
    const response = await api.post(`/parceiros-produtos/${parceiroId}/${produtoId}`, {
        preco: normalizarPrecoOpcional(preco),
    });
    return response.data;
};

export const atualizarParceiroProduto = async (parceiroId, produtoId, preco) => {
    const response = await api.put(`/parceiros-produtos/${parceiroId}/${produtoId}`, {
        preco: normalizarPrecoOpcional(preco),
    });
    return response.data;
};
