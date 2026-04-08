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
