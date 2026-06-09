import api from "./api";

export const getFichaTecnicaByFabrico = async (fabricoId) => {
    const response = await api.get(`/fichas-tecnicas/fabrico/${fabricoId}`);
    return response.data;
};

export const updateEtapaFichaTecnica = async (id, novaEtapa) => {
    const response = await api.put(`/fichas-tecnicas/${id}`, {
        etapa_atual_id: novaEtapa,
    });
    return response.data;
};

// FICHA-ETAPA
export const getFichaEtapaByFichaTecnica = async (ficha_tecnica_id) => {
    const response = await api.get(`/fichas-etapas/ficha-tecnica/${ficha_tecnica_id}`);

    return response.data;
};

export const iniciarFichaEtapa = async (ficha_tecnica_id, etapa_id) => {
    const response = await api.post(`/fichas-etapas`, {
        ficha_tecnica_id,
        etapa_id,
        data_inicio: new Date().toISOString(),
    });

    return response.data;
};

export const finalizarFichaEtapa = async (ficha_etapa_id) => {
    const response = await api.put(`/fichas-etapas/${ficha_etapa_id}`, {
        data_fim: new Date().toISOString(),
    });

    return response.data;
};
