/*
 * Loon http-response script: inject Forward playback test buttons into DB Online.
 * Each button tests one possible title parameter independently.
 */

(function () {
    const response = typeof $response === "object" && $response ? $response : null;
    if (!response || typeof response.body !== "string") {
        $done({});
        return;
    }

    const headers = Object.assign({}, response.headers || {});
    const contentTypeKey = Object.keys(headers).find(
        key => key.toLowerCase() === "content-type"
    );
    const contentType = contentTypeKey ? String(headers[contentTypeKey]) : "";
    if (contentType && !contentType.toLowerCase().includes("text/html")) {
        $done({});
        return;
    }

    const marker = "data-forward-db-online";
    if (response.body.includes(marker)) {
        $done({});
        return;
    }

    const injected = String.raw`
<style ${marker}="1">
#forward-db-online-toggle {
    position: fixed;
    right: 14px;
    bottom: calc(22px + env(safe-area-inset-bottom));
    z-index: 2147483647;
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 22px;
    color: #fff;
    background: #6d5dfc;
    box-shadow: 0 3px 14px rgba(0, 0, 0, .45);
    font: 600 15px/44px -apple-system, BlinkMacSystemFont, sans-serif;
}
#forward-db-online-panel {
    position: fixed;
    right: 14px;
    bottom: calc(74px + env(safe-area-inset-bottom));
    z-index: 2147483647;
    display: none;
    width: min(260px, calc(100vw - 28px));
    padding: 12px;
    border-radius: 16px;
    color: #fff;
    background: rgba(18, 22, 35, .96);
    box-shadow: 0 5px 24px rgba(0, 0, 0, .5);
    font: 14px/1.35 -apple-system, BlinkMacSystemFont, sans-serif;
    backdrop-filter: blur(12px);
}
#forward-db-online-panel[data-open="1"] { display: block; }
#forward-db-online-status { margin: 0 2px 9px; color: #cdd2e5; }
#forward-db-online-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}
#forward-db-online-buttons button {
    min-height: 38px;
    padding: 6px 8px;
    border: 1px solid rgba(255, 255, 255, .16);
    border-radius: 10px;
    color: #fff;
    background: rgba(109, 93, 252, .28);
    font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, sans-serif;
}
#forward-db-online-buttons button:disabled,
#forward-db-online-toggle:disabled { opacity: .6; }
</style>
<button id="forward-db-online-toggle" ${marker}="1" type="button">Forward 播放</button>
<div id="forward-db-online-panel" ${marker}="1" role="dialog" aria-label="Forward 标题参数测试">
    <div id="forward-db-online-status">请选择一种标题参数测试</div>
    <div id="forward-db-online-buttons">
        <button type="button" data-mode="plain">原始 URL</button>
        <button type="button" data-mode="title">title</button>
        <button type="button" data-mode="name">name</button>
        <button type="button" data-mode="filename">filename</button>
        <button type="button" data-mode="fileName">fileName</button>
        <button type="button" data-mode="displayName">displayName</button>
        <button type="button" data-mode="mediaTitle">mediaTitle</button>
        <button type="button" data-mode="videoTitle">videoTitle</button>
        <button type="button" data-mode="label">label</button>
        <button type="button" data-mode="fragment">#标题.mp4</button>
    </div>
</div>
<script ${marker}="1">
(() => {
    "use strict";

    const toggle = document.getElementById("forward-db-online-toggle");
    const panel = document.getElementById("forward-db-online-panel");
    const status = document.getElementById("forward-db-online-status");
    const buttons = Array.from(document.querySelectorAll("#forward-db-online-buttons button"));
    if (!toggle || !panel || toggle.dataset.ready === "1") return;
    toggle.dataset.ready = "1";

    const setBusy = busy => {
        toggle.disabled = busy;
        for (const button of buttons) button.disabled = busy;
    };

    const setStatus = message => { status.textContent = message; };

    const currentVideo = () => {
        const match = window.location.pathname.match(/^\/video\/([^/?#]+)/i);
        const code = match ? decodeURIComponent(match[1]).trim() : "";
        const videoId = new URLSearchParams(window.location.search).get("video_id") ||
            new URLSearchParams(window.location.search).get("videoId") || "";
        if (!code) throw new Error("当前不是影片详情页");
        return { code, videoId: videoId.trim() };
    };

    const requestJson = async path => {
        const response = await fetch(path, {
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        });
        if (!response.ok) throw new Error("接口返回 HTTP " + response.status);
        const data = await response.json();
        if (!data || data.success === false) {
            throw new Error(data && data.error ? data.error : "接口返回失败");
        }
        return data.data || data;
    };

    const pageTitle = () => {
        const heading = document.querySelector("h1");
        return String(heading?.textContent || document.title || "DB Online Video")
            .replace(/\s*[|｜-]\s*DB Online.*$/i, "")
            .trim();
    };

    const loadPlayback = async () => {
        const { code, videoId } = currentVideo();
        const detailPath = videoId
            ? "/api/video/id/" + encodeURIComponent(videoId)
            : "/api/video/" + encodeURIComponent(code);
        const [detail, stream] = await Promise.all([
            requestJson(detailPath),
            requestJson("/api/library/stream/" + encodeURIComponent(code))
        ]);
        const streamUrl = stream.stream_url ||
            stream.media_sources?.find(item => item && item.play_url)?.play_url;
        if (!streamUrl) throw new Error("该影片没有可用播放地址");
        return {
            title: String(detail.title || detail.video_title || pageTitle()).trim(),
            url: new URL(streamUrl, window.location.origin).toString()
        };
    };

    const makeForwardUrl = (mode, media) => {
        let mediaUrl = media.url;
        const params = new URLSearchParams();
        if (mode === "fragment") {
            const base = mediaUrl.split("#")[0];
            mediaUrl = base + "#" + encodeURIComponent(media.title + ".mp4");
        }
        params.set("url", mediaUrl);
        if (mode !== "plain" && mode !== "fragment") {
            params.set(mode, media.title);
        }
        return "forward://play?" + params.toString();
    };

    toggle.addEventListener("click", () => {
        const open = panel.dataset.open !== "1";
        panel.dataset.open = open ? "1" : "0";
        if (open) setStatus("请选择一种标题参数测试");
    });

    for (const button of buttons) {
        button.addEventListener("click", async () => {
            const mode = button.dataset.mode || "plain";
            setBusy(true);
            setStatus("正在获取最新播放地址…");
            try {
                const media = await loadPlayback();
                setStatus("正在测试 " + button.textContent + "：" + media.title);
                window.location.href = makeForwardUrl(mode, media);
            } catch (error) {
                console.error("[Forward DB Online]", error);
                setStatus(error instanceof Error ? error.message : "获取播放地址失败");
            } finally {
                window.setTimeout(() => setBusy(false), 800);
            }
        });
    }
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
    headers["X-Loon-Forward-DB-Online"] = "injected";

    $done({ response: { status: response.status, headers, body } });
})();
