const fs = require("fs");
const vm = require("vm");

const script = fs.readFileSync("forward-db-online.js", "utf8");

function run(body, headers = { "Content-Type": "text/html; charset=utf-8", "Content-Length": "10" }) {
    let result;
    vm.runInNewContext(script, {
        $response: { status: 200, headers, body },
        $done(value) { result = value; }
    });
    return result;
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const injected = run("<!doctype html><html><body><div id=\"app\"></div></body></html>");
assert(injected.response.body.includes("forward-db-online-toggle"), "应注入播放按钮");
assert(injected.response.body.includes('data-mode="title"'), "应包含 title 测试");
assert(injected.response.body.includes('data-mode="name"'), "应包含 name 测试");
assert(injected.response.body.includes('data-mode="filename"'), "应包含 filename 测试");
assert(injected.response.body.includes('data-mode="fileName"'), "应包含 fileName 测试");
assert(injected.response.body.includes('data-mode="displayName"'), "应包含 displayName 测试");
assert(injected.response.body.includes('data-mode="mediaTitle"'), "应包含 mediaTitle 测试");
assert(injected.response.body.includes('data-mode="videoTitle"'), "应包含 videoTitle 测试");
assert(injected.response.body.includes('data-mode="label"'), "应包含 label 测试");
assert(injected.response.body.includes('data-mode="fragment"'), "应包含 fragment 测试");
assert(!Object.keys(injected.response.headers).some(key => key.toLowerCase() === "content-length"), "应删除 Content-Length");

const duplicate = run(injected.response.body, injected.response.headers);
assert(!duplicate.response, "已注入页面不应重复修改");

const json = run('{"success":true}', { "Content-Type": "application/json" });
assert(!json.response, "非 HTML 响应不应修改");

console.log("forward-db-online tests passed");
