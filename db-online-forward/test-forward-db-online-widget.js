const fs = require("fs");
const vm = require("vm");

const script = fs.readFileSync("db-online-forward/forward-db-online-widget.js", "utf8");
const calls = [];
const responses = {
    "/api/search": {
        success: true,
        data: { movies: [{
            id: "DRX1yM",
            number: "MIDA-814",
            title: "测试标题",
            cover_url: "/api/image?id=cover",
            duration: 190,
            release_date: "2026-09-01",
            library: { in_library: true, source: "emby" }
        }] }
    },
    "/api/video/id/DRX1yM": {
        success: true,
        data: {
            video_id: "DRX1yM",
            code: "MIDA-814",
            title: "测试标题",
            cover_url: "/cover.jpg",
            previews: ["/preview.jpg"],
            actors: [{ external_id: "actor", name: "演员", avatar_url: "/actor.jpg" }],
            library: { in_library: true, source: "emby" }
        }
    },
    "/api/library/stream/MIDA-814": {
        success: true,
        data: {
            stream_url: "/api/video/MIDA-814/stream/1/stream.mp4",
            stream_type: "progressive",
            media_sources: [{
                name: "MIDA-814 source",
                play_url: "/api/video/MIDA-814/stream/1/stream.mp4",
                stream_type: "progressive"
            }]
        }
    }
};

const context = {
    console,
    Widget: {
        http: {
            async get(url, options) {
                const path = new URL(url).pathname;
                calls.push({ path, options });
                const data = responses[path];
                if (!data) throw new Error("unexpected request: " + path);
                return { data };
            }
        }
    }
};
vm.createContext(context);
vm.runInContext(script, context);

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

(async () => {
    const items = await context.search({ keyword: "MIDA-814", server: "http://db.test" });
    assert(items.length === 1, "搜索应返回一个条目");
    assert(items[0].title === "MIDA-814 测试标题", "标题应以番号开头，供字幕模块匹配");
    assert(items[0].link === "db-online:DRX1yM:MIDA-814", "应保存 video_id 和番号");

    const detail = await context.loadDetail(items[0].link);
    assert(detail.backdropPaths[0] === "http://10.10.10.7:9091/preview.jpg", "应生成绝对剧照 URL");
    assert(detail.peoples[0].title === "演员", "应转换演员信息");

    const resources = await context.loadResource({ link: items[0].link, server: "http://db.test" });
    assert(resources.length === 1, "重复播放地址应去重");
    assert(resources[0].url === "http://db.test/api/video/MIDA-814/stream/1/stream.mp4", "应生成动态资源绝对 URL");
    assert(calls.some(call => call.path === "/api/library/stream/MIDA-814"), "应在播放时请求媒体库资源");

    console.log("forward-db-online-widget tests passed");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
