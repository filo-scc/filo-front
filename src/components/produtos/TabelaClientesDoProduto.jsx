export default function TabelaClientesDoProduto({ clientes, referenciaInterna }) {
    const formatPreco = (valor) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);
    };

    const borderColor = "border-[#898C8F]";

    return (
        <section>
            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                Referências associadas a clientes
            </h3>

            <div className="w-full">
                <table
                    className="w-full text-center border-separate table-fixed"
                    style={{ borderSpacing: 0 }}
                >
                    <thead>
                        <tr className="bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light">
                            <th className="py-3 px-4 font-light rounded-tl-[10px]">
                                Referência Interna
                            </th>
                            <th className="py-3 px-4 font-light">Cliente</th>
                            <th className="py-3 px-4 font-light">Referência Cliente</th>
                            <th className="py-3 px-4 font-light rounded-tr-[10px]">Preço</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes && clientes.length > 0 ? (
                            clientes.map((item, idx) => {
                                const isLastRow = idx === clientes.length - 1;

                                return (
                                    <tr
                                        key={idx}
                                        className={`text-[16px] font-Outfit text-[#898c8f] ${
                                            idx % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"
                                        }`}
                                    >
                                        {idx === 0 && (
                                            <td
                                                rowSpan={clientes.length}
                                                className={`py-3 px-4 font-light align-middle bg-white border-l border-b ${borderColor} rounded-bl-[10px]`}
                                            >
                                                {referenciaInterna}
                                            </td>
                                        )}

                                        <td
                                            className={`py-3 px-4 font-light border-l ${borderColor} ${isLastRow ? "border-b" : ""}`}
                                        >
                                            {item.cliente.nome}
                                        </td>
                                        <td
                                            className={`py-3 px-4 font-light border-l ${borderColor} ${isLastRow ? "border-b" : ""}`}
                                        >
                                            {item.nome_para_cliente}
                                        </td>

                                        <td
                                            className={`py-3 px-4 font-light border-l border-r ${borderColor} ${isLastRow ? "border-b rounded-br-[10px]" : ""}`}
                                        >
                                            {formatPreco(item.preco_padrao)}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            /* Linha caso não haja clientes */
                            <tr>
                                <td
                                    colSpan="4"
                                    className={`py-10 text-[#898c8f] font-Outfit font-light bg-white border-x border-b ${borderColor} rounded-bl-[10px] rounded-br-[10px]`}
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
