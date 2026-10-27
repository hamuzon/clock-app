const elTime = document.getElementById('time');
const elDate = document.getElementById('date');

const endpoints = [
    {
        url: 'https://api-time.hamusata.f5.si/api/ip',
        type: 'worldtime'
    },
    {
        url: 'https://api-time.hamuzon-jp.f5.si/api/ip',
        type: 'worldtime'
    },
    {
        url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
        type: 'timeapi'
    }
];

let offset = 0;
let synced = false;
let lastSync = 0;

async function syncTime() {
    for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            5000
        );

        try {
            const start = performance.now();
            const response = await fetch(
                endpoint.url,
                {
                    cache: 'no-store',
                    signal: controller.signal
                }
            );
            const received = performance.now();

            if (!response.ok) {
                continue;
            }

            const data = await response.json();
            let serverTime;

            if (endpoint.type === 'worldtime') {
                serverTime = Date.parse(
                    data.utc_datetime || data.datetime
                );
            } else {
                if (
                    data.timeZone !== 'UTC' ||
                    typeof data.dateTime !== 'string'
                ) {
                    continue;
                }

                serverTime = Date.parse(
                    `${data.dateTime}Z`
                );
            }

            if (!Number.isFinite(serverTime)) {
                continue;
            }

            const roundTrip = received - start;
            const estimatedServerTime =
                serverTime + roundTrip / 2;

            const estimatedLocalTime =
                performance.timeOrigin + received;

            const newOffset =
                estimatedServerTime - estimatedLocalTime;

            offset = newOffset;
            synced = true;
            lastSync = Date.now();

            return true;
        } catch {
            // 次のAPIを試す
        } finally {
            clearTimeout(timeout);
        }
    }

    // 全APIが失敗した場合は前回の補正値を維持
    return false;
}

function nowTime() {
    const timestamp = synced
        ? performance.timeOrigin + performance.now() + offset
        : Date.now();

    return new Date(timestamp);
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

    elTime.style.fontSize = `${timeSize}px`;
    elDate.style.fontSize = `${dateSize}px`;
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