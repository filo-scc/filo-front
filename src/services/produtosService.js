import api from "./api";

export const getProdutoById = async (id) => {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
};

export const getClientesDoProduto = async (id) => {
    const response = await api.get(`/clientes-produtos/produto/${id}`);
    return response.data;
};

export const excluirProduto = async (id) => {
    const response = await api.delete(`/produtos/${id}`);
    return response.data;
};
