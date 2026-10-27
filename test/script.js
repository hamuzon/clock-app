const elTime = document.getElementById('time');
const elDate = document.getElementById('date');

const endpoints = [
    'https://api-time.hamusata.f5.si/api/ip',
    'https://api-time.hamuzon-jp.f5.si/api/ip',
    'https://timeapi.io/api/Time/current/zone?timeZone=UTC'
];

let baseTime = Date.now();
let basePerformance = performance.now();
let synced = false;

async function syncTime() {
    for (const url of endpoints) {
        try {
            const t1 = performance.now();

            const res = await fetch(url, {
                cache: 'no-store'
            });

            if (!res.ok) {
                continue;
            }

            const data = await res.json();
            const t2 = performance.now();

            let serverTime;

            if (data.datetime) {
                serverTime = new Date(data.datetime).getTime();
            } else if (data.dateTime) {
                serverTime = new Date(`${data.dateTime}Z`).getTime();
            } else {
                continue;
            }

            if (!Number.isFinite(serverTime)) {
                continue;
            }

            // 通信時間の中間点を基準に時刻を推定
            const rtt = t2 - t1;
            const estimatedTime = serverTime + rtt / 2;

            // 同期前後の時刻が逆行しないようにする
            const currentTime = nowTime().getTime();

            baseTime = synced
                ? Math.max(estimatedTime, currentTime)
                : estimatedTime;

            basePerformance = t2;
            synced = true;

            return;
        } catch {
            // 次のエンドポイントを試します
        }
    }

    // 全API失敗時は現在の時刻を維持
}

function nowTime() {
    const elapsed = performance.now() - basePerformance;

    return new Date(baseTime + elapsed);
}

function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isLandscape = w > h;

    const timeSize = isLandscape
        ? Math.min(w * 0.12, h * 0.32)
        : w * 0.17;

    const dateSize = isLandscape
        ? timeSize * 0.48
        : timeSize * 0.52;

    elTime.style.fontSize = timeSize + 'px';
    elDate.style.fontSize = dateSize + 'px';
}

function tick() {
    const now = nowTime();

    const h = now.getHours()
        .toString()
        .padStart(2, '0');

    const m = now.getMinutes()
        .toString()
        .padStart(2, '0');

    const s = now.getSeconds()
        .toString()
        .padStart(2, '0');

    elTime.textContent = `${h}:${m}:${s}`;

    const y = (now.getFullYear() % 100)
        .toString()
        .padStart(2, '0');

    const mo = (now.getMonth() + 1)
        .toString()
        .padStart(2, '0');

    const d = now.getDate()
        .toString()
        .padStart(2, '0');

    elDate.textContent = `${y}/${mo}/${d}`;

    requestAnimationFrame(tick);
}

window.addEventListener('resize', layout);

layout();
syncTime();

setInterval(syncTime, 600000);

requestAnimationFrame(tick);