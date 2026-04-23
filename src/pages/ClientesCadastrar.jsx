import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ModalReferencias from "../components/clientes/ModalReferencias";

const sectionTitleClass =
  "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

export default function ClientesCadastrar() {
  const navigate = useNavigate();
  const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
  const fabricoId = usuarioLogado?.fabrico_id;
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
            onClick={() => navigate("/clientes")}
            className="bg-[#A9E2F2] hover:bg-[#94d6eb] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
          >
            Concluir cadastro
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
