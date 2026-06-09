import api from "./api"; // Sua instância do axios

// Puxa o histórico de etapas daquela Ficha Técnica
export const getAllFichaEtapaByFichaTecnica = async (fichaTecnicaId) => {
    const response = await api.get(`/fichas-etapas/ficha-tecnica/${fichaTecnicaId}`);
    return response.data;
};

// Cria uma nova etapa para a Ficha (equivalente ao "iniciarFichaEtapa")
export const createFichaEtapa = async (data) => {
    // data deve conter: { ficha_tecnica_id, etapa_id, data_inicio }
    const response = await api.post(`/fichas-etapas`, data);
    return response.data;
};

// Atualiza a etapa atual colocando a data_fim nela (equivalente ao "finalizarFichaEtapa")
export const updateFichaEtapa = async (id, data) => {
    // Presumi que o endpoint de update no seu backend é um PUT passando o ID
    const response = await api.put(`/fichas-etapas/${id}`, data);
    return response.data;
};
