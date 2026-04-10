import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getClienteById,
  getProdutosDoCliente,
} from "../services/clientesService";
import { Layout } from "../components/Layout";

// Sub-componentes
import DetalhesHeader from "../components/clientes/DetalhesHeader";
import SecaoDadosGerais from "../components/clientes/SecaoDadosGerais";
import SecaoEndereco from "../components/clientes/SecaoEndereco";
import TabelaReferencias from "../components/clientes/TabelaReferencias";

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState(null);
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const userString = localStorage.getItem("user");

        const usuarioLogado = JSON.parse(userString);

        // Chamadas em paralelo e busca do usuário logado
        const [dadosCliente, dadosProdutos] = await Promise.all([
          getClienteById(id),
          getProdutosDoCliente(id),
        ]);

        // Regra de Segurança: fabrico_id
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
        {/* Container dinâmico acompanhando o padrão da Home */}
        <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[400px]">
          <DetalhesHeader title="Detalhes do cliente" />

          <div className="mt-8 space-y-8">
            <SecaoDadosGerais cliente={cliente} />
            <SecaoEndereco endereco={cliente.endereco} />
            <TabelaReferencias produtos={produtos} />

            <div className="flex justify-end gap-4 mt-10">
              <button className="w-[189px] h-[39px] rounded-[18.9px] border border-[#4696ad] bg-[#f3f4fa] text-[#4696ad] font-Outfit text-[16px]">
                Editar cliente
              </button>
              <button
                className="w-[189px] h-[39px] rounded-[18.9px] bg-[#a9e2f2] text-[#4696ad] font-Outfit text-[16px]"
                onClick={() => navigate("/clientes")}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
