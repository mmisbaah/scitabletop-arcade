// A short burst of confetti for wins. Skipped when the player prefers reduced motion.

const COLORS = ['#f5b301', '#0c9873', '#db4157', '#5a49d6', '#2d5bff', '#c27c12'];

export function confetti(count = 140) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const bits = Array.from({ length: count }, () => ({
        x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4,
        y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 12 - 4,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const start = performance.now();
    function frame(t) {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (const b of bits) {
            b.vy += 0.35;
            b.x += b.vx;
            b.y += b.vy;
            b.r += b.vr;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.r);
            ctx.fillStyle = b.c;
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.restore();
        }
        if (t - start < 2600) requestAnimationFrame(frame);
        else canvas.remove();
    }
    requestAnimationFrame(frame);
}
