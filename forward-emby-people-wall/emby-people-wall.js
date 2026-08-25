WidgetMetadata = {
  id: "local.emby.peoplewall",
  title: "Emby 演员墙",
  version: "1.0.4",
  requiredVersion: "0.0.1",
  description: "浏览 Emby 演员头像墙、搜索演员及按演员查看本地影片。",
  author: "Local",
  site: "https://github.com/InchStudio/ForwardWidgets",
  detailCacheDuration: 60,
  globalParams: [
    {
      name: "server", title: "Emby 地址", type: "input",
      description: "例如 http://192.168.1.50:8096；不要以 / 结尾。",
      placeholders: [{ title: "局域网示例", value: "http://192.168.1.50:8096" }]
    },
    {
      name: "apiKey", title: "Emby API Key", type: "input",
      description: "在 Emby 控制台 → 高级 → API 密钥中新建仅供本模块使用的密钥。"
    },
    {
      name: "userId", title: "Emby User ID", type: "input",
      description: "Emby 网页端登录后，浏览器地址或 API 返回中可找到；用于读取观看记录。"
    }
  ],
  modules: [
    {
      id: "actors", title: "演员海报墙", functionName: "loadActors",
      description: "按名称、最近加入或随机浏览演员。",
      requiresWebView: false, sectionMode: false, cacheDuration: 300,
      params: [
        { name: "sort", title: "演员排序", type: "enumeration", value: "nameAsc", enumOptions: [
          { title: "名称 A → Z", value: "nameAsc" },
          { title: "名称 Z → A", value: "nameDesc" },
          { title: "最近加入", value: "created" },
          { title: "随机", value: "random" }
        ] },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "actorWorks", title: "演员作品", functionName: "loadActorWorks",
      description: "输入演员名后显示该演员作品；可选择作品排序。",
      requiresWebView: false, sectionMode: false, cacheDuration: 120,
      params: [
        { name: "actor", title: "演员名称", type: "input", placeholders: [{ title: "示例", value: "周星驰" }] },
        { name: "sort", title: "作品排序", type: "enumeration", value: "rating", enumOptions: [
          { title: "评分最高", value: "rating" },
          { title: "上映年份最新", value: "yearDesc" },
          { title: "上映年份最早", value: "yearAsc" },
          { title: "最近加入", value: "created" },
          { title: "最近观看", value: "played" },
          { title: "播放次数最多", value: "playCount" },
          { title: "片名 A → Z", value: "nameAsc" },
          { title: "随机", value: "random" }
        ] },
        { name: "page", title: "页码", type: "page" }
      ]
    }
  ],
  search: {
    title: "搜索演员", functionName: "searchActors",
    params: [
      { name: "keyword", title: "演员名称", type: "input" },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

const PAGE_SIZE = 50;
const CONFIG_KEY = "local.emby.peoplewall.config";
const LIBRARY_INDEX_KEY = "local.emby.peoplewall.library-index";
const LIBRARY_INDEX_TTL_MS = 10 * 60 * 1000;

function cleanServer(server) {
  return String(server || "").replace(/\/+$/, "");
}

function saveConfig(params) {
  const config = { server: cleanServer(params.server), apiKey: String(params.apiKey || ""), userId: String(params.userId || "") };
  if (!config.server || !config.apiKey || !config.userId) {
    throw new Error("请先填写 Emby 地址、API Key 和 User ID");
  }
  Widget.storage.set(CONFIG_KEY, config);
  return config;
}

function getConfig() {
  const config = Widget.storage.get(CONFIG_KEY);
  if (!config || !config.server || !config.apiKey || !config.userId) {
    throw new Error("尚未保存 Emby 配置。请先打开“演员海报墙”并填写全局参数。");
  }
  return config;
}

async function embyGet(config, path, params) {
  const query = Object.assign({}, params || {}, { api_key: config.apiKey });
  const response = await Widget.http.get(config.server + path, { params: query });
  if (!response || !response.data) throw new Error("Emby 返回为空");
  return response.data;
}

function imageUrl(config, id) {
  return config.server + "/Items/" + encodeURIComponent(String(id)) + "/Images/Primary?api_key=" + encodeURIComponent(config.apiKey);
}

function actorSort(value) {
  if (value === "nameDesc") return { SortBy: "SortName", SortOrder: "Descending" };
  if (value === "created") return { SortBy: "DateCreated", SortOrder: "Descending" };
  if (value === "random") return { SortBy: "Random", SortOrder: "Ascending" };
  return { SortBy: "SortName", SortOrder: "Ascending" };
}

function workSort(value) {
  const map = {
    rating: ["CommunityRating", "Descending"], yearDesc: ["ProductionYear", "Descending"],
    yearAsc: ["ProductionYear", "Ascending"], created: ["DateCreated", "Descending"],
    played: ["DatePlayed", "Descending"], playCount: ["PlayCount", "Descending"],
    nameAsc: ["SortName", "Ascending"], random: ["Random", "Ascending"]
  };
  const selected = map[value] || map.rating;
  return { SortBy: selected[0], SortOrder: selected[1] };
}

function actorItem(config, person) {
  return {
    // 不使用 person.<id>：Forward 会将该格式识别为内置人物页，导致自定义 link 不生效。
    id: "embyActor_" + person.Id, type: "url", title: person.Name || "未命名演员",
    posterPath: imageUrl(config, person.Id), description: "演员",
    link: "embyActor:" + person.Id + ":" + encodeURIComponent(person.Name || "演员")
  };
}

function mediaItem(config, item) {
  const year = item.ProductionYear ? String(item.ProductionYear) : "";
  const rating = typeof item.CommunityRating === "number" ? item.CommunityRating : undefined;
  return {
    id: "embyMedia_" + item.Id, type: "url", mediaType: item.Type === "Series" ? "tv" : "movie", title: item.Name || "未命名影片",
    posterPath: imageUrl(config, item.Id), backdropPath: imageUrl(config, item.Id),
    releaseDate: item.PremiereDate || undefined, rating: rating,
    description: [year, item.Overview || ""].filter(Boolean).join(" · "),
    link: "embyMedia:" + item.Id
  };
}

function sortPeople(people, sortValue) {
  const result = people.slice();
  if (sortValue === "random") return result.sort(() => Math.random() - 0.5);
  const direction = sortValue === "nameDesc" ? -1 : 1;
  return result.sort((left, right) => String(left.Name || "").localeCompare(String(right.Name || "")) * direction);
}

function indexMatchesConfig(index, config) {
  return index && index.server === config.server && index.userId === config.userId && index.worksByPersonId &&
    Date.now() - Number(index.createdAt || 0) < LIBRARY_INDEX_TTL_MS;
}

function sortWorks(items, sortValue) {
  const result = items.slice();
  if (sortValue === "random") return result.sort(() => Math.random() - 0.5);
  const rules = {
    rating: ["CommunityRating", -1], yearDesc: ["ProductionYear", -1], yearAsc: ["ProductionYear", 1],
    created: ["DateCreated", -1], played: ["DateLastPlayed", -1], playCount: ["PlayCount", -1], nameAsc: ["SortName", 1]
  };
  const rule = rules[sortValue] || rules.rating;
  return result.sort((left, right) => {
    const a = left[rule[0]] == null ? "" : left[rule[0]];
    const b = right[rule[0]] == null ? "" : right[rule[0]];
    return String(a).localeCompare(String(b), undefined, { numeric: true }) * rule[1];
  });
}

// 只在这里读取全库的 People；演员详情直接用该索引，避免 PersonIds 请求在 Forward 中触发 Emby 500。
async function getLibraryIndex(config) {
  const cached = Widget.storage.get(LIBRARY_INDEX_KEY);
  if (indexMatchesConfig(cached, config)) return cached;
  const data = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items", {
    UserId: config.userId, IncludeItemTypes: "Movie,Series", Recursive: true,
    StartIndex: 0, Limit: 10000, EnableImages: false,
    Fields: "People,Overview,PremiereDate,ProductionYear,CommunityRating,DateCreated,DateLastPlayed,PlayCount,SortName"
  });
  const peopleById = {};
  const worksByPersonId = {};
  (data.Items || []).forEach((item) => {
    (item.People || []).forEach((person) => {
      if (person.Type !== "Actor" || !person.Id) return;
      peopleById[person.Id] = { Id: person.Id, Name: person.Name || "未命名演员" };
      if (!worksByPersonId[person.Id]) worksByPersonId[person.Id] = [];
      worksByPersonId[person.Id].push(item);
    });
  });
  const index = { server: config.server, userId: config.userId, createdAt: Date.now(), peopleById, worksByPersonId };
  Widget.storage.set(LIBRARY_INDEX_KEY, index);
  return index;
}

async function getPeopleFromLibrary(config) {
  const index = await getLibraryIndex(config);
  return Object.keys(index.peopleById).map((id) => index.peopleById[id]);
}

async function queryPeople(config, keyword, sortValue) {
  const sort = actorSort(sortValue);
  try {
    const data = await embyGet(config, "/Persons", {
      UserId: config.userId, SearchTerm: keyword || undefined, StartIndex: 0, Limit: 10000,
      SortBy: sort.SortBy, SortOrder: sort.SortOrder
    });
    return data.Items || [];
  } catch (error) {
    console.warn("[/Persons] 不可用，改从媒体库聚合演员：", error.message || error);
    const people = await getPeopleFromLibrary(config);
    const filtered = keyword ? people.filter((person) => String(person.Name || "").toLowerCase().includes(keyword.toLowerCase())) : people;
    return sortPeople(filtered, sortValue);
  }
}

function pagePeople(people, page) {
  const start = (page - 1) * PAGE_SIZE;
  return people.slice(start, start + PAGE_SIZE);
}

async function loadActors(params = {}) {
  const config = saveConfig(params);
  const page = Math.max(1, Number(params.page || 1));
  try {
    // 即使 /Persons 可用，也预建演员→作品索引，点击演员时不再发送 PersonIds 查询。
    await getLibraryIndex(config);
    const people = await queryPeople(config, "", params.sort || "nameAsc");
    return pagePeople(people, page).map((person) => actorItem(config, person));
  } catch (error) {
    console.error("[loadActors]", error.message || error);
    throw error;
  }
}

async function searchActors(params = {}) {
  const config = saveConfig(params);
  const keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  const page = Math.max(1, Number(params.page || 1));
  const people = await queryPeople(config, keyword, "nameAsc");
  return pagePeople(people, page).map((person) => actorItem(config, person));
}

async function loadActorWorks(params = {}) {
  const config = saveConfig(params);
  const actor = String(params.actor || "").trim();
  if (!actor) throw new Error("请输入演员名称");
  return fetchWorksByPerson(config, actor, null, params.sort, params.page);
}

async function fetchWorksByPerson(config, actorName, personId, sortValue, pageValue) {
  const page = Math.max(1, Number(pageValue || 1));
  if (personId) {
    const index = await getLibraryIndex(config);
    const cachedWorks = index.worksByPersonId[personId];
    if (cachedWorks) return sortWorks(cachedWorks, sortValue).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => mediaItem(config, item));
  }
  const sort = workSort(sortValue);
  const request = {
    UserId: config.userId, IncludeItemTypes: "Movie,Series", Recursive: true,
    StartIndex: (page - 1) * PAGE_SIZE, Limit: PAGE_SIZE, EnableImages: true,
    Fields: "Overview,PremiereDate,ProductionYear,CommunityRating,People,MediaSources",
    SortBy: sort.SortBy, SortOrder: sort.SortOrder
  };
  if (personId) request.PersonIds = personId;
  else request.Person = actorName;
  // /Users/{id}/Items 在部分 Emby 4.9.x + Forward 请求组合下会偶发 500；
  // /Items 是同一查询的兼容端点，显式携带 UserId 后可避免该服务器缺陷。
  let data;
  try {
    data = await embyGet(config, "/Items", request);
  } catch (error) {
    console.warn("[/Items] 查询作品失败，回退到用户媒体接口：", error.message || error);
    data = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items", request);
  }
  return (data.Items || []).map((item) => mediaItem(config, item));
}

function personWorkSortItems(personId, personName) {
  const options = [
    ["rating", "按评分最高"], ["yearDesc", "按上映年份最新"], ["yearAsc", "按上映年份最早"],
    ["created", "按最近加入"], ["played", "按最近观看"], ["playCount", "按播放次数最多"],
    ["nameAsc", "按片名 A → Z"], ["random", "随机排序"]
  ];
  return options.map((option) => ({
    id: "embyActorSort_" + personId + "_" + option[0], type: "url", title: option[1],
    description: personName + "的作品", link: "embyActorWorks:" + personId + ":" + encodeURIComponent(personName) + ":" + option[0]
  }));
}

async function loadDetail(link) {
  const config = getConfig();
  const value = String(link || "");
  if (value.indexOf("embyActorWorks:") === 0) {
    const parts = value.split(":");
    const personId = parts[1];
    const sortValue = parts[parts.length - 1];
    const personName = decodeURIComponent(parts.slice(2, -1).join(":"));
    const works = await fetchWorksByPerson(config, personName, personId, sortValue, 1);
    return {
      id: value, type: "url", title: personName + " · " + personWorkSortItems(personId, personName).filter((item) => item.link === value)[0].title,
      description: "作品列表", relatedItems: works, episodeItems: works
    };
  }
  if (value.indexOf("embyActor:") === 0) {
    const parts = value.split(":");
    const personId = parts[1];
    const personName = decodeURIComponent(parts.slice(2).join(":") || "演员");
    const works = await fetchWorksByPerson(config, personName, personId, "rating", 1);
    return {
      id: value, type: "url", title: personName, posterPath: imageUrl(config, personId),
      description: "作品（默认按评分排序）",
      relatedItems: works,
      episodeItems: works
    };
  }
  if (value.indexOf("embyMedia:") === 0) {
    const itemId = value.slice(10);
    const item = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items/" + encodeURIComponent(itemId), {
      Fields: "Overview,People,MediaSources,PremiereDate,ProductionYear,CommunityRating"
    });
    const people = (item.People || []).filter((p) => p.Type === "Actor").map((p) => ({
      id: String(p.Id || p.Name), title: p.Name, avatar: p.Id ? imageUrl(config, p.Id) : undefined, role: p.Role || "演员"
    }));
    return {
      id: value, type: "url", title: item.Name || "未命名影片", posterPath: imageUrl(config, item.Id),
      backdropPath: imageUrl(config, item.Id), description: item.Overview || "", rating: item.CommunityRating,
      releaseDate: item.PremiereDate, peoples: people,
      videoUrl: config.server + "/Videos/" + encodeURIComponent(item.Id) + "/stream?static=true&api_key=" + encodeURIComponent(config.apiKey),
      playerType: "app"
    };
  }
  return null;
}
