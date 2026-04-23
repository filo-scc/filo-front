import api from "./api";

const limparUndefined = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([, valor]) => valor !== undefined),
  );
};

export const getClientes = async (fabricoId) => {
    try {
        const response = await api.get(`/clientes/fabrico/${fabricoId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
    }
};

// Buscar detalhes de um cliente específico
export const getClienteById = async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
};

// Buscar produtos vinculados ao cliente
export const getProdutosDoCliente = async (clienteId) => {
    const response = await api.get(`/clientes-produtos/cliente/${clienteId}`);
    return response.data;
};

// Função para buscar os produtos do fabrico (com busca opcional)
export const getProdutosPorFabrico = async (fabricoId, busca = "") => {
    const response = await api.get(`/produtos/fabrico/${fabricoId}`, {
        params: { busca },
    });

    return response.data;
};

// Função para vincular o produto ao cliente
export const vincularProdutoAoCliente = async (clienteId, produtoId, body) => {
    const response = await api.post(`/clientes-produtos/${clienteId}/${produtoId}`, body);
    return response.data;
};

export const getUnassociatedProductsForClient = async (clienteId, fabricoId, body) => {
    const response = await api.get(
        `/produtos/cliente/${clienteId}/produtos-nao-associados/${fabricoId}`,
        body,
    );
    return response.data;
};

export const excluirCliente = async (clienteId) => {
    try {
        await api.delete(`/clientes/${clienteId}`);
    } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        throw error;
    }
};

// Cadastrar cliente (DTO compatível com backend)
export const cadastrarCliente = async (data) => {
  try {
    const endereco = limparUndefined(data?.endereco);
    const payloadBase = limparUndefined({
      nome: data?.nome,
      cnpj: data?.cnpj,
      telefone: data?.telefone,
      status: data?.status,
      responsavel: data?.responsavel,
      fabrico_id: data?.fabrico_id,
    });

    const payload =
      endereco && Object.keys(endereco).length > 0
        ? { ...payloadBase, endereco }
        : payloadBase;

    console.log("[clientesService] payload POST /clientes:", payload);

    const response = await api.post("/clientes", payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    throw error;
  }
};
