# 🎟️ Dance Tour Pass · 夜校嘻哈导师巡演票夹 (Teachers' Day VIP Pass)

> **专为夜校嘻哈舞（Hip-Hop）老师定制的仪式感教师节互动祝福网页**  
> 运行环境：微信内置浏览器 (WeChat H5) & 现代移动端全兼容 / PC 响应式适配

---

## 🌟 核心设计理念

将师生的学舞历程包装为一场**「专属地下街舞专场巡演（VIP PASS）」**：
1. **开场点火**：老式街头卡带机【DROP THE BEAT】，规避微信移动端音频自动播放受限，点击瞬间触发 DJ 搓碟擦片音效与 808 震动；
2. **三联拟物票根系统**：
   - 🎟️ **票根①【排练档案票】**：绝密档案印章、复古 VHS 滤镜切换、从顺拐到卡点的爆笑日常回忆；
   - 🎟️ **票根②【齐舞主秀票】**：期末大秀舞台、屏幕任意点按连击喷射发光街头俚语弹幕（`RESPECT`、`SWAG`、`SHEESH`、`太顶了`）与 Combo 计次；
   - 🎟️ **票根③【学员告白票】**：拟真锯齿撕票动效 + 808 轰鸣震动重锤落下【STAMPED · RESPECT】印章，缓缓展开拍立得合照与全班学员手写风祝福墙；
3. **压轴彩蛋**：全屏金色彩带雨，唤起 Canvas 潮流街舞杂志封面海报生成器（双模自由切换：MVP 导师封面 / 齐舞厂牌大合照封面），手机端**长按一键保存到本地相册**。

---

## 🛠️ 技术亮点

- **零外部重型框架**：纯原生 HTML5 + CSS3 + Vanilla JavaScript，秒级极速打开；
- **纯原生 Web Audio API 声学算法合成**：
  - DJ 搓碟擦片声 (`playScratch`)
  - 拟真纸张纤维撕裂声 (`playTear`)
  - 808 重低音重锤印章冲击声 (`playStamp`)
  - 连击打 Call 清脆打击节奏声 (`playTap`)
  - 程序化 Boom-Bap 律动合成器（无需外部 MP3 也能实时合成 4/4 拍经典 Hip-Hop Beat 律动）；
- **配置驱动架构 (Config-Driven)**：文案、导师称呼、班级名称、视频、合照、祝福语均在 `config.js` 中解耦管理；
- **自愈兜底机制 (Graceful Fallback)**：内置高保真街舞矢量图与 Canvas 动态舞房排练仿真动效，未上传本地媒体文件前亦能完美体验全部交互。

---

## 📁 项目结构

```
webapp/dance-tour-pass/
├── index.html       # 移动端/微信 H5 页面结构与三联票夹容器
├── styles.css       # 暗黑机能风、镭射防伪光泽、打孔锯齿边缘与动画样式
├── config.js        # 解耦配置文件（导师信息、音视频素材、学员留言）
├── app.js           # 状态机、Web Audio 引擎、打 Call 粒子、撕票盖章与 Canvas 杂志封面生成
└── README.md        # 项目说明文档
```

---

## 🎨 素材替换指引 (`config.js`)

打开 `config.js`，修改 `window.TOUR_CONFIG` 对象即可一键换装：
- `teacherName`: 老师艺名/称呼（如 `"K-Rock"`）
- `className`: 班级名称（如 `"夜校嘻哈舞进阶一期"`）
- `date`: 演出/教师节日期（如 `"2026.09.10"`）
- `rehearsalVideo.src`: 排练视频文件路径（如 `"./assets/video/rehearsal.mp4"`）
- `mainShowVideo.src`: 齐舞主秀视频文件路径（如 `"./assets/video/main_show.mp4"`）
- `groupPhoto`: 班级大合照图片（如 `"./assets/images/group.jpg"`）
- `teacherPhoto`: 导师帅照（如 `"./assets/images/teacher.jpg"`）
- `wishes`: 学员个性化祝福留言列表
