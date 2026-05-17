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

export async function syncFichaTecnicaFaccoes(fichaTecnicaId, faccoes) {
    const response = await api.post(`/fichas-tecnicas/${fichaTecnicaId}/faccoes/sync`, {
        faccoes,
    });
    return unwrap(response);
}

export async function updateFaccaoProdutoPrice(produtoId, faccaoId, preco) {
    // TODO: ajuste o path caso o seu backend use outra rota para faccao-produto.
    const response = await api.put(`/faccao-produtos/${produtoId}/${faccaoId}`, {
        preco,
    });
    return unwrap(response);
}
