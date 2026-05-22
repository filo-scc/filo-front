import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaFichaTecnica from "../components/pedidos/TabelaReferenciaFichaTecnica";
import {
    getClientes,
    getProdutosDoCliente,
    getProdutosPorFabrico,
} from "../services/clientesService";
import { getFabricoById } from "../services/fabricoService";
import FichaTecnicaModal from "../components/fichas-tecnicas/FichaTecnicaModal";

import { atualizarProduto } from "../services/produtoService";
import { createFichaTecnica } from "../services/fichaTecnicaService";
import {
    syncFichaTecnicaCores,
    saveFichaTecnicaItens,
    updateFaccaoProdutoPrice,
    createFaccaoProduto,
} from "../services/fichaTecnicaItemService";
import { createPedido } from "../services/pedidoService";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

function DropdownField({
    value,
    placeholder,
    options,
    isOpen,
    onToggle,
    onSelect,
    isSelectedOption,
    disabled = false,
    className = "",
}) {
    return (
        <div className={`relative ${isOpen ? "z-50" : "z-10"} ${className}`}>
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className="w-full h-[46px] border border-[#898C8F] rounded-[10px] px-3 text-sm focus:outline-none bg-white flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <span className={value ? "text-[#707070] font-normal" : "text-[#898C8F]"}>
                    {value || placeholder}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>
            {isOpen && !disabled && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar dropdown"
                        onClick={onToggle}
                        className="fixed inset-0 z-10 cursor-default"
                    />
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-[14px] border border-[#898C8F] bg-white max-h-[240px] overflow-y-auto">
                        {options.length === 0 ? (
                            <p className="px-3 py-3 text-sm text-[#898C8F] font-light">
                                Nenhuma opção disponível
                            </p>
                        ) : (
                            options.map((option) => {
                                const selected = isSelectedOption(option);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onSelect(option)}
                                        className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors first:rounded-t-[13px] last:rounded-b-[13px] ${selected ? "border-[#C4F042] text-[#707070] bg-white" : "border-transparent text-[#707070] bg-white hover:bg-[#FAFAFA]"}`}
                                    >
                                        <span>{option.label}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

const primeiroNumeroValido = (...valores) => {
    for (const valor of valores) {
        if (valor === null || valor === undefined) continue;
        const texto = String(valor).trim();
        if (!texto) continue;
        const numero = Number(texto);
        if (Number.isFinite(numero)) return numero;
    }
    return undefined;
};

const getProdutoId = (item) =>
    item?.produto?.id ?? item?.produto_id ?? item?.id_produto ?? item?.id;

const getReferenciaInterna = (item) =>
    item?.produto?.nome ?? item?.produto?.referencia ?? item?.nome ?? "-";

export default function PedidosCadastrar() {
    const navigate = useNavigate();
    const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
    const fabricoId = primeiroNumeroValido(
        usuarioLogado?.fabrico_id,
        usuarioLogado?.fabricoId,
        usuarioLogado?.fabrico?.id,
    );

    const [openDropdown, setOpenDropdown] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [referenciasDisponiveis, setReferenciasDisponiveis] = useState([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [carregandoReferencias, setCarregandoReferencias] = useState(false);

    const [salvandoPedido, setSalvandoPedido] = useState(false);

    const [isSobDemanda, setIsSobDemanda] = useState(true);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [referenciaSelecionada, setReferenciaSelecionada] = useState(null);

    const [modalFichaAberto, setModalFichaAberto] = useState(false);
    const [referenciaParaModal, setReferenciaParaModal] = useState(null);

    const [fichas, setFichas] = useState([]);
    const [erro, setErro] = useState("");

    const numeroPedido = useMemo(() => {
        const base = Date.now() % 10000;
        return String(1900 + base);
    }, []);

    useEffect(() => {
        if (!fabricoId) {
            setCarregandoClientes(false);
            return;
        }
        let ignorar = false;
        const carregarDados = async () => {
            setCarregandoClientes(true);
            try {
                const [fabricoInfo, listaClientes] = await Promise.all([
                    getFabricoById(fabricoId),
                    getClientes(fabricoId),
                ]);
                if (ignorar) return;

                const produzSobDemanda = Boolean(
                    fabricoInfo?.fabricacao_sob_demanda ??
                    fabricoInfo?.produz_sob_demanda ??
                    fabricoInfo?.sob_demanda ??
                    true,
                );
                setIsSobDemanda(produzSobDemanda);
                setClientes(listaClientes || []);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                if (!ignorar) {
                    setErro("Não foi possível carregar configurações e clientes.");
                }
            } finally {
                if (!ignorar) setCarregandoClientes(false);
            }
        };
        carregarDados();
        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    useEffect(() => {
        if (isSobDemanda && !clienteSelecionado?.id) {
            setReferenciasDisponiveis([]);
            setReferenciaSelecionada(null);
            return;
        }
        if (!fabricoId) return;

        let ignorar = false;
        const carregarReferencias = async () => {
            setCarregandoReferencias(true);
            try {
                let listaProdutosCliente = [];
                const promessas = [getProdutosPorFabrico(fabricoId)];
                if (isSobDemanda && clienteSelecionado?.id) {
                    promessas.push(getProdutosDoCliente(clienteSelecionado.id));
                }
                const resultados = await Promise.all(promessas);
                const todosProdutos = resultados[0];
                if (resultados[1]) listaProdutosCliente = resultados[1];
                if (ignorar) return;

                const mapaAssociados = new Map(
                    (listaProdutosCliente || []).map((item) => [String(getProdutoId(item)), item]),
                );
                const idsJaAdicionados = new Set(fichas.map((f) => String(f.produtoId)));

                const referenciasOrdenadas = (todosProdutos || [])
                    .filter((produto) => !idsJaAdicionados.has(String(produto.id)))
                    .map((produto) => {
                        const associado = mapaAssociados.get(String(produto.id));
                        if (associado) return { ...associado, produto, associadoAoCliente: true };
                        return { produto, produto_id: produto.id, associadoAoCliente: false };
                    })
                    .sort((a, b) => {
                        if (a.associadoAoCliente !== b.associadoAoCliente)
                            return a.associadoAoCliente ? -1 : 1;
                        return getReferenciaInterna(a).localeCompare(
                            getReferenciaInterna(b),
                            "pt-BR",
                            { sensitivity: "base" },
                        );
                    });
                setReferenciasDisponiveis(referenciasOrdenadas);
            } catch (error) {
                if (!ignorar) setErro("Não foi possível carregar as referências.");
                console.error("Erro ao carregar referências:", error);
            } finally {
                if (!ignorar) setCarregandoReferencias(false);
            }
        };
        carregarReferencias();
        return () => {
            ignorar = true;
        };
    }, [clienteSelecionado, fabricoId, fichas, isSobDemanda]);

    const opcoesClientes = clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.nome,
        raw: cliente,
    }));

    const opcoesReferencias = referenciasDisponiveis.map((item) => ({
        value: String(getProdutoId(item)),
        label: getReferenciaInterna(item),
        raw: item,
    }));

    const toggleDropdown = (nome) => setOpenDropdown((atual) => (atual === nome ? null : nome));

    const handleSelecionarCliente = (opcao) => {
        setClienteSelecionado(opcao.raw);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    const handleSelecionarReferencia = async (opcao) => {
        if (isSobDemanda && !clienteSelecionado) {
            setErro("Selecione um cliente antes de adicionar a referência.");
            return;
        }

        let referenciaCliente = "";

        if (isSobDemanda && clienteSelecionado?.id) {
            try {
                const produtosDoCliente = await getProdutosDoCliente(clienteSelecionado.id);

                const produtoClienteSelecionado = (produtosDoCliente || []).find(
                    (item) => String(getProdutoId(item)) === String(opcao.value),
                );

                referenciaCliente = produtoClienteSelecionado?.nome_para_cliente || "";
            } catch (error) {
                console.error("Erro ao buscar produto do cliente:", error);
            }
        }

        setReferenciaParaModal({
            ...opcao.raw?.produto,
            clienteNome: clienteSelecionado?.nome,
            referenciaCliente,
            id: getProdutoId(opcao.raw),
        });

        setModalFichaAberto(true);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    const fecharModalFicha = () => {
        setModalFichaAberto(false);
        setReferenciaParaModal(null);
    };

    const handleRemoverFicha = (id) => {
        setFichas((prev) => prev.filter((f) => f.id !== id));
    };

    const handleConcluirPedido = async () => {
        if (fichas.length === 0) {
            setErro("Adicione pelo menos uma ficha técnica ao pedido.");
            return;
        }

        setSalvandoPedido(true);
        setErro("");

        try {
            const payloadPedido = {
                fabrico_id: fabricoId,
                cliente_id: clienteSelecionado?.id || null,
                finalizado: false,
            };

            const pedidoCriado = await createPedido(payloadPedido);
            const idDoPedido = pedidoCriado?.id || pedidoCriado?.data?.id;

            if (!idDoPedido) throw new Error("ID do Pedido não retornado pelo servidor.");

            await Promise.all(
                fichas.map(async (rascunhoFicha) => {
                    if (rascunhoFicha.gradeVersaoIdOriginal !== rascunhoFicha.gradeVersaoIdNova) {
                        await atualizarProduto(rascunhoFicha.produtoId, {
                            grade_versao_id: rascunhoFicha.gradeVersaoIdNova,
                        });
                    }

                    const fichaCriadaDb = await createFichaTecnica({
                        concluida: false,
                        fabrico_id: fabricoId,
                        produto_id: rascunhoFicha.produtoId,
                        pedido_id: idDoPedido,
                        etapa_atual_id: rascunhoFicha.etapaAtualId,
                    });

                    const fichaIdReal = fichaCriadaDb?.id || fichaCriadaDb?.data?.id;

                    if (rascunhoFicha.selectedColorIds.length > 0) {
                        await syncFichaTecnicaCores(fichaIdReal, rascunhoFicha.selectedColorIds);
                    }

                    if (rascunhoFicha.itensPayload.length > 0) {
                        await saveFichaTecnicaItens(fichaIdReal, rascunhoFicha.itensPayload);
                    }

                    if (rascunhoFicha.faccaoRows.length > 0) {
                        await Promise.all(
                            rascunhoFicha.faccaoRows.map(async (r) => {
                                if (r.preco === "" || r.preco === null || !r.isDirty) return;

                                const precoLimpo = String(r.preco)
                                    .replace("R$", "")
                                    .replace(".", "")
                                    .replace(",", ".")
                                    .trim();
                                const parsed = Number.parseFloat(precoLimpo);
                                const precoValido = Number.isNaN(parsed) ? 0 : parsed;

                                if (r.isNew) {
                                    await createFaccaoProduto(
                                        r.faccaoId,
                                        rascunhoFicha.produtoId,
                                        precoValido,
                                    );
                                } else {
                                    await updateFaccaoProdutoPrice(
                                        r.faccaoId,
                                        rascunhoFicha.produtoId,
                                        precoValido,
                                    );
                                }
                            }),
                        );
                    }
                }),
            );

            navigate("/pedidos", { state: { success: "Pedido criado com sucesso!" } });
        } catch (error) {
            console.error("Erro ao salvar pedido orquestrado:", error);
            setErro(
                error?.message ||
                    "Não foi possível concluir o pedido. Verifique sua conexão e tente novamente.",
            );
        } finally {
            setSalvandoPedido(false);
        }
    };

    return (
        <div className="w-full max-w-[1200px] xl:max-w-none mx-auto font-['Outfit',_sans-serif]">
            <div className="bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_8px_40px_rgba(70,150,173,0.08)] border border-[#F0F4F6] w-full">
                <div className="mb-10">
                    <div className="flex items-center gap-3">
                        <img
                            src="/pedidos-desativado.png"
                            alt=""
                            className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
                        />
                        <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight">
                            Novo Pedido
                        </h1>
                    </div>
                    <p className="mt-2 ml-11 text-[18px] font-light text-[#898C8F]">
                        Nº {numeroPedido}
                    </p>
                </div>

                <section className="mb-10">
                    <h2 className={sectionTitleClass}>Adicionar ficha técnica</h2>
                    <div className="flex flex-wrap gap-4">
                        {isSobDemanda && (
                            <div className="w-full max-w-[320px]">
                                <DropdownField
                                    value={clienteSelecionado?.nome || ""}
                                    placeholder={
                                        carregandoClientes
                                            ? "Carregando clientes..."
                                            : "Selecionar cliente"
                                    }
                                    options={opcoesClientes}
                                    isOpen={openDropdown === "cliente"}
                                    onToggle={() => toggleDropdown("cliente")}
                                    onSelect={handleSelecionarCliente}
                                    isSelectedOption={(option) =>
                                        String(clienteSelecionado?.id) === option.value
                                    }
                                    disabled={carregandoClientes || salvandoPedido}
                                />
                            </div>
                        )}
                        <div className="w-full max-w-[320px]">
                            <DropdownField
                                value={referenciaSelecionada?.label || ""}
                                placeholder={
                                    isSobDemanda && !clienteSelecionado
                                        ? "Adicionar referência*"
                                        : carregandoReferencias
                                          ? "Carregando referências..."
                                          : "Adicionar referência*"
                                }
                                options={opcoesReferencias}
                                isOpen={openDropdown === "referencia"}
                                onToggle={() => toggleDropdown("referencia")}
                                onSelect={handleSelecionarReferencia}
                                isSelectedOption={(option) =>
                                    referenciaSelecionada?.value === option.value
                                }
                                disabled={
                                    (isSobDemanda && !clienteSelecionado) ||
                                    carregandoReferencias ||
                                    salvandoPedido
                                }
                            />
                        </div>
                    </div>
                </section>

                <div className="mb-10">
                    <TabelaFichaTecnica
                        fichas={fichas}
                        isSobDemanda={isSobDemanda}
                        onRemoverFicha={handleRemoverFicha}
                    />
                </div>

                <div className="flex flex-wrap justify-end gap-4 pt-2">
                    <button
                        type="button"
                        disabled={salvandoPedido}
                        onClick={() => navigate("/pedidos")}
                        className="bg-[#D75757] hover:bg-[#c94a4a] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={salvandoPedido}
                        onClick={handleConcluirPedido}
                        className="bg-[#A9E2F2] hover:bg-[#94d6eb] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50 flex items-center justify-center"
                    >
                        {salvandoPedido ? "Salvando..." : "Concluir pedido"}
                    </button>
                </div>
                {erro ? <p className="pt-4 text-sm text-[#D75757] text-right">{erro}</p> : null}
            </div>

            <FichaTecnicaModal
                isOpen={modalFichaAberto}
                onClose={fecharModalFicha}
                produto={referenciaParaModal}
                fabricoId={fabricoId}
                onFichaCreated={(rascunhoFicha) => {
                    setFichas((prev) => [
                        ...prev,
                        {
                            ...rascunhoFicha,
                            foto: rascunhoFicha.foto || referenciaParaModal?.foto,
                            referenciaInterna:
                                rascunhoFicha.referenciaInterna ||
                                referenciaParaModal?.nome ||
                                referenciaParaModal?.referenciaInterna,
                            referenciaCliente:
                                rascunhoFicha.referenciaCliente ||
                                referenciaParaModal?.referenciaCliente,
                            cores: rascunhoFicha.cores || rascunhoFicha.selectedColors || [],
                        },
                    ]);
                }}
            />
        </div>
    );
}
