# Forward Emby 演员墙

ForwardWidget 模块：从 Emby 读取人物与媒体库，实现演员头像墙、演员搜索、演员作品海报墙及排序。

## 导入

在 Forward 的自定义 Widget 中导入：

```text
https://raw.githubusercontent.com/genanalucy/loon-ph/main/forward-emby-people-wall/emby-people-wall.js
```

首次打开“演员海报墙”后填写：

- **Emby 地址**：例如 `http://192.168.1.50:8096`
- **Emby API Key**：Emby 控制台 → 高级 → API 密钥，新建一个专用密钥
- **Emby User ID**：Emby 用户 ID

不要把填写了真实 API Key 的模块配置或截图公开分享。

## 功能

- 演员头像海报墙：按名称、最近加入或随机排序，支持分页；
- 搜索演员；
- 点击演员浏览本地作品；
- 演员作品按评分、上映年份、最近加入、最近观看、播放次数、片名或随机排序；
- 影片详情包含演员资料及 Emby 播放 URL。

## 测试

```bash
node forward-emby-people-wall/test-emby-people-wall.js
```
