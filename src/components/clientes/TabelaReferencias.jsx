import React, { useState } from "react";

function IconeLixeira({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
        </svg>
    );
}

function IconeEditar({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
            />
        </svg>
    );
}

function IconeSalvar({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function IconeCancelar({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

const gridColsClass =
    "grid grid-cols-[minmax(140px,200px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]";
const borderColor = "#d9d9d9";

export default function TabelaReferencias({
    produtos = [],
    onAbrirModal,
    title = "Referências associadas",
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

    const borderStyle = { borderColor };
    const podeRemover = Boolean(onRemoverLinha);
    const podeEditar = Boolean(onSalvarEdicao);
    const ultimo = produtos.length - 1;

    const headerGrid = (
        <div
            className={`${gridColsClass} bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light text-center`}
        >
            <div className="py-3 px-4" />
            <div className="py-3 px-4 font-light border-l" style={borderStyle}>
                Referência Interna
            </div>
            <div className="py-3 px-4 font-light border-l" style={borderStyle}>
                Referência Cliente
            </div>
            <div className="py-3 px-4 font-light border-l" style={borderStyle}>
                Preço
            </div>
        </div>
    );

    const handleIniciarEdicao = (item) => {
        // 👇 Pega o ID de forma segura
        const idAtual = item?.produto?.id || item?.produto_id;

        setEditingId(idAtual);
        setEditNome(item.nome_para_cliente || "");
        setEditPreco(item.preco_padrao || 0);
    };

    const handleCancelarEdicao = () => {
        setEditingId(null);
        setEditNome("");
        setEditPreco("");
    };
    
    const handleSalvarClick = async (produto_id) => {
        console.log("👉 A. O botão foi clicado! ID do produto:", produto_id);
        console.log("👉 B. A função onSalvarEdicao chegou na tabela?", !!onSalvarEdicao);

        if (!onSalvarEdicao) {
            console.log("❌ ERRO: onSalvarEdicao não existe aqui dentro!");
            return;
        }

        setLoading(true);
        try {
            console.log("👉 C. Chamando a função do pai com os dados:", {
                produto_id,
                nome_para_cliente: editNome,
                preco_padrao: Number(editPreco),
            });

            await onSalvarEdicao({
                produto_id,
                nome_para_cliente: editNome,
                preco_padrao: Number(editPreco),
            });

            console.log("👉 D. A função do pai terminou! Fechando a edição.");
            setEditingId(null);
        } catch (error) {
            console.error("❌ E. Deu erro ao salvar na tabela:", error);
        } finally {
            setLoading(false);
        }
    };

    const celulasLinha = (item, isEditing) => (
        <>
            <div className="py-4 px-4 flex justify-center items-center">
                <img
                    src={item.produto?.foto}
                    alt={item.produto?.nome}
                    className="w-48 h-32 rounded-[10px] object-cover max-w-full"
                />
            </div>
            <div
                className="py-3 px-4 font-light border-l flex items-center justify-center text-[#404040] text-[16px] font-Outfit text-center"
                style={borderStyle}
            >
                {item.produto?.nome}
            </div>
            <div
                className="py-3 px-4 font-light border-l flex items-center justify-center text-[#404040] text-[16px] font-Outfit text-center"
                style={borderStyle}
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        disabled={loading}
                        className="w-full text-center px-2 py-1.5 text-[15px] border border-[#4A90E2] rounded-[6px] outline-none focus:ring-2 focus:ring-[#4A90E2]/30 transition-all"
                    />
                ) : (
                    item.nome_para_cliente
                )}
            </div>
            <div
                className="py-3 px-4 font-light border-l flex items-center justify-center text-[#404040] text-[16px] font-Outfit text-center"
                style={borderStyle}
            >
                {isEditing ? (
                    <input
                        type="number"
                        step="0.01"
                        value={editPreco}
                        onChange={(e) => setEditPreco(e.target.value)}
                        disabled={loading}
                        className="w-full max-w-[120px] text-center px-2 py-1.5 text-[15px] border border-[#4A90E2] rounded-[6px] outline-none focus:ring-2 focus:ring-[#4A90E2]/30 transition-all"
                    />
                ) : (
                    formatPreco(item.preco_padrao)
                )}
            </div>
        </>
    );

    if (podeRemover || podeEditar) {
        return (
            <section>
                <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">{title}</h3>

                {produtos.length > 0 ? (
                    <div className="flex flex-col gap-0">
                        {/* Cabeçalho */}
                        <div className="flex flex-row items-stretch gap-3 sm:gap-4 min-w-0">
                            <div
                                className="min-w-0 flex-1 rounded-t-[10px] border overflow-hidden"
                                style={borderStyle}
                            >
                                {headerGrid}
                            </div>
                            <div className="w-12 sm:w-[84px] shrink-0" aria-hidden />
                        </div>

                        {/* Linhas */}
                        {produtos.map((item, idx) => {
                            const idAtual = item?.produto?.id || item?.produto_id;
                            const isEditing = editingId === idAtual;

                            return (
                                <div
                                    key={idAtual || idx}
                                    className="flex flex-row items-center gap-3 sm:gap-4 min-w-0"
                                >
                                    <div
                                        className={`min-w-0 flex-1 border-l border-r border-b overflow-hidden ${idx === ultimo ? "rounded-b-[10px]" : ""}`}
                                        style={borderStyle}
                                    >
                                        <div className={`${gridColsClass} w-full`}>
                                            {celulasLinha(item, isEditing)}
                                        </div>
                                    </div>

                                    {/* Ações (Direita) */}
                                    <div className="w-12 sm:w-[84px] shrink-0 flex items-center justify-start gap-1">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    type="button"
                                                    // 👇 Passando o idAtual na hora de salvar
                                                    onClick={() => handleSalvarClick(idAtual)}
                                                    disabled={loading}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#28A745] transition-colors hover:bg-green-50 disabled:opacity-50"
                                                    title="Salvar"
                                                >
                                                    <IconeSalvar className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelarEdicao}
                                                    disabled={loading}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#D75757] transition-colors hover:bg-red-50 disabled:opacity-50"
                                                    title="Cancelar"
                                                >
                                                    <IconeCancelar className="h-5 w-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {podeEditar && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleIniciarEdicao(item)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4A90E2] transition-colors hover:bg-blue-50"
                                                        title="Editar"
                                                    >
                                                        <IconeEditar className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {podeRemover && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoverLinha(item, idx)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#D75757] transition-colors hover:bg-red-50"
                                                        title="Remover"
                                                    >
                                                        <IconeLixeira className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        className="rounded-[10px] border py-10 text-[#898c8f] font-Outfit font-light text-center"
                        style={borderStyle}
                    >
                        Esse cliente ainda não possui referências associadas.
                    </div>
                )}

                <button
                    type="button"
                    onClick={onAbrirModal}
                    className="w-full mt-2 flex justify-center items-center h-[45px] bg-[#f4f4f4] rounded-[10px] hover:bg-gray-200 transition-colors"
                >
                    <img src="/mais_cinza.png" alt="Adicionar" className="w-6 h-6 object-contain" />
                </button>
            </section>
        );
    }

    // Retorno de fallback
    return (
        <section>
            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">{title}</h3>
            <div className="rounded-[10px] overflow-hidden border" style={borderStyle}>
                <div className="border-b" style={borderStyle}>
                    {headerGrid}
                </div>
                {produtos.length > 0 ? (
                    produtos.map((item, idx) => {
                        const idAtual = item?.produto?.id || item?.produto_id;
                        return (
                            <div
                                key={idAtual || idx}
                                className={`${gridColsClass} w-full border-b last:border-b-0`}
                                style={borderStyle}
                            >
                                {celulasLinha(item, false)}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-10 text-[#898c8f] font-Outfit font-light text-center">
                        Esse cliente ainda não possui referências associadas.
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={onAbrirModal}
                className="w-full mt-2 flex justify-center items-center h-[45px] bg-[#f4f4f4] rounded-[10px] hover:bg-gray-200 transition-colors"
            >
                <img src="/mais_cinza.png" alt="Adicionar" className="w-6 h-6 object-contain" />
            </button>
        </section>
    );
}
