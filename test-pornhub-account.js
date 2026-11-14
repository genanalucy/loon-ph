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
const card = '<li class="pcVideoListItem"><a href="/view_video.php?viewkey=account123">Account Video</a></li>';
const c = { console, Widget: { http: { async get(target, options) {
    calls.push({ target, options });
    const signal = 'var isLoggedInUser = ' + Number(logged) + ';';
    if (target.includes('/users/')) return { data: signal + '<div class="profileContentLeft"><a href="/model/example"><img src="//img.test/actor.jpg" alt="Example"></a><a href="https://evil.test/model/no">Wrong</a></div><div class="profileContentRight">' };
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
    }
    logged = false;
    await assert.rejects(c.loadRecommended({}), /登录状态/);
    await assert.rejects(c.loadFavorites({ accountUsername: '../bad' }), /用户名格式/);
    assert.throws(() => c.accountContent('<header>' + card + '</header>', false), /结构未识别/);
    console.log('Pornhub account bridge and list tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
