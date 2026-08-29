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

## DB Online → Forward

在 Loon 中添加：

```text
https://raw.githubusercontent.com/genanalucy/loon-ph/main/forward-db-online.plugin
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
forward://widget?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgenanalucy%2Floon-ph%2Fmain%2Fdb-online-forward.fwd
```

> Loon 插件及 Widget 默认 DB Online 地址为 `10.10.10.7:9091`；服务地址变化时需同步修改配置。Forward 是否从 `forward://search` 自动展示 Widget 搜索结果取决于客户端版本；若未显示，请在 Forward 的 DB Online Widget 内搜索番号。

## 文件

- `senplayer-pornhub.plugin` / `senplayer-pornhub.js`：Pornhub 页面注入
- `senplayer-pornhub-request.js`：Pornhub CDN 请求头修正
- `forward-db-online.plugin` / `forward-db-online.js`：DB Online 的 Forward 安装和搜索按钮
- `forward-db-online-widget.js`：DB Online 搜索、详情和动态播放资源 Widget
- `xunlei-subtitle.js`：用户提供的迅雷字幕 Widget
- `db-online-forward.fwd`：两个 Widget 的一键安装清单
- `test-forward-pornhub.js` / `test-forward-db-online.js` / `test-forward-db-online-widget.js`：测试

## License

MIT
