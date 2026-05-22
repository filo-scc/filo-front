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
