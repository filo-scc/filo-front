import api from "./api";

export const criarProduto = async (data) => {
    const response = await api.post("/produtos", data);
    return response.data;
};

export const atualizarProduto = async (id, data) => {
    const response = await api.put(`/produtos/${id}`, data);
    return response.data;
};

export const getGradesByFabrico = async (fabricoId) => {
    const response = await api.get(`/fabrico-grades/fabrico/${fabricoId}`);
    return response.data;
};

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

export const getTecidosByFabrico = async (fabricoId) => {
    const response = await api.get(`/tecidos/fabrico/${fabricoId}`);
    return response.data;
};
