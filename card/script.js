// 定义全局变量
let uploadedImages = [];
let currentZIndex = 1;

// 定义全局函数
function mergeImages() {
    if (uploadedImages.length === 0) {
        alert('请先上传图片！');
        return;
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('canvasContainer');
    
    // 设置画布大小为容器大小
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 按照 z-index 排序元素
    const sortedImages = [...uploadedImages].sort((a, b) => 
        parseInt(a.style.zIndex) - parseInt(b.style.zIndex)
    );
    
    // 绘制每个图片到其当前位置
    sortedImages.forEach(container => {
        const img = container.querySelector('img');
        const rect = container.getBoundingClientRect();
        const containerRect = document.getElementById('canvasContainer').getBoundingClientRect();
        
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;
        
        ctx.drawImage(img, x, y, rect.width, rect.height);
    });

    // 显示结果
    const result = document.getElementById('result');
    result.innerHTML = '';
    
    const mergedImg = new Image();
    mergedImg.src = canvas.toDataURL('image/png');
    mergedImg.id = 'mergedImage';
    
    const downloadLink = document.createElement('a');
    downloadLink.href = mergedImg.src;
    downloadLink.download = 'merged_image.png';
    downloadLink.className = 'download-link';
    downloadLink.innerHTML = '下载合并后的图片';
    
    result.appendChild(mergedImg);
    result.appendChild(downloadLink);
}

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const canvasContainer = document.getElementById('canvasContainer');

    // 设置拖拽功能
    interact('.draggable-image')
        .draggable({
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            autoScroll: true,
            listeners: {
                move: dragMoveListener,
                start: function (event) {
                    event.target.style.zIndex = ++currentZIndex;
                }
            }
        })
        .resizable({
            edges: { right: true, bottom: true, left: true, top: true },
            restrictEdges: {
                outer: 'parent',
                endOnly: true,
            },
            restrictSize: {
                min: { width: 50, height: 50 },
            },
            inertia: true,
        })
        .on('resizemove', function (event) {
            let target = event.target;
            let x = (parseFloat(target.getAttribute('data-x')) || 0);
            let y = (parseFloat(target.getAttribute('data-y')) || 0);

            // 更新元素的宽高
            target.style.width = event.rect.width + 'px';
            target.style.height = event.rect.height + 'px';

            // 更新元素位置
            x += event.deltaRect.left;
            y += event.deltaRect.top;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);

            // 更新图片大小
            const img = target.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });

    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = function() {
                        addImageToCanvas(img);
                    }
                }
                reader.readAsDataURL(file);
            }
        }
    });
});

function addImageToCanvas(img) {
    const container = document.createElement('div');
    container.className = 'draggable-image';
    container.style.zIndex = ++currentZIndex;
    
    const imgElement = img.cloneNode();
    imgElement.style.width = '100%';
    imgElement.style.height = '100%';
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    
    container.appendChild(imgElement);
    container.appendChild(resizeHandle);
    
    // 随机位置
    const x = Math.random() * 200;
    const y = Math.random() * 200;
    container.style.transform = `translate(${x}px, ${y}px)`;
    container.setAttribute('data-x', x);
    container.setAttribute('data-y', y);

    document.getElementById('canvasContainer').appendChild(container);
    uploadedImages.push(container);
}

function dragMoveListener(event) {
    const target = event.target;
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    target.style.transform = `translate(${x}px, ${y}px)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

function clearCanvas() {
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.innerHTML = '';
    uploadedImages = [];
}

document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('li');
    
    // 检查浏览器是否支持语音合成
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        
        steps.forEach(step => {
            step.addEventListener('click', () => {
                // 停止当前正在播放的语音
                synth.cancel();
                
                // 获取要朗读的文本
                const text = step.getAttribute('data-text');
                
                // 创建语音对象
                const utterance = new SpeechSynthesisUtterance(text);
                
                // 设置语音参数
                utterance.lang = 'zh-CN'; // 设置语言为中文
                utterance.rate = 0.9; // 设置语速
                utterance.pitch = 1; // 设置音高
                
                // 播放语音
                synth.speak(utterance);
                
                // 添加视觉反馈
                step.style.backgroundColor = '#bbdefb';
                utterance.onend = () => {
                    step.style.backgroundColor = 'white';
                };
            });
        });
    } else {
        console.log('当前浏览器不支持语音合成');
    }
}); 