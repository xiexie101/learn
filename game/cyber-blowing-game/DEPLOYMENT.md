# 赛博吹气游戏 - 部署指南

## 📦 部署到 GitHub Pages

### 前置要求
- GitHub 账号
- Git 已安装

### 步骤

#### 1. 创建 GitHub 仓库
```bash
# 在项目目录下初始化 Git（如果还没有）
cd /Users/xieshijin/jin/learn/ai/cyber-blowing-game
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Cyber Blowing Game"
```

#### 2. 推送到 GitHub
```bash
# 在 GitHub 上创建新仓库后，关联远程仓库
git remote add origin https://github.com/你的用户名/cyber-blowing-game.git

# 推送代码
git branch -M main
git push -u origin main
```

#### 3. 启用 GitHub Pages
1. 进入仓库的 **Settings** 页面
2. 在左侧菜单找到 **Pages**
3. 在 **Source** 下选择 `main` 分支
4. 点击 **Save**
5. 等待几分钟，你的游戏就会部署到：
   ```
   https://你的用户名.github.io/cyber-blowing-game/landing.html
   ```

---

## 🚀 部署到 Vercel（推荐）

### 优势
- 自动部署
- 更快的全球 CDN
- 自定义域名支持

### 步骤

#### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2. 部署
```bash
cd /Users/xieshijin/jin/learn/ai/cyber-blowing-game
vercel
```

#### 3. 按照提示操作
- 登录 Vercel 账号
- 选择项目设置
- 确认部署

部署完成后，Vercel 会提供一个 URL，例如：
```
https://cyber-blowing-game.vercel.app
```

---

## 🌐 部署到 Netlify

### 方法 1: 拖拽部署（最简单）

1. 访问 [Netlify Drop](https://app.netlify.com/drop)
2. 将整个 `cyber-blowing-game` 文件夹拖拽到页面
3. 等待上传完成
4. 获得部署链接

### 方法 2: CLI 部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
cd /Users/xieshijin/jin/learn/ai/cyber-blowing-game
netlify deploy --prod
```

---

## 📱 生成分享链接

部署完成后：

1. **访问落地页**：`你的域名/landing.html`
2. **直接游戏链接**：`你的域名/index.html`
3. **二维码生成器**：`你的域名/qrcode.html`

### 分享示例

```
🎮 快来玩我做的赛博吹气游戏！

用你的呼吸创造魔法 ✨
支持4种游戏模式：
🕯️ 吹灭蜡烛
🫧 吹泡泡
🎡 吹风车
🌼 吹蒲公英

👉 点击链接开始游戏：
https://你的域名/landing.html

📱 手机扫码即玩：
https://你的域名/qrcode.html
```

---

## 🔧 本地测试

在部署前，建议先本地测试：

```bash
# 使用 Python 启动简单服务器
cd /Users/xieshijin/jin/learn/ai/cyber-blowing-game

# Python 3
python3 -m http.server 8000

# 或使用 Node.js (需要先安装 http-server)
npx http-server -p 8000
```

然后访问：
- 落地页：http://localhost:8000/landing.html
- 游戏：http://localhost:8000/index.html
- 二维码：http://localhost:8000/qrcode.html

---

## ⚠️ 注意事项

### 麦克风权限
- **HTTPS 必需**：浏览器要求麦克风访问必须在 HTTPS 环境下
- GitHub Pages、Vercel、Netlify 都自动提供 HTTPS
- 本地测试时使用 `localhost` 也可以

### 浏览器兼容性
- 推荐使用 Chrome、Edge、Safari 最新版本
- Firefox 也支持，但可能需要额外权限设置
- 移动端推荐使用 Safari (iOS) 或 Chrome (Android)

### 性能优化
- 确保在 WiFi 环境下游玩
- 关闭其他占用麦克风的应用
- 使用耳机可以避免扬声器反馈

---

## 🎯 快速部署命令（推荐）

如果你已经有 GitHub 账号，最快的方式：

```bash
# 1. 初始化并推送到 GitHub
cd /Users/xieshijin/jin/learn/ai/cyber-blowing-game
git init
git add .
git commit -m "🎮 Cyber Blowing Game"
git branch -M main
git remote add origin https://github.com/你的用户名/cyber-blowing-game.git
git push -u origin main

# 2. 然后在 GitHub 网站上启用 Pages
# Settings → Pages → Source: main → Save
```

完成！🎉
