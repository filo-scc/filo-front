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

export const getParceiroByProduto = async (produtoId) => {
    try {
        const response = await api.get(`/parceiros-produtos/produto/${produtoId}`);

        return response.data;
    } catch (error) {
        console.error("Erro ao buscar parceiros do produto:", error);
        throw error;
    }
};

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

export const getAviamentosByFabrico = async (fabricoId) => {
    const response = await api.get(`/aviamentos/fabrico/${fabricoId}`);
    return response.data;
};

export const getTiposProdutoByFabrico = async () => {
    const response = await api.get("/tipo-produto");
    return response.data;
};

export const criarTipoProduto = async (data) => {
    const response = await api.post("/tipo-produto", data);
    return response.data;
};

export const vincularProdutoAviamento = async (data) => {
    const response = await api.post("/produto-aviamento", data);
    return response.data;
};

export const desvincularProdutoAviamento = async (produtoAviamentoId) => {
    const response = await api.delete(`/produto-aviamento/${produtoAviamentoId}`);
    return response.data;
};

export const getAviamentosDoProduto = async (produtoId) => {
    try {
        const response = await api.get(`/produto-aviamento/produto/${produtoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar aviamentos do produto:", error);
        return [];
    }
};
