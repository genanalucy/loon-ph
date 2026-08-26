WidgetMetadata = {
  id: "local.emby.actorpicker",
  title: "Emby 演员选择",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "仿照分类/类型选择：选择演员后直接打开该演员的作品海报墙。",
  author: "Local",
  globalParams: [
    { name: "server", title: "Emby 地址", type: "input", placeholders: [{ title: "示例", value: "http://192.168.1.50:8096" }] },
    { name: "apiKey", title: "Emby API Key", type: "input" },
    { name: "userId", title: "Emby User ID", type: "input" }
  ],
  modules: [{
    id: "actorPicker", title: "选择演员", functionName: "loadActorWorks", requiresWebView: false, sectionMode: false, cacheDuration: 60,
    params: [
      { name: "actorId", title: "选择演员", type: "enumeration", value: "3436", enumOptions: [
  {
    "title": "爱花未满（4）",
    "value": "3436"
  },
  {
    "title": "八挂海（6）",
    "value": "1678"
  },
  {
    "title": "八木奈々（1）",
    "value": "3805"
  },
  {
    "title": "白上咲花（1）",
    "value": "2796"
  },
  {
    "title": "百田充希（1）",
    "value": "2798"
  },
  {
    "title": "百咲みいろ（1）",
    "value": "2678"
  },
  {
    "title": "坂道美琉（51）",
    "value": "160"
  },
  {
    "title": "坂元みこ（1）",
    "value": "1181"
  },
  {
    "title": "浜辺やよい（1）",
    "value": "974"
  },
  {
    "title": "本田桃（1）",
    "value": "1523"
  },
  {
    "title": "本郷愛（33）",
    "value": "3179"
  },
  {
    "title": "本庄铃（25）",
    "value": "519"
  },
  {
    "title": "彩美旬果（1）",
    "value": "2556"
  },
  {
    "title": "倉木華（2）",
    "value": "1926"
  },
  {
    "title": "柴崎はる（2）",
    "value": "1694"
  },
  {
    "title": "持野蓬（1）",
    "value": "3655"
  },
  {
    "title": "初川南（1）",
    "value": "652"
  },
  {
    "title": "大槻响（2）",
    "value": "1121"
  },
  {
    "title": "渡部ほの（1）",
    "value": "3261"
  },
  {
    "title": "枫可怜（4）",
    "value": "651"
  },
  {
    "title": "逢沢みゆ（2）",
    "value": "3875"
  },
  {
    "title": "福田ゆあ（1）",
    "value": "1583"
  },
  {
    "title": "高桥圣子（1）",
    "value": "2590"
  },
  {
    "title": "宫岛めい（1）",
    "value": "1875"
  },
  {
    "title": "宫下玲奈（20）",
    "value": "1655"
  },
  {
    "title": "河北彩花（17）",
    "value": "546"
  },
  {
    "title": "河合明日菜（1）",
    "value": "2795"
  },
  {
    "title": "黑川纱里奈（1）",
    "value": "2676"
  },
  {
    "title": "戸田真琴（24）",
    "value": "1146"
  },
  {
    "title": "花宫丽（1）",
    "value": "1509"
  },
  {
    "title": "吉高宁宁（3）",
    "value": "1357"
  },
  {
    "title": "加美杏奈（1）",
    "value": "2267"
  },
  {
    "title": "岬奈奈美（63）",
    "value": "561"
  },
  {
    "title": "架乃由罗（1）",
    "value": "2408"
  },
  {
    "title": "皆月光（1）",
    "value": "2102"
  },
  {
    "title": "金松季歩（16）",
    "value": "1065"
  },
  {
    "title": "九野ひなの（1）",
    "value": "1597"
  },
  {
    "title": "鹫尾芽衣（1）",
    "value": "2406"
  },
  {
    "title": "菊市桃子（1）",
    "value": "1180"
  },
  {
    "title": "葵司（35）",
    "value": "1196"
  },
  {
    "title": "葵伊吹（21）",
    "value": "532"
  },
  {
    "title": "瀬戸環奈（18）",
    "value": "136"
  },
  {
    "title": "栗宫双叶（10）",
    "value": "2372"
  },
  {
    "title": "栗山莉绪（17）",
    "value": "1754"
  },
  {
    "title": "莉々はるか（1）",
    "value": "2941"
  },
  {
    "title": "凉森玲梦（72）",
    "value": "569"
  },
  {
    "title": "美咲佳奈（1）",
    "value": "1960"
  },
  {
    "title": "蜜このは（1）",
    "value": "1828"
  },
  {
    "title": "明里䌷（25）",
    "value": "365"
  },
  {
    "title": "木下日葵（1）",
    "value": "2292"
  },
  {
    "title": "七濑爱丽丝（2）",
    "value": "1617"
  },
  {
    "title": "七森莉莉（2）",
    "value": "1938"
  },
  {
    "title": "七泽美亚（15）",
    "value": "418"
  },
  {
    "title": "千咲ちな（1）",
    "value": "1889"
  },
  {
    "title": "浅野こころ（1）",
    "value": "3166"
  },
  {
    "title": "桥本有菜（6）",
    "value": "1820"
  },
  {
    "title": "青空光（21）",
    "value": "1244"
  },
  {
    "title": "潤うるる（1）",
    "value": "2716"
  },
  {
    "title": "三澄寧々（1）",
    "value": "1688"
  },
  {
    "title": "三宫椿（14）",
    "value": "463"
  },
  {
    "title": "三上悠亚（90）",
    "value": "589"
  },
  {
    "title": "三田真鈴（5）",
    "value": "627"
  },
  {
    "title": "森日向子（23）",
    "value": "505"
  },
  {
    "title": "纱仓真菜（3）",
    "value": "1852"
  },
  {
    "title": "山本莲加（1）",
    "value": "2103"
  },
  {
    "title": "善場まみ（10）",
    "value": "302"
  },
  {
    "title": "設楽ゆうひ（34）",
    "value": "2352"
  },
  {
    "title": "深田咏美（1）",
    "value": "1461"
  },
  {
    "title": "神宫寺奈绪（17）",
    "value": "234"
  },
  {
    "title": "神木丽（15）",
    "value": "1210"
  },
  {
    "title": "石川澪（1）",
    "value": "2793"
  },
  {
    "title": "石原希望（21）",
    "value": "448"
  },
  {
    "title": "双叶ひより（1）",
    "value": "3762"
  },
  {
    "title": "松本一香（12）",
    "value": "1710"
  },
  {
    "title": "松岡美桜（1）",
    "value": "3906"
  },
  {
    "title": "桃乃木香奈（8）",
    "value": "256"
  },
  {
    "title": "藤咲まい（3）",
    "value": "797"
  },
  {
    "title": "天川空（4）",
    "value": "637"
  },
  {
    "title": "天美めあ（1）",
    "value": "1562"
  },
  {
    "title": "天使萌（32）",
    "value": "1270"
  },
  {
    "title": "通野未帆（1）",
    "value": "2101"
  },
  {
    "title": "唯井真寻（21）",
    "value": "391"
  },
  {
    "title": "五日市芽依（70）",
    "value": "1648"
  },
  {
    "title": "西宫梦（2）",
    "value": "1010"
  },
  {
    "title": "夏目响（4）",
    "value": "918"
  },
  {
    "title": "相泽南（3）",
    "value": "1912"
  },
  {
    "title": "响莲（1）",
    "value": "2663"
  },
  {
    "title": "小凑よつ叶（1）",
    "value": "2942"
  },
  {
    "title": "小松空（1）",
    "value": "1794"
  },
  {
    "title": "小野六花（2）",
    "value": "2794"
  },
  {
    "title": "筿田优（40）",
    "value": "805"
  },
  {
    "title": "新村晶（2）",
    "value": "455"
  },
  {
    "title": "新井莉麻（1）",
    "value": "4227"
  },
  {
    "title": "雪乃凛央（1）",
    "value": "1250"
  },
  {
    "title": "野澤すずか（1）",
    "value": "1182"
  },
  {
    "title": "伊贺まこ（1）",
    "value": "2407"
  },
  {
    "title": "伊藤舞雪（31）",
    "value": "380"
  },
  {
    "title": "翼舞（1）",
    "value": "195"
  },
  {
    "title": "樱空桃（59）",
    "value": "213"
  },
  {
    "title": "永濑唯（1）",
    "value": "3246"
  },
  {
    "title": "羽咲美晴（1）",
    "value": "2557"
  },
  {
    "title": "真白れいな（1）",
    "value": "2061"
  },
  {
    "title": "梓光莉（2）",
    "value": "1862"
  },
  {
    "title": "JULIA（1）",
    "value": "2792"
  },
  {
    "title": "MINAMO（45）",
    "value": "437"
  },
  {
    "title": "miru（39）",
    "value": "691"
  },
  {
    "title": "Nia（1）",
    "value": "2677"
  },
  {
    "title": "RINOA（1）",
    "value": "1742"
  },
  {
    "title": "うんぱい（5）",
    "value": "1589"
  },
  {
    "title": "サッチーちゃん（1）",
    "value": "4132"
  }
] },
      { name: "sort", title: "作品排序", type: "enumeration", value: "rating", enumOptions: [
        { title: "评分最高", value: "rating" }, { title: "上映年份最新", value: "year" },
        { title: "最近加入", value: "created" }, { title: "片名 A → Z", value: "name" }, { title: "随机", value: "random" }
      ] },
      { name: "page", title: "页码", type: "page" }
    ]
  }]
};

const CONFIG_KEY = "local.emby.actorpicker.config";
const PAGE_SIZE = 50;
function config(params) {
  const current = { server: String(params.server || "").replace(/\/+$/, ""), apiKey: String(params.apiKey || ""), userId: String(params.userId || "") };
  if (current.server && current.apiKey && current.userId) { Widget.storage.set(CONFIG_KEY, current); return current; }
  const saved = Widget.storage.get(CONFIG_KEY);
  if (!saved || !saved.server || !saved.apiKey || !saved.userId) throw new Error("请填写 Emby 地址、API Key 和 User ID");
  return saved;
}
function paramsOf(value) { const result = {}; Object.keys(value || {}).forEach((key) => { result[key] = typeof value[key] === "boolean" ? (value[key] ? "true" : "false") : value[key]; }); return result; }
async function get(c, path, params) { const result = await Widget.http.get(c.server + path, { params: paramsOf(Object.assign({}, params, { api_key: c.apiKey })) }); if (!result || !result.data) throw new Error("Emby 返回为空"); return result.data; }
function query(value) { return Object.keys(value).map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(String(value[key]))).join("&"); }
async function post(c, path, params) { const p = paramsOf(Object.assign({}, params, { api_key: c.apiKey })); const result = await Widget.http.post(c.server + path + "?" + query(p), null, {}); if (!result || !result.data) throw new Error("Emby 播放协商返回为空"); return result.data; }
function image(c, id) { return c.server + "/Items/" + encodeURIComponent(String(id)) + "/Images/Primary?api_key=" + encodeURIComponent(c.apiKey); }
function sort(items, value) { const list = items.slice(); if (value === "random") return list.sort(() => Math.random() - 0.5); const spec = { rating: ["CommunityRating", -1], year: ["ProductionYear", -1], created: ["DateCreated", -1], name: ["SortName", 1] }[value] || ["CommunityRating", -1]; return list.sort((a, b) => String(a[spec[0]] == null ? "" : a[spec[0]]).localeCompare(String(b[spec[0]] == null ? "" : b[spec[0]]), undefined, { numeric: true }) * spec[1]); }
function video(c, item) { return { id: "actorPickerMedia_" + item.Id, type: "url", mediaType: item.Type === "Series" ? "tv" : "movie", title: item.Name || "未命名影片", posterPath: image(c, item.Id), backdropPath: image(c, item.Id), rating: item.CommunityRating, releaseDate: item.PremiereDate, description: item.Overview || "", link: "actorPickerMedia:" + item.Id }; }
async function loadActorWorks(params = {}) {
  const c = config(params); const page = Math.max(1, Number(params.page || 1));
  const data = await get(c, "/Users/" + encodeURIComponent(c.userId) + "/Items", { UserId: c.userId, IncludeItemTypes: "Movie,Series", Recursive: "true", StartIndex: 0, Limit: 10000, EnableImages: "false", Fields: "People,Overview,PremiereDate,ProductionYear,CommunityRating,DateCreated,SortName" });
  const works = (data.Items || []).filter((item) => (item.People || []).some((person) => String(person.Id) === String(params.actorId)));
  return sort(works, params.sort).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => video(c, item));
}
async function playback(c, id) { const data = await post(c, "/Items/" + encodeURIComponent(id) + "/PlaybackInfo", { UserId: c.userId, IsPlayback: "true", AutoOpenLiveStream: "true" }); const sources = data.MediaSources || []; const direct = sources.find((s) => s.SupportsDirectPlay && s.Path); if (direct) return direct.Path; const source = sources.find((s) => s.SupportsDirectStream || s.SupportsTranscoding); if (!source) throw new Error("Emby 没有返回可播放媒体源"); return c.server + "/Videos/" + encodeURIComponent(id) + "/stream?static=true&MediaSourceId=" + encodeURIComponent(source.Id) + "&api_key=" + encodeURIComponent(c.apiKey); }
async function loadDetail(link) { const c = config({}); const text = String(link || ""); if (text.indexOf("actorPickerMedia:") !== 0) return null; const id = text.slice("actorPickerMedia:".length); const item = await get(c, "/Users/" + encodeURIComponent(c.userId) + "/Items/" + encodeURIComponent(id), { Fields: "Overview,PremiereDate,CommunityRating" }); return { id: "actorPickerMedia_" + id, type: "url", mediaType: item.Type === "Series" ? "tv" : "movie", title: item.Name || "未命名影片", posterPath: image(c, id), backdropPath: image(c, id), description: item.Overview || "", rating: item.CommunityRating, releaseDate: item.PremiereDate, videoUrl: await playback(c, id), playerType: "app" }; }
