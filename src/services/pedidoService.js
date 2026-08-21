import api from "./api";

export const createPedido = async (pedidoData) => {
    try {
        const response = await api.post("/pedidos", pedidoData);
        return response.data;
    } catch (error) {
        console.error("Error creating pedido:", error);
        throw error;
    }
};

export const getPedidosByFabricoId = async (fabricoId) => {
    try {
        const response = await api.get(`/pedidos/fabrico/${fabricoId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching pedidos:", error);
        throw error;
    }
};

export const deletPedido = async (pedido_id) => {
    try {
        await api.delete(`/pedidos/${pedido_id}`);
    } catch (error) {
        console.error("Erro ao deletar o pedido", error);
        throw error;
    }
};

export const updatePedido = async (pedido_id, pedidoData) => {
    try {
        const response = await api.put(`/pedidos/${pedido_id}`, pedidoData);
        return response;
    } catch (error) {
        console.error("Erro ao editar pedido", error);
        throw error;
    }
};
