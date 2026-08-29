const fs = require("fs");
const vm = require("vm");

const script = fs.readFileSync("db-online-forward/forward-db-online.js", "utf8");

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
assert(injected.response.body.includes("forward-db-online-play"), "应注入搜索按钮");
assert(injected.response.body.includes("forward://search?q="), "应通过番号打开 Forward 搜索");
assert(injected.response.body.includes("forward://widget?url="), "应提供 Forward 组件安装入口");
assert(injected.response.body.includes("db-online-forward/db-online-forward.fwd"), "应安装 DB Online 与字幕组件清单");
assert(!Object.keys(injected.response.headers).some(key => key.toLowerCase() === "content-length"), "应删除 Content-Length");

const duplicate = run(injected.response.body, injected.response.headers);
assert(!duplicate.response, "已注入页面不应重复修改");

const json = run('{"success":true}', { "Content-Type": "application/json" });
assert(!json.response, "非 HTML 响应不应修改");

console.log("forward-db-online tests passed");
