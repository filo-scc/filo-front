import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email, senha });
      navigate("/");
    } catch {
      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(to bottom, white, #c7e9f5)",
      }}
    >
      <div
        className="
          flex flex-col md:flex-row
          w-full
          max-w-[752px]
          h-auto
          md:h-[500px]
          bg-white
          rounded-[24px]
          shadow-[0_20px_60px_0_rgba(0,0,0,0.1)]
          overflow-hidden
        "
      >
        <div
          className="hidden md:block md:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: "url('/login-image.png')",
          }}
        />

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-10">
          <div className="text-center mb-10 ">
            <h2
              className="
                text-[22px] md:text-[30px]
                font-light
                text-[#4696AD]
                leading-none
              "
            >
              Onde{" "}
              <span
                className="
                  font-extrabold
                  text-[#4696AD]
                "
              >
                negócios fluem
              </span>
              ,
            </h2>

            <p
              className="
                text-[22px] md:text-[28px]
                text-[#4696AD]
                leading-none
                font-light
              "
            >
              resultados acontecem.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4 pb-10 pt-0 w-full"
          >
            <div className="relative w-full max-w-[252px] group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                    w-full
                    h-[39px]
                    border border-[#898C8F]
                    rounded-[10px]

                    px-3
                    leading-[39px]

                    focus:outline-none
                "
              />

              <label
                className={`
                    absolute left-3 bg-white px-1
                    text-gray-400 transition-all duration-200

                    ${
                      email
                        ? "top-0 -translate-y-1/2 text-xs text-[#898C8F]"
                        : "top-1/2 -translate-y-1/2 text-sm"
                    }
                    
                    group-focus-within:top-0
                    group-focus-within:-translate-y-1/2
                    group-focus-within:text-xs
                    group-focus-within:text-[#898C8F]
                `}
              >
                Email
              </label>
            </div>

            <div className="relative w-full max-w-[252px] group">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="
                    w-full
                    h-[39px]
                    border border-[#898C8F]
                    rounded-[10px]

                    px-3
                    leading-[39px]

                    focus:outline-none
                    "
              />

              <label
                className={`
                    absolute left-3 bg-white px-1
                    text-gray-400 transition-all duration-200

                    ${
                      senha
                        ? "top-0 -translate-y-1/2 text-xs text-[#898C8F]"
                        : "top-1/2 -translate-y-1/2 text-sm"
                    }

                    group-focus-within:top-0
                    group-focus-within:-translate-y-1/2
                    group-focus-within:text-xs
                    group-focus-within:text-[#898C8F]
                `}
              >
                Senha
              </label>
            </div>

            <button
              type="button"
              onClick={() => navigate("/esqueci-senha")}
              className="
                text-xs
                text-[#898C8F]
                w-full max-w-[252px]
                text-right
                hover:underline
              "
            >
              Esqueci minha senha
            </button>

            {error && <span className="text-red-500 text-sm">{error}</span>}

            <button
              type="submit"
              disabled={loading}
              className="
                w-[167px]
                h-[39px]
                bg-[#4696ad]
                text-white
                rounded-[10px]
                hover:bg-[#84C5D8]
                transition
                disabled:opacity-50
              "
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
