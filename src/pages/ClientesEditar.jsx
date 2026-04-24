import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ModalReferencias from "../components/clientes/ModalReferencias";
import {
  getClienteById,
  getProdutosDoCliente,
  atualizarCliente,
} from "../services/clientesService";

const sectionTitleClass =
  "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

/** Só usado com `?mock=1` na URL (desenvolvimento / preview do layout). */
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

  const usarMock = searchParams.get("mock") === "1";

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [statusCliente, setStatusCliente] = useState(true);
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

  const apenasNumeros = (valor) => String(valor || "").replace(/\D/g, "");

  const formatarCnpj = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 14);
    return digitos
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatarTelefone = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 11);
    if (!digitos) return "";
    if (digitos.length <= 2) return `(${digitos}`;
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    if (digitos.length <= 10) {
      return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    }
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  };

  const formatarCep = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 8);
    if (digitos.length <= 5) return digitos;
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
  };

  const valorOuUndefined = (valor) => {
    const limpo = String(valor || "").trim();
    return limpo.length > 0 ? limpo : undefined;
  };

  const numeroOuUndefined = (valor) => {
    if (valor === null || valor === undefined) return undefined;
    const texto = String(valor).trim();
    if (!texto) return undefined;
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : undefined;
  };

  const primeiroNumeroValido = (...valores) => {
    for (const valor of valores) {
      const numero = numeroOuUndefined(valor);
      if (numero !== undefined) return numero;
    }
    return undefined;
  };

  const fabricoId = primeiroNumeroValido(
    usuarioLogado?.fabrico_id,
    usuarioLogado?.fabricoId,
    usuarioLogado?.fabrico?.id,
  );

  const faccaoId = primeiroNumeroValido(
    usuarioLogado?.faccao_id,
    usuarioLogado?.faccaoId,
    usuarioLogado?.faccao?.id,
    usuarioLogado?.faccao?.faccao_id,
    usuarioLogado?.faccao?.[0]?.id,
    usuarioLogado?.faccao?.[0]?.faccao_id,
    usuarioLogado?.usuario?.faccao_id,
  );

  const formatarErroApi = (error) => {
    const data = error?.response?.data;
    const message = data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string" && message.trim()) return message;
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
    if (typeof error?.message === "string" && error.message.trim()) return error.message;
    return "Não foi possível salvar as alterações.";
  };

  const handleChange = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const handleChangeCnpj = (e) => {
    setForm((prev) => ({ ...prev, cnpj: formatarCnpj(e.target.value) }));
  };

  const handleChangeTelefone = (e) => {
    setForm((prev) => ({ ...prev, telefone: formatarTelefone(e.target.value) }));
  };

  const handleChangeCep = (e) => {
    setForm((prev) => ({ ...prev, cep: formatarCep(e.target.value) }));
  };

  const recarregarProdutos = async () => {
    if (!id || usarMock) return;
    try {
      const dados = await getProdutosDoCliente(id);
      setProdutosAssociados(dados);
    } catch (e) {
      console.error("Erro ao atualizar referências", e);
    }
  };

  useEffect(() => {
    async function carregar() {
      const usuario = JSON.parse(localStorage.getItem("user") || "{}");

      if (usarMock) {
        setLoading(true);
        setForm(mockClienteEditarExemplo.form);
        setProdutosAssociados(mockClienteEditarExemplo.produtos);
        setStatusCliente(true);
        setLoading(false);
        return;
      }

      if (!id) {
        navigate("/clientes", {
          replace: true,
          state: { error: "Cliente não encontrado." },
        });
        return;
      }

      const fabricoIdUsuario = primeiroNumeroValido(
        usuario?.fabrico_id,
        usuario?.fabricoId,
        usuario?.fabrico?.id,
      );

      if (!fabricoIdUsuario) {
        setLoading(false);
        navigate("/clientes", {
          replace: true,
          state: { error: "Não foi possível identificar a fábrica do usuário." },
        });
        return;
      }

      try {
        setLoading(true);
        const [dadosCliente, dadosProdutos] = await Promise.all([
          getClienteById(id),
          getProdutosDoCliente(id),
        ]);

        if (Number(dadosCliente.fabrico_id) !== Number(fabricoIdUsuario)) {
          navigate("/clientes", {
            replace: true,
            state: {
              error: "Acesso negado. Este cliente não pertence à sua fábrica.",
            },
          });
          return;
        }

        const end = dadosCliente.endereco || {};
        setStatusCliente(Boolean(dadosCliente.status));
        setForm({
          nomeEmpresa: dadosCliente.nome ?? "",
          cnpj: dadosCliente.cnpj ? formatarCnpj(dadosCliente.cnpj) : "",
          proprietario: dadosCliente.responsavel ?? "",
          telefone: dadosCliente.telefone
            ? formatarTelefone(dadosCliente.telefone)
            : "",
          cep: end.cep ? formatarCep(String(end.cep)) : "",
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
  }, [id, navigate, usarMock]);

  const handleFinalizar = async () => {
    setErro("");

    if (usarMock) {
      navigate("/clientes");
      return;
    }

    if (!id) return;

    const nome = valorOuUndefined(form.nomeEmpresa);
    if (!nome) {
      setErro("Informe o nome da empresa.");
      return;
    }

    const fabricoIdNumerico = numeroOuUndefined(fabricoId);
    if (!fabricoIdNumerico) {
      setErro("Não foi possível identificar a fábrica do usuário.");
      return;
    }

    const cnpjNumerico = valorOuUndefined(apenasNumeros(form.cnpj));
    const telefoneNumerico = valorOuUndefined(apenasNumeros(form.telefone));

    if (cnpjNumerico && cnpjNumerico.length !== 14) {
      setErro("CNPJ inválido. Informe 14 dígitos.");
      return;
    }
    if (
      telefoneNumerico &&
      (telefoneNumerico.length < 9 || telefoneNumerico.length > 11)
    ) {
      setErro("Telefone inválido. Informe entre 9 e 11 dígitos.");
      return;
    }

    const cepNumerico = valorOuUndefined(apenasNumeros(form.cep));
    if (cepNumerico && cepNumerico.length !== 8) {
      setErro("CEP inválido. Informe 8 dígitos.");
      return;
    }

    const endereco = {
      cep: cepNumerico,
      rua: valorOuUndefined(form.rua),
      numero: valorOuUndefined(form.numero),
      bairro: valorOuUndefined(form.bairro),
      complemento: valorOuUndefined(form.complemento),
      cidade: valorOuUndefined(form.cidade),
      estado: valorOuUndefined(form.estado),
      faccao_id: numeroOuUndefined(faccaoId),
    };

    const payload = {
      nome,
      cnpj: cnpjNumerico,
      telefone: telefoneNumerico,
      status: statusCliente,
      responsavel: valorOuUndefined(form.proprietario),
      fabrico_id: fabricoIdNumerico,
      endereco: Object.values(endereco).some((v) => v !== undefined)
        ? endereco
        : undefined,
    };

    try {
      setSalvando(true);
      await atualizarCliente(id, payload);
      navigate(`/clientes/${id}`, {
        replace: true,
        state: { success: "Cliente atualizado com sucesso." },
      });
    } catch (e) {
      setErro(formatarErroApi(e));
    } finally {
      setSalvando(false);
    }
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
                  onChange={handleChangeCnpj}
                />
                <FloatingLabelInput
                  label="Proprietário"
                  value={form.proprietario}
                  onChange={handleChange("proprietario")}
                />
                <FloatingLabelInput
                  label="Telefone"
                  value={form.telefone}
                  onChange={handleChangeTelefone}
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
                    onChange={handleChangeCep}
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

            <div className="flex flex-wrap justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(usarMock ? "/clientes" : `/clientes/${id}`)
                }
                className="bg-[#F3F4FA] hover:bg-[#E8EBF2] text-[#4696ad] border border-[#4696ad] h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[160px]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinalizar}
                disabled={salvando}
                className="bg-[#A9E2F2] hover:bg-[#94d6eb] disabled:opacity-60 disabled:cursor-not-allowed text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
              >
                {salvando ? "Salvando..." : "Finalizar edição"}
              </button>
            </div>
            {erro ? (
              <p className="pt-4 text-sm text-[#D75757] text-right">{erro}</p>
            ) : null}
          </>
        )}
      </div>

      {!loading && (usarMock || id) ? (
        <ModalReferencias
          isOpen={modalReferenciasAberto}
          onClose={() => setModalReferenciasAberto(false)}
          clienteId={usarMock ? null : id}
          fabricoId={fabricoId}
          produtosExistentes={produtosAssociados}
          onSuccess={recarregarProdutos}
        />
      ) : null}
    </div>
  );
}
