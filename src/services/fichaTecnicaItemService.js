import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function syncFichaTecnicaCores(fichaTecnicaId, coresIds) {
    const response = await api.post(`/fichas-tecnicas/${fichaTecnicaId}/cores/sync`, {
        cores_ids: coresIds,
    });
    return unwrap(response);
}

export async function updateFichaTecnicaItem(fichaIemId, data) {
    const response = await api.put(`fichas-tecnicas/itens/${fichaIemId}`, data);
    return unwrap(response);
}

export async function deleteFichaTecnicaItem(fichaItemId) {
    const response = await api.delete(`fichas-tecnicas/itens/${fichaItemId}`);
    return unwrap(response);
}

export async function createFichaTecnicaItem(fichaTecnicaId, data) {
    const response = await api.post(`/fichas-tecnicas/item/${fichaTecnicaId}`, data);
    return unwrap(response);
}

export async function removeFichaTecnicaCores(fichaTecnicaId, coresIds) {
    const response = await api.delete(`/fichas-tecnicas/${fichaTecnicaId}/cores`, {
        data: { cores_ids: coresIds },
    });
    return unwrap(response);
}

export async function saveFichaTecnicaItens(fichaTecnicaId, itens) {
    const response = await api.post(`/fichas-tecnicas/${fichaTecnicaId}/itens`, {
        itens,
    });
    return unwrap(response);
}

export async function clearFichaTecnicaItens(fichaTecnicaId) {
    const response = await api.delete(`/fichas-tecnicas/${fichaTecnicaId}/itens`);
    return unwrap(response);
}

export async function getProdutoParceiro(produtoId, parceiroId) {
    const response = await api.get(`/parceiros-produtos/${parceiroId}/${produtoId}`);
    return unwrap(response);
}

export async function updateParceiroProdutoPrice(parceiroId, produtoId, preco) {
    const response = await api.put(`/parceiros-produtos/${parceiroId}/${produtoId}`, {
        preco,
    });

    return unwrap(response);
}

export async function createParceiroProduto(parceiroId, produtoId, preco) {
    const response = await api.post(`/parceiros-produtos/${parceiroId}/${produtoId}`, {
        preco,
    });

    return unwrap(response);
}
