WidgetMetadata = {
  id: "local.emby.library.people",
  title: "Emby 影片 · 演员筛选（实验）",
  version: "0.1.2",
  requiredVersion: "0.0.1",
  description: "从影片详情的“团队”点击演员后，尝试在同一模块显示该演员的本地作品。",
  author: "Local",
  globalParams: [
    { name: "server", title: "Emby 地址", type: "input", placeholders: [{ title: "示例", value: "http://192.168.1.50:8096" }] },
    { name: "apiKey", title: "Emby API Key", type: "input" },
    { name: "userId", title: "Emby User ID", type: "input" }
  ],
  modules: [{
    id: "library", title: "本地影片", functionName: "loadMovies", requiresWebView: false, sectionMode: false, cacheDuration: 60,
    params: [
      { name: "sort", title: "影片排序", type: "enumeration", value: "rating", enumOptions: [
        { title: "评分最高", value: "rating" }, { title: "最近加入", value: "created" },
        { title: "上映年份最新", value: "year" }, { title: "片名 A → Z", value: "name" }, { title: "随机", value: "random" }
      ] },
      { name: "page", title: "页码", type: "page" }
    ]
  }]
};

const PAGE_SIZE = 50;
const CONFIG_KEY = "local.emby.library.people.config";

function getConfig(params) {
  const current = {
    server: String(params.server || "").replace(/\/+$/, ""),
    apiKey: String(params.apiKey || ""), userId: String(params.userId || "")
  };
  if (current.server && current.apiKey && current.userId) {
    Widget.storage.set(CONFIG_KEY, current);
    return current;
  }
  const saved = Widget.storage.get(CONFIG_KEY);
  if (!saved || !saved.server || !saved.apiKey || !saved.userId) throw new Error("请填写 Emby 地址、API Key 和 User ID");
  return saved;
}

function normalizeParams(params) {
  const result = {};
  Object.keys(params || {}).forEach((key) => {
    const value = params[key];
    // Forward 的 HTTP 桥会将 JS boolean 编码成 1/0；Emby 4.9.5 只接受 true/false 文本。
    result[key] = typeof value === "boolean" ? (value ? "true" : "false") : value;
  });
  return result;
}

async function embyGet(config, path, params) {
  const response = await Widget.http.get(config.server + path, { params: normalizeParams(Object.assign({}, params || {}, { api_key: config.apiKey })) });
  if (!response || !response.data) throw new Error("Emby 返回为空");
  return response.data;
}

async function embyPost(config, path, params) {
  const query = normalizeParams(Object.assign({}, params || {}, { api_key: config.apiKey }));
  const response = await Widget.http.post(config.server + path, null, { params: query });
  if (!response || !response.data) throw new Error("Emby 播放协商返回为空");
  return response.data;
}

async function getPlaybackUrl(config, itemId) {
  const playback = await embyPost(config, "/Items/" + encodeURIComponent(itemId) + "/PlaybackInfo", {
    UserId: config.userId, IsPlayback: "true", AutoOpenLiveStream: "true"
  });
  const sources = playback.MediaSources || [];
  const direct = sources.find((source) => source.SupportsDirectPlay && source.Path);
  if (direct) return direct.Path;
  const streamable = sources.find((source) => source.SupportsDirectStream || source.SupportsTranscoding);
  if (!streamable) throw new Error("Emby 没有返回可播放的媒体源");
  const mediaSourceId = encodeURIComponent(streamable.Id);
  return config.server + "/Videos/" + encodeURIComponent(itemId) + "/stream?static=true&MediaSourceId=" + mediaSourceId + "&api_key=" + encodeURIComponent(config.apiKey);
}

function imageUrl(config, id) {
  return config.server + "/Items/" + encodeURIComponent(String(id)) + "/Images/Primary?api_key=" + encodeURIComponent(config.apiKey);
}

function sortQuery(value) {
  const values = {
    rating: ["CommunityRating", "Descending"], created: ["DateCreated", "Descending"], year: ["ProductionYear", "Descending"],
    name: ["SortName", "Ascending"], random: ["Random", "Ascending"]
  };
  return values[value] || values.rating;
}

function toVideoItem(config, item) {
  return {
    id: "emby-library-" + item.Id, type: "url", mediaType: item.Type === "Series" ? "tv" : "movie",
    title: item.Name || "未命名影片", posterPath: imageUrl(config, item.Id), backdropPath: imageUrl(config, item.Id),
    rating: item.CommunityRating, releaseDate: item.PremiereDate,
    description: item.Overview || "", link: "embyLibrary:" + item.Id
  };
}

function localSort(items, value) {
  const clone = items.slice();
  if (value === "random") return clone.sort(() => Math.random() - 0.5);
  const key = { rating: "CommunityRating", created: "DateCreated", year: "ProductionYear", name: "SortName" }[value] || "CommunityRating";
  const direction = value === "name" ? 1 : -1;
  return clone.sort((a, b) => String(a[key] || "").localeCompare(String(b[key] || ""), undefined, { numeric: true }) * direction);
}

async function loadMovies(params = {}) {
  const config = getConfig(params);
  const page = Math.max(1, Number(params.page || 1));
  const sort = sortQuery(params.sort);
  // Forward 点击 peoples 后会把 peopleId 回传到此列表模块。不要使用 Emby PersonIds：该组合在此设备上会 500。
  if (params.peopleId) {
    const all = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items", {
      UserId: config.userId, IncludeItemTypes: "Movie,Series", Recursive: true, StartIndex: 0, Limit: 10000,
      Fields: "People", EnableImages: false
    });
    const filtered = (all.Items || []).filter((item) => (item.People || []).some((person) => String(person.Id) === String(params.peopleId)));
    return localSort(filtered, params.sort).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => toVideoItem(config, item));
  }
  const data = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items", {
    UserId: config.userId, IncludeItemTypes: "Movie,Series", Recursive: true,
    StartIndex: (page - 1) * PAGE_SIZE, Limit: PAGE_SIZE, EnableImages: true,
    Fields: "Overview,PremiereDate,ProductionYear,CommunityRating,People,SortName",
    SortBy: sort[0], SortOrder: sort[1]
  });
  return (data.Items || []).map((item) => toVideoItem(config, item));
}

async function loadDetail(link) {
  const config = getConfig({});
  const value = String(link || "");
  if (value.indexOf("embyLibrary:") !== 0) return null;
  const itemId = value.slice("embyLibrary:".length);
  const item = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items/" + encodeURIComponent(itemId), {
    Fields: "Overview,People,PremiereDate,ProductionYear,CommunityRating,MediaSources"
  });
  return {
    id: "emby-library-" + item.Id, type: "url", mediaType: item.Type === "Series" ? "tv" : "movie", link: value,
    title: item.Name || "未命名影片", posterPath: imageUrl(config, item.Id), backdropPath: imageUrl(config, item.Id),
    description: item.Overview || "", rating: item.CommunityRating, releaseDate: item.PremiereDate,
    peoples: (item.People || []).filter((person) => person.Type === "Actor" && person.Id).map((person) => ({
      id: String(person.Id), title: person.Name, avatar: imageUrl(config, person.Id), role: person.Role || "演员"
    })),
    videoUrl: await getPlaybackUrl(config, item.Id),
    playerType: "app"
  };
}
