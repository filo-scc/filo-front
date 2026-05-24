import React from "react";

const borderColor = "#d9d9d9";
const borderStyle = { borderColor };

export default function TabelaFichaTecnica({ fichas = [], isSobDemanda = true, onRemoverFicha }) {
    const gridColsClass = isSobDemanda ? "grid grid-cols-5 w-full" : "grid grid-cols-4 w-full";

    const formatarCores = (cores) => {
        if (!cores || cores.length === 0) return "-";
        if (Array.isArray(cores)) {
            return cores.map((cor) => (typeof cor === "object" ? cor.nome : cor)).join(", ");
        }
        return String(cores);
    };

    return (
        <section className="w-full">
            <div className="flex flex-col w-full">
                {/* CABEÇALHO DA TABELA */}
                <div className="flex flex-row items-stretch w-full">
                    <div
                        className="flex-1 rounded-t-[10px] border overflow-hidden bg-[#d9d9d9]"
                        style={borderStyle}
                    >
                        <div
                            className={`${gridColsClass} text-[#898c8f] text-[14px] font-Outfit font-light min-h-[46px]`}
                        >
                            <div
                                className="border-r flex items-center justify-center px-4"
                                style={borderStyle}
                            ></div>

                            <div className="flex items-center justify-center text-center px-4">
                                Referência Interna
                            </div>

                            {isSobDemanda && (
                                <div className="flex items-center justify-center text-center px-4">
                                    Referência Cliente
                                </div>
                            )}

                            <div className="flex items-center justify-center text-center px-4">
                                Cores
                            </div>

                            <div className="flex items-center justify-center text-center px-4">
                                Quantidade
                            </div>
                        </div>
                    </div>
                </div>

                {/* CORPO DA TABELA */}
                {fichas.length > 0 ? (
                    fichas.map((ficha, index) => {
                        const ultimo = index === fichas.length - 1;

                        return (
                            <div
                                key={ficha.id || index}
                                className="relative group flex flex-row items-stretch w-full"
                            >
                                <div
                                    className={`flex-1 border-l border-r border-b overflow-hidden bg-white transition-colors ${
                                        ultimo ? "rounded-b-[10px]" : ""
                                    }`}
                                    style={borderStyle}
                                >
                                    <div
                                        className={`${gridColsClass} text-[#404040] text-[16px] font-Outfit font-light min-h-[130px]`}
                                    >
                                        {/* 1. Coluna da Foto (com divisória interna) */}
                                        <div className="border-r-[0.5px] border-[#898c8f] p-3 flex items-center justify-center bg-white">
                                            {ficha.foto ? (
                                                <img
                                                    src={ficha.foto}
                                                    alt="Produto"
                                                    className="w-full max-w-[150px] h-[106px] object-cover rounded-[10px] shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-full max-w-[150px] h-[106px] bg-gray-50 rounded-[10px] flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200">
                                                    Sem foto
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Referência Interna (centralizada + divisória interna) */}
                                        <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                            {ficha.referenciaInterna || "-"}
                                        </div>

                                        {/* 3. Condicional: Referência Cliente (centralizada + divisória interna se ativo) */}
                                        {isSobDemanda && (
                                            <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                                {ficha.referenciaCliente || "-"}
                                            </div>
                                        )}

                                        {/* 4. Cores (centralizada + divisória interna) */}
                                        <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                            {formatarCores(ficha.cores)}
                                        </div>

                                        {/* 5. Quantidade (centralizada e sem borda direita, já que é a última célula interna) */}
                                        <div className="flex items-center justify-center text-center px-4 font-normal text-[#404040]">
                                            {ficha.quantidade || ficha.quantidade_pecas || "0"}
                                        </div>
                                    </div>
                                </div>

                                {/* Lixeira Externa */}
                                <button
                                    type="button"
                                    onClick={() => onRemoverFicha?.(ficha.id || index)}
                                    className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-5 text-[#D75757] rounded-full"
                                    title="Excluir ficha"
                                >
                                    <img
                                        src="/excluir-cinza-claro.png"
                                        alt="Remover ficha"
                                        className="w-5 h-5"
                                    />
                                </button>
                            </div>
                        );
                    })
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
