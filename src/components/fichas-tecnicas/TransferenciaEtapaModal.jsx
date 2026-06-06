import React, { useState, useEffect, useRef, useMemo } from "react";
import { getAllEtapasByFabricoId } from "../../services/etapaService";
import { getParceirosByFabrico } from "../../services/parceiroService";
import { updateParceiroProdutoPrice } from "../../services/fichaTecnicaItemService";
import {
    getAllParceirosByFichaTecnicaId,
    upsertFichaTecnicaParceiro,
    finalizarFichaEtapa,
    iniciarFichaEtapa,
    getFichaEtapaByFichaTecnica,
} from "../../services/fichasTecnicasService";

export default function TransferenciaEtapaModal({
    isOpen,
    onClose,
    fichaTecnica, // { id, quantidade, produto_id, ... }
    fabricoId,
    etapaConcluida, // { id, nome, ... } (Etapa que a FT estava)
    proximaEtapa, // { id, nome, ... } (Etapa para onde a FT vai)
    onSuccess, // Callback para recarregar o Kanban após transferir
}) {
    // --- Estados ---
    const [etapas, setEtapas] = useState([]);
    const [parceirosDisponiveis, setParceirosDisponiveis] = useState([]);
    const [linhasTabela, setLinhasTabela] = useState([]);

    const [buscaParceiro, setBuscaParceiro] = useState("");
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Refs para controle de clique fora do dropdown
    const dropdownRef = useRef(null);

    // --- Máscaras e Utilitários de Formatação ---
    const formatarMoedaBR = (valor) => {
        const limpo = String(valor).replace(/\D/g, "");
        const numero = Number(limpo) / 100;
        return numero.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    const converterMoedaParaFloat = (stringMoeda) => {
        if (!stringMoeda) return 0;
        const limpo = stringMoeda.replace(/[^\d]/g, "");
        return Number(limpo) / 100;
    };

    // --- Carga Inicial de Dados ---
    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoading(true);
            try {
                // 1. Buscar todas as etapas do fabrico
                const listaEtapas = await getAllEtapasByFabricoId(fabricoId);
                const ativasEOrdenadas = listaEtapas
                    .filter((e) => e.ativa)
                    .sort((a, b) => a.ordem - b.ordem);
                setEtapas(ativasEOrdenadas);

                // 2. Buscar parceiros do fabrico filtrando pela categoria da etapa concluída
                const listaParceiros = await getParceirosByFabrico(fabricoId);
                const filtradosPorCategoria = listaParceiros.filter(
                    (p) => p.categoria?.toLowerCase() === etapaConcluida.nome?.toLowerCase(),
                );
                setParceirosDisponiveis(filtradosPorCategoria);

                // 3. Buscar parceiros já associados a esta Ficha Técnica
                const parceirosExistentes = await getAllParceirosByFichaTecnicaId(fichaTecnica.id);
                const jaVinculadosDestaEtapa = parceirosExistentes
                    .filter(
                        (p) => p.categoria?.toLowerCase() === etapaConcluida.nome?.toLowerCase(),
                    )
                    .map((p) => ({
                        id: p.id,
                        nome: p.nome,
                        operacao: p.operacao || "",
                        quantidade: p.quantidade || fichaTecnica.quantidade,
                        custoTotalFormatado: formatarMoedaBR(p.custo ? p.custo * 100 : 0),
                    }));

                setLinhasTabela(jaVinculadosDestaEtapa);
            } catch (error) {
                console.error("Erro ao carregar dados do modal de transferência:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && fabricoId && fichaTecnica?.id) {
            carregarDadosIniciais();
        }
    }, [isOpen, fabricoId, fichaTecnica, etapaConcluida]);

    // --- Fechamento do Dropdown ao clicar fora ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Filtragem Dinâmica do Dropdown ---
    const parceirosFiltrados = useMemo(() => {
        return parceirosDisponiveis.filter((p) => {
            const jaAdicionado = linhasTabela.some((linha) => linha.id === p.id);
            const bateBusca = p.nome?.toLowerCase().includes(buscaParceiro.toLowerCase());
            return !jaAdicionado && bateBusca;
        });
    }, [parceirosDisponiveis, linhasTabela, buscaParceiro]);

    // --- Ações da Tabela ---
    const adicionarParceiroNaTabela = (parceiro) => {
        const novaLinha = {
            id: parceiro.id,
            nome: parceiro.nome,
            operacao: "",
            // Se for o primeiro, assume o total. Se já existirem outros, inicia zerado para validação forçar o ajuste
            quantidade: linhasTabela.length === 0 ? fichaTecnica.quantidade : 0,
            custoTotalFormatado: formatarMoedaBR(0),
        };
        setLinhasTabela([...linhasTabela, novaLinha]);
        setBuscaParceiro("");
        setDropdownAberto(false);
    };

    const removerParceiroDaTabela = (id) => {
        setLinhasTabela(linhasTabela.filter((linha) => linha.id !== id));
    };

    const atualizarCampoLinha = (id, campo, valor) => {
        setLinhasTabela(
            linhasTabela.map((linha) => {
                if (linha.id !== id) return linha;
                if (campo === "custoTotalFormatado") {
                    return { ...linha, [campo]: formatarMoedaBR(valor) };
                }
                return { ...linha, [campo]: valor };
            }),
        );
    };

    // --- Cálculos de Validação de Quantidade ---
    const somaQuantidades = useMemo(() => {
        return linhasTabela.reduce((acc, curr) => acc + Number(curr.quantidade || 0), 0);
    }, [linhasTabela]);

    const quantidadeValida = useMemo(() => {
        if (linhasTabela.length <= 1) return true;
        return somaQuantidades === fichaTecnica.quantidade;
    }, [linhasTabela, somaQuantidades, fichaTecnica]);

    if (!isOpen) return null;

    // --- Submit / Processamento da Transferência ---
    const handleTransferir = async () => {
        if (linhasTabela.length === 0 || !quantidadeValida) return;

        setSubmitting(true);
        try {
            for (const linha of linhasTabela) {
                const custoTotal = converterMoedaParaFloat(linha.custoTotalFormatado);
                const qtdAlocada =
                    linhasTabela.length === 1 ? fichaTecnica.quantidade : Number(linha.quantidade);

                // Evita divisão por zero boba
                const precoUnitario = qtdAlocada > 0 ? custoTotal / qtdAlocada : 0;

                // Passos de Negócio mapeados:
                // 1. Atualizar preço da relação parceiro_produto
                await updateParceiroProdutoPrice(linha.id, fichaTecnica.produto_id, precoUnitario);

                // 2. Criar ou atualizar o registro de ficha_tecnica_parceiro
                await upsertFichaTecnicaParceiro({
                    ficha_tecnica_id: fichaTecnica.id,
                    parceiro_id: linha.id,
                    operacao: linha.operacao,
                    custo: custoTotal,
                    quantidade: qtdAlocada,
                });
            }

            // 3. Finalizar etapa concluída (Passando a data_fim como agora)
            const fichas_etapas = await getFichaEtapaByFichaTecnica(fichaTecnica.id);

            const ficha_etapa_concluida = fichas_etapas.find(
                (fe) => fe.etapa_id === etapaConcluida.id,
            );

            await finalizarFichaEtapa(ficha_etapa_concluida.id);

            // 4. Iniciar a nova etapa do fluxo
            await iniciarFichaEtapa({
                ficha_tecnica_id: fichaTecnica.id,
                etapa_id: proximaEtapa.id,
                data_inicio: new Date().toISOString(),
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Falha ao processar a transferência de etapa:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 font-['Outfit']">
            {/* Modal Container */}
            <div className="relative w-full max-w-4xl rounded-[24px] bg-white p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/icons/transfer-header-icon.png"
                            alt="Ícone"
                            className="w-6 h-6 object-contain"
                        />
                        <h2 className="text-[22px] font-medium text-[#2E3133]">
                            Transferência de Etapa da Produção
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                    >
                        <img src="/icons/x.png" alt="Fechar" className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center text-gray-400">
                        Carregando informações da etapa...
                    </div>
                ) : (
                    <>
                        {/* ---------------- BARRA DE PROGRESSÃO DINÂMICA ---------------- */}
                        <div className="w-full overflow-x-auto pb-6 mb-8 scrollbar-thin">
                            <div className="flex items-center min-w-max px-2">
                                {etapas.map((etapa, idx) => {
                                    // Definição de index das etapas de controle do fluxo
                                    const idxProxima = etapas.findIndex(
                                        (e) => e.id === proximaEtapa.id,
                                    );
                                    const isConcluida = idx < idxProxima;

                                    // Lógica dos Ícones informada por você
                                    const linkIcone = isConcluida
                                        ? etapa.icone_verde?.link
                                        : etapa.icone?.link;

                                    // Lógica de Estilização das caixas (83px X 83px, radius 30px)
                                    const estiloCaixa = isConcluida
                                        ? "bg-[#FBFFF0] border-[#B4D64E] text-[#B4D64E]"
                                        : "bg-white border-[#D9D9D9] text-[#898C8F]";

                                    return (
                                        <React.Fragment key={etapa.id}>
                                            {/* Caixa da Etapa */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div
                                                    className={`w-[83px] h-[83px] rounded-[30px] border flex items-center justify-center transition-all ${estiloCaixa}`}
                                                    title={etapa.descricao}
                                                >
                                                    {linkIcone && (
                                                        <img
                                                            src={linkIcone}
                                                            alt={etapa.nome}
                                                            className="w-10 h-10 object-contain"
                                                        />
                                                    )}
                                                </div>
                                                <span
                                                    className={`text-[16px] font-normal tracking-wide ${isConcluida ? "text-[#B4D64E]" : "text-[#898C8F]"}`}
                                                >
                                                    {etapa.nome}
                                                </span>
                                            </div>

                                            {/* Linha Conectora (Se não for a última etapa) */}
                                            {idx < etapas.length - 1 &&
                                                (() => {
                                                    const proxEtapaLista = etapas[idx + 1];
                                                    const estaConcluida = idx < idxProxima;
                                                    const proximaConcluida = idx + 1 < idxProxima;

                                                    let estiloLinha = {
                                                        backgroundColor: "#D9D9D9",
                                                    };

                                                    if (estaConcluida && proximaConcluida) {
                                                        estiloLinha = {
                                                            backgroundColor: "#B4D64E",
                                                        };
                                                    } else if (
                                                        etapa.id === etapaConcluida.id &&
                                                        proxEtapaLista.id === proximaEtapa.id
                                                    ) {
                                                        // Caso Especial: Gradiente Linear entre Concluída e Próxima
                                                        estiloLinha = {
                                                            backgroundImage:
                                                                "linear-gradient(90deg, #B4D64E 0%, #D9D9D9 100%)",
                                                        };
                                                    }

                                                    return (
                                                        <div
                                                            className="h-[2px] w-16 -mt-6 mx-2 transition-all"
                                                            style={estiloLinha}
                                                        />
                                                    );
                                                })()}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ---------------- DROPDOWN SELETOR DE PARCEIROS ---------------- */}
                        <div className="mb-6 relative" ref={dropdownRef}>
                            <label className="block text-[16px] font-light text-[#7b7d80] mb-2">
                                Registrar custo do(a) {etapaConcluida.nome}
                            </label>

                            {/* Input container baseado no FichaTecnicaModal */}
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={buscaParceiro}
                                    onFocus={() => setDropdownAberto(true)}
                                    onChange={(e) => setBuscaParceiro(e.target.value)}
                                    placeholder="Digite para buscar e filtrar colaboradores..."
                                    className="w-full h-[45px] rounded-[10px] border border-[#898C8F] bg-white px-4 text-[14px] outline-none placeholder:text-gray-400 focus:border-[#B4D64E] transition-all"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    ▼
                                </span>
                            </div>

                            {/* Menu Suspenso */}
                            {dropdownAberto && (
                                <ul className="absolute left-0 right-0 top-[50px] z-50 max-h-[220px] overflow-y-auto rounded-[10px] border border-gray-200 bg-white shadow-xl py-1">
                                    {parceirosFiltrados.length === 0 ? (
                                        <li className="px-4 py-3 text-[14px] text-gray-400 italic">
                                            Nenhum colaborador disponível para esta categoria
                                        </li>
                                    ) : (
                                        parceirosFiltrados.map((parceiro) => (
                                            <li
                                                key={parceiro.id}
                                                onClick={() => adicionarParceiroNaTabela(parceiro)}
                                                className="px-4 py-2.5 text-[14px] text-gray-700 hover:bg-[#FBFFF0] hover:text-[#B4D64E] cursor-pointer transition-colors flex justify-between items-center"
                                            >
                                                <span className="font-medium">{parceiro.nome}</span>
                                                <span className="text-[12px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                    {parceiro.categoria}
                                                </span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>

                        {/* ---------------- TABELA DE LANÇAMENTO DE CUSTOS ---------------- */}
                        <div className="mb-6 overflow-hidden border border-gray-100 rounded-[16px]">
                            <table className="w-full border-collapse text-left text-[14px]">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                        <th className="p-4">Colaborador</th>
                                        <th className="p-4">Operação</th>
                                        {linhasTabela.length > 1 && (
                                            <th className="p-4 w-[160px]">Total de Peças</th>
                                        )}
                                        <th className="p-4 w-[200px]">Custo Total</th>
                                        <th className="p-4 w-[60px] text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {linhasTabela.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={linhasTabela.length > 1 ? 5 : 4}
                                                className="p-8 text-center text-gray-400 italic"
                                            >
                                                Nenhum colaborador adicionado para esta etapa ainda.
                                                Selecione um acima.
                                            </td>
                                        </tr>
                                    ) : (
                                        linhasTabela.map((linha) => (
                                            <tr
                                                key={linha.id}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                {/* Colaborador - Imutável */}
                                                <td className="p-4 font-medium text-gray-700 cursor-not-allowed select-none">
                                                    {linha.nome}
                                                </td>

                                                {/* Operação */}
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={linha.operacao}
                                                        onChange={(e) =>
                                                            atualizarCampoLinha(
                                                                linha.id,
                                                                "operacao",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Ex: Pesponto de cós"
                                                        className="w-full h-[36px] px-3 rounded-[8px] border border-gray-200 outline-none focus:border-[#B4D64E] text-[14px]"
                                                    />
                                                </td>

                                                {/* Total de Peças (Condicional) */}
                                                {linhasTabela.length > 1 && (
                                                    <td className="p-4">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={linha.quantidade}
                                                            onChange={(e) => {
                                                                const val = Math.max(
                                                                    0,
                                                                    parseInt(e.target.value) || 0,
                                                                );
                                                                atualizarCampoLinha(
                                                                    linha.id,
                                                                    "quantidade",
                                                                    val,
                                                                );
                                                            }}
                                                            className="w-full h-[36px] px-3 rounded-[8px] border border-gray-200 outline-none focus:border-[#B4D64E] text-[14px]"
                                                        />
                                                    </td>
                                                )}

                                                {/* Custo Total (Com máscara R$) */}
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={linha.custoTotalFormatado}
                                                        onChange={(e) =>
                                                            atualizarCampoLinha(
                                                                linha.id,
                                                                "custoTotalFormatado",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full h-[36px] px-3 rounded-[8px] border border-gray-200 outline-none font-mono focus:border-[#B4D64E] text-[14px] text-right"
                                                    />
                                                </td>

                                                {/* Ação de Remover */}
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() =>
                                                            removerParceiroDaTabela(linha.id)
                                                        }
                                                        className="text-red-400 hover:text-red-600 transition-colors text-[18px] font-bold p-1"
                                                    >
                                                        &times;
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ---------------- ALERTAS DE VALIDAÇÃO ESTÉTICOS ---------------- */}
                        {!quantidadeValida && (
                            <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[12px] text-[14px]">
                                <span className="text-[18px]">⚠️</span>
                                <div>
                                    <p className="font-semibold">
                                        Divergência na Quantidade de Peças
                                    </p>
                                    <p className="opacity-90">
                                        A soma das peças distribuídas (
                                        <strong>{somaQuantidades}</strong>) não bate com o total da
                                        Ficha Técnica (<strong>{fichaTecnica.quantidade}</strong>{" "}
                                        peças). Ajuste os valores para prosseguir.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ---------------- FOOTER / AÇÕES DO MODAL ---------------- */}
                        <div className="flex justify-between items-center border-t border-gray-100 pt-6 mt-6">
                            <div className="text-[14px] text-gray-400">
                                Total da Ficha:{" "}
                                <span className="font-semibold text-gray-700">
                                    {fichaTecnica.quantidade} pçs
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="px-6 h-[45px] rounded-[10px] text-gray-500 border border-gray-200 font-medium hover:bg-gray-50 transition-colors text-[15px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTransferir}
                                    disabled={
                                        submitting || linhasTabela.length === 0 || !quantidadeValida
                                    }
                                    className={`px-6 h-[45px] rounded-[10px] font-medium text-white transition-all text-[15px] ${
                                        linhasTabela.length === 0 || !quantidadeValida
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-[#B4D64E] hover:bg-[#a3c343] active:scale-95"
                                    }`}
                                >
                                    {submitting ? "Processando..." : "Concluir Transferência"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
