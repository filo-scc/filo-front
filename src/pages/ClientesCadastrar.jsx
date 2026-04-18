import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import FloatingLabelInput from "../components/FloatingLabelInput";

const sectionTitleClass =
  "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

const produtosExemplo = [
  {
    produto: {
      foto: "/imagem-login.png",
      nome: "Breeze",
    },
    nome_para_cliente: "Celine",
    preco_padrao: 0,
  },
];

export default function ClientesCadastrar() {
  const navigate = useNavigate();
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

  const [produtosAssociados] = useState(produtosExemplo);

  const handleChange = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  return (
    <div className="w-full max-w-[1200px] xl:max-w-none mx-auto font-['Outfit',_sans-serif]">
      <div className="bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_8px_40px_rgba(70,150,173,0.08)] border border-[#F0F4F6] w-full">
        <div className="flex items-center gap-3 mb-10">
          <img src="/star.png" alt="" className="w-8 h-8 shrink-0" />
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
            onAbrirModal={() => {}}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="bg-[#A9E2F2] hover:bg-[#94d6eb] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
          >
            Concluir cadastro
          </button>
        </div>
      </div>
    </div>
  );
}
