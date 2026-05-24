function RecuperarSenha() {
    const handleSelectEmail = () => {
        // TODO: integrar fluxo de recuperação por e-mail
    };

    const handleSelectSms = () => {
        // TODO: integrar fluxo de recuperação por SMS
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
                    <h1 className="text-center text-[22px] md:text-[22px] font-light text-[#4696AD] leading-tight">
                        Recuperação de senha
                    </h1>

                    <div className="mt-4 mx-auto inline-block text-center">
                        <p className="mx-auto block w-fit max-w-[248px] text-center text-[13px] md:text-[14px] font-light text-[#898C8F] leading-snug">
                            Selecione como você prefere receber o
                            <br />
                            <span className="font-bold">código de verificação</span>.
                        </p>

                        <div className="mt-8 flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={handleSelectEmail}
                                className="
                  flex h-[44px] w-full min-w-0 items-center justify-center gap-3
                  rounded-[10px] bg-[#4696ad] text-white
                  text-[15px] font-light
                  transition hover:bg-[#84C5D8]
                "
                            >
                                <img
                                    src="/mail-icon.png"
                                    alt=""
                                    className="h-[18px] w-[18px] brightness-0 invert"
                                />
                                E-mail
                            </button>

                            <button
                                type="button"
                                onClick={handleSelectSms}
                                className="
                  flex h-[44px] w-full min-w-0 items-center justify-center gap-3
                  rounded-[10px] bg-[#4696ad] text-white
                  text-[15px] font-light
                  transition hover:bg-[#84C5D8]
                "
                            >
                                <img
                                    src="/message-icon.png"
                                    alt=""
                                    className="h-[18px] w-[18px] brightness-0 invert"
                                />
                                SMS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecuperarSenha;
