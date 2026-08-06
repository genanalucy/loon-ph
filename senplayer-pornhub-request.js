/*
 * Loon http-request script: make SenPlayer's signed Pornhub MP4 request use
 * the same browser identity that obtained the URL.
 */

(function () {
    if (typeof $request !== "object" || !$request) {
        $done({});
        return;
    }

    const headers = Object.assign({}, $request.headers || {});
    const findHeader = name => Object.keys(headers).find(
        key => key.toLowerCase() === name.toLowerCase()
    );
    const setHeader = (name, value) => {
        const existing = findHeader(name);
        if (existing && existing !== name) delete headers[existing];
        headers[name] = value;
    };

    const fallbackUserAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 " +
        "Mobile/15E148 Safari/604.1";
    const storedUserAgent = typeof $persistentStore === "object" && $persistentStore
        ? $persistentStore.read("senplayer-pornhub-user-agent")
        : null;
    const storedReferer = typeof $persistentStore === "object" && $persistentStore
        ? $persistentStore.read("senplayer-pornhub-referer")
        : null;
    const referer = /^https:\/\/(?:www|cn)\.pornhub\.com\/$/i.test(storedReferer || "")
        ? storedReferer
        : "https://cn.pornhub.com/";

    setHeader("User-Agent", storedUserAgent || fallbackUserAgent);
    setHeader("Referer", referer);

    // Keep the signed URL and all other player headers (especially Range)
    // untouched. Origin is deliberately omitted for a media GET request to
    // match Safari's normal video request more closely.
    $done({ headers });
})();
