WidgetMetadata = {
    id: "forward.pornhub.actors",
    title: "Pornhub 演员头像",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    description: "独立演员头像墙，卡片绑定 Pornhub 主页 URL，点击查看作品",
    author: "genanalucy",
    site: "https://www.pornhub.com/",
    detailCacheDuration: 0,
    globalParams: [{
        name: "creators", title: "演员主页", type: "input",
        description: "每行一个 Pornhub 主页 URL 或 /model、/pornstar、/channels、/users 路径",
        value: "/model/milamuse\n/model/kitty-alina\n/model/yunadoll"
    }],
    modules: [{
        id: "actors", title: "演员头像墙", functionName: "loadActors", cacheDuration: 60,
        params: [{ name: "page", title: "页码", type: "page" }]
    }]
};

const ACTOR_ORIGIN = "https://www.pornhub.com";
function actorHeaders() {
    return { Referer: ACTOR_ORIGIN + "/", "User-Agent": "Mozilla/5.0" };
}
function actorText(value) {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/\s+/g, " ").trim();
}
function actorAttr(tag, name) {
    const match = String(tag).match(new RegExp("\\b" + name + "\\s*=\\s*[\"']([^\"']*)", "i"));
    return match ? actorText(match[1]) : "";
}
function actorPath(value) {
    let path = String(value || "").trim();
    if (/^https?:\/\//i.test(path)) {
        const match = path.match(/^https?:\/\/(?:www\.|cn\.)?pornhub\.com(\/[^?#]*)\/?$/i);
        if (!match) return "";
        path = match[1];
    }
    path = path.replace(/^\/+|\/+$/g, "");
    return /^(?:model|pornstar|channels|users)\/[A-Za-z0-9_-]+$/i.test(path) ? path : "";
}
function actorImageUrl(value) {
    const url = String(value || "").trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.charAt(0) === "/") return ACTOR_ORIGIN + url;
    return "";
}
function actorPortrait(html) {
    const images = String(html).match(/<img\b[^>]*>/gi) || [];
    // 优先真实主页头像，不能取导航推荐、评论头像或第一张视频缩略图。
    const primary = images.find(tag => /^(?:getAvatar|avatarPicture|profileImage|profilePicture)$/i.test(actorAttr(tag, "id")));
    if (primary) {
        const url = actorImageUrl(actorAttr(primary, "data-src") || actorAttr(primary, "src"));
        if (url) return url;
    }
    const metas = String(html).match(/<meta\b[^>]*>/gi) || [];
    const og = metas.find(tag => actorAttr(tag, "property").toLowerCase() === "og:image");
    return og ? actorImageUrl(actorAttr(og, "content")) : "";
}
async function actorPage(path, page) {
    const response = await Widget.http.get(ACTOR_ORIGIN + "/" + path, {
        headers: actorHeaders(), params: page > 1 ? { page } : {}
    });
    if (!response || typeof response.data !== "string") throw new Error("演员主页返回异常");
    return response.data;
}
function actorCard(path, html) {
    const heading = String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const name = actorText(heading && heading[1]) || path.split("/")[1];
    const portrait = actorPortrait(html);
    const url = ACTOR_ORIGIN + "/" + path;
    return {
        id: "ph-actor:" + path, type: "url", title: name,
        coverUrl: portrait, posterPath: portrait, backdropPath: portrait,
        headers: actorHeaders(), link: url,
        description: "演员主页：" + url
    };
}
function actorWorks(html) {
    const cards = String(html).split(/<div\b[^>]*class\s*=\s*["'][^"']*\bvideoWrapper\b[^"']*["'][^>]*>/i).slice(1);
    const seen = {};
    return cards.map(card => {
        const link = card.match(/href\s*=\s*["'][^"']*view_video\.php\?viewkey=([A-Za-z0-9]+)(?:[&"'])/i);
        if (!link || seen[link[1]]) return null;
        seen[link[1]] = true;
        const title = card.match(/<a\b[^>]*class\s*=\s*["'][^"']*thumbnailTitle[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
        const img = card.match(/<img\b[^>]*>/i);
        return {
            id: link[1], type: "url", title: actorText(title && title[1]) || link[1],
            coverUrl: img ? actorImageUrl(actorAttr(img[0], "data-src") || actorAttr(img[0], "src")) : "",
            headers: actorHeaders(), link: ACTOR_ORIGIN + "/view_video.php?viewkey=" + link[1],
            description: "作品网页 URL；本头像实验 Widget 不提供播放解析，请使用原 Pornhub Widget 播放。"
        };
    }).filter(Boolean);
}
async function loadActors(params = {}) {
    try {
        if (params.peopleId != null) {
            const path = actorPath(params.peopleId);
            return path ? actorWorks(await actorPage(path, Math.max(1, Number(params.page || 1)))) : [];
        }
        if (Number(params.page || 1) > 1) return [];
        const paths = [];
        for (const line of String(params.creators || WidgetMetadata.globalParams[0].value).split(/\n/)) {
            const path = actorPath(line);
            if (path && !paths.includes(path)) paths.push(path);
        }
        if (!paths.length) throw new Error("请填写有效演员主页");
        const result = [];
        for (const path of paths) {
            try { result.push(actorCard(path, await actorPage(path, 1))); }
            catch (error) {
                console.warn("[PH Actors] 头像加载失败:", path, String(error));
                result.push(actorCard(path, ""));
            }
        }
        return result;
    } catch (error) {
        console.error("[PH Actors] 列表失败:", String(error));
        throw error;
    }
}
async function loadDetail(link) {
    const path = actorPath(link);
    if (!path) return null;
    try {
        const html = await actorPage(path, 1);
        return Object.assign(actorCard(path, html), { relatedItems: actorWorks(html) });
    } catch (error) {
        console.error("[PH Actors] 详情失败:", String(error));
        throw error;
    }
}
