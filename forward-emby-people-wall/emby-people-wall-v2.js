WidgetMetadata = {
  id: "local.emby.peoplewall.v2",
  title: "Emby 纯演员墙",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  description: "从 Emby 本地影片库聚合演员头像墙；点击演员查看作品，支持 STRM 播放。",
  author: "Local",
  globalParams: [
    { name: "server", title: "Emby 地址", type: "input", placeholders: [{ title: "示例", value: "http://192.168.1.50:8096" }] },
    { name: "apiKey", title: "Emby API Key", type: "input" },
    { name: "userId", title: "Emby User ID", type: "input" }
  ],
  modules: [{
    id: "actors", title: "演员海报墙", functionName: "loadActors", requiresWebView: false, sectionMode: false, cacheDuration: 60,
    params: [
      { name: "sort", title: "演员排序", type: "enumeration", value: "name", enumOptions: [
        { title: "名称 A → Z", value: "name" }, { title: "名称 Z → A", value: "nameDesc" },
        { title: "作品数量最多", value: "count" }, { title: "随机", value: "random" }
      ] },
      { name: "page", title: "页码", type: "page" }
    ]
  }]
};

const ACTOR_PAGE_SIZE = 50;
const WORK_PAGE_SIZE = 50;
const CONFIG_KEY = "local.emby.peoplewall.v2.config";
const INDEX_KEY = "local.emby.peoplewall.v2.index";
const INDEX_TTL_MS = 15 * 60 * 1000;

function normalizeParams(params) {
  const result = {};
  Object.keys(params || {}).forEach((key) => {
    const value = params[key];
    // Forward 将 JS boolean 转成 1/0；Emby 4.9.5 只接受字符串 true/false。
    result[key] = typeof value === "boolean" ? (value ? "true" : "false") : value;
  });
  return result;
}

function queryString(params) {
  return Object.keys(params).map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]))).join("&");
}

function getConfig(params) {
  const current = { server: String(params.server || "").replace(/\/+$/, ""), apiKey: String(params.apiKey || ""), userId: String(params.userId || "") };
  if (current.server && current.apiKey && current.userId) {
    Widget.storage.set(CONFIG_KEY, current);
    return current;
  }
  const saved = Widget.storage.get(CONFIG_KEY);
  if (!saved || !saved.server || !saved.apiKey || !saved.userId) throw new Error("请填写 Emby 地址、API Key 和 User ID");
  return saved;
}

async function embyGet(config, path, params) {
  const response = await Widget.http.get(config.server + path, { params: normalizeParams(Object.assign({}, params || {}, { api_key: config.apiKey })) });
  if (!response || !response.data) throw new Error("Emby 返回为空");
  return response.data;
}

async function embyPost(config, path, params) {
  const query = normalizeParams(Object.assign({}, params || {}, { api_key: config.apiKey }));
  const response = await Widget.http.post(config.server + path + "?" + queryString(query), null, {});
  if (!response || !response.data) throw new Error("Emby 播放协商返回为空");
  return response.data;
}

function imageUrl(config, id) {
  return config.server + "/Items/" + encodeURIComponent(String(id)) + "/Images/Primary?api_key=" + encodeURIComponent(config.apiKey);
}

function indexIsFresh(index, config) {
  return index && index.server === config.server && index.userId === config.userId && index.actors && index.worksByActor &&
    Date.now() - Number(index.createdAt || 0) < INDEX_TTL_MS;
}

async function getIndex(config) {
  const cached = Widget.storage.get(INDEX_KEY);
  if (indexIsFresh(cached, config)) return cached;
  const data = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items", {
    UserId: config.userId, IncludeItemTypes: "Movie,Series", Recursive: "true", StartIndex: 0, Limit: 10000,
    EnableImages: "false", Fields: "People,Overview,PremiereDate,ProductionYear,CommunityRating,DateCreated,SortName"
  });
  const actorsById = {};
  const worksByActor = {};
  (data.Items || []).forEach((item) => {
    (item.People || []).forEach((person) => {
      if (person.Type !== "Actor" || !person.Id) return;
      if (!actorsById[person.Id]) actorsById[person.Id] = { Id: person.Id, Name: person.Name || "未命名演员", WorkCount: 0 };
      if (!worksByActor[person.Id]) worksByActor[person.Id] = [];
      worksByActor[person.Id].push(item);
      actorsById[person.Id].WorkCount += 1;
    });
  });
  const index = { server: config.server, userId: config.userId, createdAt: Date.now(), actors: Object.keys(actorsById).map((id) => actorsById[id]), worksByActor };
  Widget.storage.set(INDEX_KEY, index);
  return index;
}

function sortActors(actors, sort) {
  const result = actors.slice();
  if (sort === "random") return result.sort(() => Math.random() - 0.5);
  if (sort === "count") return result.sort((a, b) => b.WorkCount - a.WorkCount || String(a.Name).localeCompare(String(b.Name)));
  const direction = sort === "nameDesc" ? -1 : 1;
  return result.sort((a, b) => String(a.Name).localeCompare(String(b.Name)) * direction);
}

function sortWorks(works, sort) {
  const result = works.slice();
  if (sort === "random") return result.sort(() => Math.random() - 0.5);
  const specs = { rating: ["CommunityRating", -1], year: ["ProductionYear", -1], created: ["DateCreated", -1], name: ["SortName", 1] };
  const spec = specs[sort] || specs.rating;
  return result.sort((a, b) => String(a[spec[0]] == null ? "" : a[spec[0]]).localeCompare(String(b[spec[0]] == null ? "" : b[spec[0]]), undefined, { numeric: true }) * spec[1]);
}

function actorItem(config, actor) {
  return {
    id: "actorWall_" + actor.Id, type: "url", title: actor.Name, posterPath: imageUrl(config, actor.Id),
    description: actor.WorkCount + " 部作品", link: "actorWall:" + actor.Id + ":" + encodeURIComponent(actor.Name)
  };
}

function mediaItem(config, item) {
  return {
    id: "actorWallMedia_" + item.Id, type: "url", mediaType: item.Type === "Series" ? "tv" : "movie", title: item.Name || "未命名影片",
    posterPath: imageUrl(config, item.Id), backdropPath: imageUrl(config, item.Id), rating: item.CommunityRating,
    releaseDate: item.PremiereDate, description: item.Overview || "", link: "actorWallMedia:" + item.Id
  };
}

async function loadActors(params = {}) {
  const config = getConfig(params);
  const index = await getIndex(config);
  const page = Math.max(1, Number(params.page || 1));
  const actors = sortActors(index.actors, params.sort || "name");
  return actors.slice((page - 1) * ACTOR_PAGE_SIZE, page * ACTOR_PAGE_SIZE).map((actor) => actorItem(config, actor));
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
  return config.server + "/Videos/" + encodeURIComponent(itemId) + "/stream?static=true&MediaSourceId=" + encodeURIComponent(streamable.Id) + "&api_key=" + encodeURIComponent(config.apiKey);
}

async function loadDetail(link) {
  const config = getConfig({});
  const value = String(link || "");
  if (value.indexOf("actorWall:") === 0) {
    const parts = value.split(":");
    const actorId = parts[1];
    const actorName = decodeURIComponent(parts.slice(2).join(":") || "演员");
    const index = await getIndex(config);
    const works = index.worksByActor[actorId] || [];
    // Forward 对 type:url 的详情页未稳定渲染作品列表；在此返回完整数据供新版客户端渲染，同时保留原生详情。
    return {
      id: "actorWall_" + actorId, type: "url", title: actorName, posterPath: imageUrl(config, actorId),
      description: works.length + " 部本地作品（默认按评分排序）", relatedItems: sortWorks(works, "rating").slice(0, WORK_PAGE_SIZE).map((item) => mediaItem(config, item))
    };
  }
  if (value.indexOf("actorWallMedia:") === 0) {
    const itemId = value.slice("actorWallMedia:".length);
    const item = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items/" + encodeURIComponent(itemId), {
      Fields: "Overview,PremiereDate,ProductionYear,CommunityRating,People,MediaSources"
    });
    return {
      id: "actorWallMedia_" + item.Id, type: "url", mediaType: item.Type === "Series" ? "tv" : "movie", link: value,
      title: item.Name || "未命名影片", posterPath: imageUrl(config, item.Id), backdropPath: imageUrl(config, item.Id),
      description: item.Overview || "", rating: item.CommunityRating, releaseDate: item.PremiereDate,
      videoUrl: await getPlaybackUrl(config, item.Id), playerType: "app"
    };
  }
  return null;
}
