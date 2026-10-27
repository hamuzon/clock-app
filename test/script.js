const elTime = document.getElementById('time');
const elDate = document.getElementById('date');
let offset = 0;
async function syncTime() {
    const endpoints = [
        'https://api-time.hamusata.f5.si/api/ip',
        'https://api-time.hamuzon-jp.f5.si/api/ip',
        'https://timeapi.io/api/Time/current/zone?timeZone=UTC'
    ];
    for (const url of endpoints) {
        try {
            const t1 = Date.now();
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const data = await res.json();
            const t2 = Date.now();
            let serverTime;
            if (data.datetime) {
                serverTime = new Date(data.datetime).getTime();
            } else if (data.dateTime) {
                serverTime = new Date(`${data.dateTime}Z`).getTime();
            } else {
                continue;
            }
            if (!Number.isFinite(serverTime)) continue;
            offset = serverTime - (t1 + t2) / 2;
            return;
        } catch {
            // 次のエンドポイントを試す
        }
    }
    offset = 0;
}
function nowTime() {
    return new Date(Date.now() + offset);
}
function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isLandscape = w > h;
    const timeSize = isLandscape ? Math.min(w * 0.12, h * 0.32) : w * 0.17;
    const dateSize = timeSize * (isLandscape ? 0.48 : 0.52);
    elTime.style.fontSize = timeSize + 'px';
    elDate.style.fontSize = dateSize + 'px';
}
function tick() {
    const now = nowTime();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    elTime.textContent = `${h}:${m}:${s}`;
    const y = String(now.getFullYear() % 100).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    elDate.textContent = `${y}/${mo}/${d}`;
    requestAnimationFrame(tick);
}
window.addEventListener('resize', layout);
layout();
syncTime();
setInterval(syncTime, 600000);
requestAnimationFrame(tick);