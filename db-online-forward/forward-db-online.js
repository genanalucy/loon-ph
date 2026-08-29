/*
 * Loon http-response script: inject Forward search/install buttons into DB Online.
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
#forward-db-online-actions {
    position: fixed;
    right: 14px;
    bottom: calc(22px + env(safe-area-inset-bottom));
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
#forward-db-online-actions button {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 22px;
    color: #fff;
    box-shadow: 0 3px 14px rgba(0, 0, 0, .45);
    font: 600 14px/44px -apple-system, BlinkMacSystemFont, sans-serif;
}
#forward-db-online-play { background: #6d5dfc; }
#forward-db-online-install { background: rgba(18, 22, 35, .92); }
</style>
<div id="forward-db-online-actions" ${marker}="1">
    <button id="forward-db-online-install" type="button">首次安装组件</button>
    <button id="forward-db-online-play" type="button">在 Forward 搜索</button>
</div>
<script ${marker}="1">
(() => {
    "use strict";
    const play = document.getElementById("forward-db-online-play");
    const install = document.getElementById("forward-db-online-install");
    if (!play || !install || play.dataset.ready === "1") return;
    play.dataset.ready = "1";

    const currentCode = () => {
        const match = window.location.pathname.match(/^\/video\/([^/?#]+)/i);
        if (!match) return "";
        try { return decodeURIComponent(match[1]).trim().toUpperCase(); }
        catch (_) { return ""; }
    };

    const update = () => {
        const code = currentCode();
        play.disabled = !code;
        play.textContent = code ? "Forward 搜索 " + code : "请打开影片详情";
    };

    play.addEventListener("click", () => {
        const code = currentCode();
        if (!code) return;
        window.location.href = "forward://search?q=" + encodeURIComponent(code);
    });

    install.addEventListener("click", () => {
        const manifest = "https://raw.githubusercontent.com/genanalucy/loon-ph/main/db-online-forward/db-online-forward.fwd";
        window.location.href = "forward://widget?url=" + encodeURIComponent(manifest);
    });

    update();
    window.addEventListener("popstate", update);
    window.setInterval(update, 1000);
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
