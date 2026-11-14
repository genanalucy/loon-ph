WidgetMetadata = {
    id: "forward.pornhub",
    title: "Pornhub",
    version: "1.2.3",
    requiredVersion: "0.0.1",
    description: "Pornhub 公开热门、搜索、播放、相关推荐与创作者作品",
    author: "genanalucy",
    site: "https://www.pornhub.com/",
    detailCacheDuration: 0,
    globalParams: [
        { name: "accountUsername", title: "Pornhub 用户名", type: "input", value: "genanalucy",
          description: "账号内容通过 Loon Account Bridge 注入登录状态，无需填写 Cookie" },
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
            title: "我的关注",
            functionName: "loadFavorites",
            cacheDuration: 0,
            params: [
                { name: "sortOrder", title: "演员排序", type: "enumeration", value: "original",
                  enumOptions: [
                      { title: "原顺序", value: "original" },
                      { title: "随机排序（当前页）", value: "random" }
                  ] },
                { name: "page", title: "页码", type: "page" }
            ]
        },
        {
            id: "loadRecommended", title: "个性化推荐", functionName: "loadRecommended",
            cacheDuration: 0, params: [{ name: "page", title: "页码", type: "page" }]
        },
        {
            id: "loadManualFavorites", title: "手动收藏（备用）", functionName: "loadManualFavorites",
            cacheDuration: 300, params: [{ name: "page", title: "页码", type: "page" }]
        },
        {
            id: "loadPopularPeople",
            title: "热门人物（实验）",
            functionName: "loadPopularPeople",
            cacheDuration: 0,
            params: [{ name: "page", title: "页码", type: "page" }]
        },
        {
            id: "loadFavoriteUpdates",
            title: "关注更新",
            functionName: "loadFavoriteUpdates",
            cacheDuration: 0,
            params: [{ name: "page", title: "页码", type: "page" }]
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
                    { title: "当前页随机排列", value: "random" }
                ]
            }, { name: "page", title: "页码", type: "page" }]
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
    if (value.indexOf("//") === 0) return "https:" + value;
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
    const images = String(html || "").match(/<img\b[^>]*>/gi) || [];
    const avatar = images.find(tag => /^(?:getAvatar|avatarPicture|profileImage|profilePicture)$/i.test(attrValue(tag, "id")));
    const metas = String(html || "").match(/<meta\b[^>]*>/gi) || [];
    const ogImage = metas.find(tag => attrValue(tag, "property").toLowerCase() === "og:image");
    const portrait = absoluteUrl(avatar
        ? attrValue(avatar, "data-src") || attrValue(avatar, "src")
        : ogImage ? attrValue(ogImage, "content") : "");
    return {
        id: linkForCreator(path),
        type: "url",
        title: cleanText(titleMatch && titleMatch[1]) || creatorTitleFromPath(path),
        mediaType: "tv",
        coverUrl: portrait,
        posterPath: portrait,
        backdropPath: portrait,
        headers: phHeaders(),
        description: "演员作品集 · 点击查看分集影片",
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
    const durationMatch = card.match(/class\s*=\s*["'][^"']*\b(?:time|duration)\b[^"']*["'][^>]*>([^<]*)<\/(?:span|var)>/i);
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
    const marker = /<(?:div|li)\b[^>]*class\s*=\s*["'][^"']*\b(?:videoWrapper|pcVideoListItem)\b[^"']*["'][^>]*>/gi;
    let match;
    while ((match = marker.exec(source))) starts.push(match.index);
    const results = [];
    const seen = {};
    for (let index = 0; index < starts.length; index += 1) {
        let card = source.slice(starts[index], starts[index + 1] || source.length);
        if (/^<li\b/i.test(card)) {
            const end = card.indexOf("</li>");
            if (end !== -1) card = card.slice(0, end + 5);
        }
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

function creatorPathFromPeopleId(value) {
    const match = String(value || "").match(/^creator:((?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+)$/i);
    return match ? match[1] : "";
}

async function loadCreatorWorks(path, params = {}) {
    const pageValue = Number(params.page || 1);
    const page = Number.isFinite(pageValue) ? Math.max(1, Math.floor(pageValue)) : 1;
    const html = await requestPage("/" + path, page > 1 ? { page } : {});
    // 仅缓存首页，避免翻页覆盖演员详情的作品预览。
    if (page === 1) writeCreatorCache(path, html);
    const creator = creatorItem(path, html);
    const works = parseVideoCards(html).map(item => {
        item.peoples = [{ id: linkForCreator(path), title: creator.title, role: "创作者" }];
        return item;
    });
    if (!works.length && page === 1) throw new Error("未找到该创作者的公开作品");
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

async function routeCreatorWorks(params) {
    const path = creatorPathFromPeopleId(params.peopleId);
    // 非法 peopleId 不能退回首页或预选演员，否则会显示错误作品。
    if (!path) return [];
    return loadCreatorWorks(path, params);
}

async function loadList(params = {}) {
    if (params.peopleId != null) return routeCreatorWorks(params);
    const page = Math.max(1, Number(params.page || 1));
    const html = await requestPage("/", page > 1 ? { page } : {});
    const items = parseVideoCards(html);
    if (!items.length) throw new Error("首页未找到视频；站点页面结构可能已变化");
    return items;
}

function accountPageNumber(params) {
    const page = Number(params.page || 1);
    return Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
}

async function requestAccountPage(path, params) {
    const headers = Object.assign(phHeaders(), { Referer: "https://cn.pornhub.com/", "X-PH-Widget-Auth": "1" });
    // 人物订阅页使用桌面布局；视频流与媒体请求继续使用原手机 UA。
    if (/^\/users\/[A-Za-z0-9_-]+\/subscriptions$/.test(path)) {
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    }
    const response = await Widget.http.get("https://cn.pornhub.com" + path, {
        headers,
        params: { page: accountPageNumber(params) }
    });
    const html = response && response.data;
    if (typeof html !== "string" || !/\bisLoggedInUser\s*=\s*1\b/.test(html)) {
        throw new Error("未取得账号登录状态：请启用 Loon Account Bridge，在 Safari 登录 cn.pornhub.com 并打开订阅页面后重试");
    }
    if (/您无权限查看此内容|you (?:do not|don't) have permission/i.test(html)) {
        throw new Error("账号无权查看此内容，请检查用户名与 Safari 登录账号是否一致");
    }
    return html;
}

function accountMobileVideoList(html, path) {
    const expectedClass = path === "/subscriptions" ? "subscriptionsVideosWrapper" :
        path === "/recommended" ? "recommendedVideosContainer" : "";
    if (!expectedClass) return null;
    const tags = /<\/?div\b[^>]*>/gi;
    let tag;
    while ((tag = tags.exec(html))) {
        if (/^<\//.test(tag[0]) || !attrValue(tag[0], "class").split(/\s+/).includes(expectedClass)) continue;
        const start = tags.lastIndex;
        let depth = 1;
        while ((tag = tags.exec(html))) {
            depth += /^<\//.test(tag[0]) ? -1 : 1;
            if (depth === 0) {
                const section = html.slice(start, tag.index);
                const lists = /<ul\b[^>]*>/gi;
                let list;
                while ((list = lists.exec(section))) {
                    if (!attrValue(list[0], "class").split(/\s+/).includes("videoList")) continue;
                    const end = section.indexOf("</ul>", lists.lastIndex);
                    if (end >= 0) return section.slice(list.index, end + 5);
                }
                return null;
            }
        }
        return null;
    }
    return null;
}

function accountContent(html, actors, path) {
    if (actors) {
        const start = html.search(/<div\b[^>]*class=["'][^"']*\bprofileContentLeft\b/i);
        if (start < 0) throw new Error("订阅人物结构未识别；需要登录后的页面样本，未回退到固定演员");
        const right = html.indexOf('profileContentRight', start);
        return html.slice(start, right < 0 ? html.length : right);
    }
    const start = /<ul\b[^>]*\bid=["'](?:subscriptionsVideosSection|recommendedListings|recommendedVideos|recommendedVideoSection|videoCategory)["'][^>]*>/i.exec(html);
    if (start) {
        const end = html.indexOf("</ul>", start.index + start[0].length);
        return html.slice(start.index, end < 0 ? html.length : end);
    }
    // 手机页没有桌面列表 ID，仅在当前账号入口的专属容器中找 videoList。
    const mobileList = accountMobileVideoList(html, path);
    if (mobileList !== null) return mobileList;
    throw new Error("账号视频列表结构未识别，需要登录后的页面样本；未使用导航推荐代替");
}

async function loadFavorites(params = {}) {
    if (params.peopleId != null) return routeCreatorWorks(params);
    const username = String(params.accountUsername || "genanalucy").trim();
    if (!/^[A-Za-z0-9_-]+$/.test(username)) throw new Error("用户名格式无效");
    const html = accountContent(await requestAccountPage("/users/" + username + "/subscriptions", params), true);
    const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
    const seen = {};
    const items = [];
    for (const anchor of anchors) {
        const href = attrValue(anchor, "href");
        // Strict host/path allowlist; do not strip arbitrary external hosts.
        const match = href.match(/^(?:https:\/\/(?:www|cn)\.pornhub\.com)?\/?((?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+)\/?$/i);
        if (!match || seen[match[1].toLowerCase()] || match[1].toLowerCase() === "users/" + username.toLowerCase()) continue;
        seen[match[1].toLowerCase()] = true;
        const image = (anchor.match(/<img\b[^>]*>/i) || [""])[0];
        const title = cleanText(anchor.replace(/<img\b[^>]*>/gi, "")) || attrValue(image, "alt") || creatorTitleFromPath(match[1]);
        const item = creatorItem(match[1], "");
        item.title = title;
        item.coverUrl = absoluteUrl(attrValue(image, "data-src") || attrValue(image, "src"));
        item.posterPath = item.coverUrl;
        item.backdropPath = item.coverUrl;
        items.push(item);
    }
    if (!items.length && accountPageNumber(params) === 1) throw new Error("未解析到订阅人物；请确认账号有关注，或提供登录后的人物页面抓包");
    if (params.sortOrder === "random") {
        for (let index = items.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temporary = items[index];
            items[index] = items[swapIndex];
            items[swapIndex] = temporary;
        }
    }
    return items;
}

async function loadAccountVideos(params, path) {
    if (params.peopleId != null) return routeCreatorWorks(params);
    const items = parseVideoCards(accountContent(await requestAccountPage(path, params), false, path));
    if (!items.length && accountPageNumber(params) === 1) throw new Error("账号视频列表为空或结构尚未适配；未使用游客视频代替");
    return items;
}

async function loadFavoriteUpdates(params = {}) {
    return loadAccountVideos(params, "/subscriptions");
}

async function loadRecommended(params = {}) {
    return loadAccountVideos(params, "/recommended");
}

async function loadManualFavorites(params = {}) {
    if (params.peopleId != null) return routeCreatorWorks(params);
    if (Number(params.page || 1) > 1) return [];
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

function peopleHubItem(paths) {
    const peoples = paths.map(path => {
        const creator = creatorItem(path, readCreatorCache(path));
        return { id: creator.link, title: creator.title, avatar: creator.coverUrl, role: "创作者" };
    });
    return {
        id: "ph-people-hub",
        type: "url",
        title: "热门人物（收藏演员）",
        coverUrl: peoples.length ? peoples[0].avatar : "",
        description: "实验入口：打开后点击人物头像查看作品；不是首页原生热门人物数据源。",
        link: "ph-people:" + encodeURIComponent(paths.join("\n")),
        peoples
    };
}

async function loadPopularPeople(params = {}) {
    if (params.peopleId != null) return routeCreatorWorks(params);
    if (Number(params.page || 1) > 1) return [];
    // 复用收藏加载以获取姓名和头像，并将首页写入现有缓存。
    await loadManualFavorites(params);
    return [peopleHubItem(favoriteCreatorPaths(params.favoriteCreators))];
}

async function loadCreatorWall(params = {}) {
    if (params.peopleId != null) return routeCreatorWorks(params);
    const path = String(params.creatorPath || "").replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
    if (!/^(?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+$/i.test(path)) {
        throw new Error("缺少有效的创作者主页路径");
    }
    return loadCreatorWorks(path, params);
}

async function loadManualFavoriteUpdates(params = {}) {
    if (params.peopleId != null) return routeCreatorWorks(params);
    if (Number(params.page || 1) > 1) return [];
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
    if (params.peopleId != null) return routeCreatorWorks(params);
    const keyword = String(params.keyword || "").trim();
    if (!keyword) throw new Error("请输入关键词");
    const html = await requestPage("/video/search", { search: keyword, page: Math.max(1, Number(params.page || 1)) });
    return parseVideoCards(html);
}

function creatorPageVideos(html) {
    const source = String(html || "");
    const list = /<ul\b[^>]*\bid\s*=\s*["'](?:modelMostRecentVideosSection|pornstarsVideos|mostRecentVideosSection)["'][^>]*>/i.exec(source);
    if (!list) return parseVideoCards(source);
    const start = list.index + list[0].length;
    const end = source.indexOf("</ul>", start);
    return parseVideoCards(source.slice(start, end < 0 ? source.length : end));
}

async function creatorEpisodesDetail(path) {
    let html = readCreatorCache(path);
    if (!html) {
        html = await requestPage("/" + path, {});
        writeCreatorCache(path, html);
    }
    const creator = creatorItem(path, html);
    const videos = [];
    const seen = {};
    // 最多抓取 5 页、50 部；后续页失败不能丢弃已加载的分集。
    for (let page = 1; page <= 5 && videos.length < 50; page += 1) {
        let pageHtml = html;
        if (page > 1) {
            try { pageHtml = await requestPage("/" + path, { page }); }
            catch (error) {
                console.warn("[Pornhub] 后续作品加载失败，保留已有分集:", String(error));
                break;
            }
        }
        const items = creatorPageVideos(pageHtml);
        let added = 0;
        for (const video of items) {
            if (seen[video.id]) continue;
            seen[video.id] = true;
            videos.push(video);
            added += 1;
            if (videos.length === 50) break;
        }
        if (!added) break;
    }
    if (!videos.length) throw new Error("未找到该演员的公开影片；请刷新或检查主页");
    return Object.assign(creator, {
        description: "演员作品集 · 单季 " + videos.length + " 集（最多 50 集）",
        episodeItems: videos.map((video, index) => Object.assign({}, video, {
            mediaType: "tv", season: 1, episode: index + 1, playerType: "app",
            peoples: [{ id: linkForCreator(path), title: creator.title, avatar: creator.coverUrl, role: "创作者" }]
        }))
    });
}

async function loadDetail(link) {
    const value = String(link || "");
    if (value.indexOf("ph-people:") === 0) {
        let raw;
        try { raw = decodeURIComponent(value.slice("ph-people:".length)); }
        catch (_) { return null; }
        const paths = favoriteCreatorPaths(raw);
        if (!paths.length || paths.join("\n") !== raw) return null;
        return peopleHubItem(paths);
    }
    if (value.indexOf("ph-season:") === 0) {
        const match = value.match(/^ph-season:([1-9][0-9]*):((?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+)$/i);
        if (!match || Number(match[1]) > 100) return null;
        // 兼容已缓存的旧季卡片，统一回到单季作品集。
        return creatorEpisodesDetail(match[2]);
    }
    if (value.indexOf("creator:") === 0) {
        const path = value.slice("creator:".length).replace(/^\/+/, "");
        if (!/^(?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+$/i.test(path)) return null;
        return creatorEpisodesDetail(path);
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
