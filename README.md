# loon-ph

一个用于 Loon 的 Pornhub → SenPlayer 辅助插件。

它会在 Pornhub 视频详情页右下角添加“SenPlayer 播放”按钮，提取可用的最高画质 MP4，并通过 SenPlayer URL Scheme 打开。

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
4. 打开 `senplayer://x-callback-url/play`。

## 注意事项

- Pornhub 媒体地址通常包含有效期、签名和出口 IP；获取链接后不要切换代理节点。
- Pornhub 页面和 `*.phncdn.com` 建议使用相同代理策略。
- 网站页面结构变化后可能需要更新提取逻辑。
- 本项目不存储、代理或分发视频内容。

## 文件

- `senplayer-pornhub.plugin`：Loon 插件配置
- `senplayer-pornhub.js`：HTML 响应注入与 SenPlayer 跳转脚本

## License

MIT
