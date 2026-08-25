const fs = require("fs");
const assert = require("assert/strict");

const calls = [];
let failPersons = false;
global.Widget = {
  storage: {
    values: {},
    get(key) { return this.values[key]; },
    set(key, value) { this.values[key] = value; }
  },
  http: {
    async get(url, options = {}) {
      calls.push({ url, params: options.params || {} });
      const p = options.params || {};
      if (url.endsWith("/Persons")) {
        if (failPersons) throw new Error("Response status code was unacceptable: 500");
        return { data: { Items: [{ Id: "p1", Name: "周星驰" }] } };
      }
      if (url.includes("/Users/u1/Items/i1")) {
        return { data: {
          Id: "i1", Name: "功夫", Overview: "测试简介", CommunityRating: 8.2,
          PremiereDate: "2004-12-23T00:00:00.000Z",
          People: [{ Id: "p1", Name: "周星驰", Type: "Actor", Role: "主演" }]
        } };
      }
      if (url.endsWith("/Users/u1/Items")) {
        if (!p.PersonIds) {
          return { data: { Items: [{
            Id: "i1", Name: "功夫", People: [{ Id: "p1", Name: "周星驰", Type: "Actor" }]
          }] } };
        }
        assert.equal(p.PersonIds, "p1");
        return { data: { Items: [{ Id: "i1", Name: "功夫", ProductionYear: 2004, CommunityRating: 8.2 }] } };
      }
      throw new Error("未模拟请求: " + url);
    }
  }
};

eval(fs.readFileSync("./emby-people-wall.js", "utf8"));

(async () => {
  const config = { server: "http://192.168.1.50:8096", apiKey: "secret", userId: "u1" };
  const actors = await loadActors({ ...config, page: 1, sort: "nameDesc" });
  assert.equal(actors.length, 1);
  assert.equal(actors[0].type, "url");
  assert.equal(actors[0].link, "person:p1:%E5%91%A8%E6%98%9F%E9%A9%B0");
  assert.ok(actors[0].posterPath.includes("api_key=secret"));
  assert.equal(calls[0].params.StartIndex, 0);
  assert.equal(calls[0].params.SortBy, "SortName");
  assert.equal(calls[0].params.SortOrder, "Descending");

  const person = await loadDetail(actors[0].link);
  assert.equal(person.title, "周星驰");
  assert.equal(person.relatedItems[0].title, "功夫");
  const worksCall = calls.find((call) => call.url.endsWith("/Users/u1/Items"));
  assert.ok(worksCall);
  assert.equal(worksCall.params.PersonIds, "p1");
  assert.equal(worksCall.params.SortBy, "CommunityRating");

  const movie = await loadDetail("item:i1");
  assert.equal(movie.peoples[0].title, "周星驰");
  assert.ok(movie.videoUrl.includes("/Videos/i1/stream?static=true&api_key=secret"));
  assert.equal(movie.stills, undefined);
  assert.equal(movie.recommendations, undefined);

  failPersons = true;
  const fallbackActors = await loadActors({ ...config, page: 1, sort: "nameAsc" });
  assert.equal(fallbackActors[0].title, "周星驰");
  assert.ok(calls.some((call) => call.url.endsWith("/Users/u1/Items") && !call.params.PersonIds && call.params.Fields === "People"));
  failPersons = false;

  const searched = await searchActors({ ...config, keyword: "周星", page: 1 });
  assert.equal(searched[0].title, "周星驰");
  const searchCall = calls[calls.length - 1];
  assert.equal(searchCall.params.SearchTerm, "周星");
  console.log("✅ emby people wall tests passed");
})().catch((error) => {
  console.error("❌", error);
  process.exit(1);
});
