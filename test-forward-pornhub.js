const assert = require("assert/strict");
const fs = require("fs");
const vm = require("vm");

const homeCard = `
<div class="positionRelative videoWrapper js-video-element">
  <a class="imageLink" href="/view_video.php?viewkey=abc123" data-poster="https://img.example/home.jpg"><img class="videoThumb" src="https://img.example/home.jpg"></a>
  <div class="duration"><span class="bgEffect time">12:34</span></div>
  <div class="videoUploaderBlock"><a class="uploaderLink" href="/pornstar/alice">Alice</a></div>
  <div class="videoViews"><i></i>123K</div>
  <a class="thumbnailTitle" href="/view_video.php?viewkey=abc123">Example Video</a>
</div>`;

const relatedRows = [[
  "https://img.example/related.jpg", "Related Video", "02:00", 90,
  "https://www.pornhub.com/view_video.php?viewkey=related1", 100,
  "", "Alice", "https://www.pornhub.com/pornstar/alice", "", { highResThumb: "https://img.example/related-hd.jpg" }
]];

const detail = `
<script>var VIDEO_SHOW = {"videoTitle":"Example Video","videoImage":"https://img.example/detail.jpg"};</script>
<script>var flashvars_1 = {"video_duration":754,"mediaDefinitions":[{"quality":"720","height":720,"format":"hls","videoUrl":"https://media.example/720.m3u8"},{"quality":"1080","height":1080,"format":"hls","videoUrl":"https://media.example/1080.m3u8"},{"format":"mp4","remote":true,"videoUrl":"https://www.pornhub.com/video/get_media?token=example"}]};</script>
<script>var MODEL_PROFILE = {"username":"Alice","modelProfileLink":"/pornstar/alice"};</script>
<script>var relatedVideosData = ${JSON.stringify(relatedRows)}; var x = 1;</script>`;

const calls = [];
const sandbox = {
  console,
  Widget: {
    storage: { _data: {}, get(key) { return this._data[key]; }, set(key, value) { this._data[key] = value; } },
    http: {
      get: async (url, options) => {
        calls.push({ url, options });
        if (url.endsWith("/view_video.php")) return { data: detail };
        if (url.includes("/video/get_media")) return { data: [{ quality: "1080", height: 1080, format: "mp4", videoUrl: "https://cdn.example/1080.mp4" }] };
        if (url.endsWith("/pornstar/alice")) return { data: homeCard };
        return { data: homeCard };
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("./forward-pornhub.js", "utf8"), sandbox);

(async () => {
  const list = await sandbox.loadList({ page: 1 });
  assert.equal(list.length, 1);
  assert.equal(list[0].type, "url");
  assert.equal(list[0].link, "video:abc123");
  assert.equal(list[0].peoples[0].id, "creator:pornstar/alice");
  assert.equal(list[0].posterPath, undefined);

  const detailItem = await sandbox.loadDetail("video:abc123");
  assert.equal(detailItem.title, "Example Video");
  assert.equal(detailItem.duration, 754);
  assert.equal(detailItem.peoples[0].id, "creator:pornstar/alice");
  assert.equal(detailItem.relatedItems[0].link, "video:related1");
  assert.equal(detailItem.relatedItems[0].coverUrl, "https://img.example/related-hd.jpg");

  const resources = await sandbox.loadResource({ link: "video:abc123" });
  assert.equal(resources[0].url, "https://cdn.example/1080.mp4");
  assert.equal(resources[0].name, "MP4 · 1080P");
  assert.equal(resources[0].customHeaders.Referer, "https://www.pornhub.com/");
  assert.ok(resources.some(resource => resource.url === "https://media.example/1080.m3u8"));

  const creatorWorks = await sandbox.loadList({ peopleId: "creator:pornstar/alice" });
  assert.equal(creatorWorks[0].link, "video:abc123");

  const creatorDetail = await sandbox.loadDetail("creator:pornstar/alice");
  assert.equal(creatorDetail.link, "creator:pornstar/alice");
  assert.equal(creatorDetail.relatedItems.length, 1);
  assert.equal(creatorDetail.relatedItems[0].link, "video:abc123");

  sandbox.Widget.storage.set("creator-page:model/creator-cache", homeCard);
  const callsBeforeCachedDetail = calls.length;
  const cachedCreatorDetail = await sandbox.loadDetail("creator:model/creator-cache");
  assert.equal(cachedCreatorDetail.relatedItems[0].link, "video:abc123");
  assert.equal(calls.length, callsBeforeCachedDetail);

  const favorites = await sandbox.loadFavorites({ favoriteCreators: "https://www.pornhub.com/pornstar/alice\n/model/bob\ninvalid" });
  assert.equal(favorites.length, 2);
  assert.equal(favorites[0].link, "creator:pornstar/alice");
  assert.equal(favorites[1].link, "creator:model/bob");

  assert.equal(sandbox.WidgetMetadata.version, "1.1.1");
  const creatorWallModule = sandbox.WidgetMetadata.modules.find(module => module.id === "loadCreatorWall");
  assert.equal(sandbox.WidgetMetadata.modules.length, 5);
  assert.equal(creatorWallModule.params[0].type, "enumeration");
  assert.equal(creatorWallModule.params[0].enumOptions.length, 12);

  const creatorWall = await sandbox.loadCreatorWall({ creatorPath: "/pornstar/alice" });
  assert.equal(creatorWall.length, 1);
  assert.equal(creatorWall[0].link, "video:abc123");
  assert.equal(creatorWall[0].peoples[0].id, "creator:pornstar/alice");

  const updates = await sandbox.loadFavoriteUpdates({ favoriteCreators: "/pornstar/alice\n/model/bob" });
  assert.equal(updates.length, 1);
  assert.equal(updates[0].peoples[0].id, "creator:pornstar/alice");
  assert.ok(calls.some(call => call.url.endsWith("/pornstar/alice")));
  assert.ok(calls.some(call => call.url.endsWith("/view_video.php") && call.options.params.viewkey === "abc123"));
  console.log("✅ Forward Pornhub mock test passed", { calls: calls.length });
})().catch(error => { console.error("❌", error); process.exit(1); });
