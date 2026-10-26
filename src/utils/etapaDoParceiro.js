const normalizar = (valor) =>
    String(valor ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .replace(/\s+/g, " ");

// A etapa de costura ainda é reconhecida pelo NOME da etapa vinculada ao parceiro (DEV-545 trata
// a marcação definitiva no banco). Basta o nome conter uma destas palavras, então renomear
// "Costura" para "Costura Final" não tira a etapa do filtro.
const PALAVRAS_DA_ETAPA_DE_COSTURA = ["costur", "faccao", "confeccao"];

export const indexarEtapasPorId = (etapas) =>
    new Map(
        (Array.isArray(etapas) ? etapas : [])
            .filter((etapa) => etapa?.id !== null && etapa?.id !== undefined)
            .map((etapa) => [Number(etapa.id), etapa]),
    );

// Quem vem de GET /parceiros traz `etapa`; o parceiro aninhado em ficha, produto e transferência
// traz só `etapa_id`, e o nome sai do mapa de etapas carregado pela tela.
export const nomeEtapaDoParceiro = (parceiro, etapasPorId) => {
    if (parceiro?.etapa?.nome) return parceiro.etapa.nome;
    if (parceiro?.etapa_id === null || parceiro?.etapa_id === undefined) return "";

    return etapasPorId?.get(Number(parceiro.etapa_id))?.nome ?? "";
};

export const parceiroEhDaEtapa = (parceiro, etapaId) =>
    parceiro?.etapa_id !== null &&
    parceiro?.etapa_id !== undefined &&
    etapaId !== null &&
    etapaId !== undefined &&
    Number(parceiro.etapa_id) === Number(etapaId);

export const ehEtapaDeCostura = (nomeEtapa) => {
    const nome = normalizar(nomeEtapa);

    return nome !== "" && PALAVRAS_DA_ETAPA_DE_COSTURA.some((palavra) => nome.includes(palavra));
};

export const ehParceiroDeCostura = (parceiro, etapasPorId) =>
    ehEtapaDeCostura(nomeEtapaDoParceiro(parceiro, etapasPorId));

// O parceiro aninhado em ficha_parceiro vem só com `etapa_id`. A tela que carrega a ficha anexa
// a etapa uma vez, na origem, e os filtros depois só olham `parceiro.etapa`.
export const anexarEtapaAosParceiros = (ficha, etapasPorId) => {
    if (!Array.isArray(ficha?.ficha_parceiro)) return ficha;

    return {
        ...ficha,
        ficha_parceiro: ficha.ficha_parceiro.map((vinculo) => {
            if (!vinculo?.parceiro || vinculo.parceiro.etapa) return vinculo;

            const etapa = etapasPorId?.get(Number(vinculo.parceiro.etapa_id)) ?? null;

            return { ...vinculo, parceiro: { ...vinculo.parceiro, etapa } };
        }),
    };
};
