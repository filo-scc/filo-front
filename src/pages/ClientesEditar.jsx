import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ModalReferencias from "../components/clientes/ModalReferencias";
import {
  getClienteById,
  getProdutosDoCliente,
} from "../services/clientesService";

const sectionTitleClass =
  "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

/** Exemplo local em dev quando não há id na URL (rota `/clientes/editar`). Use ?mock=0 para ver formulário vazio. */
const mockClienteEditarExemplo = {
  form: {
    nomeEmpresa: "Moda Azul Ltda",
    cnpj: "12.345.678/0001-90",
    proprietario: "Ana Souza",
    telefone: "(81) 99999-0000",
    cep: "50050-100",
    rua: "Av. Boa Viagem",
    numero: "1200",
    bairro: "Boa Viagem",
    complemento: "Sala 302",
    cidade: "Recife",
    estado: "PE",
  },
  produtos: [
    {
      produto: {
        foto: "/imagem-login.png",
        nome: "Breeze",
      },
      nome_para_cliente: "Celine",
      preco_padrao: 0,
    },
    {
      produto: {
        foto: "/imagem-login.png",
        nome: "Aurora",
      },
      nome_para_cliente: "Linha verão",
      preco_padrao: 149.9,
    },
  ],
};

export default function ClientesEditar() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
  const fabricoId = usuarioLogado?.fabrico_id;
  /** Em dev: sem `id` na rota não há cliente para buscar — mostra exemplo. Com `?mock=1` força exemplo mesmo se houver `id` no futuro. Com `?mock=0` desliga o exemplo. */
  const usarMockDev =
    import.meta.env.DEV &&
    searchParams.get("mock") !== "0" &&
    (!id || searchParams.get("mock") === "1");

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nomeEmpresa: "",
    cnpj: "",
    proprietario: "",
    telefone: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
    cidade: "",
    estado: "",
  });

  const [produtosAssociados, setProdutosAssociados] = useState([]);
  const [modalReferenciasAberto, setModalReferenciasAberto] = useState(false);

  const recarregarProdutos = async () => {
    if (!id) return;
    try {
      const dados = await getProdutosDoCliente(id);
      setProdutosAssociados(dados);
    } catch (e) {
      console.error("Erro ao atualizar referências", e);
    }
  };

  useEffect(() => {
    async function carregar() {
      if (usarMockDev) {
        setLoading(true);
        setForm(mockClienteEditarExemplo.form);
        setProdutosAssociados(mockClienteEditarExemplo.produtos);
        setLoading(false);
        return;
      }
      if (!id || !fabricoId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [dadosCliente, dadosProdutos] = await Promise.all([
          getClienteById(id),
          getProdutosDoCliente(id),
        ]);

        if (dadosCliente.fabrico_id !== fabricoId) {
          navigate("/clientes", {
            replace: true,
            state: {
              error:
                "Acesso negado. Este cliente não pertence à sua fábrica.",
            },
          });
          return;
        }

        const end = dadosCliente.endereco || {};
        setForm({
          nomeEmpresa: dadosCliente.nome ?? "",
          cnpj: dadosCliente.cnpj ?? "",
          proprietario: dadosCliente.responsavel ?? "",
          telefone: dadosCliente.telefone ?? "",
          cep: end.cep ?? "",
          rua: end.rua ?? "",
          numero: end.numero ?? "",
          bairro: end.bairro ?? "",
          complemento: end.complemento ?? "",
          cidade: end.cidade ?? "",
          estado: end.estado ?? "",
        });
        setProdutosAssociados(dadosProdutos);
      } catch (e) {
        console.error(e);
        navigate("/clientes", {
          replace: true,
          state: { error: "Não foi possível carregar o cliente." },
        });
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id, fabricoId, navigate, usarMockDev]);

  const handleChange = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const removerLinha = (index) => {
    setProdutosAssociados((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-[1200px] xl:max-w-none mx-auto font-['Outfit',_sans-serif]">
      <div className="bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_8px_40px_rgba(70,150,173,0.08)] border border-[#F0F4F6] w-full">
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <img src="/star.png" alt="" className="w-8 h-8 shrink-0" />
          <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight">
            Editar cliente
          </h1>
        </div>

        {loading ? (
          <p className="text-[#4696AD] font-light py-12 text-center">
            Carregando dados do cliente...
          </p>
        ) : (
          <>
            <section className="mb-10">
              <h2 className={sectionTitleClass}>Dados gerais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <FloatingLabelInput
                  label="Nome da empresa"
                  value={form.nomeEmpresa}
                  onChange={handleChange("nomeEmpresa")}
                />
                <FloatingLabelInput
                  label="CNPJ"
                  value={form.cnpj}
                  onChange={handleChange("cnpj")}
                />
                <FloatingLabelInput
                  label="Proprietário"
                  value={form.proprietario}
                  onChange={handleChange("proprietario")}
                />
                <FloatingLabelInput
                  label="Telefone"
                  value={form.telefone}
                  onChange={handleChange("telefone")}
                />
              </div>
            </section>

            <section className="mb-10">
              <h2 className={sectionTitleClass}>Endereço</h2>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <FloatingLabelInput
                    label="CEP"
                    value={form.cep}
                    onChange={handleChange("cep")}
                  />
                </div>
                <div className="sm:col-span-5">
                  <FloatingLabelInput
                    label="Rua"
                    value={form.rua}
                    onChange={handleChange("rua")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FloatingLabelInput
                    label="Nº"
                    value={form.numero}
                    onChange={handleChange("numero")}
                  />
                </div>
                <div className="sm:col-span-3">
                  <FloatingLabelInput
                    label="Bairro"
                    value={form.bairro}
                    onChange={handleChange("bairro")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <FloatingLabelInput
                    label="Complemento"
                    value={form.complemento}
                    onChange={handleChange("complemento")}
                  />
                </div>
                <div className="md:col-span-4">
                  <FloatingLabelInput
                    label="Cidade"
                    value={form.cidade}
                    onChange={handleChange("cidade")}
                  />
                </div>
                <div className="md:col-span-3">
                  <FloatingLabelInput
                    label="Estado"
                    value={form.estado}
                    onChange={handleChange("estado")}
                  />
                </div>
              </div>
            </section>

            <div className="mb-10">
              <TabelaReferencias
                title="Associar produtos e referências"
                produtos={produtosAssociados}
                onAbrirModal={() => setModalReferenciasAberto(true)}
                onRemoverLinha={removerLinha}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    usarMockDev || !id ? "/clientes" : `/clientes/${id}`,
                  )
                }
                className="bg-[#A9E2F2] hover:bg-[#94d6eb] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
              >
                Finalizar edição
              </button>
            </div>
          </>
        )}
      </div>

      {!loading && (usarMockDev || id) ? (
        <ModalReferencias
          isOpen={modalReferenciasAberto}
          onClose={() => setModalReferenciasAberto(false)}
          clienteId={usarMockDev ? null : id}
          fabricoId={fabricoId}
          produtosExistentes={produtosAssociados}
          onSuccess={recarregarProdutos}
        />
      ) : null}
    </div>
  );
}
