// Read-aloud for young players. Uses the browser's built-in voices and quietly
// does nothing where speech isn't available.

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text) {
    if (!canSpeak() || !text) return false;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'%:-]/gu, ''));
        u.rate = 0.92;
        u.pitch = 1.1;
        window.speechSynthesis.speak(u);
        return true;
    } catch {
        return false;
    }
}
