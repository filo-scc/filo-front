export default function TabelaReferencias({ produtos, onAbrirModal }) {
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
        Referências associadas
      </h3>

      <div
        className="rounded-[10px] overflow-hidden border"
        style={borderStyle}
      >
        <table className="w-full text-center border-collapse">
          <thead>
            <tr
              className="bg-[#d9d9d9] text-[#898c8f] text-[16px] font-Outfit font-light border-b"
              style={borderStyle}
            >
              <th className="py-3 px-4 w-[200px]"></th>{" "}
              {/* Coluna da foto sem label */}
              <th className="py-3 px-4 font-light border-l" style={borderStyle}>
                Referência Interna
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
            {produtos.length > 0 ? (
              produtos.map((item, idx) => (
                <tr
                  key={idx}
                  className="text-[#404040] text-[16px] font-Outfit border-b last:border-b-0"
                  style={borderStyle}
                >
                  <td className="py-4 px-4 flex justify-center">
                    <img
                      src={item.produto.foto}
                      alt={item.produto.nome}
                      className="w-48 h-32 rounded-[10px] object-cover"
                    />
                  </td>
                  <td
                    className="py-3 px-4 font-light border-l"
                    style={borderStyle}
                  >
                    {item.produto.nome}
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
                  className="py-10 text-[#898c8f] font-Outfit font-light"
                >
                  Esse cliente ainda não possui referências associadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botão de + com largura total da tabela e função onAbrirModal */}
      <button
        onClick={onAbrirModal}
        className="w-full mt-2 flex justify-center items-center h-[45px] bg-[#f4f4f4] rounded-[10px] hover:bg-gray-200 transition-colors"
      >
        <img
          src="/mais_cinza.png"
          alt="Adicionar"
          className="w-6 h-6 object-contain"
        />
      </button>
    </section>
  );
}
