export default function TabelaClientesDoProduto({ clientes, referenciaInterna }) {
    const formatPreco = (valor) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);
    };

    const borderStyle = { borderColor: "#d9d9d9" };

    return (
        <section>
            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                Referências associadas a clientes
            </h3>

            <div className="rounded-[10px] overflow-hidden border" style={borderStyle}>
                <table className="w-full text-center border-collapse table-fixed">
                    <thead>
                        <tr
                            className="bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light border-b"
                            style={borderStyle}
                        >
                            <th className="py-3 px-4 font-light">Referência Interna</th>
                            <th className="py-3 px-4 font-light border-l" style={borderStyle}>
                                Cliente
                            </th>
                            <th className="py-3 px-4 font-light border-l" style={borderStyle}>
                                Referência Cliente
                            </th>
                            <th className="py-3 px-4 font-light border-l" style={borderStyle}>
                                Preço
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length > 0 ? (
                            clientes.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className="text-[#404040] text-[16px] font-Outfit border-b last:border-b-0"
                                    style={borderStyle}
                                >
                                    {/* A primeira linha carrega o rowSpan da Referência Interna */}
                                    {idx === 0 && (
                                        <td
                                            rowSpan={clientes.length}
                                            className="py-3 px-4 font-light align-middle bg-white"
                                        >
                                            {referenciaInterna}
                                        </td>
                                    )}
                                    <td
                                        className="py-3 px-4 font-light border-l"
                                        style={borderStyle}
                                    >
                                        {item.cliente.nome}
                                    </td>
                                    <td
                                        className="py-3 px-4 font-light border-l"
                                        style={borderStyle}
                                    >
                                        {item.nome_para_cliente}
                                    </td>
                                    <td
                                        className="py-3 px-4 font-light border-l"
                                        style={borderStyle}
                                    >
                                        {formatPreco(item.preco_padrao)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="py-10 text-[#898c8f] font-Outfit font-light bg-white"
                                >
                                    Nenhum cliente associado a este produto.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
