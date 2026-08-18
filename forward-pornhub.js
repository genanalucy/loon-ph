WidgetMetadata = {
    id: "forward.pornhub",
    title: "Pornhub",
    version: "1.1.2",
    requiredVersion: "0.0.1",
    description: "Pornhub 公开热门、搜索、播放、相关推荐与创作者作品",
    author: "genanalucy",
    site: "https://www.pornhub.com/",
    detailCacheDuration: 0,
    globalParams: [
        {
            name: "favoriteCreators",
            title: "收藏创作者",
            type: "input",
            description: "每行一个 Pornhub 创作者主页 URL 或 /model、/pornstar、/channels、/users 路径",
            value: "/model/milamuse\n/model/kitty-alina\n/model/yunadoll\n/model/minialejandra\n/model/nath-gomez7\n/model/arinafox\n/model/lesya-moon\n/model/catawaiss\n/model/pufffypink\n/model/kuporovaa-krupa\n/pornstar/meg-vicious\n/model/diana-rider"
        }
    ],
    modules: [
        {
            id: "loadList",
            title: "首页热门",
            functionName: "loadList",
            cacheDuration: 300,
            params: [{ name: "page", title: "页码", type: "page" }]
        },
        {
            id: "loadFavorites",
            title: "收藏演员",
            functionName: "loadFavorites",
            cacheDuration: 300,
            params: []
        },
        {
            id: "loadFavoriteUpdates",
            title: "收藏更新",
            functionName: "loadFavoriteUpdates",
            cacheDuration: 300,
            params: []
        },
        {
            id: "loadCreatorWall",
            title: "演员作品墙",
            functionName: "loadCreatorWall",
            cacheDuration: 0,
            params: [{
                name: "creatorPath",
                title: "演员",
                type: "enumeration",
                value: "/model/milamuse",
                enumOptions: [
                    { title: "MilaMuse", value: "/model/milamuse" },
                    { title: "Kitty Alina", value: "/model/kitty-alina" },
                    { title: "Yunadoll", value: "/model/yunadoll" },
                    { title: "MiniAlejandra", value: "/model/minialejandra" },
                    { title: "Nath Gomez7", value: "/model/nath-gomez7" },
                    { title: "ArinaFox", value: "/model/arinafox" },
                    { title: "Lesya Moon", value: "/model/lesya-moon" },
                    { title: "Catawaiss", value: "/model/catawaiss" },
                    { title: "Pufffypink", value: "/model/pufffypink" },
                    { title: "Kuporovaa Krupa", value: "/model/kuporovaa-krupa" },
                    { title: "Meg Vicious", value: "/pornstar/meg-vicious" },
                    { title: "Diana Rider", value: "/model/diana-rider" }
                ]
            }, {
                name: "sortOrder",
                title: "排序",
                type: "enumeration",
                value: "latest",
                enumOptions: [
                    { title: "最新发布", value: "latest" },
                    { title: "随机排列", value: "random" }
                ]
            }]
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
        title: "搜索",
        functionName: "search",
        params: [
            { name: "keyword", title: "关键词", type: "input" },
            { name: "page", title: "页码", type: "page" }
        ]
    }
};

const PH_ORIGIN = "https://www.pornhub.com";
const PH_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

function phHeaders() {
    return { "User-Agent": PH_UA, Referer: PH_ORIGIN + "/" };
}

function absoluteUrl(value) {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return PH_ORIGIN + (value.charAt(0) === "/" ? value : "/" + value);
}

function cleanText(value) {
    return String(value || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/\s+/g, " ").trim();
}

function attrValue(html, name) {
    const match = String(html || "").match(new RegExp("\\b" + name + "\\s*=\\s*[\\\"']([^\\\"']*)", "i"));
    return match ? cleanText(match[1]) : "";
}

function viewKeyFromUrl(url) {
    const match = String(url || "").match(/[?&]viewkey=([^&#"'\s]+)/i);
    return match ? match[1] : "";
}

function linkForVideo(key) {
    return "video:" + key;
}

function linkForCreator(path) {
    return "creator:" + path.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
}

function favoriteCreatorPaths(value) {
    const entries = String(value || "").split(/[\n,]+/);
    const paths = [];
    const seen = {};
    for (const entry of entries) {
        const path = entry.trim().replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "").replace(/[?#].*$/, "");
        if (!/^(?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+$/i.test(path) || seen[path.toLowerCase()]) continue;
        seen[path.toLowerCase()] = true;
        paths.push(path);
    }
    return paths;
}

function creatorTitleFromPath(path) {
    return path.split("/").slice(1).join("/").replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function creatorCacheKey(path) {
    return "creator-page:" + path.toLowerCase();
}

function readCreatorCache(path) {
    if (!Widget.storage || typeof Widget.storage.get !== "function") return "";
    return String(Widget.storage.get(creatorCacheKey(path)) || "");
}

function writeCreatorCache(path, html) {
    if (!Widget.storage || typeof Widget.storage.set !== "function" || !html) return;
    Widget.storage.set(creatorCacheKey(path), html);
}

function creatorItem(path, html) {
    const titleMatch = String(html || "").match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) ||
        String(html || "").match(/<title[^>]*>\s*([^<|]+?)(?:\s*[|-]|<)/i);
    const imageMatch = String(html || "").match(/<meta\b[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)/i) ||
        String(html || "").match(/<(?:img)\b[^>]*(?:data-avatar|src)\s*=\s*["']([^"']+)["'][^>]*(?:class\s*=\s*["'][^"']*(?:avatar|profile)[^"']*["'])?/i);
    return {
        id: linkForCreator(path),
        type: "url",
        title: cleanText(titleMatch && titleMatch[1]) || creatorTitleFromPath(path),
        coverUrl: absoluteUrl(imageMatch && imageMatch[1]),
        description: "已收藏创作者",
        link: linkForCreator(path)
    };
}

function videoItemFromCard(card) {
    const urlMatch = card.match(/href\s*=\s*["']([^"']*view_video\.php\?viewkey=[^"']+)["']/i);
    const key = viewKeyFromUrl(urlMatch && urlMatch[1]);
    if (!key) return null;

    const titledLink = card.match(/<a\b[^>]*class\s*=\s*["'][^"']*thumbnailTitle[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
    const videoLinkPattern = /<a\b[^>]*href\s*=\s*["'][^"']*view_video\.php\?viewkey=[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi;
    const fallbackTitles = [];
    let titleLink;
    while ((titleLink = videoLinkPattern.exec(card))) {
        const text = cleanText(titleLink[1]);
        if (text) fallbackTitles.push(text);
    }
    const title = cleanText(titledLink && titledLink[1]) || fallbackTitles.sort((a, b) => b.length - a.length)[0] || "";
    const imageMatch = card.match(/<(?:img)\b[^>]*(?:data-poster|src)\s*=\s*["']([^"']+)["']/i);
    const durationMatch = card.match(/class\s*=\s*["'][^"']*\btime\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const uploaderMatch = card.match(/<a\b[^>]*class\s*=\s*["'][^"']*uploaderLink[^"']*["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const viewMatch = card.match(/class\s*=\s*["'][^"']*videoViews[^"']*["'][^>]*>[\s\S]*?<\/i>\s*([^<]+)/i);
    if (!title) return null;

    return {
        id: key,
        type: "url",
        title,
        coverUrl: absoluteUrl(imageMatch && imageMatch[1]),
        durationText: cleanText(durationMatch && durationMatch[1]),
        description: cleanText(viewMatch && viewMatch[1]),
        link: linkForVideo(key),
        peoples: uploaderMatch ? [{
            id: linkForCreator(uploaderMatch[1]),
            title: cleanText(uploaderMatch[2]),
            role: "创作者"
        }] : []
    };
}

function parseVideoCards(html) {
    const source = String(html || "");
    const starts = [];
    const marker = /<div\b[^>]*class\s*=\s*["'][^"']*\bvideoWrapper\b[^"']*["'][^>]*>/gi;
    let match;
    while ((match = marker.exec(source))) starts.push(match.index);
    const results = [];
    const seen = {};
    for (let index = 0; index < starts.length; index += 1) {
        const card = source.slice(starts[index], starts[index + 1] || source.length);
        const item = videoItemFromCard(card);
        if (item && !seen[item.id]) {
            seen[item.id] = true;
            results.push(item);
        }
    }
    return results;
}

function extractAssignedJson(html, variableName) {
    const startMatch = new RegExp("(?:var\\s+)?" + variableName + "\\s*=\\s*\\{").exec(html);
    if (!startMatch) return null;
    const start = startMatch.index + startMatch[0].length - 1;
    let quote = "";
    let escaped = false;
    let depth = 0;
    for (let index = start; index < html.length; index += 1) {
        const char = html.charAt(index);
        if (quote) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === quote) quote = "";
            continue;
        }
        if (char === '"' || char === "'") quote = char;
        else if (char === "{") depth += 1;
        else if (char === "}" && --depth === 0) {
            try { return JSON.parse(html.slice(start, index + 1)); } catch (_) { return null; }
        }
    }
    return null;
}

function extractFlashvars(html) {
    const match = /var\s+flashvars_[A-Za-z0-9_]+\s*=\s*\{/.exec(html);
    return match ? extractAssignedJson(html.slice(match.index), match[0].match(/flashvars_[A-Za-z0-9_]+/)[0]) : null;
}

function relatedItemsFromPage(html) {
    const dataMatch = /var\s+relatedVideosData\s*=\s*(\[[\s\S]*?\]);\s*(?:var|<\/script)/.exec(html);
    if (!dataMatch) return parseVideoCards(html);
    try {
        const rows = JSON.parse(dataMatch[1]);
        return rows.map(row => {
            const key = viewKeyFromUrl(row[4]);
            if (!key) return null;
            const creatorPath = row[8] ? String(row[8]).replace(/^https?:\/\/[^/]+/i, "") : "";
            return {
                id: key,
                type: "url",
                title: cleanText(row[1]),
                coverUrl: row[10] && row[10].highResThumb ? row[10].highResThumb : row[0],
                durationText: cleanText(row[2]),
                description: row[5] ? String(row[5]) + " views" : "",
                link: linkForVideo(key),
                peoples: creatorPath ? [{ id: linkForCreator(creatorPath), title: cleanText(row[7]), role: "创作者" }] : []
            };
        }).filter(Boolean);
    } catch (_) {
        return parseVideoCards(html);
    }
}

async function requestPage(path, params) {
    const response = await Widget.http.get(absoluteUrl(path), { headers: phHeaders(), params: params || {} });
    if (!response || typeof response.data !== "string") throw new Error("Pornhub 未返回可解析的网页");
    return response.data;
}

async function loadList(params = {}) {
    const page = Math.max(1, Number(params.page || 1));
    const creatorLink = String(params.peopleId || "");
    if (creatorLink.indexOf("creator:") === 0) {
        const path = creatorLink.slice("creator:".length).replace(/^\/+/, "");
        const html = await requestPage("/" + path, page > 1 ? { page } : {});
        const items = parseVideoCards(html);
        if (!items.length) throw new Error("未找到该创作者的公开作品");
        return items;
    }
    const html = await requestPage("/", page > 1 ? { page } : {});
    const items = parseVideoCards(html);
    if (!items.length) throw new Error("首页未找到视频；站点页面结构可能已变化");
    return items;
}

async function loadFavorites(params = {}) {
    const paths = favoriteCreatorPaths(params.favoriteCreators);
    if (!paths.length) throw new Error("请在“收藏创作者”中填写至少一个有效主页路径");
    const results = [];
    for (const path of paths) {
        try {
            const html = await requestPage("/" + path, {});
            writeCreatorCache(path, html);
            results.push(creatorItem(path, html));
        } catch (error) {
            console.warn("[Pornhub] 读取收藏创作者失败:", path, error && error.message ? error.message : error);
            results.push(creatorItem(path, ""));
        }
    }
    return results;
}

async function loadCreatorWall(params = {}) {
    const path = String(params.creatorPath || "").replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
    if (!/^(?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+$/i.test(path)) {
        throw new Error("缺少有效的创作者主页路径");
    }
    const html = await requestPage("/" + path, {});
    writeCreatorCache(path, html);
    const creator = creatorItem(path, html);
    const items = parseVideoCards(html);
    if (!items.length) throw new Error("未找到该创作者的公开作品");
    const works = items.map(item => {
        item.peoples = [{ id: linkForCreator(path), title: creator.title, role: "创作者" }];
        return item;
    });
    if (params.sortOrder === "random") {
        for (let index = works.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temporary = works[index];
            works[index] = works[swapIndex];
            works[swapIndex] = temporary;
        }
    }
    return works;
}

async function loadFavoriteUpdates(params = {}) {
    const paths = favoriteCreatorPaths(params.favoriteCreators);
    if (!paths.length) throw new Error("请在“收藏创作者”中填写至少一个有效主页路径");
    const results = [];
    const seen = {};
    for (const path of paths) {
        try {
            const html = await requestPage("/" + path, {});
            writeCreatorCache(path, html);
            const creator = creatorItem(path, html);
            const items = parseVideoCards(html);
            for (const item of items) {
                if (seen[item.id]) continue;
                seen[item.id] = true;
                item.peoples = [{ id: linkForCreator(path), title: creator.title, role: "创作者" }];
                results.push(item);
            }
        } catch (error) {
            console.warn("[Pornhub] 读取收藏更新失败:", path, error && error.message ? error.message : error);
        }
    }
    if (!results.length) throw new Error("未找到收藏创作者的公开作品");
    return results;
}

async function search(params = {}) {
    const keyword = String(params.keyword || "").trim();
    if (!keyword) throw new Error("请输入关键词");
    const html = await requestPage("/video/search", { search: keyword, page: Math.max(1, Number(params.page || 1)) });
    return parseVideoCards(html);
}

async function loadDetail(link) {
    const value = String(link || "");
    if (value.indexOf("creator:") === 0) {
        const path = value.slice("creator:".length).replace(/^\/+/, "");
        if (!/^(?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+$/i.test(path)) return null;
        let html = readCreatorCache(path);
        if (!html) {
            html = await requestPage("/" + path, {});
            writeCreatorCache(path, html);
        }
        const creator = creatorItem(path, html);
        return Object.assign(creator, {
            relatedItems: parseVideoCards(html).map(item => {
                item.peoples = [{ id: linkForCreator(path), title: creator.title, role: "创作者" }];
                return item;
            })
        });
    }
    if (value.indexOf("video:") !== 0) return null;
    const key = value.slice("video:".length);
    if (!/^[A-Za-z0-9]+$/.test(key)) return null;
    const html = await requestPage("/view_video.php", { viewkey: key });
    const video = extractAssignedJson(html, "VIDEO_SHOW") || {};
    const flashvars = extractFlashvars(html) || {};
    const creatorMatch = html.match(/var\s+MODEL_PROFILE\s*=\s*(\{[\s\S]*?\});/);
    let creator = null;
    if (creatorMatch) {
        try {
            const profile = JSON.parse(creatorMatch[1]);
            if (profile.modelProfileLink && profile.username) creator = {
                id: linkForCreator(profile.modelProfileLink), title: cleanText(profile.username), role: "创作者"
            };
        } catch (_) {}
    }
    return {
        id: key,
        type: "url",
        title: cleanText(video.videoTitle || flashvars.video_title || "Pornhub Video"),
        coverUrl: video.videoImage || flashvars.image_url || flashvars.poster_url || "",
        description: "",
        duration: Number(flashvars.video_duration || 0) || undefined,
        link: linkForVideo(key),
        peoples: creator ? [creator] : [],
        relatedItems: relatedItemsFromPage(html)
    };
}

async function resolveRemoteDefinitions(definitions) {
    const remote = definitions.find(item => item && item.remote && /^https?:\/\//i.test(item.videoUrl || ""));
    if (!remote) return [];
    try {
        const response = await Widget.http.get(remote.videoUrl, {
            headers: Object.assign(phHeaders(), { Accept: "application/json, text/plain, */*" })
        });
        const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
        return Array.isArray(data) ? data.filter(item => item && /^https?:\/\//i.test(item.videoUrl || "")) : [];
    } catch (error) {
        console.warn("[Pornhub] MP4 线路解析失败，使用 HLS 线路:", error && error.message ? error.message : error);
        return [];
    }
}

async function loadResource(params = {}) {
    const link = String(params.link || "");
    const key = link.indexOf("video:") === 0 ? link.slice("video:".length) : "";
    if (!/^[A-Za-z0-9]+$/.test(key)) throw new Error("缺少有效的视频标识");
    const html = await requestPage("/view_video.php", { viewkey: key });
    const flashvars = extractFlashvars(html);
    const pageDefinitions = flashvars && Array.isArray(flashvars.mediaDefinitions) ? flashvars.mediaDefinitions : [];
    const resolvedDefinitions = await resolveRemoteDefinitions(pageDefinitions);
    const definitions = pageDefinitions.filter(item => !item.remote).concat(resolvedDefinitions);
    const seen = {};
    const resources = definitions.filter(item => item && /^https?:\/\//i.test(item.videoUrl || ""))
        .sort((a, b) => {
            const quality = Number(b.height || b.quality || 0) - Number(a.height || a.quality || 0);
            if (quality) return quality;
            return String(a.format || "").toLowerCase() === "mp4" ? -1 : 1;
        })
        .map(item => {
            const format = String(item.format || "hls").toUpperCase();
            const quality = Number(item.height || item.quality || 0);
            const name = format + (quality ? " · " + quality + "P" : " · 自动");
            if (seen[item.videoUrl]) return null;
            seen[item.videoUrl] = true;
            return {
                name,
                description: format === "MP4" ? "直连（优先）" : "HLS 自适应分片",
                url: item.videoUrl,
                customHeaders: phHeaders(),
                playerType: "app"
            };
        }).filter(Boolean);
    if (!resources.length) throw new Error("未找到可播放的公开资源");
    return resources;
}
