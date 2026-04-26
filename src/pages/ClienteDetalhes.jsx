import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getClienteById,
  getProdutosDoCliente,
} from "../services/clientesService";
import { Layout } from "../components/Layout";
import {
    formatarCepExibicao,
    formatarCnpjExibicao,
    formatarTelefoneExibicao,
} from "../utils/mascaras";

// Sub-componentes
import DetalhesHeader from "../components/clientes/DetalhesHeader";
import SecaoDadosGerais from "../components/clientes/SecaoDadosGerais";
import SecaoEndereco from "../components/clientes/SecaoEndereco";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import ModalReferencias from "../components/clientes/ModalReferencias";

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState(null);
  const [produtos, setProdutos] = useState([]);

  // Estado do modal de referências
  const [modalReferenciasAberto, setModalReferenciasAberto] = useState(false);

  // Recarrega a tabela chamando o endpoint de produtos novamente
  const recarregarTabela = async () => {
    try {
      const dadosProdutos = await getProdutosDoCliente(id);
      setProdutos(dadosProdutos);
    } catch (error) {
      console.error("Erro ao atualizar tabela", error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const userString = localStorage.getItem("user");
        const usuarioLogado = JSON.parse(userString);

        const [dadosCliente, dadosProdutos] = await Promise.all([
          getClienteById(id),
          getProdutosDoCliente(id),
        ]);

        if (dadosCliente.fabrico_id !== usuarioLogado.fabrico_id) {
          navigate("/clientes", {
            replace: true,
            state: {
              error: "Acesso negado. Este cliente não pertence à sua fábrica.",
            },
          });
          return;
        }

        setCliente(dadosCliente);
        setProdutos(dadosProdutos);
      } catch (error) {
        console.error(error);
        navigate("/clientes", {
          replace: true,
          state: { error: "Não foi possível ver detalhes desse cliente" },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate]);

    const clienteExibicao = useMemo(() => {
        if (!cliente) return null;
        return {
            ...cliente,
            cnpj: formatarCnpjExibicao(cliente.cnpj),
            telefone: formatarTelefoneExibicao(cliente.telefone),
            endereco: cliente.endereco
                ? {
                      ...cliente.endereco,
                      cep: formatarCepExibicao(cliente.endereco.cep),
                  }
                : null,
        };
    }, [cliente]);

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <p className="text-[#4696AD] animate-pulse font-Outfit">
                        Carregando detalhes...
                    </p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 pt-0 w-full flex justify-center">
                <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[400px]">
                    <DetalhesHeader title="Detalhes de cliente" />

                    <div className="mt-8 space-y-8">
                        <SecaoDadosGerais cliente={cliente} />
                        <SecaoEndereco endereco={cliente.endereco} />
          <div className="mt-8 space-y-8">
            <SecaoDadosGerais cliente={clienteExibicao} />
            <SecaoEndereco endereco={clienteExibicao?.endereco} />

            {/* Tabela de Referências: 
                Passe a função de abrir o modal como prop, para acionar de lá! */}
            <TabelaReferencias
              produtos={produtos}
              onAbrirModal={() => setModalReferenciasAberto(true)}
            />

            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                nomeItem={cliente?.nome}
                tipoItem="o cliente"
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false);
                    navigate("/clientes", {
                        replace: true,
                        state: { success: "Cliente excluído com sucesso." },
                    });
                }}
                type="excluído"
            />
        </Layout>
    );
}
