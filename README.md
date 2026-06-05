# 高中物理合格考卡片

这是一个可部署到 GitHub Pages 的手机卡片 PWA。

## 使用

部署后访问仓库 Pages 地址即可进入应用：

```text
https://你的用户名.github.io/你的仓库名/
```

iPhone Safari 打开后，点击分享按钮，选择“添加到主屏幕”。

## 内容

- 读题卡：161 张
- 知识唤醒卡：50 张
- 知识关联卡：14 张

## GitHub Pages 设置

1. 新建 GitHub 仓库。
2. 上传本目录 `github-pages` 里的全部内容到仓库根目录。
3. 进入仓库 `Settings` → `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 保存后等待 GitHub Pages 生成访问地址。

## 注意

- A/B/C 记录保存在当前浏览器本地。
- 连续三次 A 后自动退出唤醒队列。
- 如果更新卡片内容，需要重新上传 `app/data.js`。
