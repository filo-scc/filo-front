import api from './api';

export const getFaccoesByFabrico = async (fabricoId) => {
  try {
    const response = await api.get(`/faccoes/fabrico/${fabricoId}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar facções do fabrico:", error);
    throw error;
  }
};