export const getEnderecoByCep = async (cep) => {
    const cepLimpo = String(cep ?? "").replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        return null;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        if (data.erro) {
            return null;
        }

        return {
            rua: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
        };
    } catch (error) {
        console.error("Erro na busca do CEP:", error);
        return null;
    }
};
