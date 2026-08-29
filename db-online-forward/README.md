# DB Online → Forward + 迅雷字幕

在 DB Online 影片页添加 Forward 搜索入口，通过 Forward Widget 动态获取媒体库播放地址，并使用迅雷字幕 Widget 按番号搜索字幕。

## 安装

### 1. Loon 插件

```text
https://raw.githubusercontent.com/genanalucy/loon-ph/main/db-online-forward/forward-db-online.plugin
```

### 2. Forward Widgets

可在 DB Online 页面点击“首次安装组件”，或直接打开：

```text
forward://widget?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgenanalucy%2Floon-ph%2Fmain%2Fdb-online-forward%2Fdb-online-forward.fwd
```

安装以下两个 Widget：

- `DB Online`
- `迅雷看看 字幕`

## 使用

1. Safari 打开 DB Online 影片详情页；
2. 点击右下角“Forward 搜索 番号”；
3. 在 Forward 搜索结果中打开 DB Online 条目；
4. 播放后在字幕菜单中选择迅雷字幕。

如果全局搜索未展示 Widget 结果，请进入 Forward 的 DB Online Widget，手动搜索番号。

## 默认服务地址

```text
http://10.10.10.7:9091
```

如地址变化，需要修改 Loon 插件匹配规则和 DB Online Widget 参数。
