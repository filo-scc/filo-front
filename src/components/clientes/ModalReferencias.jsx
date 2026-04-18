import React, { useState, useEffect } from "react";
import {
  getProdutosPorFabrico,
  vincularProdutoAoCliente,
} from "../../services/clientesService";

export default function ModalReferencias({
  isOpen,
  onClose,
  clienteId,
  fabricoId,
  produtosExistentes,
  onSuccess,
  onAdicionarSelecionados,
}) {
  const [produtos, setProdutos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [busca, setBusca] = useState("");
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Função para fechar e resetar os estados do modal
  const handleClose = () => {
    setBusca("");
    setSelecionados([]);
    onClose();
  };

  useEffect(() => {
    // Se o modal fechar, garante a limpeza. Se abrir, faz a busca.
    if (!isOpen) {
      setBusca("");
      setSelecionados([]);
      return;
    }

    const carregarProdutos = async () => {
      setLoadingFetch(true);
      try {
        const dados = await getProdutosPorFabrico(fabricoId, busca);

        const produtosFiltrados = dados.filter((prod) => {
          return !produtosExistentes.some(
            (existente) =>
              (existente.produto?.id || existente.produto_id) === prod.id,
          );
        });

        setProdutos(produtosFiltrados);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setLoadingFetch(false);
      }
    };

    const delayDebounceFn = setTimeout(() => carregarProdutos(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [isOpen, fabricoId, busca, produtosExistentes]);

  const toggleSelecao = (id) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAdicionar = async () => {
    if (selecionados.length === 0) return;

    if (onAdicionarSelecionados) {
      const produtosSelecionados = produtos.filter((produto) =>
        selecionados.includes(produto.id),
      );
      onAdicionarSelecionados(produtosSelecionados);
      handleClose();
      return;
    }

    setLoadingSubmit(true);
    try {
      const body = { nome_para_cliente: "-", preco_padrao: 0 };

      const requests = selecionados.map((produtoId) =>
        vincularProdutoAoCliente(clienteId, produtoId, body),
      );

      await Promise.all(requests);

      onSuccess();
      handleClose(); // Já limpa e fecha
    } catch (error) {
      console.error("Erro ao vincular produtos:", error);
      alert("Ocorreu um erro ao adicionar algumas referências.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop com onClick para fechar ao clicar fora
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Estilos locais para deixar o scroll extremamente sutil apenas neste modal */}
      <style>
        {`
          .scrollbar-sutil::-webkit-scrollbar {
            width: 4px;
          }
          .scrollbar-sutil::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-sutil::-webkit-scrollbar-thumb {
            background-color: #d1d5db; /* gray-300 */
            border-radius: 10px;
          }
        `}
      </style>

      {/* Container do Modal - Largura aumentada para 730px */}
      <div
        className="bg-[#F3F4FA] w-full max-w-[730px] rounded-[24px] shadow-[4px_4px_10px_2px_rgba(0,0,0,0.15)] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pl-6 font-['Outfit',_sans-serif]">
          <div className="flex items-center gap-3">
            <img
              src="/etiqueta_cinza.png"
              alt="Ícone Referências"
              className="w-[26px] h-[26px] object-contain"
            />
            <h2 className="text-[26px] font-light text-[#404040]">
              Referências
            </h2>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-4 pr-10 border border-[#898c8e] bg-[#f3f4fa] rounded-[12px] text-sm placeholder-[#898c8e] focus:outline-none focus:border-[#4696AD] w-[196px] h-[34px]"
            />
            <svg
              className="w-4 h-4 text-[#898c8e] absolute right-4 top-1/2 -translate-y-1/2"
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
        </div>

        {/* O -mr-6 empurra a barra de rolagem para a borda direita (invadindo o padding do pai). 
            O pr-4 devolve o espaço para os cards não ficarem colados na barra de rolagem. 
        */}
        <div className="max-h-[280px] overflow-y-auto -mr-6 pr-4 scrollbar-sutil">
          {loadingFetch ? (
            <div className="flex justify-center items-center h-[150px] text-[#4696AD]">
              Buscando produtos...
            </div>
          ) : produtos.length === 0 ? (
            <div className="flex justify-center items-center h-[150px] text-gray-500 font-light font-Outfit">
              Nenhuma nova referência encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {produtos.map((produto) => {
                const isSelected = selecionados.includes(produto.id);
                return (
                  <div
                    key={produto.id}
                    onClick={() => toggleSelecao(produto.id)}
                    /* AQUI: 
              - 'p-1' (era p-2) deixa a borda do background cinza mais fininha. Teste p-1.5 ou p-[6px].
              - 'gap-1' (era gap-2) aproxima a imagem da linha do texto abaixo. 
            */
                    className={` rounded-[16px] p-1 flex flex-col gap-1 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-[#cbe8f0] text-[#4696ad]"
                        : "bg-[#d7d7d7] text-[#7b7d80]"
                    }`}
                  >
                    {/* Contêiner da Foto - Aumente ou diminua h-[135px] para controlar o tamanho.
                ADICIONADO: 'relative' para o posicionamento do overlay. */}
                    <div className="w-full h-[135px] bg-white rounded-[13px] overflow-hidden relative">
                      <img
                        src={produto.foto}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />

                      {/* AQUI: ADIÇÃO DO OVERLAY GRADIENTE
                  - bg-gradient-to-t: Gradiente linear para o topo (vertical).
                  - from-...: Define a cor na base (0%).
                  - via-transparent via-50%: Força a transparência total a partir da metade (50% pra cima).
                  - to-transparent: Garante transparência no topo.
              */}
                      <div
                        className={`absolute inset-0 z-10 bg-gradient-to-t to-transparent via-transparent via-50% transition-colors duration-200 ${
                          isSelected
                            ? // Selecionado: 40% da cor #4696AD no bottom
                              "from-[#4696AD]/40"
                            : // Não Selecionado: 50% da cor #898C8F no bottom
                              "from-[#898C8F]/50"
                        }`}
                      />
                    </div>

                    {/* AQUI: 'px-1.5' dá um respiro nas laterais e embaixo para o texto não colar na borda do card */}
                    <div className="flex items-center justify-between px-1.5 p-1 relative z-20">
                      {/* AQUI: Mudei para 'gap-1' (era gap-2). Se ainda achar longe, use 'gap-[2px]' ou 'gap-0' */}
                      <div className="flex items-center gap-1 overflow-hidden">
                        <img
                          src={
                            isSelected
                              ? "/etiqueta_azul.png"
                              : "/etiqueta_cinza_claro.png"
                          }
                          alt="Ícone"
                          className="w-[16px] h-[16px] shrink-0 object-contain"
                        />
                        <span className="text-[12px] truncate font-['Outfit',_sans-serif] font-light">
                          {produto.nome}
                        </span>
                      </div>

                      <button className="shrink-0 flex items-center justify-center w-[20px] h-[20px]">
                        <img
                          src={
                            isSelected ? "/check_azul.png" : "/mais_cinza.png"
                          }
                          alt={isSelected ? "Selecionado" : "Adicionar"}
                          className="w-[11px] h-[11px] object-contain"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botão de concluir com as novas cores */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleAdicionar}
            disabled={loadingSubmit || selecionados.length === 0}
            className={`w-[189px] h-[39px] rounded-[18.9px] font-['Outfit',_sans-serif] text-[16px] transition-colors bg-[#A9E2F2] text-[#4696AD] ${
              selecionados.length > 0 && !loadingSubmit
                ? "hover:bg-[#8acbdc]" // Leve hover para dar feedback
                : "opacity-50 cursor-not-allowed" // Transparente quando inativo
            }`}
          >
            {loadingSubmit ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
