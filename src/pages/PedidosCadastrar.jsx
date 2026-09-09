import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaFichaTecnica from "../components/pedidos/TabelaReferenciaFichaTecnica";
import {
    getClientes,
    getProdutosDoCliente,
    getProdutosPorFabrico,
} from "../services/clientesService";
import { getFabricoById } from "../services/fabricoService";
import FichaTecnicaModal from "../components/fichas-tecnicas/FichaTecnicaModal";

import { createPedidoCompleto, getPedidosByFabricoId } from "../services/pedidoService";

import { getAllEtapasByFabricoId } from "../services/etapaService";
import { DropdownOptionsSkeleton, LoadingButton, SkeletonBox } from "../components/geral/Loading";
import ModalConfirmacaoEscolha from "../components/geral/ModalConfirmacaoEscolha";

import { parsePreco } from "../utils/preco";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit']";

const normalizarPrecoOpcional = (preco) => {
    if (preco === null || preco === undefined || preco === "") return null;

    const valorNormalizado =
        typeof preco === "string" ? preco.replace("R$", "").replace(",", ".").trim() : preco;
    const valorNumerico = Number(valorNormalizado);

    return Number.isFinite(valorNumerico) && valorNumerico > 0 ? valorNumerico : null;
};

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
    loading = false,
}) {
    const [termoBusca, setTermoBusca] = useState("");
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const inputRef = useRef(null);
    const fieldDisabled = disabled || loading;

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setTermoBusca("");
        }
    }

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const opcoesFiltradas = options.filter((option) =>
        option.label.toLowerCase().includes(termoBusca.toLowerCase()),
    );

    return (
        <div className={`relative ${isOpen ? "z-50" : "z-10"} ${className}`}>
            <div
                onClick={() => {
                    if (fieldDisabled) return;
                    if (!isOpen) onToggle();
                    inputRef.current?.focus();
                }}
                className={`w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-sm bg-white flex items-center justify-between transition-opacity ${
                    fieldDisabled ? "opacity-60 cursor-not-allowed" : "cursor-text"
                }`}
            >
                {loading ? (
                    <SkeletonBox className="h-[14px] w-36 rounded-[7px]" />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        disabled={fieldDisabled}
                        value={isOpen ? termoBusca : value || ""}
                        onChange={(e) => {
                            setTermoBusca(e.target.value);
                            if (!isOpen) onToggle();
                        }}
                        placeholder={isOpen && value ? value : placeholder}
                        className="w-full bg-transparent outline-none text-[#707070] placeholder:text-[#898C8F] truncate disabled:cursor-not-allowed"
                    />
                )}

                <button
                    type="button"
                    disabled={fieldDisabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!fieldDisabled) onToggle();
                    }}
                    className="ml-2 py-2 shrink-0 outline-none"
                >
                    <svg
                        className={`w-4 h-4 text-[#898C8F] transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
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
            </div>

            {isOpen && !fieldDisabled && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar dropdown"
                        onClick={onToggle}
                        className="fixed inset-0 z-10 cursor-default outline-none"
                    />

                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-[14px] border border-[#898C8F] bg-white max-h-[240px] overflow-y-auto scrollbar-sutil">
                        {loading ? (
                            <DropdownOptionsSkeleton />
                        ) : opcoesFiltradas.length === 0 ? (
                            <p className="px-3 py-3 text-sm text-[#898C8F] font-light">
                                Nenhuma opção encontrada
                            </p>
                        ) : (
                            opcoesFiltradas.map((option) => {
                                const selected = isSelectedOption(option);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onSelect(option)}
                                        className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors ${
                                            selected
                                                ? "border-[#C4F042] text-[#707070] bg-white"
                                                : "border-transparent text-[#707070] bg-white hover:bg-[#F5F5F5]"
                                        }`}
                                    >
                                        <span className="truncate">{option.label}</span>
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

const extrairMensagemDeErro = (error) => {
    const mensagem = error?.response?.data?.message;

    if (Array.isArray(mensagem)) return mensagem.join(". ");

    return typeof mensagem === "string" ? mensagem : "";
};

// Converte o rascunho local da ficha no formato aceito por POST /pedidos/completo.
const montarFichaParaEnvio = (ficha, { etapaPadraoId, incluirDadosDoCliente }) => {
    const gradeVersaoId = ficha.gradeVersaoIdNova || ficha.gradeVersaoIdOriginal;
    const etapaAtualId = ficha.etapa_atual_id || etapaPadraoId;

    const payload = {
        produto_id: Number(ficha.produtoId ?? ficha.produto_id),
        quantidade: Number(ficha.quantidade) || 0,
        cores_ids: (ficha.selectedColorIds || []).map(Number),
        itens: (ficha.itensPayload || []).map((item) => ({
            cor_id: Number(item.cor_id),
            grade_versao_item_id: Number(item.grade_versao_item_id),
            quantidade: Number(item.quantidade) || 0,
        })),
        parceiros: (ficha.parceiroRows || []).map((parceiro) => ({
            parceiro_id: Number(parceiro.parceiroId ?? parceiro.id),
            operacao: parceiro.operacao || null,
            preco: normalizarPrecoOpcional(parceiro.preco),
        })),
    };

    if (gradeVersaoId) payload.grade_versao_id = Number(gradeVersaoId);
    if (etapaAtualId) payload.etapa_atual_id = Number(etapaAtualId);

    if (incluirDadosDoCliente) {
        payload.nome_para_cliente = ficha.referenciaCliente ?? ficha.ref_cliente ?? "";
        payload.preco_padrao = parsePreco(
            ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0,
        );
    }

    return payload;
};

export default function PedidosCadastrar() {
    const navigate = useNavigate();
    const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
    const fabricoId = primeiroNumeroValido(
        usuarioLogado?.fabrico_id,
        usuarioLogado?.fabricoId,
        usuarioLogado?.fabrico?.id,
    );

    const [primeiraEtapaId, setPrimeiraEtapaId] = useState(null);

    const [openDropdown, setOpenDropdown] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [referenciasDisponiveis, setReferenciasDisponiveis] = useState([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [carregandoReferencias, setCarregandoReferencias] = useState(false);

    const [salvandoPedido, setSalvandoPedido] = useState(false);

    const [isSobDemanda, setIsSobDemanda] = useState(true);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [referenciaSelecionada, setReferenciaSelecionada] = useState(null);
    const [dataPrevista, setDataPrevista] = useState("");

    const [modalFichaAberto, setModalFichaAberto] = useState(false);
    const [referenciaParaModal, setReferenciaParaModal] = useState(null);

    const [fichas, setFichas] = useState([]);
    const [erro, setErro] = useState("");
    const [numeroPedido, setNumeroPedido] = useState("...");
    const [modalTrocaClienteAberto, setModalTrocaClienteAberto] = useState(false);
    const [clientePendente, setClientePendente] = useState(null);
    const [trocandoCliente, setTrocandoCliente] = useState(false);

    useEffect(() => {
        if (!fabricoId) return;

        let ignorar = false;

        const carregarNumeroDoPedido = async () => {
            try {
                const resposta = await getPedidosByFabricoId(fabricoId);

                if (ignorar) return;

                const pedidos_do_fabrico = Array.isArray(resposta)
                    ? resposta
                    : resposta?.data || resposta?.pedidos || [];

                const numeros = pedidos_do_fabrico
                    .map((p) => p.numero)
                    .filter((n) => n != null && n !== "")
                    .map((n) => Number(n))
                    .filter((n) => Number.isFinite(n));
                const proximoNumero = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;

                setNumeroPedido(String(proximoNumero));
            } catch (error) {
                console.error("Erro ao gerar o número do pedido:", error);
                if (!ignorar) setNumeroPedido("-");
            }
        };

        carregarNumeroDoPedido();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    useEffect(() => {
        if (!fabricoId) return;

        let ignorar = false;

        const carregarEtapas = async () => {
            try {
                const etapas = await getAllEtapasByFabricoId(fabricoId);

                if (ignorar) return;

                if (etapas && etapas.length > 0) {
                    const etapaInicial = etapas
                        .sort((a, b) => a.ordem - b.ordem)
                        .find((etapa) => etapa.ativa === true);

                    if (etapaInicial) {
                        setPrimeiraEtapaId(etapaInicial.id);
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar as etapas do fabrico:", error);
            }
        };

        carregarEtapas();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    useEffect(() => {
        if (!fabricoId) {
            setCarregandoClientes(false);
            return;
        }
        let ignorar = false;
        const carregarDados = async () => {
            setCarregandoClientes(true);
            try {
                const fabricoInfo = await getFabricoById(fabricoId);
                if (ignorar) return;

                const produzSobDemanda = fabricoInfo?.fabricacao_sob_demanda === true;
                setIsSobDemanda(produzSobDemanda);

                if (!produzSobDemanda) {
                    setClientes([]);
                    return;
                }

                try {
                    const listaClientes = await getClientes(fabricoId);
                    if (ignorar) return;

                    setClientes(listaClientes || []);
                } catch (error) {
                    console.error("Erro ao carregar clientes:", error);
                    if (!ignorar) {
                        setClientes([]);
                        setErro("Não foi possível carregar clientes.");
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar configuração do fabrico:", error);
                if (!ignorar) {
                    setIsSobDemanda(false);
                    setClientes([]);
                    setErro("Não foi possível carregar configurações do fabrico.");
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

    const aplicarCliente = (cliente) => {
        setClienteSelecionado(cliente);
        setReferenciaSelecionada(null);
        setErro("");
    };

    const handleSelecionarCliente = (opcao) => {
        setOpenDropdown(null);

        const mesmoCliente = String(clienteSelecionado?.id || "") === String(opcao.raw?.id || "");
        if (mesmoCliente) return;

        if (fichas.length > 0) {
            setClientePendente(opcao.raw);
            setModalTrocaClienteAberto(true);
            return;
        }

        aplicarCliente(opcao.raw);
    };

    const cancelarTrocaCliente = () => {
        if (trocandoCliente) return;
        setModalTrocaClienteAberto(false);
        setClientePendente(null);
    };

    const confirmarTrocaCliente = async () => {
        if (!clientePendente || trocandoCliente) return;

        const novoCliente = clientePendente;
        setTrocandoCliente(true);

        try {
            const produtosDoNovoCliente = await getProdutosDoCliente(novoCliente.id);
            const relacoesPorProduto = new Map(
                (produtosDoNovoCliente || []).map((item) => [String(getProdutoId(item)), item]),
            );

            setFichas((fichasAtuais) =>
                fichasAtuais.map((ficha) => {
                    const produtoId = ficha.produtoId ?? ficha.produto_id;
                    const relacao = relacoesPorProduto.get(String(produtoId));
                    const referenciaCliente = relacao?.nome_para_cliente ?? "";
                    const precoPadrao = relacao?.preco_padrao ?? null;

                    return {
                        ...ficha,
                        associadoAoCliente: Boolean(relacao),
                        referenciaCliente,
                        ref_cliente: referenciaCliente,
                        preco_padrao: precoPadrao,
                        preco_unitario: null,
                        preco: null,
                        subtotal: undefined,
                    };
                }),
            );

            aplicarCliente(novoCliente);
            setModalTrocaClienteAberto(false);
            setClientePendente(null);
        } catch (error) {
            console.error("Erro ao carregar produtos do novo cliente:", error);
            setErro("Não foi possível trocar o cliente. Tente novamente.");
        } finally {
            setTrocandoCliente(false);
        }
    };

    const handleSelecionarReferencia = async (opcao) => {
        if (isSobDemanda && !clienteSelecionado) {
            setErro("Selecione um cliente antes de adicionar a referência.");
            return;
        }

        let referenciaCliente = "";
        let preco_padrao = null;

        if (isSobDemanda && clienteSelecionado?.id) {
            try {
                const produtosDoCliente = await getProdutosDoCliente(clienteSelecionado.id);
                const produtoClienteSelecionado = (produtosDoCliente || []).find(
                    (item) => String(getProdutoId(item)) === String(opcao.value),
                );

                referenciaCliente = produtoClienteSelecionado?.nome_para_cliente || "";
                preco_padrao = produtoClienteSelecionado?.preco_padrao || null;
            } catch (error) {
                console.error("Erro ao buscar produto do cliente:", error);
            }
        }

        const dadosParaModal = {
            ...opcao.raw?.produto,
            clienteNome: clienteSelecionado?.nome,
            referenciaCliente,
            preco_padrao,
            id: getProdutoId(opcao.raw),
            associadoAoCliente: opcao.raw?.associadoAoCliente ?? false,
        };

        setReferenciaParaModal(dadosParaModal);
        setModalFichaAberto(true);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    const handleDataPrevistaChange = (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 8) v = v.slice(0, 8);

        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        setDataPrevista(v);
    };

    const fecharModalFicha = () => {
        setModalFichaAberto(false);
        setReferenciaParaModal(null);
    };

    const handleRemoverFicha = (id) => {
        setFichas((prev) => prev.filter((f) => f.id !== id));
    };

    const handleAtualizarFicha = (identificador, campo, valor) => {
        setFichas((prevFichas) =>
            prevFichas.map((ficha, index) => {
                const ehAFicha =
                    ficha.id !== undefined && ficha.id !== null
                        ? ficha.id === identificador
                        : index === identificador;

                if (ehAFicha) {
                    return { ...ficha, [campo]: valor };
                }
                return ficha;
            }),
        );
    };

    const handleConcluirPedido = async () => {
        if (trocandoCliente) {
            setErro("Aguarde a atualização dos produtos do novo cliente.");
            return;
        }

        if (isSobDemanda && !clienteSelecionado) {
            setErro("Selecione um cliente para prosseguir.");
            return;
        }

        if (fichas.length === 0) {
            setErro("Adicione pelo menos uma ficha técnica ao pedido.");
            return;
        }

        if (isSobDemanda) {
            const temPrecoInvalido = fichas.some((ficha) => {
                const preco = parsePreco(
                    ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0,
                );
                return preco <= 0;
            });

            if (temPrecoInvalido) {
                setErro(
                    "Não é possível concluir o pedido: existem fichas técnicas com valor unitário zerado.",
                );
                return;
            }
        }

        if (dataPrevista && dataPrevista.length < 10) {
            setErro("Por favor, insira uma data de previsão completa (dd/mm/aaaa).");
            return;
        }

        setSalvandoPedido(true);
        setErro(null);

        try {
            let dataFormatadaBackend = undefined;
            if (dataPrevista && dataPrevista.length === 10) {
                const [dia, mes, ano] = dataPrevista.split("/");
                dataFormatadaBackend = new Date(`${ano}-${mes}-${dia}T12:00:00.000Z`).toISOString();
            }

            const clienteId = clienteSelecionado?.id ? Number(clienteSelecionado.id) : null;

            await createPedidoCompleto({
                cliente_id: clienteId,
                finalizado: false,
                data_prevista: dataFormatadaBackend,
                usarCorPaleta: fichas.length > 1,
                fichas: fichas.map((ficha) =>
                    montarFichaParaEnvio(ficha, {
                        etapaPadraoId: primeiraEtapaId,
                        incluirDadosDoCliente: isSobDemanda && Boolean(clienteId),
                    }),
                ),
            });

            navigate("/pedidos");
        } catch (error) {
            console.error("Erro ao salvar pedido:", error);
            setErro(
                extrairMensagemDeErro(error) ||
                    "Falha ao salvar pedido. Verifique os dados e tente novamente.",
            );
        } finally {
            setSalvandoPedido(false);
        }
    };

    return (
        <>
            <div className="p-6 pt-0 mt-6 w-full relative z-0 font-['Outfit']">
                <div className="bg-white p-10 rounded-[24px] shadow-sm w-full mx-auto">
                    <div className="mb-6">
                        <div className="flex items-start gap-3">
                            <img
                                src="/pedidos-desativado.png"
                                alt=""
                                className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
                            />
                            <div className="flex flex-col gap-0 items-start">
                                <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight leading-none">
                                    {isSobDemanda ? "Novo Pedido" : "Nova Produção"}
                                </h1>

                                <p className="text-[18px] font-light text-[#898C8F] mt-0.5 leading-none">
                                    Nº {numeroPedido}
                                </p>
                            </div>
                        </div>
                    </div>

                    <section className="mb-4">
                        <div className="flex flex-wrap gap-4 justify-between items-start">
                            <div className="flex flex-col">
                                <h2 className={sectionTitleClass}>Adicionar ficha técnica</h2>
                                <div className="flex flex-row flex-wrap gap-4">
                                    {isSobDemanda && (
                                        <div className="w-[320px] shrink-0">
                                            <DropdownField
                                                value={clienteSelecionado?.nome || ""}
                                                placeholder="Selecionar cliente"
                                                options={opcoesClientes}
                                                isOpen={openDropdown === "cliente"}
                                                onToggle={() => toggleDropdown("cliente")}
                                                onSelect={handleSelecionarCliente}
                                                isSelectedOption={(option) =>
                                                    String(clienteSelecionado?.id) === option.value
                                                }
                                                disabled={carregandoClientes || salvandoPedido}
                                                loading={carregandoClientes}
                                            />
                                        </div>
                                    )}

                                    <div className="w-[320px] shrink-0">
                                        <DropdownField
                                            value={referenciaSelecionada?.label || ""}
                                            placeholder="Adicionar referência*"
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
                                            loading={carregandoReferencias}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col w-fit max-w-full">
                                <h2 className={sectionTitleClass}>Previsão de entrega</h2>
                                <input
                                    type="text"
                                    disabled={salvandoPedido}
                                    value={dataPrevista}
                                    onChange={handleDataPrevistaChange}
                                    placeholder="Data"
                                    className={`w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 bg-white outline-none text-[#707070] placeholder:text-[#898C8F]/60 text-sm font-['Outfit'] transition-opacity ${
                                        salvandoPedido ? "opacity-60 cursor-not-allowed" : ""
                                    }`}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="mb-10">
                        <TabelaFichaTecnica
                            fichas={fichas}
                            isSobDemanda={isSobDemanda}
                            onRemoverFicha={handleRemoverFicha}
                            onAtualizarFicha={handleAtualizarFicha}
                        />
                    </div>

                    <div className="flex flex-wrap justify-end gap-4 pt-2">
                        <button
                            type="button"
                            disabled={salvandoPedido}
                            onClick={() => navigate("/pedidos")}
                            className="border border-[#D75757] bg-[#FFFFFF] hover:bg-[#FDF1F1] text-[#D75757] h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <LoadingButton
                            type="button"
                            loading={salvandoPedido}
                            loadingText="Salvando..."
                            onClick={handleConcluirPedido}
                            className="bg-[#A9E2F2] hover:bg-[#A2DCED] text-[#4696AD] h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50 flex items-center justify-center"
                        >
                            Concluir cadastro
                        </LoadingButton>
                    </div>

                    {erro ? <p className="pt-4 text-sm text-[#D75757] text-right">{erro}</p> : null}
                </div>
            </div>

            <ModalConfirmacaoEscolha
                isOpen={modalTrocaClienteAberto}
                onClose={cancelarTrocaCliente}
                onConfirm={confirmarTrocaCliente}
                mensagem={`Ao selecionar o cliente ${clientePendente?.nome || ""} todas as Fichas Técnicas criadas estarão associadas a esse cliente, deseja confirmar?`}
            />

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
                            preco_padrao:
                                rascunhoFicha.preco_padrao ?? referenciaParaModal?.preco_padrao,
                            custo_total:
                                rascunhoFicha.custo_total ?? referenciaParaModal?.custo_total,
                            referenciaInterna:
                                rascunhoFicha.referenciaInterna ||
                                referenciaParaModal?.nome ||
                                referenciaParaModal?.referenciaInterna,
                            referenciaCliente:
                                rascunhoFicha.referenciaCliente ||
                                referenciaParaModal?.referenciaCliente,
                            cores: rascunhoFicha.cores || rascunhoFicha.selectedColors || [],
                            etapa_atual_id: primeiraEtapaId,
                            associadoAoCliente:
                                rascunhoFicha.associadoAoCliente ??
                                referenciaParaModal?.associadoAoCliente ??
                                false,
                        },
                    ]);
                }}
            />
        </>
    );
}
