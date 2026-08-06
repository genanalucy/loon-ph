/*
 * Loon http-response script: inject a "SenPlayer 播放" button into Pornhub.
 * Runs only on HTML video pages configured by senplayer-pornhub.plugin.
 */

(function () {
    const response = typeof $response === "object" && $response ? $response : null;
    if (!response || typeof response.body !== "string") {
        $done({});
        return;
    }

    const headers = Object.assign({}, response.headers || {});

    // Save the browser headers used to obtain the signed media URL. The CDN
    // request script reuses them because SenPlayer may ignore the Scheme's
    // `ua` parameter and send its own User-Agent.
    if (typeof $persistentStore === "object" && $persistentStore) {
        const requestHeaders = typeof $request === "object" && $request
            ? ($request.headers || {})
            : {};
        const userAgentKey = Object.keys(requestHeaders).find(
            key => key.toLowerCase() === "user-agent"
        );
        const pageUserAgent = userAgentKey ? String(requestHeaders[userAgentKey]) : "";
        if (pageUserAgent) {
            $persistentStore.write(pageUserAgent, "senplayer-pornhub-user-agent");
        }
        try {
            const pageUrl = new URL($request.url);
            $persistentStore.write(pageUrl.origin + "/", "senplayer-pornhub-referer");
        } catch (_) {}
    }

    const contentTypeKey = Object.keys(headers).find(
        key => key.toLowerCase() === "content-type"
    );
    const contentType = contentTypeKey ? String(headers[contentTypeKey]) : "";
    if (contentType && !contentType.toLowerCase().includes("text/html")) {
        $done({});
        return;
    }

    const marker = "data-senplayer-pornhub";
    if (response.body.includes(marker)) {
        $done({});
        return;
    }

    const injected = String.raw`
<style ${marker}="1">
#senplayer-pornhub-button {
    position: fixed;
    right: 14px;
    bottom: calc(22px + env(safe-area-inset-bottom));
    z-index: 2147483647;
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 22px;
    color: #111;
    background: #ffa31a;
    box-shadow: 0 3px 14px rgba(0, 0, 0, .45);
    font: 600 15px/44px -apple-system, BlinkMacSystemFont, sans-serif;
}
#senplayer-pornhub-button:disabled { opacity: .65; }
</style>
<button id="senplayer-pornhub-button" ${marker}="1" type="button">SenPlayer 播放</button>
<script ${marker}="1">
(() => {
    "use strict";

    const button = document.getElementById("senplayer-pornhub-button");
    if (!button || button.dataset.ready === "1") return;
    button.dataset.ready = "1";

    const notify = message => {
        button.textContent = message;
        window.setTimeout(() => { button.textContent = "SenPlayer 播放"; }, 2500);
    };

    const qualityNumber = value => {
        const match = String(value == null ? "" : value).match(/\d+/);
        return match ? Number(match[0]) : 0;
    };

    const normalizeItem = item => {
        if (!item || typeof item !== "object") return null;
        const url = typeof item.videoUrl === "string" ? item.videoUrl :
            (typeof item.url === "string" ? item.url : "");
        if (!/^https?:\/\//i.test(url)) return null;
        return {
            url,
            quality: qualityNumber(item.quality),
            format: String(item.format || "").toLowerCase(),
            remote: Boolean(item.remote) || /\/video\/get_media(?:\?|$)/i.test(url)
        };
    };

    const getFlashvars = () => {
        for (const key of Object.keys(window)) {
            if (/^flashvars_\d+$/.test(key)) {
                try {
                    const value = window[key];
                    if (value && typeof value === "object") return value;
                } catch (_) {}
            }
        }
        return null;
    };

    const fetchRemoteDefinitions = async definitions => {
        const remote = definitions.find(item => item && item.remote);
        if (!remote) return [];
        const response = await fetch(remote.url, {
            credentials: "include",
            headers: { "Accept": "application/json, text/plain, */*" }
        });
        if (!response.ok) throw new Error("媒体接口返回 HTTP " + response.status);
        const data = await response.json();
        return Array.isArray(data) ? data.map(normalizeItem).filter(Boolean) : [];
    };

    const collectDefinitions = async () => {
        const flashvars = getFlashvars();
        let definitions = flashvars && Array.isArray(flashvars.mediaDefinitions)
            ? flashvars.mediaDefinitions.map(normalizeItem).filter(Boolean)
            : [];

        const remoteItems = await fetchRemoteDefinitions(definitions).catch(error => {
            console.warn("[SenPlayer]", error);
            return [];
        });
        definitions = definitions.concat(remoteItems);

        for (const video of document.querySelectorAll("video")) {
            const urls = [video.currentSrc, video.src];
            for (const source of video.querySelectorAll("source")) urls.push(source.src);
            for (const url of urls) {
                const item = normalizeItem({ videoUrl: url });
                if (item) definitions.push(item);
            }
        }

        const seen = new Set();
        return definitions.filter(item => {
            if (item.remote || seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
        });
    };

    const chooseBestMp4 = definitions => definitions
        .filter(item => item.format === "mp4" || /\.mp4(?:\?|$)/i.test(item.url))
        .sort((a, b) => b.quality - a.quality)[0] || null;

    const getTitle = flashvars => {
        const candidates = [
            flashvars && flashvars.video_title,
            document.querySelector('meta[property="og:title"]')?.content,
            document.querySelector("h1")?.textContent,
            document.title
        ];
        return String(candidates.find(value => value && String(value).trim()) || "Pornhub Video")
            .replace(/\s*[|-]\s*Pornhub\s*$/i, "")
            .trim();
    };

    button.addEventListener("click", async () => {
        button.disabled = true;
        button.textContent = "正在取链接…";
        try {
            const definitions = await collectDefinitions();
            const media = chooseBestMp4(definitions);
            if (!media) throw new Error("未找到可用的 MP4 地址");

            const params = new URLSearchParams({
                url: media.url,
                name: getTitle(getFlashvars()),
                ua: navigator.userAgent
            });
            window.location.href = "senplayer://x-callback-url/play?" + params.toString();
            notify(media.quality ? "打开 " + media.quality + "P" : "正在打开…");
        } catch (error) {
            console.error("[SenPlayer]", error);
            notify(error instanceof Error ? error.message : "取链接失败");
        } finally {
            button.disabled = false;
        }
    });
})();
</script>`;

    let body = response.body;
    if (/<body(?:\s[^>]*)?>/i.test(body)) {
        body = body.replace(/<body(?:\s[^>]*)?>/i, match => match + injected);
    } else if (/<\/html\s*>/i.test(body)) {
        body = body.replace(/<\/html\s*>/i, injected + "</html>");
    } else {
        body += injected;
    }

    for (const key of Object.keys(headers)) {
        const lower = key.toLowerCase();
        if (lower === "content-length" ||
            lower === "content-security-policy" ||
            lower === "content-security-policy-report-only") {
            delete headers[key];
        }
    }
    headers["X-Loon-SenPlayer"] = "injected";

    $done({ response: { status: response.status, headers, body } });
})();
