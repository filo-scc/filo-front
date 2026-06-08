import api from "./api"; // Sua configuração do axios

// Busca todos os parceiros atrelados a uma Ficha Técnica (Traz a relação + os dados do parceiro)
export const getFichaParceiroByFicha = async (fichaId) => {
    const response = await api.get(`/fichas-tecnicas/${fichaId}/parceiros`);
    return response.data;
};

// Faz o papel do UPSERT inteligentemente no frontend
export const upsertFichaTecnicaParceiro = async (ficha_id, parceiro_id, data) => {
    try {
        // Tenta atualizar a relação existente (PUT)
        return await api.put(`/fichas-tecnicas/${ficha_id}/parceiros/${parceiro_id}`, data);
    } catch (error) {
        // Se retornar 404 (Não Encontrado), significa que a relação não existe, então criamos (POST)
        if (error.response?.status === 404) {
            return await api.post(`/fichas-tecnicas/parceiros`, {
                ficha_id,
                parceiro_id,
                ...data,
            });
        }
        throw error;
    }
};
