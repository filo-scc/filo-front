import React, { useState } from "react";

// Componentes de ícone (Mantidos)
function IconeLixeira() {
    return (
        <div className="group relative w-6 h-6 flex items-center justify-center cursor-pointer">
            <img
                src="/excluir-cinza.png"
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
        <div className="group relative w-6 h-6 flex items-center justify-center cursor-pointer">
            <img
                src="/editar-cinza.png"
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
        <div className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <img
                src="/check_azul.png"
                alt="Salvar"
                className="w-full h-full object-contain transition-transform hover:scale-110"
            />
        </div>
    );
}

const gridColsClass = "grid grid-cols-[180px_1fr_1fr_1fr]";
const borderColor = "#d9d9d9";

export default function TabelaReferencias({
    produtos = [],
    onAbrirModal,
    title = "Associar produtos e referências",
    onRemoverLinha,
    onSalvarEdicao,
}) {
    const [editingId, setEditingId] = useState(null);
    const [editNome, setEditNome] = useState("");
    const [editPreco, setEditPreco] = useState("");
    const [loading, setLoading] = useState(false);

    const formatPreco = (valor) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);
    };

    // Máscara nativa sem imports
    const maskMoeda = (valor) => {
        let value = valor.replace(/\D/g, "");
        value = (Number(value) / 100).toFixed(2) + "";
        value = value.replace(".", ",");
        value = value.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
        value = value.replace(/(\d)(\d{3}),/g, "$1.$2,");
        return "R$ " + value;
    };

    const handlePrecoChange = (e) => {
        setEditPreco(maskMoeda(e.target.value));
    };

    const handleIniciarEdicao = (item) => {
        const idAtual = item?.produto?.id || item?.produto_id;
        setEditingId(idAtual);
        setEditNome(item.nome_para_cliente || "");
        setEditPreco(maskMoeda((item.preco_padrao * 100).toString()));
    };

    const handleSalvarClick = async (produto_id) => {
        if (!onSalvarEdicao) return;
        setLoading(true);
        const valorNumerico = Number(editPreco.replace(/\D/g, "")) / 100;
        try {
            await onSalvarEdicao({
                produto_id,
                nome_para_cliente: editNome,
                preco_padrao: valorNumerico,
            });
            setEditingId(null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const borderStyle = { borderColor };
    const podeRemover = Boolean(onRemoverLinha);
    const podeEditar = Boolean(onSalvarEdicao);
    const ultimo = produtos.length - 1;

    const celulasLinha = (item, isEditing) => (
        <>
            {/* COLUNA FOTO - Sem borda à direita */}
            <div className="flex justify-center items-center h-full">
                <img
                    src={item.produto?.foto}
                    alt={item.produto?.nome}
                    className="w-[158px] h-[115px] rounded-[10px] object-cover"
                />
            </div>

            {/* COLUNA NOME INTERNO - Removi o border-l aqui */}
            <div className="font-light flex items-center justify-center text-center text-[#404040] text-[16px] font-Outfit h-full px-4">
                {item.produto?.nome}
            </div>

            {/* COLUNA NOME CLIENTE - Mantém border-l */}
            <div
                className="font-light border-l flex items-center justify-center text-center text-[#898C8F] text-[16px] font-Outfit h-full px-4"
                style={borderStyle}
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="w-full text-center bg-transparent border-none outline-none focus:ring-0 font-Outfit"
                        autoFocus
                    />
                ) : (
                    item.nome_para_cliente || "-"
                )}
            </div>

            {/* COLUNA PREÇO - Mantém border-l */}
            <div
                className="font-light border-l flex items-center justify-center text-center text-[#898C8F] text-[16px] font-Outfit h-full px-4"
                style={borderStyle}
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={editPreco}
                        onChange={handlePrecoChange}
                        className="w-full text-center bg-transparent border-none outline-none focus:ring-0 font-Outfit"
                    />
                ) : (
                    formatPreco(item.preco_padrao)
                )}
            </div>
        </>
    );

    return (
        <section className="w-full">
            <h3 className="text-[18px] font-Outfit font-normal text-[#404040] mb-4">{title}</h3>
            <div className="flex flex-col w-full">
                {/* Header */}
                <div className="flex flex-row items-stretch gap-4 w-full">
                    <div
                        className="flex-1 rounded-t-[10px] border overflow-hidden"
                        style={borderStyle}
                    >
                        <div
                            className={`${gridColsClass} bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light text-center h-[52px] items-center`}
                        >
                            {/* Espaço da foto e nome interno sem divisória no header também */}
                            <div className="col-span-2 flex items-center justify-center h-full">
                                Referência Interna
                            </div>
                            <div
                                className="border-l h-full flex items-center justify-center"
                                style={borderStyle}
                            >
                                Referência Cliente
                            </div>
                            <div
                                className="border-l h-full flex items-center justify-center"
                                style={borderStyle}
                            >
                                Preço
                            </div>
                        </div>
                    </div>
                    <div className="w-[30px] shrink-0" />
                </div>

                {/* Rows */}
                {produtos.map((item, idx) => {
                    const idAtual = item?.produto?.id || item?.produto_id;
                    const isEditing = editingId === idAtual;
                    return (
                        <div
                            key={idAtual || idx}
                            className="flex flex-row items-center gap-4 w-full group/row"
                        >
                            <div
                                className={`flex-1 border-l border-r border-b overflow-hidden h-[152px] ${idx === ultimo ? "rounded-b-[10px]" : ""}`}
                                style={borderStyle}
                            >
                                <div className={`${gridColsClass} w-full h-full items-center`}>
                                    {celulasLinha(item, isEditing)}
                                </div>
                            </div>
                            <div className="w-[30px] shrink-0 flex flex-col items-center gap-3">
                                {isEditing ? (
                                    <button
                                        onClick={() => handleSalvarClick(idAtual)}
                                        disabled={loading}
                                    >
                                        <IconeSalvar />
                                    </button>
                                ) : (
                                    podeEditar && (
                                        <button onClick={() => handleIniciarEdicao(item)}>
                                            <IconeEditar />
                                        </button>
                                    )
                                )}
                                {podeRemover && (
                                    <button onClick={() => onRemoverLinha(item, idx)}>
                                        <IconeLixeira />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={onAbrirModal}
                className="w-full mt-3 flex justify-center items-center h-[48px] bg-[#f8f8f8] rounded-[10px] border border-[#e0e0e0] hover:bg-gray-100 transition-colors"
            >
                <span className="text-[24px] text-gray-400 font-light">+</span>
            </button>
        </section>
    );
}
