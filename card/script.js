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