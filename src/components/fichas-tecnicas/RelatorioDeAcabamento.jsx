export default function RelatorioDeAcabamento({
    defeitoCostura = 0,
    defeitoTecido = 0,
    retiradas = 0,
    sobras = 0,
}) {
    return (
        <div className="mt-4">
            <div className="mb-2 text-center text-[15px] font-light text-[#737373]">
                Relatório de acabamento
            </div>
            <div className="border border-[#E8E8E8] rounded-[10px] overflow-hidden">
                <table className="w-full text-center text-sm">
                    <thead className="bg-[#C9EAF6] text-[#4696AD]">
                        <tr>
                            <th className="py-3 border-r border-white/50 font-normal w-1/4 rounded-tl-[9px]">
                                Defeito de costura
                            </th>
                            <th className="py-3 border-r border-white/50 font-normal w-1/4">
                                Defeito no tecido
                            </th>
                            <th className="py-3 border-r border-white/50 font-normal w-1/4">
                                Retiradas
                            </th>
                            <th className="py-3 font-normal w-1/4 rounded-tr-[9px]">Sobras</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#707070]">
                        <tr className="border-t border-[#E8E8E8]">
                            <td className="py-3 border-r border-[#E8E8E8] rounded-bl-[9px]">
                                {defeitoCostura}
                            </td>
                            <td className="py-3 border-r border-[#E8E8E8]">{defeitoTecido}</td>
                            <td className="py-3 border-r border-[#E8E8E8]">{retiradas}</td>
                            <td className="py-3 rounded-br-[9px]">{sobras}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
