import React from "react";

const borderColor = "#d9d9d9";
const borderStyle = { borderColor };

export default function TabelaFichaTecnica({ fichas = [], isSobDemanda = true, onRemoverFicha }) {
    const ultimo = fichas.length - 1;

    // Define o grid dinamicamente: se tiver Referência Cliente, são 6 colunas. Senão, 5.
    const gridColsClass = isSobDemanda
        ? "grid grid-cols-[260px_1fr_1fr_1fr_120px_100px]"
        : "grid grid-cols-[260px_1.5fr_1.5fr_120px_100px]";

    return (
        <section className="w-full">
            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                Fichas técnicas
            </h3>

            <div className="flex flex-col w-full">
                {/* CABEÇALHO DA TABELA */}
                <div className="flex flex-row items-stretch w-full">
                    <div
                        className="flex-1 rounded-t-[10px] border overflow-hidden"
                        style={borderStyle}
                    >
                        <div
                            className={`${gridColsClass} bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light h-[52px] items-center`}
                        >
                            <div className="h-full flex items-center justify-center text-center px-3">
                                Foto
                            </div>

                            <div
                                className="border-l h-full flex items-center justify-center text-center px-3"
                                style={borderStyle}
                            >
                                Referência interna
                            </div>

                            {isSobDemanda && (
                                <div
                                    className="border-l h-full flex items-center justify-center text-center px-3"
                                    style={borderStyle}
                                >
                                    Referência cliente
                                </div>
                            )}

                            <div
                                className="border-l h-full flex items-center justify-center text-center px-3"
                                style={borderStyle}
                            >
                                Cores
                            </div>

                            <div
                                className="border-l h-full flex items-center justify-center text-center px-3"
                                style={borderStyle}
                            >
                                Quantidade
                            </div>

                            <div
                                className="border-l h-full flex items-center justify-center text-center px-3"
                                style={borderStyle}
                            >
                                Ações
                            </div>
                        </div>
                    </div>
                </div>

                {/* CORPO DA TABELA */}
                {fichas.length > 0 ? (
                    fichas.map((ficha, idx) => (
                        <div key={ficha.id} className="flex flex-row items-stretch w-full">
                            <div
                                className={`flex-1 border-l border-r border-b overflow-hidden h-[168px] ${idx === ultimo ? "rounded-b-[10px]" : ""}`}
                                style={borderStyle}
                            >
                                <div
                                    className={`${gridColsClass} w-full h-full items-center text-[16px] font-Outfit text-[#898c8f] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"}`}
                                >
                                    {/* COLUNA FOTO */}
                                    <div className="flex justify-center items-center h-full px-2">
                                        {ficha.foto ? (
                                            <img
                                                src={ficha.foto}
                                                alt={ficha.referenciaInterna || "Produto"}
                                                className="w-[220px] h-[130px] rounded-[10px] object-cover border border-[#E0E0E0]"
                                            />
                                        ) : (
                                            <div className="w-[220px] h-[130px] rounded-[10px] bg-[#E8E8E8] flex items-center justify-center text-[12px] text-[#9B9B9B] text-center border border-[#E0E0E0]">
                                                Sem foto
                                            </div>
                                        )}
                                    </div>

                                    {/* COLUNA REF. INTERNA */}
                                    <div className="font-light flex items-center justify-center text-center px-3 h-full text-[#404040]">
                                        {ficha.referenciaInterna || "-"}
                                    </div>

                                    {/* COLUNA REF. CLIENTE (CONDICIONAL) */}
                                    {isSobDemanda && (
                                        <div
                                            className="font-light border-l flex items-center justify-center text-center px-3 h-full"
                                            style={borderStyle}
                                        >
                                            {ficha.referenciaCliente || "-"}
                                        </div>
                                    )}

                                    {/* COLUNA CORES */}
                                    <div
                                        className="font-light border-l flex items-center justify-center text-center px-2 h-full"
                                        style={borderStyle}
                                    >
                                        {ficha.cores && ficha.cores.length > 0 ? (
                                            <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 overflow-y-auto max-h-[140px] scrollbar-thin">
                                                {ficha.cores.map((cor, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center rounded-full bg-[#E5F6FB] px-2.5 py-1 text-[13px] text-[#4696AD]"
                                                    >
                                                        {cor.nome || cor}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[13px] text-[#898C8F] italic">
                                                {ficha.selectedColorIds?.length
                                                    ? `${ficha.selectedColorIds.length} cor(es)`
                                                    : "-"}
                                            </span>
                                        )}
                                    </div>

                                    {/* COLUNA QUANTIDADE */}
                                    <div
                                        className="font-light border-l flex items-center justify-center text-center px-3 h-full text-[#404040]"
                                        style={borderStyle}
                                    >
                                        {ficha.quantidade || 0}
                                    </div>

                                    {/* COLUNA AÇÕES */}
                                    <div
                                        className="font-light border-l flex items-center justify-center text-center px-3 h-full"
                                        style={borderStyle}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onRemoverFicha?.(ficha.id)}
                                            className="text-[14px] text-[#D75757] hover:underline transition-all"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-row items-stretch w-full">
                        <div
                            className="flex-1 border-l border-r border-b rounded-b-[10px] overflow-hidden"
                            style={borderStyle}
                        >
                            <div className="py-14 text-center text-[#898c8f] font-Outfit font-light bg-white text-[16px]">
                                Nenhuma ficha técnica adicionada ao pedido.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
