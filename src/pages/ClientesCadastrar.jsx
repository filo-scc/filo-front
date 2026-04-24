import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ModalReferencias from "../components/clientes/ModalReferencias";
import { cadastrarCliente } from "../services/clientesService";

const sectionTitleClass =
  "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

export default function ClientesCadastrar() {
  const navigate = useNavigate();
  const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
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
  const [salvando, setSalvando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [payloadEnviado, setPayloadEnviado] = useState(null);

  const handleChange = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

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

  const handleChangeCnpj = (e) => {
    setForm((prev) => ({ ...prev, cnpj: formatarCnpj(e.target.value) }));
  };

  const handleChangeTelefone = (e) => {
    setForm((prev) => ({ ...prev, telefone: formatarTelefone(e.target.value) }));
  };

  const handleChangeCep = (e) => {
    setForm((prev) => ({ ...prev, cep: formatarCep(e.target.value) }));
  };

  const handleChangeNumeroEndereco = (e) => {
    setForm((prev) => ({ ...prev, numero: apenasNumeros(e.target.value) }));
  };

  const handleAdicionarProdutos = (produtosSelecionados) => {
    if (!produtosSelecionados?.length) return;

    const novosProdutos = produtosSelecionados.map((produto) => ({
      produto: {
        id: produto.id,
        foto: produto.foto,
        nome: produto.nome,
      },
      nome_para_cliente: produto.nome,
      preco_padrao: 0,
    }));

    setProdutosAssociados((prev) => [...prev, ...novosProdutos]);
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
    return "Nao foi possivel cadastrar o cliente.";
  };

  const handleCadastrar = async () => {
    setErroCadastro("");

    const nome = valorOuUndefined(form.nomeEmpresa);
    if (!nome) {
      setErroCadastro("Informe o nome da empresa.");
      return;
    }

    const fabricoIdNumerico = numeroOuUndefined(fabricoId);
    if (!fabricoIdNumerico) {
      setErroCadastro("Nao foi possivel identificar a fabrica do usuario.");
      return;
    }

    const cnpjNumerico = valorOuUndefined(apenasNumeros(form.cnpj));
    const telefoneNumerico = valorOuUndefined(apenasNumeros(form.telefone));

    if (cnpjNumerico && cnpjNumerico.length !== 14) {
      setErroCadastro("CNPJ invalido. Informe 14 digitos.");
      return;
    }
    if (
      telefoneNumerico &&
      (telefoneNumerico.length < 9 || telefoneNumerico.length > 11)
    ) {
      setErroCadastro("Telefone invalido. Informe entre 9 e 11 digitos.");
      return;
    }

    const cepNumerico = valorOuUndefined(apenasNumeros(form.cep));
    if (cepNumerico && cepNumerico.length !== 8) {
      setErroCadastro("CEP invalido. Informe 8 digitos.");
      return;
    }

    const endereco = {
      cep: cepNumerico,
      rua: valorOuUndefined(form.rua),
      numero: numeroOuUndefined(apenasNumeros(form.numero)),
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
      status: true,
      responsavel: valorOuUndefined(form.proprietario),
      fabrico_id: fabricoIdNumerico,
      endereco: Object.values(endereco).some((valor) => valor !== undefined)
        ? endereco
        : undefined,
    };

    try {
      setSalvando(true);
      setPayloadEnviado(payload);
      await cadastrarCliente(payload);
      navigate("/clientes", {
        replace: true,
        state: { success: "Cliente cadastrado com sucesso." },
      });
    } catch (error) {
      setErroCadastro(formatarErroApi(error));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] xl:max-w-none mx-auto font-['Outfit',_sans-serif]">
      <div className="bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_8px_40px_rgba(70,150,173,0.08)] border border-[#F0F4F6] w-full">
        <div className="flex items-center gap-3 mb-10">
          <img
            src="/add-star.png"
            alt=""
            className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
          />
          <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight">
            Cadastrar cliente
          </h1>
        </div>

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
                onChange={handleChangeNumeroEndereco}
                inputMode="numeric"
                autoComplete="off"
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
          />
        </div>

        <div className="flex flex-wrap justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="bg-[#D75757] hover:bg-[#c94a4a] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCadastrar}
            disabled={salvando}
            className="bg-[#A9E2F2] hover:bg-[#94d6eb] disabled:opacity-60 disabled:cursor-not-allowed text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
          >
            {salvando ? "Salvando..." : "Concluir cadastro"}
          </button>
        </div>
      </div>

      <ModalReferencias
        isOpen={modalReferenciasAberto}
        onClose={() => setModalReferenciasAberto(false)}
        clienteId={null}
        fabricoId={fabricoId}
        produtosExistentes={produtosAssociados}
        onSuccess={() => {}}
        onAdicionarSelecionados={handleAdicionarProdutos}
      />
    </div>
  );
}
