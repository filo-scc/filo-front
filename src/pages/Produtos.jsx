import React, { useState, useEffect } from "react";
import { getProdutosByFabrico } from "../services/produtoService";
import { useNavigate } from "react-router-dom";

// Componente do Card
const ProdutoCard = ({ id, nome, tipo, data, foto }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/produtos/${id}`)}
      className="w-full bg-[#F3F4FA] rounded-[16px] p-[6px] flex flex-col transition-all hover:shadow-sm font-['Outfit',_sans-serif] cursor-pointer"
    >
      {/* Contêiner da Imagem */}
      <div className="relative w-full h-[155px] bg-white rounded-t-[14px] rounded-b-[4px] overflow-hidden">
        <img src={foto} alt={nome} className="w-full h-full object-cover" />

        {/* Overlay Gradiente: Azul do ModalReferencias (40% opacidade) */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#4696AD]/40 via-transparent via-50% to-transparent" />

        {/* Nome do produto e Ícone etiqueta-branca.png*/}
        <div className="absolute bottom-[10px] left-[10px] right-[10px] z-20 flex items-center gap-[4px]">
          <img
            src="/etiqueta-branca.png"
            className="w-[14px] h-[14px] shrink-0 object-contain"
          />
          <span className="text-white text-[14px] font-normal tracking-wide drop-shadow-sm truncate block">
            {nome}
          </span>
        </div>
      </div>

      {/* Legenda inferior */}
      <div className="flex flex-col px-1 pt-1.5 pb-1">
        <span className="text-[#7B7D80] text-[10px] font-light truncate leading-tight">
          {tipo}
        </span>
        <span className="text-[#7B7D80] text-[10px] font-light truncate leading-tight">
          {data}
        </span>
      </div>
    </div>
  );
};

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      try {
        const dados = await getProdutosByFabrico(1);
        setProdutos(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

  return (
    <div className="p-6 pt-0 font-['Outfit',_sans-serif]">
      {/* Container Branco Principal */}
      <div className="bg-white rounded-[24px] shadow-sm min-h-[400px] w-full overflow-hidden pb-8">
        {/* Cabeçalho */}
        <div className="p-8 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-[28px] pl-[21px]">
            <div className="flex items-center gap-2 flex-shrink-0">
              <img src="/produtos-ativado.png" alt="" className="w-7 h-7" />
              <h1 className="text-[30px] font-light text-gray-800">Produtos</h1>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end min-w-[300px]">
              {/* Input de Buscar (Padrão Clientes) */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar"
                  className="pl-4 pr-10 border border-[#D3D3D3] rounded-[16px] text-[14px] focus:outline-none w-[196px] h-[39px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Botão Cadastrar Produto (Padrão Clientes) */}
              <button className="bg-[#A9E2F2] hover:bg-[#8acbdc] text-white w-[196px] h-[39px] rounded-[18.9px] flex items-center justify-center gap-2 text-[14px] font-normal transition-colors">
                <img
                  src="/produtos-ativado.png"
                  className="w-[20px] h-[20px]"
                />
                Cadastrar produto
              </button>
            </div>
          </div>
        </div>

        {/* 2 - Grid configurado para apenas 4 produtos por linha (lg:grid-cols-4) */}
        <div
          className="grid gap-[11px] pl-[16px] pr-[32px] 
                     grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {loading ? (
            <div className="col-span-full flex justify-center py-10 text-[#4696AD]">
              Carregando produtos...
            </div>
          ) : produtos.length === 0 ? (
            <div className="col-span-full flex justify-center py-10 text-gray-400 font-light">
              Nenhum produto encontrado.
            </div>
          ) : (
            produtos.map((produto) => (
              <ProdutoCard
                key={produto.id}
                id={produto.id}
                nome={produto.nome}
                tipo={produto.tipo || "Geral"}
                // Exemplo de tratamento de data (ajuste conforme o retorno do seu banco)
                data={
                  produto.created_at
                    ? `Criado em ${new Date(produto.created_at).toLocaleDateString()}`
                    : "Sem data"
                }
                foto={produto.foto || "https://via.placeholder.com/400x300"}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
