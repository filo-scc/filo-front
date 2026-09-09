import api from "./api";

const sanitizeCatalogPayload = (payload = {}) => {
    const { ...rest } = payload;
    return rest;
};

export const getProdutos = async () => {
    try {
        const response = await api.get("/produtos");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return [];
    }
};



export const getParceiroByProduto = async (produtoId) => {
    try {
        const response = await api.get(`/parceiros-produtos/produto/${produtoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar parceiros do produto:", error);
        return [];
    }
};

export const criarProduto = async (data) => {
    try {
        const response = await api.post("/produtos", sanitizeCatalogPayload(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        throw error;
    }
};

export const atualizarProduto = async (id, data) => {
    try {
        const response = await api.put(`/produtos/${id}`, sanitizeCatalogPayload(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        throw error;
    }
};

export const getGrades = async () => {
    try {
        const response = await api.get("/fabrico-grades");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar grades do fabrico:", error);
        return [];
    }
};

export const getProdutoById = async (id) => {
    try {
        const response = await api.get(`/produtos/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar produto por id:", error);
        return null;
    }
};

export const getClientesDoProduto = async (id) => {
    try {
        const response = await api.get(`/clientes-produtos/produto/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar clientes do produto:", error);
        return [];
    }
};

export const excluirProduto = async (id) => {
    try {
        const response = await api.delete(`/produtos/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        throw error;
    }
};

export const getTecidos = async () => {
    try {
        const response = await api.get("/tecidos");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar tecidos do fabrico:", error);
        return [];
    }
};

export const getAviamentos = async () => {
    try {
        const response = await api.get("/aviamentos");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar aviamentos do fabrico:", error);
        return [];
    }
};

export const getTiposProduto = async () => {
    try {
        const response = await api.get("/tipo-produto");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar tipos de produto:", error);
        return [];
    }
};

export const criarTipoProduto = async (data) => {
    try {
        const response = await api.post("/tipo-produto", sanitizeCatalogPayload(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao criar tipo de produto:", error);
        throw error;
    }
};

export const vincularProdutoAviamento = async (data) => {
    try {
        const response = await api.post("/produto-aviamento", sanitizeCatalogPayload(data));
        return response.data;
    } catch (error) {
        console.error("Erro ao vincular aviamento ao produto:", error);
        throw error;
    }
};

export const desvincularProdutoAviamento = async (produtoAviamentoId) => {
    try {
        const response = await api.delete(`/produto-aviamento/${produtoAviamentoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao desvincular aviamento do produto:", error);
        throw error;
    }
};

export const atualizarProdutoAviamento = async (produtoAviamentoId, data) => {
    try {
        const response = await api.patch(
            `/produto-aviamento/${produtoAviamentoId}`,
            sanitizeCatalogPayload(data),
        );
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar aviamento do produto:", error);
        throw error;
    }
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
