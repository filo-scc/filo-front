import api from "./api";

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
  const response = await api.post(
    `/clientes-produtos/${clienteId}/${produtoId}`,
    body,
  );
  return response.data;
};
