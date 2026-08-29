WidgetMetadata = {
    id: "forward.db-online",
    title: "DB Online",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    description: "搜索 DB Online 媒体库并动态加载播放地址，供 Forward 字幕模块按番号匹配字幕",
    author: "genanalucy",
    site: "http://10.10.10.7:9091/",
    detailCacheDuration: 0,
    globalParams: [
        {
            name: "server",
            title: "DB Online 地址",
            type: "input",
            description: "包含 http(s) 协议和端口，不要填写末尾斜杠",
            value: "http://10.10.10.7:9091"
        }
    ],
    modules: [
        {
            id: "library",
            title: "媒体库",
            functionName: "loadList",
            cacheDuration: 60,
            params: [
                { name: "page", title: "页码", type: "page" }
            ]
        },
        {
            id: "loadResource",
            title: "加载播放资源",
            functionName: "loadResource",
            type: "stream",
            cacheDuration: 0,
            params: []
        }
    ],
    search: {
        title: "搜索番号",
        functionName: "search",
        params: [
            { name: "keyword", title: "番号", type: "input" },
            { name: "page", title: "页码", type: "page" }
        ]
    }
};

const DEFAULT_SERVER = "http://10.10.10.7:9091";

function serverUrl(value) {
    const server = String(value || DEFAULT_SERVER).trim().replace(/\/+$/, "");
    if (!/^https?:\/\/[^/]+/i.test(server)) throw new Error("DB Online 地址无效");
    return server;
}

function absoluteUrl(server, value) {
    const url = String(value || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return server + (url.charAt(0) === "/" ? url : "/" + url);
}

function normalizeCode(value) {
    return String(value || "").trim().toUpperCase();
}

function itemLink(videoId, code) {
    return "db-online:" + encodeURIComponent(String(videoId || "")) + ":" + encodeURIComponent(code);
}

function parseItemLink(link) {
    const match = String(link || "").match(/^db-online:([^:]*):(.+)$/);
    if (!match) return null;
    try {
        return { videoId: decodeURIComponent(match[1]), code: normalizeCode(decodeURIComponent(match[2])) };
    } catch (_) {
        return null;
    }
}

async function apiGet(server, path, params) {
    const response = await Widget.http.get(server + path, {
        headers: { Accept: "application/json" },
        params: params || {}
    });
    const payload = response && response.data;
    if (!payload || payload.success === false) {
        throw new Error(payload && payload.error ? payload.error : "DB Online 接口返回失败");
    }
    return payload.data || payload;
}

function videoItem(movie, server) {
    const code = normalizeCode(movie && (movie.number || movie.code));
    if (!code) return null;
    const videoId = String(movie.id || movie.video_id || "").trim();
    const originalTitle = String(movie.title || movie.origin_title || "").trim();
    const library = movie.library || {};
    return {
        id: videoId || code,
        type: "url",
        title: code + (originalTitle ? " " + originalTitle : ""),
        coverUrl: absoluteUrl(server, movie.cover_url || movie.thumb_url),
        releaseDate: movie.release_date || movie.date || "",
        duration: Number(movie.duration || 0) || undefined,
        description: library.in_library
            ? "已入库 · " + String(library.source || "媒体库")
            : "未入库",
        link: itemLink(videoId, code),
        playerType: "app"
    };
}

async function search(params = {}) {
    const keyword = String(params.keyword || "").trim();
    if (!keyword) throw new Error("请输入番号");
    const server = serverUrl(params.server);
    const data = await apiGet(server, "/api/search", {
        q: keyword,
        page: Math.max(1, Number(params.page || 1)),
        limit: 24
    });
    const movies = Array.isArray(data.movies) ? data.movies : [];
    return movies.map(movie => videoItem(movie, server)).filter(Boolean);
}

async function loadList(params = {}) {
    const server = serverUrl(params.server);
    const response = await apiGet(server, "/api/videos", {
        page: Math.max(1, Number(params.page || 1)),
        pageSize: 24
    });
    const movies = Array.isArray(response) ? response :
        (Array.isArray(response.videos) ? response.videos :
            (Array.isArray(response.items) ? response.items : []));
    return movies.map(movie => videoItem(movie, server)).filter(Boolean);
}

async function loadDetail(link) {
    const parsed = parseItemLink(link);
    if (!parsed || !parsed.code) return null;
    const server = serverUrl();
    const path = parsed.videoId
        ? "/api/video/id/" + encodeURIComponent(parsed.videoId)
        : "/api/video/" + encodeURIComponent(parsed.code);
    const data = await apiGet(server, path);
    const movie = Object.assign({}, data, {
        id: data.video_id || parsed.videoId,
        number: data.code || parsed.code,
        release_date: data.date,
        library: data.library || {}
    });
    const item = videoItem(movie, server);
    if (!item) return null;
    item.backdropPaths = Array.isArray(data.previews)
        ? data.previews.map(url => absoluteUrl(server, url))
        : [];
    item.peoples = Array.isArray(data.actors) ? data.actors.map(actor => ({
        id: String(actor.external_id || actor.name || ""),
        title: String(actor.name || ""),
        avatar: absoluteUrl(server, actor.avatar_url),
        role: "演员"
    })) : [];
    return item;
}

async function loadResource(params = {}) {
    const parsed = parseItemLink(params.link);
    const code = normalizeCode(parsed && parsed.code || params.id || params.title);
    if (!code) throw new Error("缺少有效番号");
    const server = serverUrl(params.server);
    const data = await apiGet(server, "/api/library/stream/" + encodeURIComponent(code));
    const sources = Array.isArray(data.media_sources) ? data.media_sources : [];
    const resources = [];
    const seen = {};

    function addResource(url, name, streamType) {
        const absolute = absoluteUrl(server, url);
        if (!absolute || seen[absolute]) return;
        seen[absolute] = true;
        resources.push({
            name: String(name || code),
            description: streamType === "hls" ? "HLS" : "媒体库直连",
            url: absolute,
            playerType: "app"
        });
    }

    for (const source of sources) {
        addResource(source && source.play_url, source && source.name, source && source.stream_type);
    }
    addResource(data.stream_url, code, data.stream_type);
    if (!resources.length) throw new Error("该影片未入库或没有可用播放地址");
    return resources;
}
