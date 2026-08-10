import api from "./api"; // Importe a sua instância configurada do Axios

export const listarTecidos = async () => {
    const response = await api.get("/tecidos");
    return response.data;
};

export const listarTecidosPorFabrico = async (idFabrico) => {
    const response = await api.get(`/tecidos/fabrico/${idFabrico}`);
    return response.data;
};

export const obterTecidoPorId = async (id) => {
    const response = await api.get(`/tecidos/${id}`);
    return response.data;
};

export const criarTecido = async (dadosTecido) => {
    const response = await api.post("/tecidos", dadosTecido);
    return response.data;
};

export const atualizarTecido = async (id, dadosTecido) => {
    const response = await api.put(`/tecidos/${id}`, dadosTecido);
    return response.data;
};

export const deletarTecido = async (id) => {
    const response = await api.delete(`/tecidos/${id}`);
    return response.data;
};
