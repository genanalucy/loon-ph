# loon-ph

一组用于 Loon 的网页播放器辅助插件：

- Pornhub → SenPlayer：提取最高画质 MP4 并调用 SenPlayer。
- DB Online → Forward：获取媒体库的最新播放地址并调用 Forward。

## 支持域名

- `www.pornhub.com`
- `cn.pornhub.com`

## 安装

在 Loon 中添加以下插件 URL：

```text
https://raw.githubusercontent.com/genanalucy/loon-ph/main/senplayer-pornhub.plugin
```

然后确认：

1. 已安装并信任 Loon CA 证书；
2. 已开启 HTTPS 解密；
3. 插件处于启用状态；
4. Safari 与 SenPlayer 访问 Pornhub/CDN 时使用同一个代理节点。

重新打开形如下面的视频详情页：

```text
https://www.pornhub.com/view_video.php?viewkey=...
https://cn.pornhub.com/view_video.php?viewkey=...
```

点击页面右下角的“SenPlayer 播放”。

## 工作方式

插件会从页面的 `flashvars_*.mediaDefinitions`、远程媒体定义接口和 `<video>` 元素中查找媒体地址，然后：

1. 过滤直接 MP4 地址；
2. 按清晰度选择最高画质；
3. 编码视频 URL、标题及当前 User-Agent；
4. 使用 `senplayer://x-callback-url/play?...&saveURL` 播放，并保存到 SenPlayer URL 列表/历史记录；
5. 在 SenPlayer 请求 CDN 时恢复 Safari 的 `User-Agent` 和 Pornhub `Referer`，避免播放器自带请求头触发 CDN 防盗链。

## 注意事项

- Pornhub 媒体地址通常包含有效期、签名和出口 IP；获取链接后不要切换代理节点。
- 保存到 SenPlayer 的历史条目仍使用临时签名地址；地址过期后需返回 Pornhub 页面重新取链。
- Pornhub 页面和 `*.phncdn.com` 建议使用相同代理策略。
- 网站页面结构变化后可能需要更新提取逻辑。
- 本项目不存储、代理或分发视频内容。

## 文件

- `senplayer-pornhub.plugin`：Loon 插件配置
- `senplayer-pornhub.js`：HTML 响应注入与 SenPlayer 跳转脚本
- `senplayer-pornhub-request.js`：SenPlayer MP4 CDN 请求头修正脚本

## Pornhub 账号内容与 Loon 登录桥接（1.2.5）

`1.2.5` 小修公共解析：列表封面优先从视频链接内图片按 `data-mediumthumb / data-image / data-poster / data-src / src` 提取，排除视频、内联数据和常见占位图；清晰度兼容数组与 `720p` 文本，多档 HLS 标记为自适应最高档位；页面请求识别明确验证页、空响应与 HTTP 错误。未改账号桥接、缓存 TTL、分集或取链流程。已有关注缓存中的图片需过期或强刷后更新。离线边界和回归测试通过，客户端图片及播放效果待确认。

`1.2.4` 仅为“我的关注”和“关注更新”增加 `Widget.storage` 持久化：分别缓存 6 小时和 5 分钟，按配置用户名、入口、页码隔离。随机排序读取副本后执行，不污染缓存原顺序。两个入口新增“缓存模式”，选择“每次强制刷新”绕过读取并更新缓存；恢复“优先缓存”后继续使用缓存。不新增推荐、演员分集或播放缓存。

缓存只含列表展示资料与条目 ID/link，不含 Cookie 或临时播放地址；头像 URL 不等于图片文件缓存。缓存可能在登录失效后继续显示到 TTL 到期；过期或强刷请求失败时正常报错，不覆盖旧缓存、不静默回退。缓存中有本地关注隐私，备份/导出时注意。用户名只是缓存隔离标签，不能验证 Loon Cookie 的实际账号；切换 Safari 账号时需同步修改用户名并强刷。无需改变 Loon 插件。命中、过期、强刷、账号/页隔离、随机副本和跨 JS 上下文复用已通过 mock；客户端持久化与速度提升待确认。

`1.2.3` 为“我的关注”新增“演员排序”：默认“原顺序”，可选“随机排序（当前页）”。仅打乱本次加载的演员卡片，不额外请求其他页面，不改变演员详情和播放逻辑。刷新重新加载时重新随机，随机结果可能与上次相同。离线测试覆盖顺序、元素完整性、单演员和请求数量；客户端排序选项显示仍待确认。

`1.2.2` 仅对 `/users/:username/subscriptions` 人物列表请求使用桌面 Chrome User-Agent，尝试获取电脑版人物布局；关注更新、个性化推荐与播放请求仍使用原 UA。保留 Loon 登录注入与登录检测，不改变 Cookie 存储。请求头隔离与桥接兼容性 mock 已通过，但桌面 UA 不保证站点一定返回 `profileContentLeft`；登录后人物页面结构和客户端列表仍待真机确认。

`1.2.1` 修复手机账号视频列表：分别限定在 `subscriptionsVideosWrapper` / `recommendedVideosContainer` 内解析 `ul.videoList`，保留电脑版列表 ID 支持。移除过于宽泛的 `main` 兜底，防止无关视频混入。手机/桌面 mock、导航隔离和公开真实手机 HTML 的容器提取已验证；真实页面样本未登录，仅证明解析结构，不证明账号内容或登录桥接可用。Loon 桥接脚本无改动。

安装 Loon 插件：

```text
https://raw.githubusercontent.com/genanalucy/loon-ph/main/pornhub-account-auth.plugin
```

开启 MITM 并信任 Loon CA 后，在 Safari 登录 `https://cn.pornhub.com`，再打开一次 `https://cn.pornhub.com/recommended` 或 `https://cn.pornhub.com/subscriptions`。插件只在指定账号页面的浏览器导航响应明确包含 `isLoggedInUser = 1` 时保存该请求的 Cookie。捕获包含当前请求所用凭据，不解析 Set-Cookie 或保证续期；网站更新 Cookie 后需再次访问指定页面才会捕获新值。

更新主 Widget `forward-pornhub.js` 到 1.2.0，填写全局参数“Pornhub 用户名”。新增/调整入口：

- 我的关注：读取 `/users/<用户名>/subscriptions`，替代固定演员列表，点击沿用最多 50 集作品集。
- 关注更新：读取 `/subscriptions` 视频列表。
- 个性化推荐：读取 `/recommended` 视频列表。
- 手动收藏（备用）：保留原先手工配置的人物，不依赖登录。

Widget 账号请求携带 `X-PH-Widget-Auth` 标记，Loon 为 `https://cn.pornhub.com` 的上述三个路径注入本地 Cookie 并删除标记。Widget 自身不保存凭据，不向视频/图片 CDN 注入 Cookie。登录检测失败时提示重新在 Safari 登录并访问账号页面，不返回游客内容。账号入口的客户端模块缓存设为 0。

**限制与安全**：Widget 网络必须经过 Loon，且允许 HTTPS 解密。Loon 的请求头数组/重复 Cookie 表示及浏览器 `Sec-Fetch-Dest` 特征需真机确认；首次安装可能需要关闭重开账号网页。脚本不输出 Cookie，不存入 Git，也不提供远程凭据服务。Loon 本地持久化存储不是安全钥匙串；备份/导出 Loon 数据前注意其中凭据。停用插件不会删除已保存 Cookie，需要清除 Loon 中 `ph.account.cookie.v1` 对应数据或撤销网站会话。网站真正撤销登录时仍需重新登录。

**验证状态**：来源限制、游客拒绝、标记去除、Cookie 合并、失败不覆盖、三个入口的 mock 已通过。公开网页已确认订阅人物需要权限，更新和推荐存在独立列表容器。登录后的订阅人物具体 HTML、Loon → Widget 注入链路、账号身份及客户端显示尚未实测；当前人物解析是兼容候选结构，不宣称三项账号功能已经可用。若提示“结构未识别”，需要登录后相应页面抓包（勿公开上传凭据）继续适配。

测试：`node test-pornhub-account.js`。

## 独立演员头像 Widget（实验）

导入 `https://raw.githubusercontent.com/genanalucy/loon-ph/main/forward-pornhub-actors.js`，在首页添加其“演员头像墙”，使用普通海报墙布局，而非内置热门人物组件。全局参数“演员主页”每行填一个 Pornhub 主页 URL。每位演员独立卡片，封面为主页头像，`link` 为对应主页 URL。

点击卡片通过 `loadDetail` 展示演员作品。此独立实验只验证头像和 URL 绑定，不提供作品播放解析；播放请继续使用原 Pornhub Widget。头像提取优先使用真实主页的 `img#getAvatar`，不使用任意首图冒充头像。头像无法读取时保留姓名和 URL。

测试：`node test-forward-pornhub-actors.js`。客户端海报显示及点击效果未验证。

## Pornhub Widget 演员作品路由

`forward-pornhub.js` 的 `1.1.3` 版本统一处理首页、收藏演员、收藏更新、演员作品墙及搜索入口的 `peopleId`。点击详情页创作者时，返回目标演员的作品，而不是原收藏列表或预选演员。

- 演员作品支持 `page` 翻页；随机排序仅作用于当前页。
- 非法演员 ID 返回空列表，不请求网站。
- 普通收藏演员和收藏更新仍为单页聚合，不重复加载第一页。
- 保留现有 `creator:` 标识，兼容已有条目；不改变播放资源解析。
- 本地 mock 已覆盖路由与翻页；rex 内演员点击和实播尚未验证。

### 单季最多 50 集（1.1.7）

恢复点击演员直接显示 `episodeItems`，不再显示季卡片或第二季。最多抓取 5 页，按视频 ID 去重后保留前 50 集；后续页失败时保留已有分集。兼容网页的 `li.pcVideoListItem` 与旧 `div.videoWrapper`，演员主页优先限定在作品列表中，避免混入导航推荐。旧 `ph-season:` 链接兼容到单季作品集。

已验证上限、去重、后续页失败回退，以及真实桌面演员网页的解析；客户端显示与实播仍需确认。

### 每 20 集分季（1.1.6，已撤回）

演员详情显示第 1 季卡片，点击后通过 `episodeItems` 显示最多 20 部影片。季详情底部的 `relatedItems` 提供上一季 / 下一季，下一季仅在抓取到更多影片后显示。每季集数从 1 重新编号，播放仍以影片原始 `video:` link 为准。

按打开的季按需抓取网页并去重，空页或无新增影片时停止；每次最多扫描 100 页，季号最多 100。为避免假定网站页大小，较后的季需要重新扫描前页定位。新片发布会改变分组。不是客户端原生季选择器；季卡片及分集原生显示待真机确认。

### 演员作为剧集（1.1.5，历史版本）

“收藏演员”中的每位演员作为 `mediaType: "tv"` 的作品集卡片，头像作为封面。打开演员详情后，以 `episodeItems` 返回主页解析到的影片，每部影片编号一集；每集保留原 `video:` link，通过现有 `loadResource` 动态获取播放地址。视频详情的相关推荐不受影响。

演员主页当前解析到的这一页构成分集列表，不代表已加载该演员全部影片；需要浏览更多页时使用“演员作品墙”。头像优先取真实主页头像，不再用任意首图充当演员照片。分集结构、不同分集的资源 ID 传递和回归测试已覆盖，客户端原生分集布局与实播仍需真机确认。

### 热门人物（实验，1.1.4）

新增 `loadPopularPeople` 列表模块。将它添加到客户端首页，打开“热门人物（收藏演员）”卡片后，通过详情页 `peoples` 人物栏展示全局参数中的收藏演员，点击人物进入作品列表。保留原有收藏演员模块。

这是基于官方详情页人物机制的实验，不是向首页内置“热门人物”写入数据；官方文档未公开后者的自定义接口。姓名和图片复用现有创作者页面解析，无法读取时姓名回退为路径名称，图片可能为空。列表 → 人物详情 → 演员作品的 mock 已验证，rex 原生布局、头像和点击效果需真机确认。

验证命令：`node test-forward-pornhub.js`。

## DB Online → Forward

在 Loon 中添加：

```text
https://raw.githubusercontent.com/genanalucy/loon-ph/main/db-online-forward/forward-db-online.plugin
```

然后通过 Safari 打开：

```text
http://10.10.10.7:9091/video/MIDA-814?video_id=DRX1yM
```

首次使用：

1. 点击右下角“首次安装组件”，在 Forward 中安装 `DB Online` 和“迅雷看看 字幕”；
2. 返回 Safari 影片页，点击“Forward 搜索 MIDA-814”；
3. 在 Forward 搜索结果中打开 DB Online 条目并播放；
4. 在播放器字幕菜单中选择“迅雷看看 字幕”的搜索结果。

DB Online Widget 会把番号放在标题开头，例如 `MIDA-814 标题`，让字幕 Widget 能提取番号；真正播放时才请求 `/api/library/stream/:code`，避免使用过期地址。

也可以直接导入组件清单：

```text
forward://widget?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgenanalucy%2Floon-ph%2Fmain%2Fdb-online-forward%2Fdb-online-forward.fwd
```

> Loon 插件及 Widget 默认 DB Online 地址为 `10.10.10.7:9091`；服务地址变化时需同步修改配置。Forward 是否从 `forward://search` 自动展示 Widget 搜索结果取决于客户端版本；若未显示，请在 Forward 的 DB Online Widget 内搜索番号。

## 文件

- `senplayer-pornhub.plugin` / `senplayer-pornhub.js`：Pornhub 页面注入
- `senplayer-pornhub-request.js`：Pornhub CDN 请求头修正
- `db-online-forward/forward-db-online.plugin` / `forward-db-online.js`：DB Online 的 Forward 安装和搜索按钮
- `db-online-forward/forward-db-online-widget.js`：DB Online 搜索、详情和动态播放资源 Widget
- `db-online-forward/xunlei-subtitle.js`：用户提供的迅雷字幕 Widget
- `db-online-forward/db-online-forward.fwd`：两个 Widget 的一键安装清单
- `test-forward-pornhub.js` / `db-online-forward/test-*.js`：测试

## License

MIT
