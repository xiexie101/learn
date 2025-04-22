// 定义所有图片的数据
const drawingData = {
    cat: {
        title: "可爱的小猫咪",
        image: "./images/cat.jpg",
        steps: [
            "第一步：画一个圆形作为小猫的头部",
            "第二步：在圆形的上方画两个小三角形作为耳朵",
            "第三步：用一个比头部稍大的椭圆形画身体",
            "第四步：在头部圆形的下方画两个小圆形或椭圆形作为眼睛",
            "第五步：用一个小三角形画鼻子",
            "第六步：画一条短的弧线作为嘴巴",
            "第七步：用一条弯曲的细长椭圆形画尾巴",
            "第八步：用四个短短的细长方形画腿"
        ]
    },
    bear: {
    "title": "可爱的小熊",
    "image": "./images/熊.jpg",
    "steps": [
      "第一步：头部: 用一个较大的圆形。",
      "第二步：耳朵: 在头部圆形的上方左右两侧画两个小圆形。",
      "第三步：身体: 用一个比头部稍大的椭圆形或圆形。",
      "第四步：眼睛: 在头部圆形的上方画两个小圆形。",
      "第五步：鼻子: 用一个较大的椭圆形或圆形。",
      "第六步：嘴巴: 用一条短弧线。",
      "第七步：腿: 用四个粗短的椭圆形或长方形。",
      "第八步：胳膊: 也可以用粗短的椭圆形或长方形。"
    ]
  },
    rabbit: {
        "title": "萌萌的小兔子",
        "image": "./images/兔子.jpg",
        "steps": [
        "第一步：头部: 用一个圆形。",
        "第二步：耳朵: 在头部的上方画两个长长的椭圆形。",
        "第三步：身体: 用一个比头部稍大的椭圆形。",
        "第四步：眼睛: 在头部的中间上方画两个小圆形。",
        "第五步：鼻子: 用一个小圆形或三角形。",
        "第六步：嘴巴: 用一个倒“Y”字形。",
        "第七步：后腿: 用两个较大的弯曲椭圆形表示。",
        "第八步：前腿: 用两个较小的长方形。",
        "第九步：尾巴: 用一个小圆形。"
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const drawingCard = document.getElementById('drawingCard');
    const buttons = document.querySelectorAll('.image-button');
    let synth;
    
    // 检查浏览器是否支持语音合成
    if ('speechSynthesis' in window) {
        synth = window.speechSynthesis;
    } else {
        console.log('当前浏览器不支持语音合成');
    }

    // 更新卡片内容的函数
    function updateCard(imageType) {
        const data = drawingData[imageType];
        drawingCard.innerHTML = `
            <h2>${data.title}</h2>
            <div class="drawing-content">
                <div class="image-container">
                    <img src="${data.image}" alt="${data.title}" class="drawing-image">
                </div>
                <div class="steps">
                    <h3>画画步骤：</h3>
                    <ul>
                        ${data.steps.map((step, index) => `
                            <li data-text="${step}">${index + 1}. ${step.split('：')[1]}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;

        // 重新绑定点击事件
        attachStepClickEvents();
    }

    // 为步骤添加点击事件
    function attachStepClickEvents() {
        const steps = document.querySelectorAll('li');
        if (synth) {
            steps.forEach(step => {
                step.addEventListener('click', () => {
                    synth.cancel();
                    const text = step.getAttribute('data-text');
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'zh-CN';
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    synth.speak(utterance);

                    step.style.backgroundColor = '#bbdefb';
                    utterance.onend = () => {
                        step.style.backgroundColor = 'white';
                    };
                });
            });
        }
    }

    // 为按钮添加点击事件
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // 更新按钮状态
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 更新卡片内容
            updateCard(button.dataset.image);
        });
    });

    // 初始化第一个卡片
    attachStepClickEvents();
}); 