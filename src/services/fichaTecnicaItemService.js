import api from "./api";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export async function replaceMatriz(fichaTecnicaId, itens) {
    const response = await api.put(`/fichas-tecnicas/${fichaTecnicaId}/matriz`, {
        itens,
    });
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
