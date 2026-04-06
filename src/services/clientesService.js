import api from "./api";
import { getMe } from "./authService";

export const getClientes = async () => {
  try {
    const response = await api.get("/clientes");
    const todosClientes = response.data;

    const usuarioLogado = await getMe();

    if (!usuarioLogado) return [];

    // Filtra comparando o fabrico_id do Cliente com o fabrico_id do Usuário
    const clientesFiltrados = todosClientes.filter(
      (cliente) =>
        String(cliente.fabrico_id) === String(usuarioLogado.fabrico_id),
    );

    return clientesFiltrados;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);

    // A MUDANÇA É AQUI: Repassamos o erro adiante para que a tela consiga capturá-lo!
    throw error;
  }
};
