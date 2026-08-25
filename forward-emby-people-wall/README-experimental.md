# 实验：影片详情的原生演员入口

模块文件：`emby-library-people.js`

该模块不使用独立演员详情页。它先显示本地影片；影片详情会返回 `peoples`，让 Forward 使用原生“团队/演员”卡片展示。点击人物时，按 ForwardWidget 的 `peopleId` 约定重新调用列表模块；模块从本地媒体库的 `People` 字段筛选该演员作品，避免 Emby `PersonIds` 查询在 Forward 中返回 500 的问题。

## 导入

```text
https://raw.githubusercontent.com/genanalucy/loon-ph/main/forward-emby-people-wall/emby-library-people.js
```

首次打开“本地影片”时填写 Emby 地址、API Key 和 User ID。

## 状态

这是针对 Forward 原生人物点击回调的兼容性尝试。基础 API 返回和 `peopleId` 筛选逻辑已本地模拟验证；是否能接收到你当前 Forward 版本的 `peopleId`，需要在手机实际点一次影片详情里的“团队”人物卡片确认。
