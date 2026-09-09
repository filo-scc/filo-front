import api from "./api";

function responseBody(response) {
    return response?.data ?? response;
}

export async function getOperationalSummary() {
    const response = await api.get("/dashboard/resumo-operacional");
    return responseBody(response);
}

export async function getProductionSeries(period = "semanal", intervalCount = 7) {
    const response = await api.get("/dashboard/serie-producao", {
        params: { periodo: period, quantidade: intervalCount },
    });
    return responseBody(response);
}
