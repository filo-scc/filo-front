import { useState } from "react";
import { atualizarClientesProdutos } from "../../services/clientesService";

function IconeLixeira() {
    return (
        <div className="group relative w-[24px] h-[24px] flex items-center justify-center cursor-pointer">
            <img
                src="/excluir-branco.png"
                alt="Excluir"
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200 group-hover:opacity-0"
            />
            <img
                src="/excluir-vermelho.png"
                alt="Excluir"
                className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
        </div>
    );
}

function IconeEditar() {
    return (
        <div className="group relative w-[24px] h-[24px] flex items-center justify-center cursor-pointer">
            <img
                src="/editar-branco.png"
                alt="Editar"
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200 group-hover:opacity-0"
            />
            <img
                src="/editar-azul.png"
                alt="Editar"
                className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
        </div>
    );
}

function IconeSalvar() {
    return (
        <div className="w-[24px] h-[24px] flex items-center justify-center cursor-pointer">
            <img
                src="/check_azul.png"
                alt="Salvar"
                className="w-full h-full object-contain transition-transform hover:scale-110"
            />
        </div>
    );
}

const maskMoeda = (valor) => {
    let value = String(valor || "").replace(/\D/g, "");
    value = (Number(value) / 100).toFixed(2);
    value = value.replace(".", ",");
    value = value.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    value = value.replace(/(\d)(\d{3}),/g, "$1.$2,");
    return `R$ ${value}`;
};

const normalizarId = (valor) => {
    if (valor === null || valor === undefined) return "";
    return String(valor);
};

export default function TabelaClientesDoProduto({
    clientes,
    referenciaInterna,
    produtoId,
    fabricacao_sob_demanda,
    onAbrirModal,
    onRemoverLinha,
    onSalvarEdicao,
}) {
    const [editingId, setEditingId] = useState(null);
    const [editNome, setEditNome] = useState("");
    const [editPreco, setEditPreco] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erroEdicao, setErroEdicao] = useState("");

    if (!fabricacao_sob_demanda) {
        return null;
    }

    const formatPreco = (valor) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(valor || 0));
    };

    const getClienteId = (item) => {
        if (typeof item?.cliente === "number") {
            return normalizarId(item.cliente);
        }

        if (typeof item?.cliente === "string" && /^\d+$/.test(item.cliente)) {
            return normalizarId(item.cliente);
        }

        return normalizarId(
            item?.cliente?.id ??
                item?.cliente?.cliente_id ??
                item?.cliente?.clienteId ??
                item?.cliente?.clienteID ??
                item?.cliente?.id_cliente ??
                item?.cliente_id ??
                item?.clienteId ??
                item?.clienteID ??
                item?.id_cliente ??
                item?.fk_cliente_id ??
                item?.cliente_produto?.cliente_id ??
                item?.clienteProduto?.cliente_id,
        );
    };

    const getClienteNome = (item) =>
        (typeof item?.cliente === "string" ? item.cliente : item?.cliente?.nome) ||
        item.cliente_nome ||
        "-";

    const getLinhaId = (item, idx) => getClienteId(item) || `linha-${idx}`;

    const handleIniciarEdicao = (item, linhaId) => {
        setErroEdicao("");
        setEditingId(linhaId);
        setEditNome(item.nome_para_cliente || "");
        setEditPreco(maskMoeda(String(Number(item.preco_padrao || 0) * 100)));
    };

    const handleSalvarClick = async (item, linhaId) => {
        const clienteId = getClienteId(item);
        if (!clienteId || !produtoId) {
            setErroEdicao("Não foi possível identificar o cliente ou o produto para salvar.");
            return;
        }

        const dadosEditados = {
            cliente_id: clienteId,
            linha_id: linhaId,
            nome_para_cliente: editNome,
            preco_padrao: Number(editPreco.replace(/\D/g, "")) / 100,
        };

        setSalvando(true);
        setErroEdicao("");

        try {
            await atualizarClientesProdutos(clienteId, produtoId, {
                nome_para_cliente: dadosEditados.nome_para_cliente,
                preco_padrao: dadosEditados.preco_padrao,
            });

            if (onSalvarEdicao) {
                onSalvarEdicao(dadosEditados);
            }

            setEditingId(null);
        } catch (error) {
            console.error("Erro ao salvar referência do cliente:", error);
            setErroEdicao("Erro ao salvar referência do cliente.");
        } finally {
            setSalvando(false);
        }
    };

    const borderStyle = { borderColor: "#d9d9d9" };
    const podeEditar = Boolean(onSalvarEdicao);
    const podeRemover = Boolean(onRemoverLinha);
    const mostraAcoes = podeEditar || podeRemover;
    const linhas = clientes || [];
    const ultimo = linhas.length - 1;
    const gridColsClass = "grid grid-cols-4";

    const renderCampoEditavel = (item, isEditing) => {
        if (!isEditing) return item.nome_para_cliente || "-";

        return (
            <input
                type="text"
                value={editNome}
                onChange={(event) => setEditNome(event.target.value)}
                className="w-full text-center bg-transparent border-none outline-none focus:ring-0 font-Outfit"
                autoFocus
            />
        );
    };

    const renderPreco = (item, isEditing) => {
        if (!isEditing) return formatPreco(item.preco_padrao);

        return (
            <input
                type="text"
                value={editPreco}
                onChange={(event) => setEditPreco(maskMoeda(event.target.value))}
                className="w-full text-center bg-transparent border-none outline-none focus:ring-0 font-Outfit"
            />
        );
    };

    return (
        <section className="w-full">
            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                Referências associadas a clientes
            </h3>
            {erroEdicao && <p className="mb-3 text-sm text-[#D75757]">{erroEdicao}</p>}

            <div className="flex flex-col w-full">
                <div className="flex flex-row items-stretch gap-4 w-full">
                    <div
                        className="flex-1 rounded-t-[10px] border overflow-hidden"
                        style={borderStyle}
                    >
                        <div
                            className={`${gridColsClass} bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light h-[52px] items-center`}
                        >
                            <div className="h-full flex items-center justify-center text-center px-4">
                                Referência Interna
                            </div>
                            <div
                                className="border-l h-full flex items-center justify-center text-center px-4"
                                style={borderStyle}
                            >
                                Cliente
                            </div>
                            <div
                                className="border-l h-full flex items-center justify-center text-center px-4"
                                style={borderStyle}
                            >
                                Referência Cliente
                            </div>
                            <div
                                className="border-l h-full flex items-center justify-center text-center px-4"
                                style={borderStyle}
                            >
                                Preço
                            </div>
                        </div>
                    </div>
                    {mostraAcoes && <div className="w-[56px] shrink-0" />}
                </div>

                {linhas.length > 0 ? (
                    <div className="flex flex-row items-stretch gap-4 w-full">
                        <div
                            className="flex-1 border-l border-r border-b rounded-b-[10px] overflow-hidden"
                            style={borderStyle}
                        >
                            <div className="grid grid-cols-4 w-full text-[16px] font-Outfit text-[#898c8f]">
                                <div className="font-light flex items-center justify-center text-center px-4 bg-white">
                                    {referenciaInterna}
                                </div>

                                <div className="col-span-3 border-l" style={borderStyle}>
                                    {linhas.map((item, idx) => {
                                        const linhaId = getLinhaId(item, idx);
                                        const isEditing = editingId === linhaId;

                                        return (
                                            <div
                                                key={linhaId}
                                                className={`grid grid-cols-3 min-h-[64px] items-stretch ${
                                                    idx % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"
                                                } ${idx !== ultimo ? "border-b" : ""}`}
                                                style={idx !== ultimo ? borderStyle : undefined}
                                            >
                                                <div className="font-light flex items-center justify-center text-center h-full px-4">
                                                    {getClienteNome(item)}
                                                </div>
                                                <div
                                                    className="font-light border-l flex items-center justify-center text-center h-full px-4"
                                                    style={borderStyle}
                                                >
                                                    {renderCampoEditavel(item, isEditing)}
                                                </div>
                                                <div
                                                    className="font-light border-l flex items-center justify-center text-center h-full px-4"
                                                    style={borderStyle}
                                                >
                                                    {renderPreco(item, isEditing)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {mostraAcoes && (
                            <div className="w-[56px] shrink-0">
                                {linhas.map((item, idx) => {
                                    const linhaId = getLinhaId(item, idx);
                                    const isEditing = editingId === linhaId;

                                    return (
                                        <div
                                            key={linhaId}
                                            className="min-h-[64px] flex items-center justify-center gap-2"
                                        >
                                            {isEditing ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSalvarClick(item, linhaId)}
                                                    disabled={salvando}
                                                    aria-label="Salvar referência"
                                                >
                                                    <IconeSalvar />
                                                </button>
                                            ) : (
                                                podeEditar && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleIniciarEdicao(item, linhaId)
                                                        }
                                                        aria-label="Editar referência"
                                                    >
                                                        <IconeEditar />
                                                    </button>
                                                )
                                            )}

                                            {podeRemover && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoverLinha(item, idx)}
                                                    aria-label="Remover referência"
                                                >
                                                    <IconeLixeira />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-row items-center gap-4 w-full">
                        <div
                            className="flex-1 border-l border-r border-b rounded-b-[10px] overflow-hidden"
                            style={borderStyle}
                        >
                            <div className="py-10 text-center text-[#898c8f] font-Outfit font-light bg-white">
                                Nenhum cliente associado a este produto.
                            </div>
                        </div>
                        {mostraAcoes && <div className="w-[56px] shrink-0" />}
                    </div>
                )}

                {onAbrirModal && (
                    <button
                        type="button"
                        onClick={onAbrirModal}
                        className="w-full mt-3 flex justify-center items-center h-[48px] bg-[#f8f8f8] rounded-[10px] border border-[#e0e0e0] hover:bg-gray-100 transition-colors"
                    >
                        <span className="text-[24px] text-gray-400 font-light">+</span>
                    </button>
                )}
            </div>
        </section>
    );
}
