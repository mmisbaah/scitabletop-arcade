// Shared DOM helpers used by every game module.

export const $ = (id) => document.getElementById(id);

let toastTimer = null;
export function showToast(msg) {
    const toast = $('toast');
    $('toast-msg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// Prepends a line to a log box and keeps the last `max` lines.
export function logTo(id, msg, max = 30) {
    const box = $(id);
    if (!box) return;
    const line = document.createElement('div');
    line.textContent = `> ${msg}`;
    box.prepend(line);
    while (box.children.length > max) box.lastChild.remove();
}

export function clearLog(id, firstLine) {
    const box = $(id);
    if (!box) return;
    box.innerHTML = '';
    if (firstLine) logTo(id, firstLine);
}

export function setMeter(barId, valId, value) {
    const v = Math.max(0, Math.min(100, Math.round(value)));
    $(barId).style.width = `${v}%`;
    $(valId).textContent = `${v}%`;
}

export function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth; // restart the animation
    el.classList.add('shake');
}

export function refreshIcons() {
    window.lucide?.createIcons();
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
