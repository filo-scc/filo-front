// Listener nativo não passivo: mantém o foco e impede o incremento por roda/trackpad.
// O onWheel do React é passivo e não permite cancelar esse comportamento nativo.
export function preventNumberInputWheel(event) {
    const input = event.currentTarget;
    const preventWheel = (wheelEvent) => wheelEvent.preventDefault();
    input.addEventListener("wheel", preventWheel, { passive: false });
    input.addEventListener("blur", () => input.removeEventListener("wheel", preventWheel), {
        once: true,
    });
}
