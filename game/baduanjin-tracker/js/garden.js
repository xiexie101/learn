/**
 * 禅意花园渲染模块
 * 负责 SVG 渲染和动画
 */

class ZenGarden {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svgNS = "http://www.w3.org/2000/svg";
        this.width = 600;
        this.height = 300;
        this.initSVG();
    }

    initSVG() {
        // 清空容器
        const placeholder = this.container.querySelector('.garden-visual-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        // 创建SVG画布
        this.svg = document.createElementNS(this.svgNS, "svg");
        this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.svg.style.borderRadius = "12px";
        this.svg.style.background = "linear-gradient(to bottom, #E8F5E9, #FFF8E1)"; // 默认背景

        // 创建各个图层组
        this.layers = {
            background: this.createGroup("background"),
            ground: this.createGroup("ground"),
            water: this.createGroup("water"),
            plants: this.createGroup("plants"),
            objects: this.createGroup("objects"),
            foreground: this.createGroup("foreground"),
            effects: this.createGroup("effects")
        };

        this.container.insertBefore(this.svg, this.container.firstChild.nextSibling); // 插入到header之后
    }

    createGroup(id) {
        const g = document.createElementNS(this.svgNS, "g");
        g.setAttribute("id", id);
        this.svg.appendChild(g);
        return g;
    }

    // 根据等级渲染花园
    render(level) {
        this.clearLayers();

        // 基础地面 (所有等级都有)
        this.drawGround();

        // Lv.1: 荒芜石地 (石头)
        if (level >= 1) this.drawStones();

        // Lv.2: 青苔初现
        if (level >= 2) this.drawMoss();

        // Lv.3: 嫩草萌发
        if (level >= 3) this.drawGrass();

        // Lv.4: 清池涟漪
        if (level >= 4) this.drawPond();

        // Lv.5: 莲花绽放
        if (level >= 5) this.drawLotus();

        // Lv.6: 锦鲤游弋
        if (level >= 6) this.drawKoi();

        // Lv.7: 树木石灯
        if (level >= 7) this.drawTreeAndLantern();
    }

    clearLayers() {
        Object.values(this.layers).forEach(g => {
            while (g.firstChild) {
                g.removeChild(g.firstChild);
            }
        });
    }

    // --- 绘图方法 ---

    drawGround() {
        // 沙纹背景 (枯山水风格)
        // 简单模拟：画一些同心圆或波浪线
        const path = document.createElementNS(this.svgNS, "path");
        let d = "";
        for (let i = 0; i < 10; i++) {
            d += `M ${-50} ${200 + i * 20} Q ${300} ${250 + i * 20} ${650} ${200 + i * 20} `;
        }
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#D7CCC8"); // 浅褐色
        path.setAttribute("stroke-width", "2");
        path.setAttribute("opacity", "0.5");
        this.layers.ground.appendChild(path);
    }

    drawStones() {
        // 主石
        this.createShape("path", {
            d: "M 150 220 Q 180 180 220 210 T 250 230 L 130 240 Z",
            fill: "#757575",
            stroke: "#616161"
        }, this.layers.objects);

        // 副石
        this.createShape("ellipse", {
            cx: 400, cy: 240, rx: 40, ry: 25,
            fill: "#9E9E9E",
            stroke: "#757575"
        }, this.layers.objects);
    }

    drawMoss() {
        // 在石头上添加青苔
        this.createShape("path", {
            d: "M 160 210 Q 180 200 200 215",
            fill: "none",
            stroke: "#4CAF50",
            "stroke-width": "5",
            "stroke-linecap": "round"
        }, this.layers.objects);

        // 地面散落青苔
        for (let i = 0; i < 5; i++) {
            this.createShape("circle", {
                cx: 100 + Math.random() * 400,
                cy: 250 + Math.random() * 40,
                r: 3 + Math.random() * 5,
                fill: "#8BC34A",
                opacity: 0.8
            }, this.layers.ground);
        }
    }

    drawGrass() {
        // 绘制草丛
        const drawGrassClump = (x, y) => {
            const g = document.createElementNS(this.svgNS, "g");
            const path = document.createElementNS(this.svgNS, "path");
            path.setAttribute("d", `M ${x} ${y} q -5 -15 0 -20 M ${x} ${y} q 0 -18 5 -15 M ${x} ${y} q 5 -15 8 -18`);
            path.setAttribute("stroke", "#4CAF50");
            path.setAttribute("fill", "none");
            path.setAttribute("stroke-width", "2");
            g.appendChild(path);

            // 简单的摇曳动画
            const animate = document.createElementNS(this.svgNS, "animateTransform");
            animate.setAttribute("attributeName", "transform");
            animate.setAttribute("type", "skewX");
            animate.setAttribute("values", "-5;5;-5");
            animate.setAttribute("dur", `${2 + Math.random()}s`);
            animate.setAttribute("repeatCount", "indefinite");
            g.appendChild(animate);

            this.layers.plants.appendChild(g);
        };

        for (let i = 0; i < 15; i++) {
            drawGrassClump(50 + Math.random() * 500, 220 + Math.random() * 60);
        }
    }

    drawPond() {
        // 池塘形状
        const pond = this.createShape("path", {
            d: "M 350 220 Q 450 200 550 230 T 500 280 Q 400 300 320 260 Z",
            fill: "#81D4FA",
            stroke: "#4FC3F7",
            opacity: 0.8
        }, this.layers.water);

        // 水波动画
        const animate = document.createElementNS(this.svgNS, "animate");
        animate.setAttribute("attributeName", "opacity");
        animate.setAttribute("values", "0.7;0.9;0.7");
        animate.setAttribute("dur", "3s");
        animate.setAttribute("repeatCount", "indefinite");
        pond.appendChild(animate);
    }

    drawLotus() {
        // 荷叶
        this.createShape("circle", {
            cx: 450, cy: 240, r: 15,
            fill: "#66BB6A",
            stroke: "#43A047"
        }, this.layers.plants);

        // 莲花
        const lotus = this.createShape("path", {
            d: "M 450 240 q -5 -10 0 -15 q 5 5 0 15 M 450 240 q 5 -10 0 -15 q -5 5 0 15",
            fill: "#F48FB1",
            transform: "translate(0, -5)"
        }, this.layers.plants);
    }

    drawKoi() {
        // 锦鲤 (简化为一个橙色椭圆)
        const koiGroup = document.createElementNS(this.svgNS, "g");

        const body = document.createElementNS(this.svgNS, "ellipse");
        body.setAttribute("cx", "0");
        body.setAttribute("cy", "0");
        body.setAttribute("rx", "10");
        body.setAttribute("ry", "4");
        body.setAttribute("fill", "#FF5722");
        koiGroup.appendChild(body);

        // 游动动画
        const animateMotion = document.createElementNS(this.svgNS, "animateMotion");
        animateMotion.setAttribute("path", "M 400 250 C 450 230 500 270 450 260 S 350 270 400 250");
        animateMotion.setAttribute("dur", "10s");
        animateMotion.setAttribute("repeatCount", "indefinite");
        animateMotion.setAttribute("rotate", "auto");
        koiGroup.appendChild(animateMotion);

        this.layers.water.appendChild(koiGroup);
    }

    drawTreeAndLantern() {
        // 树干
        this.createShape("path", {
            d: "M 50 300 L 50 150 Q 50 100 20 80 M 50 150 Q 80 120 100 100",
            stroke: "#795548",
            "stroke-width": "10",
            fill: "none"
        }, this.layers.objects);

        // 树叶 (樱花)
        const drawLeaf = (x, y) => {
            this.createShape("circle", {
                cx: x, cy: y, r: 5,
                fill: "#F8BBD0",
                opacity: 0.8
            }, this.layers.plants);
        };

        for (let i = 0; i < 20; i++) {
            drawLeaf(20 + Math.random() * 80, 80 + Math.random() * 80);
        }

        // 石灯笼
        this.createShape("rect", {
            x: 520, y: 200, width: 20, height: 40,
            fill: "#9E9E9E"
        }, this.layers.objects);
        this.createShape("polygon", {
            points: "510,200 550,200 530,180",
            fill: "#757575"
        }, this.layers.objects);
    }

    // 辅助方法: 创建SVG元素
    createShape(type, attrs, parent) {
        const el = document.createElementNS(this.svgNS, type);
        for (const [key, value] of Object.entries(attrs)) {
            el.setAttribute(key, value);
        }
        if (parent) parent.appendChild(el);
        return el;
    }

    // 播放反馈动画
    playFeedbackAnimation() {
        // 简单的光晕闪烁
        const rect = document.createElementNS(this.svgNS, "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");
        rect.setAttribute("fill", "white");
        rect.setAttribute("opacity", "0");
        this.layers.effects.appendChild(rect);

        const animate = document.createElementNS(this.svgNS, "animate");
        animate.setAttribute("attributeName", "opacity");
        animate.setAttribute("values", "0;0.3;0");
        animate.setAttribute("dur", "0.5s");
        animate.setAttribute("fill", "freeze");
        rect.appendChild(animate);

        // 动画结束后移除
        setTimeout(() => rect.remove(), 500);
    }
}

window.ZenGarden = ZenGarden;
