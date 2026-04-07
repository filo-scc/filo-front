import api from "./api";
import { getMe } from "./authService";

export const getClientes = async () => {
  try {
    const usuarioLogado = await getMe();

    if (!usuarioLogado) return [];

    const response = await api.get(
      `clientes/fabrico/${usuarioLogado.fabrico_id}`,
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);

    throw error;
  }
};
