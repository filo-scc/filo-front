export default function AppLoadingScreen() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center px-6 bg-gradient-to-b from-white to-[#C7E9F5]">
            <div className="flex flex-col items-center text-center">
                <img
                    src="/filo-logo.png"
                    alt="Filo"
                    className="w-[132px] h-auto animate-filo-breathe"
                />
                <p className="mt-6 font-Outfit text-base text-center animate-filo-text-shimmer">
                    Carregando o Filo
                </p>
            </div>
        </div>
    );
}
