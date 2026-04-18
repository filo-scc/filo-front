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

/** Mesmas colunas do cabeçalho e das linhas (foto + 3 textos) */
const gridColsClass =
  "grid grid-cols-[minmax(140px,200px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]";

const borderColor = "#d9d9d9";

export default function TabelaReferencias({
  produtos,
  onAbrirModal,
  title = "Referências associadas",
  onRemoverLinha,
}) {
  const formatPreco = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const borderStyle = { borderColor };
  const podeRemover = Boolean(onRemoverLinha);
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

  const celulasLinha = (item) => (
    <>
      <div className="py-4 px-4 flex justify-center items-center">
        <img
          src={item.produto.foto}
          alt={item.produto.nome}
          className="w-48 h-32 rounded-[10px] object-cover max-w-full"
        />
      </div>
      <div
        className="py-3 px-4 font-light border-l flex items-center justify-center text-[#404040] text-[16px] font-Outfit"
        style={borderStyle}
      >
        {item.produto.nome}
      </div>
      <div
        className="py-3 px-4 font-light border-l flex items-center justify-center text-[#404040] text-[16px] font-Outfit"
        style={borderStyle}
      >
        {item.nome_para_cliente}
      </div>
      <div
        className="py-3 px-4 font-light border-l flex items-center justify-center text-[#404040] text-[16px] font-Outfit"
        style={borderStyle}
      >
        {formatPreco(item.preco_padrao)}
      </div>
    </>
  );

  if (podeRemover) {
    return (
      <section>
        <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
          {title}
        </h3>

        {produtos.length > 0 ? (
          <div className="flex flex-col gap-0">
            {/* Cabeçalho: tabela à esquerda (com borda), faixa vazia à direita alinhada à lixeira */}
            <div className="flex flex-row items-stretch gap-3 sm:gap-4 min-w-0">
              <div
                className="min-w-0 flex-1 rounded-t-[10px] border overflow-hidden"
                style={borderStyle}
              >
                {headerGrid}
              </div>
              <div
                className="w-12 sm:w-14 shrink-0"
                aria-hidden
              />
            </div>

            {produtos.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-row items-center gap-3 sm:gap-4 min-w-0"
              >
                <div
                  className={`min-w-0 flex-1 border-l border-r border-b overflow-hidden ${
                    idx === ultimo ? "rounded-b-[10px]" : ""
                  }`}
                  style={borderStyle}
                >
                  <div className={`${gridColsClass} w-full`}>
                    {celulasLinha(item)}
                  </div>
                </div>
                <div className="w-12 sm:w-14 shrink-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onRemoverLinha(idx)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#D75757] transition-colors hover:bg-red-50"
                    aria-label="Remover referência"
                  >
                    <IconeLixeira className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
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
          <img
            src="/mais_cinza.png"
            alt="Adicionar"
            className="w-6 h-6 object-contain"
          />
        </button>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
        {title}
      </h3>

      <div
        className="rounded-[10px] overflow-hidden border"
        style={borderStyle}
      >
        <div className="border-b" style={borderStyle}>
          {headerGrid}
        </div>

        {produtos.length > 0 ? (
          produtos.map((item, idx) => (
            <div
              key={idx}
              className={`${gridColsClass} w-full border-b last:border-b-0`}
              style={borderStyle}
            >
              {celulasLinha(item)}
            </div>
          ))
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
        <img
          src="/mais_cinza.png"
          alt="Adicionar"
          className="w-6 h-6 object-contain"
        />
      </button>
    </section>
  );
}
