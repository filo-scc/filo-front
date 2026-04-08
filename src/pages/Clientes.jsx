import { useEffect, useState } from "react";
import { getClientes } from "../services/clientesService";
import { useNavigate } from "react-router-dom";
import { getMe } from "../services/authService";

// 👇 IMPORTANDO O SEU LAYOUT (ajuste o caminho de acordo com a sua pasta)
import { Layout } from "../components/Layout";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let componenteMontado = true;

    async function carregarDados() {
      try {
        setCarregando(true);

        const usuarioLogado = await getMe();

        if (!usuarioLogado || !usuarioLogado.fabrico_id) {
          if (componenteMontado) setCarregando(false);
          return;
        }

        const dados = await getClientes(usuarioLogado.fabrico_id);

        if (componenteMontado) {
          setClientes(dados);
          console.log("Clientes carregados:", dados);
          setCarregando(false);
        }
      } catch (erro) {
        if (componenteMontado) {
          console.log("Status do erro capturado:", erro?.response?.status);

          if (erro.response && erro.response.status === 403) {
            navigate("/", {
              replace: true,
              state: {
                error:
                  "Acesso negado. Administradores não podem acessar esta área.",
              },
            });
            return;
          }

          console.error("Erro desconhecido:", erro);
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      componenteMontado = false;
    };
  }, [navigate]);

  if (carregando) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <p className="text-[#4696AD] animate-pulse font-Outfit">
            Carregando clientes...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4 translate-x-5">
            <img
              src="/star.png"
              alt="Ícone de Clientes"
              className="w-30 h-30 object-contain"
            />
            <h2 className="text-3xl font-Outfit font-thin text-[#404040] tracking-tight">
              Clientes
            </h2>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm text[#404040] focus:outline-none focus:border-[#4696AD] transition-colors"
              />
              <svg
                className="w-5 h-5 absolute right-3 top-2.5 text[#404040]"
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

            <button className="bg-[#9be0ee] text-white rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-Outfit font-light hover:bg-[#7ecbda] transition-colors whitespace-nowrap">
              <img src="/add-star.png" alt="Estrela Pequena" />
              Cadastrar cliente
            </button>
          </div>
        </div>

        {/* Corpo da Tabela */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#C9EAF6] text-[#4696AD] text-sm border-b border-[#a9d8eb]">
                <th className="py-4 px-4 font-Outfit font-light w-1/6">
                  Cliente
                </th>
                <th className="py-4 px-4 font-Outfit font-light w-1/6">
                  Responsável
                </th>
                <th className="py-4 px-4 font-Outfit font-light w-1/6">
                  Contato
                </th>
                <th className="py-4 px-4 font-Outfit font-light w-1/6">
                  Status
                </th>
                <th className="py-4 px-4 font-Outfit font-light w-1/6 text-center">
                  Opções
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, index) => (
                <tr
                  key={cliente.id}
                  className={
                    index % 2 === 0
                      ? "bg-white border-b border-gray-100"
                      : "bg-[#F4F4F4] border-b border-gray-100"
                  }
                >
                  <td className="py-5 px-4 text[#404040] font-Outfit font-light">
                    {cliente.nome}
                  </td>
                  <td className="py-5 px-4 text[#404040] font-Outfit font-light">
                    {cliente.responsavel}
                  </td>
                  <td className="py-5 px-4 text[#404040] font-Outfit font-light">
                    {cliente.telefone}
                  </td>
                  <td className="py-5 px-4">
                    <span
                      className={`px-8 py-1.5 rounded-full text-xs font-Outfit font-light text-white ${
                        cliente.status
                          ? "bg-[#B4D64E]"
                          : "bg-[#D9D9D9] text-[#414040]"
                      }`}
                    >
                      {cliente.status ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-5 px-4 align-middle">
                    <div className="flex items-center justify-center w-full h-full">
                      <svg
                        className="w-6 h-6 text[#404040] cursor-pointer hover:text-[#4696AD] transition-colors"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientes.length === 0 && (
            <div className="text-center py-10 text[#404040] font-Outfit">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
