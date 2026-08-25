WidgetMetadata = {
  id: "local.emby.peoplewall",
  title: "Emby 演员墙",
  version: "1.0.0",
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
    id: "person." + person.Id, type: "url", title: person.Name || "未命名演员",
    posterPath: imageUrl(config, person.Id), description: "演员",
    link: "person:" + person.Id + ":" + encodeURIComponent(person.Name || "演员")
  };
}

function mediaItem(config, item) {
  const year = item.ProductionYear ? String(item.ProductionYear) : "";
  const rating = typeof item.CommunityRating === "number" ? item.CommunityRating : undefined;
  return {
    id: "item." + item.Id, type: "url", title: item.Name || "未命名影片",
    posterPath: imageUrl(config, item.Id), backdropPath: imageUrl(config, item.Id),
    releaseDate: item.PremiereDate || undefined, rating: rating,
    description: [year, item.Overview || ""].filter(Boolean).join(" · "),
    link: "item:" + item.Id
  };
}

async function loadActors(params = {}) {
  const config = saveConfig(params);
  const page = Math.max(1, Number(params.page || 1));
  const sort = actorSort(params.sort);
  try {
    const data = await embyGet(config, "/Persons", {
      UserId: config.userId, StartIndex: (page - 1) * PAGE_SIZE, Limit: PAGE_SIZE,
      Recursive: true, EnableImages: true, SortBy: sort.SortBy, SortOrder: sort.SortOrder
    });
    return (data.Items || []).map((person) => actorItem(config, person));
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
  const data = await embyGet(config, "/Persons", {
    UserId: config.userId, SearchTerm: keyword, StartIndex: (page - 1) * PAGE_SIZE,
    Limit: PAGE_SIZE, Recursive: true, EnableImages: true, SortBy: "SortName", SortOrder: "Ascending"
  });
  return (data.Items || []).map((person) => actorItem(config, person));
}

async function loadActorWorks(params = {}) {
  const config = saveConfig(params);
  const actor = String(params.actor || "").trim();
  if (!actor) throw new Error("请输入演员名称");
  return fetchWorksByPerson(config, actor, null, params.sort, params.page);
}

async function fetchWorksByPerson(config, actorName, personId, sortValue, pageValue) {
  const page = Math.max(1, Number(pageValue || 1));
  const sort = workSort(sortValue);
  const request = {
    UserId: config.userId, IncludeItemTypes: "Movie,Series", Recursive: true,
    StartIndex: (page - 1) * PAGE_SIZE, Limit: PAGE_SIZE, EnableImages: true,
    Fields: "Overview,PremiereDate,ProductionYear,CommunityRating,People,MediaSources",
    SortBy: sort.SortBy, SortOrder: sort.SortOrder
  };
  if (personId) request.PersonIds = personId;
  else request.Person = actorName;
  const data = await embyGet(config, "/Users/" + encodeURIComponent(config.userId) + "/Items", request);
  return (data.Items || []).map((item) => mediaItem(config, item));
}

function personWorkSortItems(personId, personName) {
  const options = [
    ["rating", "按评分最高"], ["yearDesc", "按上映年份最新"], ["yearAsc", "按上映年份最早"],
    ["created", "按最近加入"], ["played", "按最近观看"], ["playCount", "按播放次数最多"],
    ["nameAsc", "按片名 A → Z"], ["random", "随机排序"]
  ];
  return options.map((option) => ({
    id: "personWorkSort." + personId + "." + option[0], type: "url", title: option[1],
    description: personName + "的作品", link: "personWorks:" + personId + ":" + encodeURIComponent(personName) + ":" + option[0]
  }));
}

async function loadDetail(link) {
  const config = getConfig();
  const value = String(link || "");
  if (value.indexOf("personWorks:") === 0) {
    const parts = value.split(":");
    const personId = parts[1];
    const sortValue = parts[parts.length - 1];
    const personName = decodeURIComponent(parts.slice(2, -1).join(":"));
    const works = await fetchWorksByPerson(config, personName, personId, sortValue, 1);
    return {
      id: value, type: "url", title: personName + " · " + personWorkSortItems(personId, personName).filter((item) => item.link === value)[0].title,
      description: "下拉可继续加载下一页；返回演员页可选择其他排序。", relatedItems: works
    };
  }
  if (value.indexOf("person:") === 0) {
    const parts = value.split(":");
    const personId = parts[1];
    const personName = decodeURIComponent(parts.slice(2).join(":") || "演员");
    const works = await fetchWorksByPerson(config, personName, personId, "rating", 1);
    return {
      id: value, type: "url", title: personName, posterPath: imageUrl(config, personId),
      description: "默认按评分排序。下方“排序方式”可按年份、加入时间、播放次数等重新浏览。",
      relatedItems: works,
      childItems: personWorkSortItems(personId, personName)
    };
  }
  if (value.indexOf("item:") === 0) {
    const itemId = value.slice(5);
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
