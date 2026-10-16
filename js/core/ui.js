// Shared DOM helpers used by every game module.

import { ICONS } from './icons.js';

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
    line.textContent = msg;
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
    if (valId) $(valId).textContent = `${v}%`;
}

// "+30" that floats up from an element.
export function floatPoints(text, anchor) {
    if (!anchor) return;
    const box = anchor.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'float-pts';
    el.textContent = text;
    el.style.left = `${box.left + box.width / 2}px`;
    el.style.top = `${box.top}px`;
    anchor.closest('.screen')?.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

export const icon = (name, cls = 'icon') => `<i data-icon="${name}" class="${cls}"></i>`;

export function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth; // restart the animation
    el.classList.add('shake');
}

// Fills every <i data-icon="name"> with its inline SVG.
export function refreshIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
        const svg = ICONS[el.dataset.icon];
        if (!svg || el.dataset.drawn === el.dataset.icon) return;
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>`;
        el.dataset.drawn = el.dataset.icon;
        el.classList.add('icon');
    });
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

