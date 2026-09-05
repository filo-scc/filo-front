import api from "./api";

export const upload = async (data, fabricoId) => {
    try {
        if (fabricoId !== undefined && fabricoId !== null) {
            data.set("fabrico_id", String(fabricoId));
        }

        // Make a POST request to the /upload endpoint with the provided data
        // o corpo da requisição é form-data
        const response = await api.post("/upload", data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading photo:", error);
        throw error;
    }
};
