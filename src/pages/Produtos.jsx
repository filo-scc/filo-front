import { useState } from "react";

// Componente do Card com o Fill e Radius solicitados
const ProdutoCard = () => {
  return (
    <div 
      style={{ backgroundColor: '#F3F4FA' }}
      className="w-full h-[238px] rounded-[16px] pt-4 px-4 pb-0 flex flex-col items-center justify-start opacity-100"
    >
      {/* Conteúdo interno virá a seguir */}
    </div>
  );
};

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtroSelecionado, setFiltroSelecionado] = useState("Mais vendidos");

  const opcoesFiltro = ["Mais vendidos", "Data de criação", "Nome"];

  return (
    <div className="p-6 pt-0">
      {/* Container Branco */}
      <div className="bg-white rounded-[24px] shadow-sm min-h-[400px] w-full overflow-hidden pb-8">
        
        {/* Cabeçalho - Mantendo o padding original para o título */}
        <div className="p-8 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-[28px] pl-[21px]">
            <div className="flex items-center gap-2 flex-shrink-0">
              <img src="/produtos-ativado.png" alt="" className="w-7 h-7" />
              <h1 className="text-[30px] font-light text-gray-800">Produtos</h1>
            </div>

            <div className="flex items-center justify-end gap-[15px] flex-1 min-w-[300px]">
              <div className="relative w-full max-w-[196px] h-[33px]">
                <input
                  type="text"
                  placeholder="Buscar"
                  className="w-full h-full border border-[#898C8F] rounded-[10px] pl-4 pr-10 text-[14px] text-[#898C8F] outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <img src="/search.png" alt="Lupa" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-70" />
              </div>

              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setFiltroAberto(!filtroAberto)}
                  className="w-[155px] h-[33px] border border-[#898C8F] rounded-[10px] flex items-center justify-between px-4"
                >
                  <span className="text-[#7B7D80] text-[14px] truncate">{filtroSelecionado}</span>
                  <img src="/arrow-down.png" alt="" className={`w-3 h-2 transition-transform duration-300 ${filtroAberto ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute right-0 mt-2 w-[155px] bg-white border border-[#eeeeee] rounded-[4px] shadow-lg z-50 overflow-hidden origin-top transition-all duration-300 ${filtroAberto ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible pointer-events-none'}`}>
                  {opcoesFiltro.map((opcao) => (
                    <button
                      key={opcao}
                      className="w-full h-[35px] flex items-center px-4 text-[14px] relative text-[#898C8F] hover:bg-[#F5F5F5]"
                      onClick={() => { setFiltroSelecionado(opcao); setFiltroAberto(false); }}
                    >
                      {filtroSelecionado === opcao && <div className="absolute left-0 top-0 w-[4px] h-full bg-[#D7FE65]" />}
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cards com as margens específicas: Esquerda 16px, Direita 40px, Gap 11px */}
        <div 
          className="grid gap-[11px] pl-[16px] pr-[40px] 
                     grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          <ProdutoCard />
          <ProdutoCard />
          <ProdutoCard />
          <ProdutoCard />
          <ProdutoCard />
          <ProdutoCard />
          <ProdutoCard />
          <ProdutoCard />
        </div>
      </div>
    </div>
  );
}