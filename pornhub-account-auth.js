/* Loon only. Never log, export or forward stored credentials to other hosts. */
(function () {
    const KEY = "ph.account.cookie.v1";
    const request = typeof $request === "object" ? $request : {};
    const response = typeof $response === "object" ? $response : null;
    const match = String(request.url || "").match(/^https:\/\/cn\.pornhub\.com(\/[^#]*)$/i);
    const headers = Object.assign({}, request.headers || {});
    const markerKeys = Object.keys(headers).filter(key => key.toLowerCase() === "x-ph-widget-auth");
    const marked = markerKeys.length > 0;
    markerKeys.forEach(key => { delete headers[key]; });
    const path = match ? match[1].split("?")[0] : "";
    const allowed = path === "/subscriptions" || path === "/recommended" ||
        /^\/users\/[A-Za-z0-9_-]+\/subscriptions$/.test(path);
    function cookieFrom(source) {
        return Object.keys(source).filter(key => key.toLowerCase() === "cookie")
            .map(key => source[key]).reduce((all, value) => all.concat(Array.isArray(value) ? value : [value]), [])
            .map(value => String(value || "").trim()).filter(Boolean).join("; ");
    }
    if (!response) {
        if (!marked) { $done({}); return; }
        // Always remove a widget-supplied Cookie first; credentials only come from local storage.
        Object.keys(headers).filter(key => key.toLowerCase() === "cookie").forEach(key => { delete headers[key]; });
        if (match && allowed) {
            try {
                const saved = JSON.parse($persistentStore.read(KEY) || "null");
                if (saved && typeof saved.cookie === "string" && !/[\r\n]/.test(saved.cookie)) {
                    headers.Cookie = saved.cookie;
                }
            } catch (_) { /* Missing/broken storage is treated as logged out. */ }
        }
        $done({ headers });
        return;
    }
    // Only explicit browser navigations with server-confirmed login may update the vault.
    // Widget traffic lacks Sec-Fetch-Dest: document and must never overwrite browser credentials.
    const destination = Object.keys(headers).find(key => key.toLowerCase() === "sec-fetch-dest");
    const browserDocument = destination && String(headers[destination]).toLowerCase() === "document";
    if (!match || !allowed || marked || !browserDocument) { $done({}); return; }
    const status = String(response.status || response.statusCode || "200");
    if (!/^(?:200|HTTP\/\S+\s+200)(?:\s|$)/i.test(status)) { $done({}); return; }
    const body = typeof response.body === "string" ? response.body : "";
    if (!/\bisLoggedInUser\s*=\s*1\b/.test(body)) { $done({}); return; }
    const cookie = cookieFrom(headers);
    if (cookie && !/[\r\n]/.test(cookie)) {
        $persistentStore.write(JSON.stringify({ cookie, capturedAt: Date.now() }), KEY);
    }
    $done({});
})();
