import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaFichaTecnica from "../components/pedidos/TabelaReferenciaFichaTecnica";
import ModalFichaTecnica from "../components/pedidos/ModalFichaTecnica";
import {
    getClientes,
    getProdutosDoCliente,
    getProdutosPorFabrico,
} from "../services/clientesService";
import { getFaccoesByFabrico } from "../services/faccaoService";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

function FieldLabel({ children }) {
    return <label className="block text-[20px] font-light text-[#404040] mb-3">{children}</label>;
}

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
                className="w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-sm focus:outline-none bg-white flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
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
                                        className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors first:rounded-t-[13px] last:rounded-b-[13px] ${
                                            selected
                                                ? "border-[#C4F042] text-[#707070] bg-white"
                                                : "border-transparent text-[#707070] bg-white hover:bg-[#FAFAFA]"
                                        }`}
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
    const [faccoes, setFaccoes] = useState([]);
    const [referenciasDisponiveis, setReferenciasDisponiveis] = useState([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [carregandoReferencias, setCarregandoReferencias] = useState(false);

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
                const [listaClientes, listaFaccoes] = await Promise.all([
                    getClientes(fabricoId),
                    getFaccoesByFabrico(fabricoId),
                ]);

                if (ignorar) return;

                setClientes(listaClientes || []);
                setFaccoes(
                    (listaFaccoes || []).map((faccao) => ({
                        id: faccao.id,
                        nome: faccao.nome,
                    })),
                );
            } catch (error) {
                console.error("Erro ao carregar dados do pedido:", error);
                if (!ignorar) setErro("Não foi possível carregar clientes e facções.");
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
        if (!clienteSelecionado?.id || !fabricoId) {
            setReferenciasDisponiveis([]);
            setReferenciaSelecionada(null);
            return;
        }

        let ignorar = false;

        const carregarReferencias = async () => {
            setCarregandoReferencias(true);
            try {
                const [todosProdutos, produtosDoCliente] = await Promise.all([
                    getProdutosPorFabrico(fabricoId),
                    getProdutosDoCliente(clienteSelecionado.id),
                ]);

                if (ignorar) return;

                const mapaAssociados = new Map(
                    (produtosDoCliente || []).map((item) => [String(getProdutoId(item)), item]),
                );

                const idsJaAdicionados = new Set(fichas.map((f) => String(f.produtoId)));

                const referenciasOrdenadas = (todosProdutos || [])
                    .filter((produto) => !idsJaAdicionados.has(String(produto.id)))
                    .map((produto) => {
                        const associado = mapaAssociados.get(String(produto.id));

                        if (associado) {
                            return { ...associado, associadoAoCliente: true };
                        }

                        return {
                            produto,
                            produto_id: produto.id,
                            associadoAoCliente: false,
                        };
                    })
                    .sort((a, b) => {
                        if (a.associadoAoCliente !== b.associadoAoCliente) {
                            return a.associadoAoCliente ? -1 : 1;
                        }

                        return getReferenciaInterna(a).localeCompare(
                            getReferenciaInterna(b),
                            "pt-BR",
                            {
                                sensitivity: "base",
                            },
                        );
                    });

                setReferenciasDisponiveis(referenciasOrdenadas);
            } catch (error) {
                console.error("Erro ao carregar referências:", error);
                if (!ignorar) {
                    setReferenciasDisponiveis([]);
                    setErro("Não foi possível carregar as referências.");
                }
            } finally {
                if (!ignorar) setCarregandoReferencias(false);
            }
        };

        carregarReferencias();

        return () => {
            ignorar = true;
        };
    }, [clienteSelecionado, fabricoId, fichas]);

    const opcoesClientes = clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.nome,
        raw: cliente,
    }));

    const opcoesReferencias = referenciasDisponiveis.map((item) => {
        const produtoId = getProdutoId(item);

        return {
            value: String(produtoId),
            label: getReferenciaInterna(item),
            raw: item,
        };
    });

    const toggleDropdown = (nome) => {
        setOpenDropdown((atual) => (atual === nome ? null : nome));
    };

    const handleSelecionarCliente = (opcao) => {
        setClienteSelecionado(opcao.raw);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    const handleSelecionarReferencia = (opcao) => {
        if (!clienteSelecionado) {
            setErro("Selecione um cliente antes de adicionar a referência.");
            return;
        }

        setReferenciaParaModal(opcao.raw);
        setModalFichaAberto(true);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    const fecharModalFicha = () => {
        setModalFichaAberto(false);
        setReferenciaParaModal(null);
    };

    const handleChangeQuantidade = (fichaId, valor) => {
        setFichas((prev) =>
            prev.map((ficha) => (ficha.id === fichaId ? { ...ficha, quantidade: valor } : ficha)),
        );
    };

    const handleChangeFaccao = (fichaId, faccaoId, faccaoNome) => {
        setFichas((prev) =>
            prev.map((ficha) =>
                ficha.id === fichaId ? { ...ficha, faccaoId, faccaoNome } : ficha,
            ),
        );
    };

    const handleConcluirPedido = () => {
        setErro("");

        if (fichas.length === 0) {
            setErro("Adicione ao menos uma ficha técnica ao pedido.");
            return;
        }

        const fichaInvalida = fichas.find(
            (f) => !f.quantidade || Number(f.quantidade) <= 0 || !f.faccaoId,
        );

        if (fichaInvalida) {
            setErro("Preencha quantidade e facção responsável em todas as fichas.");
            return;
        }

        navigate("/pedidos", {
            replace: true,
            state: { success: "Pedido criado com sucesso." },
        });
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
                                disabled={carregandoClientes}
                            />
                        </div>
                        <div className="w-full max-w-[320px]">
                            <DropdownField
                                value={referenciaSelecionada?.label || ""}
                                placeholder={
                                    !clienteSelecionado
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
                                disabled={!clienteSelecionado || carregandoReferencias}
                            />
                        </div>
                    </div>
                </section>

                <div className="mb-10">
                    <TabelaFichaTecnica
                        fichas={fichas}
                        faccoes={faccoes}
                        onChangeQuantidade={handleChangeQuantidade}
                        onChangeFaccao={handleChangeFaccao}
                    />
                </div>

                <div className="flex flex-wrap justify-end gap-4 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate("/pedidos")}
                        className="bg-[#D75757] hover:bg-[#c94a4a] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConcluirPedido}
                        className="bg-[#A9E2F2] hover:bg-[#94d6eb] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
                    >
                        Concluir pedido
                    </button>
                </div>

                {erro ? <p className="pt-4 text-sm text-[#D75757] text-right">{erro}</p> : null}
            </div>

            <ModalFichaTecnica
                isOpen={modalFichaAberto}
                onClose={fecharModalFicha}
                referencia={referenciaParaModal}
            />
        </div>
    );
}
