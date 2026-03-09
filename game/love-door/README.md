# LoveDoor (表白开门迷宫游戏)

基于原版 Cocos Creator 3.8.2 的高精度镜像本地版本，100% 还原。

## 🎮 玩法指引

### 第 1 步：生成专属链接
1. 在本地启动一个 HTTP 服务器。例如：
   ```bash
   python3 -m http.server 8080
   ```
2. 浏览器内访问首页：[http://localhost:8080/index.html](http://localhost:8080/index.html)
3. 在页面内输入你想表白对象的**名字缩写**（例如 `mxz`）。
4. 点击“生成表白链接”并复制得到的专属 url。

### 第 2 步：分享与游玩
1. 将刚才生成的链接（如 `http://localhost:8080/game/index.html?name=mxz`）通过手机发送给对方。
2. 对方打开后：
   - 会先看到闪屏和基础交互教程。
   - 使用屏幕右下方的“虚拟摇杆”移动小人。
   - 触碰并拾取**金色的钥匙🔑**。
   - 在上方的**沙漏⏳倒计时**结束前走到终点的门🚪。
   - 共通过三关之后，系统将全屏放大，小人头顶冒出气泡喊出 `name` 设计好的名字。
   - 最后伴随流畅特效进行 `I ❤ U` 的粉笔字表白绘制。

## ⏱️ 高级配置：如何调整过关的沙漏时间？

目前游戏内置了 3 个关卡，为了营造紧迫感，默认的过关时间较短。如果您觉得太难，想调整过关时间，请按以下步骤直接修改底层引擎代码：

1. 使用代码编辑器（如 VS Code）打开 `game/assets/main/index.js`。
2. 在该文件中全局搜索 `level1Time` 或 `level2Time` 或 `level3Time`。
3. 您会看到类似下面这行被编译和压缩的代码片段：
   ```javascript
   Q=t(V.prototype,"level1Time",[x],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return 3}})
   ...
   Y=t(V.prototype,"level2Time",[K],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return 9}})
   ...
   Z=t(V.prototype,"level3Time",[F],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return 5}})
   ```
4. 将其中对应关卡尾部的 `return 3`、`return 9`、`return 5` 的**数字修改为您想要的秒数**。
5. **保存文件，清空浏览器缓存后重新进入游戏**，即可生效！

*(注：原版代码由于经 Web Mobile 模式打包过，为了保证引擎逻辑稳定，强烈建议仅修改上面指出的 `return` 后的纯数值。)*
