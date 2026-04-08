import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mostrarErro, setMostrarErro] = useState(!!location.state?.error);
  const mensagem = location.state?.error;

  useEffect(() => {
    if (mostrarErro) {
      const timer = setTimeout(() => {
        setMostrarErro(false);

        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [mostrarErro, location.pathname, navigate]);

  return (
    <div className="p-6">
      {mostrarErro && mensagem && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in-out">
          <div className="flex items-center gap-2">
            <p>{mensagem}</p>
          </div>
        </div>
      )}

      <h1>home</h1>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm min-h-[400px]">
      <h1 className="text-2xl font-bold text-[#4696AD] mb-4">Lorem Ipsum</h1>
      <p className="text-[#898C8F]">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium eaque, doloremque aspernatur laborum repellat iste nesciunt a, molestias deleniti sunt nulla ullam expedita ad quia alias porro. Reprehenderit, error culpa.        Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium eaque, doloremque aspernatur laborum repellat iste nesciunt a, molestias deleniti sunt nulla ullam expedita ad quia alias porro. Reprehenderit, error culpa.
      </p>
    </div>
  );
}