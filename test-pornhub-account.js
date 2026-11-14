const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const bridge = fs.readFileSync('pornhub-account-auth.js', 'utf8');
const store = {};
function run(request, response) {
    let result;
    const context = { $request: request, $done: value => { result = value; },
        $persistentStore: { read: key => store[key], write: (value, key) => { store[key] = value; return true; } } };
    if (response) context.$response = response;
    vm.runInNewContext(bridge, context);
    return result;
}
const url = 'https://cn.pornhub.com/recommended';
run({ url, headers: { Cookie: ['sessid=mock-a', 'ss=mock-b'], 'Sec-Fetch-Dest': 'document' } }, { body: 'var isLoggedInUser = 1;' });
assert.equal(Object.keys(store).length, 1);
let result = run({ url, headers: { 'X-PH-Widget-Auth': '1' } });
assert.equal(result.headers.Cookie, 'sessid=mock-a; ss=mock-b');
assert.equal(result.headers['X-PH-Widget-Auth'], undefined);
const previous = JSON.stringify(store);
run({ url, headers: { Cookie: 'bad=value', 'Sec-Fetch-Dest': 'document' } }, { body: 'isLoggedInUser = 0;' });
run({ url, headers: { Cookie: 'bad=value' } }, { body: 'isLoggedInUser = 1;' });
assert.equal(JSON.stringify(store), previous);
for (const badUrl of ['https://cn.pornhub.com.evil.test/recommended', 'https://cdn.test/recommended', 'https://cn.pornhub.com/_xa/ads', 'http://cn.pornhub.com/recommended']) {
    result = run({ url: badUrl, headers: { 'X-PH-Widget-Auth': '1', Cookie: 'not-forwarded' } });
    assert.equal(result.headers.Cookie, undefined);
    assert.equal(result.headers['X-PH-Widget-Auth'], undefined);
}
const calls = [];
let logged = true;
let mobile = false;
let actorCount = 1;
const card = '<li class="pcVideoListItem"><a href="/view_video.php?viewkey=account123">Account Video</a></li>';
const c = { console, Widget: { http: { async get(target, options) {
    calls.push({ target, options });
    const signal = 'var isLoggedInUser = ' + Number(logged) + ';';
    if (target.includes('/users/')) return { data: signal + '<div class="profileContentLeft">' +
        Array.from({ length: actorCount }, (_, i) => '<a href="/model/example' + (i || '') + '"><img src="//img.test/actor.jpg" alt="Example"></a>').join('') +
        '<a href="https://evil.test/model/no">Wrong</a></div><div class="profileContentRight">' };
    if (mobile) {
        const wrapper = target.endsWith('/recommended') ? 'recommendedVideosContainer' : 'subscriptionsVideosWrapper mobile';
        return { data: signal + '<header><ul class="videoList">' + card.replace(/account123/g, 'navWrong') + '</ul></header>' +
            '<div class="' + wrapper + '"><div class="nested">Filters</div><ul class="videoList clearfix latestThumbDesign">' + card + '</ul></div>' };
    }
    return { data: signal + '<ul id="' + (target.endsWith('/recommended') ? 'recommendedListings' : 'subscriptionsVideosSection') + '">' + card + '</ul>' };
} } } };
vm.createContext(c);
vm.runInContext(fs.readFileSync('forward-pornhub.js', 'utf8'), c);
(async () => {
    const actors = await c.loadFavorites({ accountUsername: 'example' });
    assert.equal(actors.length, 1);
    assert.equal(actors[0].link, 'creator:model/example');
    assert.equal(actors[0].posterPath, 'https://img.test/actor.jpg');
    for (const name of ['loadFavoriteUpdates', 'loadRecommended']) {
        const videos = await c[name]({ page: 2 });
        assert.equal(videos[0].link, 'video:account123');
        assert.equal(calls[calls.length - 1].options.params.page, 2);
    }
    for (const call of calls) {
        assert.ok(call.target.startsWith('https://cn.pornhub.com/'));
        assert.equal(call.options.headers['X-PH-Widget-Auth'], '1');
        assert.equal(call.options.headers.Cookie, undefined);
        if (call.target.includes('/users/')) {
            assert.ok(call.options.headers['User-Agent'].includes('Windows NT'));
            assert.ok(!call.options.headers['User-Agent'].includes('iPhone'));
        } else {
            assert.ok(call.options.headers['User-Agent'].includes('iPhone'));
        }
    }
    mobile = true;
    for (const name of ['loadFavoriteUpdates', 'loadRecommended']) {
        const videos = await c[name]({ page: 2 });
        assert.equal(videos.length, 1);
        assert.equal(videos[0].link, 'video:account123');
        assert.equal(calls[calls.length - 1].options.params.page, 2);
    }
    for (const path of ['/subscriptions', '/recommended']) {
        assert.throws(() => c.accountContent('<main><ul class="videoList">' + card + '</ul></main>', false, path), /结构未识别/);
        assert.throws(() => c.accountContent('<div class="not-recommendedVideosContainer"><ul class="videoList">' + card + '</ul></div>', false, path), /结构未识别/);
    }
    assert.equal(c.accountContent('<div class="subscriptionsVideosWrapper mobile"><ul class="videoList"></ul></div>', false, '/subscriptions'), '<ul class="videoList"></ul>');
    assert.throws(() => c.accountContent('<div class="subscriptionsVideosWrapper mobile"><ul class="videoList">' + card + '</ul></div>', false, '/recommended'), /结构未识别/);
    assert.equal(c.WidgetMetadata.version, '1.2.5');
    const favoritesModule = c.WidgetMetadata.modules.find(module => module.id === 'loadFavorites');
    const sortParam = favoritesModule.params.find(param => param.name === 'sortOrder');
    assert.equal(sortParam.value, 'original');
    assert.equal(sortParam.enumOptions[1].value, 'random');
    assert.equal(favoritesModule.cacheDuration, 0);
    actorCount = 3;
    vm.runInContext('Math.random = () => 0;', c);
    const beforeSort = calls.length;
    const original = await c.loadFavorites({ accountUsername: 'example', page: 2 });
    const shuffled = await c.loadFavorites({ accountUsername: 'example', page: 2, sortOrder: 'random' });
    assert.deepEqual(Array.from(original, item => item.link), ['creator:model/example', 'creator:model/example1', 'creator:model/example2']);
    assert.deepEqual(Array.from(shuffled, item => item.link), ['creator:model/example1', 'creator:model/example2', 'creator:model/example']);
    assert.deepEqual(Array.from(shuffled, item => item.link).sort(), Array.from(original, item => item.link).sort());
    assert.equal(calls.length - beforeSort, 2, '随机排序不能额外抓取其他页');
    assert.equal(calls[calls.length - 1].options.params.page, 2);
    actorCount = 1;
    assert.equal((await c.loadFavorites({ sortOrder: 'random' })).length, 1);
    const publicHeaders = c.phHeaders();
    assert.ok(publicHeaders['User-Agent'].includes('iPhone'), '桌面请求不能污染其他请求头');
    const desktopRequest = calls.find(call => call.target.includes('/users/'));
    const injected = run({ url: desktopRequest.target, headers: desktopRequest.options.headers });
    assert.equal(injected.headers['User-Agent'], desktopRequest.options.headers['User-Agent']);
    assert.equal(injected.headers.Cookie, 'sessid=mock-a; ss=mock-b');
    assert.equal(injected.headers['X-PH-Widget-Auth'], undefined);
    const cacheStore = {};
    c.Widget.storage = { get: key => cacheStore[key], set: (key, value) => { cacheStore[key] = value; } };
    actorCount = 3;
    const cacheStart = calls.length;
    const cachedActors = await c.loadFavorites({ accountUsername: 'cached' });
    const randomized = await c.loadFavorites({ accountUsername: 'cached', sortOrder: 'random' });
    const cachedOriginal = await c.loadFavorites({ accountUsername: 'cached' });
    assert.equal(calls.length, cacheStart + 1);
    assert.deepEqual(Array.from(cachedOriginal, item => item.link), Array.from(cachedActors, item => item.link));
    assert.notDeepEqual(Array.from(randomized, item => item.link), Array.from(cachedOriginal, item => item.link));
    await c.loadFavorites({ accountUsername: 'cached', page: 2 });
    await c.loadFavorites({ accountUsername: 'another' });
    await c.loadFavorites({ accountUsername: 'cached', forceRefresh: 'refresh' });
    assert.equal(calls.length, cacheStart + 4);
    const actorKey = Object.keys(cacheStore).find(key => key.includes(':cached:actors:1'));
    const expired = JSON.parse(cacheStore[actorKey]);
    expired.savedAt = Date.now() - 7 * 60 * 60 * 1000;
    cacheStore[actorKey] = JSON.stringify(expired);
    await c.loadFavorites({ accountUsername: 'cached' });
    assert.equal(calls.length, cacheStart + 5);
    cacheStore[actorKey] = 'broken';
    await c.loadFavorites({ accountUsername: 'cached' });
    assert.equal(calls.length, cacheStart + 6);
    const updateStart = calls.length;
    await c.loadFavoriteUpdates({ accountUsername: 'cached' });
    await c.loadFavoriteUpdates({ accountUsername: 'cached' });
    assert.equal(calls.length, updateStart + 1);
    const updateKey = Object.keys(cacheStore).find(key => key.includes(':cached:updates:1'));
    const oldUpdate = JSON.parse(cacheStore[updateKey]);
    oldUpdate.savedAt = Date.now() - 6 * 60 * 1000;
    cacheStore[updateKey] = JSON.stringify(oldUpdate);
    await c.loadFavoriteUpdates({ accountUsername: 'cached' });
    assert.equal(calls.length, updateStart + 2);
    const recommendStart = calls.length;
    await c.loadRecommended({});
    await c.loadRecommended({});
    assert.equal(calls.length, recommendStart + 2, '推荐不能新增持久化缓存');
    assert.ok(Object.keys(cacheStore).every(key => !key.includes('recommended')));
    assert.ok(!JSON.stringify(cacheStore).includes('sessid='));
    assert.ok(!JSON.stringify(cacheStore).includes('videoUrl'));
    const savedBeforeFailure = JSON.stringify(cacheStore);
    logged = false;
    await assert.rejects(c.loadFavorites({ accountUsername: 'cached', forceRefresh: 'refresh' }), /登录状态/);
    assert.equal(JSON.stringify(cacheStore), savedBeforeFailure, '失败不能覆盖已缓存数据');
    // 模拟重新启动 JS 上下文，继续使用同一份持久化存储。
    const fresh = { console, Widget: c.Widget };
    vm.createContext(fresh);
    vm.runInContext(fs.readFileSync('forward-pornhub.js', 'utf8'), fresh);
    const restartCalls = calls.length;
    assert.equal((await fresh.loadFavorites({ accountUsername: 'cached' })).length, 3);
    assert.equal(calls.length, restartCalls);
    logged = false;
    await assert.rejects(c.loadRecommended({}), /登录状态/);
    await assert.rejects(c.loadFavorites({ accountUsername: '../bad' }), /用户名格式/);
    assert.throws(() => c.accountContent('<header>' + card + '</header>', false), /结构未识别/);
    console.log('Pornhub account bridge and list tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
