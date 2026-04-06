import { useEffect, useState } from "react";
import { getClientes } from "../services/clientesService";
import { useNavigate } from "react-router-dom";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const dados = await getClientes();

        setClientes(dados);
        console.log("Clientes carregados:", dados);

        // Se deu sucesso, paramos o loading aqui
        setCarregando(false);
      } catch (erro) {
        console.log("Status do erro capturado:", erro?.response?.status);

        if (erro.response && erro.response.status === 403) {
          // Navega imediatamente
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

    carregarDados();
  }, [navigate]);
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 animate-pulse">Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-transparent">
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-8 h-8 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
              <h2 className="text-3xl font-Outfit font-extralight text-[#404040] tracking-tight">
                Clientes
              </h2>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Buscar"
                  className="w-full border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-colors"
                />
                <svg
                  className="w-5 h-5 absolute right-3 top-2.5 text-gray-400"
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Cadastrar cliente
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-[#C9EAF6] text-[#4696AD] text-sm">
                  <th className="py-4 px-4 font-Outfit font-light rounded-tl-xl w-1/6">
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
                  {/* Adicionado text-center aqui para garantir o alinhamento do título */}
                  <th className="py-4 px-4 font-Outfit font-light rounded-tr-xl w-1/6 text-center">
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
                        ? "bg-white"
                        : "bg-[#F4F4F4] border-y border-gray-100"
                    }
                  >
                    <td className="py-5 px-4 text-gray-600 font-Outfit font-light">
                      {cliente.nome}
                    </td>
                    <td className="py-5 px-4 text-gray-600 font-Outfit font-light">
                      {cliente.responsavel}
                    </td>
                    <td className="py-5 px-4 text-gray-600 font-Outfit font-light">
                      {cliente.telefone}
                    </td>
                    <td className="py-5 px-4">
                      <span
                        className={`px-8 py-1.5 rounded-full text-xs font-Outfit font-light text-white ${cliente.status ? "bg-[#aedd57]" : "bg-gray-400"}`}
                      >
                        {cliente.status ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    {/* Aqui está o TD corrigido com a div interna! */}
                    <td className="py-5 px-4 align-middle">
                      <div className="flex items-center justify-center w-full h-full">
                        <svg
                          className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
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
              <div className="text-center py-10 text-gray-500">
                Nenhum cliente encontrado.
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-8 mt-4">
        <p className="text-[#4696AD] text-sm font-Outfit font-light tracking-wide">
          Filo® | Onde negócios fluem, resultados acontecem
        </p>
      </footer>
    </div>
  );
}
