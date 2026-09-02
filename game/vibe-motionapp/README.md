# Vibe Motion App

这是一个基于 [Remotion](https://www.remotion.dev/) 与 Vite 的短视频动画渲染项目。支持在 Web 端预览参数化的动画，并可通过 Remotion Studio 导出视频。

## 最新重构：参数化 Rolling Text 动画
将原本基于 GSAP + SplitText 插件的 3D 文字滚轮效果，完全使用 **纯 Remotion / React (帧动画驱动)** 进行了重构。这使得动画无需依赖外部商业脚本即可完美运行，并且能精确同步到视频帧率以便于高质量导出。

### 核心改动点
1. **替换了默认的 Scaffold Demo 场景**：
   - 目标文件：`shared/features/demoMotion/scenes/DemoMotionScene.jsx`
   - 将原先静态卡片动画替换为了动态的 3D 滚动文本（Rolling Text）。
   - **Remotion 帧驱动逻辑化**：废弃了 GSAP 基于时间的动画 `gsap.timeline()`，转而使用传入的 `frame` 以及 Remotion 的 `interpolate` 函数，把字符翻转的时间线精准映射为 `(frame % tlDurationFrames)`，保证了循环滚动和无缝衔接。
   - 实现了 3D 文字的景深（`perspective: "700px"`）、交错效果（Staggering），且背景严格设为透明 (`backgroundColor: "transparent"`) 以支持透明通道视频（如 ProRes 4444）的导出。

2. **参数面板 (Control Panel) 定制**：
   - 目标文件：`shared/features/demoMotion/config/demoMotionDefaults.js` 和 `shared/features/demoMotion/plugins/demoMotionPlugin.js`
   - 删除了与原 Demo 相关的无关参数（如 badgeText, cardTiltMax 等）。
   - 引入了适配 Rolling Text 的专属控制参数：
     - `text`: 动态修改文字内容。
     - `speed`: 缩放时间轴速度，控制字符翻转的快慢。
     - `linesCount`: 控制循环渲染行数，使得视觉上看起来像个 3D 滚筒。
     - `fontSize`: 控制文字占比。
     - `accentHue` & `darkMode`: 灵活改变文本的主题色和 3D 阴影。
   - 更新了 `demoMotionSceneBuilder.js` 中关于 Context 和 Props 的解析逻辑，以透传这些新参数。

### 注意点与避坑指南 (Gotchas)
- **避免双轨渲染上下文冲突**：
  在早期的实现中，如果在 `DemoMotionScene` 内直接使用 `useCurrentFrame()` 和 `useVideoConfig()`，会在 Vite 的 Web 预览模式 (`localhost:5173`) 触发报错：`useCurrentFrame() can only be called inside a component that was registered as a composition.`。
  **解决方案**：不要在 Scene 层级直接调用 Remotion hooks，而是由其外层的 Composition（或 Web 预览的 Scaffold 包装器）将 `frame` 和 `layout` 作为普通的 React `Props` 传入组件。这保证了代码在 Remotion Studio 环境和普通 Web 页面渲染环境间的完全复用。

- **透明背景视频导出**：
  如果需要渲染包含 Alpha 通道的视频（透明背景），请确保最外层容器 `style` 没有被 CSS 覆盖，或者设置了 `backgroundColor: "transparent"`。在导出时，需要配合指定的编码格式（例如 `--codec=prores`）来实现。

---

## 🚀 新动画添加标准流程 (Standard Workflow)

### 1. 动画引擎的“去外部化” (Remotion-Native Conversion)
*   **原则**：不要直接在 Remotion 中嵌入外部 HTML/JS（如 GSAP 库或 Codepen 脚本）。
*   **做法**：将基于时间的动画（Time-based，如 GSAP timeline）转化为基于帧的动画（Frame-based）。
*   **核心工具**：利用 Remotion 的 `useCurrentFrame`（或直接接收 `frame` prop）配合 `interpolate` 函数。
    *   *GSAP 逻辑*：`tl.to(target, { rotation: 90, duration: 1 })`
    *   *Remotion 逻辑*：`const rotation = interpolate(frame, [0, fps], [0, 90])`

### 2. 实现“双轨兼容”架构 (Hybrid Rendering Architecture)
这是确保代码能同时在两个环境跑通的关键：
*   **环境 A：Remotion Studio**（导出视频用）。
*   **环境 B：Vite Web Preview**（`localhost:5173` 预览及交互用）。
*   **避坑指南**：**不要在 UI 组件（Scene）内部调用 `useCurrentFrame()`**。因为在 Vite 环境下，该 Hook 找不到 Composition 上下文会直接报错崩溃。
*   **解决方案**：由外层的 Scaffold（脚手架）组件负责获取 `frame`，并作为普通的 `Props` 传递给 Scene 组件。

### 3. 参数化配置 (Parametrization)
为了让左侧控制面板生效，需要修改三个核心配置文件：
1.  **`demoMotionDefaults.js`**：
    *   定义字段的 ID、默认值（`DEFAULT_DEMO_MOTION_ANIMATION_PARAMS`）。
    *   定义控制面板的 UI 控件（`DEMO_MOTION_PARAM_FIELDS`，如 `switch`, `range`, `select`）。
    *   编写 `normalize` 逻辑，确保输入值合法。
2.  **`demoMotionSceneBuilder.js`**：
    *   在 `resolveDemoMotionSceneContext` 中解构并透传这些新字段，使它们进入 React 组件的 Props。
3.  **`DemoMotionScene.jsx`**：
    *   接收这些 Props，并将它们绑定到内联样式（Style）或动画计算公式中（如 `accentHue` 绑定到颜色计算）。

---

## ⚠️ 核心注意点 (Critical Checkpoints)

### 1. 透明背景 (Alpha Channel)
*   **UI 层**：根 div 必须显式设置 `backgroundColor: "transparent"`。
*   **渲染层**：导出命令必须指定支持透明通道的编码器。**ProRes 4444** 是行业标准，渲染命令应包含 `codec=prores`。

### 2. 动画循环与 Stagger (交错动画)
*   在 Rolling Text 等无限循环动画中，必须计算总时长 `tlDurationFrames`。
*   使用取模运算 `currentFrame % tlDurationFrames` 来实现无缝循环。
*   Stagger 效果通过给每个对象分配一个 `startTime`（如基于 `index * delay`）来偏移其 `interpolate` 的起跳点。

### 3. 分辨率自适应 (Layout Fluidity)
*   不要写死 `px` 单位。推荐使用 `vw` (Viewport Width) 或根据传入的 `layout.videoWidth` 进行比例缩放（如 `fontSize = 18 * (width / 1080)`），确保同一套动画在 720p、1080p 下比例一致。
