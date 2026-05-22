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
