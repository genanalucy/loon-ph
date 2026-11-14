const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const calls = [];
const html = `<img src="https://img.test/wrong.jpg"><h1>Test Actor</h1>
<img src="//img.test/avatar.jpg" id="getAvatar">
<div class="videoWrapper"><a href="/view_video.php?viewkey=abc123">Video</a>
<a class="thumbnailTitle" href="/view_video.php?viewkey=abc123">Test Work</a><img src="/work.jpg"></div>`;
const context = { console, Widget: { http: { async get(url, options) {
    calls.push({ url, options }); return { data: html };
} } } };
vm.createContext(context);
vm.runInContext(fs.readFileSync('forward-pornhub-actors.js', 'utf8'), context);
(async () => {
    const items = await context.loadActors({ creators: '/model/test\nhttps://www.pornhub.com/model/test\nhttps://evil.test/model/bad' });
    assert.equal(items.length, 1);
    assert.equal(items[0].title, 'Test Actor');
    assert.equal(items[0].posterPath, 'https://img.test/avatar.jpg');
    assert.equal(items[0].coverUrl, items[0].posterPath);
    assert.equal(items[0].link, 'https://www.pornhub.com/model/test');
    const detail = await context.loadDetail(items[0].link);
    assert.equal(detail.relatedItems[0].link, 'https://www.pornhub.com/view_video.php?viewkey=abc123');
    assert.equal(detail.relatedItems[0].title, 'Test Work');
    assert.equal(context.actorPortrait('<img src="https://img.test/video.jpg">'), '');
    assert.equal(context.actorPortrait('<meta content="/og.jpg" property="og:image">'), 'https://www.pornhub.com/og.jpg');
    for (const value of ['https://pornhub.com.evil.test/model/test', 'https://evil.test/?u=https://www.pornhub.com/model/test', '/model/../test', 'person:123']) {
        const count = calls.length;
        assert.equal(await context.loadDetail(value), null);
        assert.equal((await context.loadActors({ peopleId: value })).length, 0);
        assert.equal(calls.length, count);
    }
    const works = await context.loadActors({ peopleId: '/model/test', page: 2 });
    assert.equal(works.length, 1);
    assert.equal(calls[calls.length - 1].options.params.page, 2);
    assert.equal((await context.loadActors({ page: 2 })).length, 0);
    console.log('Pornhub actor avatar tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
