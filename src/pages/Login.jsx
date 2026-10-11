import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [senhaVisivel, setSenhaVisivel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await login({ email, senha });
            navigate("/");
        } catch (error) {
            const apiMessage = error.response?.data?.message;

            setError(
                apiMessage === "Usuário sem fábrico ativo"
                    ? apiMessage
                    : "Credenciais inválidas",
            );
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
                        backgroundImage: "url('/imagem-login.png')",
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
                                id="senha"
                                type={senhaVisivel ? "text" : "password"}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="
                    w-full
                    h-[39px]
                    border border-[#898C8F]
                    rounded-[10px]

                    pl-3 pr-10
                    leading-[39px]

                    focus:outline-none
                    "
                            />

                            <label
                                htmlFor="senha"
                                className={`
                    absolute left-3 z-10 bg-white px-1
                    text-gray-400 transition-all duration-200
                    pointer-events-none

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

                            <button
                                type="button"
                                aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                                aria-pressed={senhaVisivel}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setSenhaVisivel((visivel) => !visivel)}
                                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#898C8F] hover:text-[#4696AD] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4696AD] rounded-r-[10px]"
                            >
                                {senhaVisivel ? (
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-5 w-5"
                                    >
                                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                                        <circle cx="12" cy="12" r="2.5" />
                                    </svg>
                                ) : (
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-5 w-5"
                                    >
                                        <path d="M2 2l20 20" />
                                        <path d="M6.7 6.7C4.5 8.1 3 10 2 12c2 4 5.3 6 10 6 1.6 0 3-.2 4.2-.7" />
                                        <path d="M10.7 10.7A2 2 0 0013.3 13.3" />
                                        <path d="M9.9 6.1A10.6 10.6 0 0112 6c4.7 0 8 2 10 6a12.5 12.5 0 01-2 3" />
                                    </svg>
                                )}
                            </button>
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
