import api from "./api"; // Ajuste para a sua importação do axios

export const getFichaParceiroByFicha = async (ficha_id) => {
    const response = await api.get(`/fichas-tecnicas/${ficha_id}/parceiros`);
    return response.data;
};

// Faz o GET de uma relação específica para avaliar se existe
export const getFichaParceiroById = async (ficha_id, parceiro_id) => {
    const response = await api.get(`/fichas-tecnicas/${ficha_id}/parceiros/${parceiro_id}`);
    return response.data;
};

// Cria a nova relação (POST)
export const createFichaTecnicaParceiro = async (data) => {
    const response = await api.post(`/fichas-tecnicas/parceiros`, data);
    return response.data;
};

// Atualiza a relação existente (PUT)
export const updateFichaTecnicaParceiro = async (ficha_id, parceiro_id, data) => {
    const response = await api.put(`/fichas-tecnicas/${ficha_id}/parceiros/${parceiro_id}`, data);
    return response.data;
};
