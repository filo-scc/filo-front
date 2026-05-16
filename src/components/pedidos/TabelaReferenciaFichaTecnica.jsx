const gridColsClass =
    "grid grid-cols-[280px_1fr_1fr_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.1fr)]";
const borderColor = "#d9d9d9";
const borderStyle = { borderColor };

function MiniDropdown({ value, placeholder, options, onChange }) {
    return (
        <select
            value={value || ""}
            onChange={(e) => {
                const selected = options.find((opt) => String(opt.id) === e.target.value);
                onChange(e.target.value, selected?.nome || "");
            }}
            className="w-full max-w-[180px] h-[32px] border border-[#898C8F] rounded-[8px] px-2 text-sm text-[#707070] bg-white focus:outline-none text-center appearance-none cursor-pointer"
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                    {opt.nome}
                </option>
            ))}
        </select>
    );
}

export default function TabelaFichaTecnica({
    fichas = [],
    faccoes = [],
    onChangeQuantidade,
    onChangeFaccao,
}) {
    const ultimo = fichas.length - 1;

    return (
        <section className="w-full">
            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">Fichas técnicas</h3>

            <div className="flex flex-col w-full">
                <div className="flex flex-row items-stretch w-full">
                    <div
                        className="flex-1 rounded-t-[10px] border overflow-hidden"
                        style={borderStyle}
                    >
                        <div
                            className={`${gridColsClass} bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light h-[52px] items-center`}
                        >
                            <div />
                            <div className="h-full flex items-center justify-center text-center px-3">
                                Referência interna
                            </div>
                            <div
                                className="border-l h-full flex items-center justify-center text-center px-3"
                                style={borderStyle}
                            >
                                Referência cliente
                            </div>
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
                                Facção Responsável
                            </div>
                        </div>
                    </div>
                </div>

                {fichas.length > 0 ? (
                    fichas.map((ficha, idx) => (
                        <div key={ficha.id} className="flex flex-row items-stretch w-full">
                            <div
                                className={`flex-1 border-l border-r border-b overflow-hidden h-[168px] ${
                                    idx === ultimo ? "rounded-b-[10px]" : ""
                                }`}
                                style={borderStyle}
                            >
                                <div
                                    className={`${gridColsClass} w-full h-full items-center text-[16px] font-Outfit text-[#898c8f] ${
                                        idx % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"
                                    }`}
                                >
                                    <div className="flex justify-center items-center h-full px-2">
                                        {ficha.foto ? (
                                            <img
                                                src={ficha.foto}
                                                alt={ficha.referenciaInterna}
                                                className="w-[220px] h-[130px] rounded-[10px] object-cover"
                                            />
                                        ) : (
                                            <div className="w-[220px] h-[130px] rounded-[10px] bg-[#E8E8E8]" />
                                        )}
                                    </div>
                                    <div className="font-light flex items-center justify-center text-center px-3 h-full text-[#404040]">
                                        {ficha.referenciaInterna || "-"}
                                    </div>
                                    <div
                                        className="font-light border-l flex items-center justify-center text-center px-3 h-full"
                                        style={borderStyle}
                                    >
                                        {ficha.referenciaCliente || "-"}
                                    </div>
                                    <div
                                        className="font-light border-l flex items-center justify-center text-center px-3 h-full"
                                        style={borderStyle}
                                    >
                                        {ficha.cores || "-"}
                                    </div>
                                    <div
                                        className="font-light border-l flex items-center justify-center text-center px-3 h-full"
                                        style={borderStyle}
                                    >
                                        <input
                                            type="number"
                                            min="1"
                                            value={ficha.quantidade ?? ""}
                                            onChange={(e) =>
                                                onChangeQuantidade?.(ficha.id, e.target.value)
                                            }
                                            placeholder="0"
                                            className="w-full max-w-[80px] text-center bg-transparent border-none outline-none focus:ring-0 font-Outfit text-[#898c8f]"
                                        />
                                    </div>
                                    <div
                                        className="font-light border-l flex items-center justify-center text-center px-3 h-full"
                                        style={borderStyle}
                                    >
                                        <MiniDropdown
                                            value={ficha.faccaoId}
                                            placeholder="Selecionar"
                                            options={faccoes}
                                            onChange={(faccaoId, faccaoNome) =>
                                                onChangeFaccao?.(ficha.id, faccaoId, faccaoNome)
                                            }
                                        />
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
                            <div className="py-10 text-center text-[#898c8f] font-Outfit font-light bg-white text-[16px]">
                                Nenhuma ficha adicionada
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
