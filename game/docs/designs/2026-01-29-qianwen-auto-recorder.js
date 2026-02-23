/**
 * Project: 通义听悟自动录音控制脚本
 * Date: 2026-01-29
 * Author: 深度头脑风暴 (Senior Design Architect)
 * Description: 自动点击开始录音，基于系统时间倒计时，结束后自动确认保存。
 */

(function() {
    'use strict';

    // ==========================================
    // 1. 配置区域 (Configuration)
    // ==========================================
    const CONFIG = {
        // 录音时长（分钟）- 修改此处数字即可
        durationMinutes: 120,
        
        // 目标元素选择器 (根据需求定制)
        selectors: {
            startBtn: 'div.RecordEntryConfig__StartRecord',
            stopBtn: 'div.stop-btn',
            popupContainer: 'div.endRecording', // 弹窗容器
            buttonWrapper :'.ant-modal-confirm-btns .ty-button-wrapper' ,
            // 确认按钮将在 popupContainer 内部通过文本查找
        },
        
        // 确认按钮上的文字 (必须严格匹配)
        confirmText: '确认结束'
    };

    // ==========================================
    // 2. UI 面板模块 (Visual Interface)
    // ==========================================
    let statusDiv, timerDiv;

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'qianwen-auto-panel';
        panel.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 220px;
            background: rgba(33, 33, 33, 0.95); color: #fff;
            padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px; text-align: center; border: 1px solid #444;
        `;

        const title = document.createElement('div');
        title.innerText = '🎙️ 自动录音控制';
        title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #aaa; font-size: 12px;';

        statusDiv = document.createElement('div');
        statusDiv.innerText = '准备启动...';
        statusDiv.style.marginBottom = '10px';

        timerDiv = document.createElement('div');
        timerDiv.innerText = '00:00:00';
        timerDiv.style.cssText = 'font-size: 24px; font-weight: bold; color: #4caf50; margin: 10px 0; font-family: monospace;';

        const stopBtn = document.createElement('button');
        stopBtn.innerText = '⏹ 立即停止并保存';
        stopBtn.style.cssText = `
            background: #f44336; color: white; border: none; padding: 8px 15px;
            border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;
        `;
        stopBtn.onclick = () => stopSequence('manual');

        panel.appendChild(title);
        panel.appendChild(statusDiv);
        panel.appendChild(timerDiv);
        panel.appendChild(stopBtn);
        document.body.appendChild(panel);
    }

    function updateStatus(text, color = '#fff') {
        if (statusDiv) {
            statusDiv.innerText = text;
            statusDiv.style.color = color;
        }
        console.log(`[AutoScript] ${text}`);
    }

    // ==========================================
    // 3. 核心逻辑模块 (Core Logic)
    // ==========================================
    let timerInterval;

    function formatTime(ms) {
        if (ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    // 停止录音序列
    function stopSequence(triggerSource) {
        clearInterval(timerInterval);
        const reason = triggerSource === 'manual' ? '用户手动停止' : '时间已到';
        updateStatus(`正在停止 (${reason})...`, '#ffeb3b');

        // 1. 点击停止按钮
        const stopBtn = document.querySelector(CONFIG.selectors.stopBtn);
        if (stopBtn) {
            stopBtn.click();
            console.log('点击了停止按钮');
        } else {
            updateStatus('错误：找不到停止按钮！', '#ff0000');
            return;
        }

        // 2. 循环检测弹窗并点击确认
        let attempts = 0;
        const checkPopup = setInterval(() => {
            attempts++;
            updateStatus(`等待确认弹窗 (${attempts}/20)...`);
            
            const popup = document.querySelector(CONFIG.selectors.popupContainer);
            if (popup) {
                // 备选方案：如果找不到文字，尝试找 .ty-button-wrapper 下的第二个按钮
                const wrapper = popup.querySelector(CONFIG.selectors.buttonWrapper);
                wrapper.children
                if (wrapper && wrapper.children.length > 1) {
                    // 尝试点击第二个子元素 (索引1)
                    wrapper.children[1].click();
                    clearInterval(checkPopup);
                    updateStatus('✅ 已完成：通过位置点击保存', '#4caf50');
                }
            }

            if (attempts >= 20) {
                clearInterval(checkPopup);
                updateStatus('⚠️ 超时：请手动点击确认！', '#f44336');
            }
        }, 500); // 每0.5秒检查一次
    }

    // 主启动函数
    function startTask() {
        createPanel();

        // 1. 尝试点击开始
        const startBtn = document.querySelector(CONFIG.selectors.startBtn);
        if (startBtn) {
            startBtn.click();
            updateStatus('录音进行中...');
        } else {
            updateStatus('提示：未找到开始按钮(可能已在录音?)', '#ff9800');
        }

        // 2. 启动计时器 (使用 Date.now() 确保后台准确性)
        const endTime = Date.now() + CONFIG.durationMinutes * 60 * 1000;

        timerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;

            if (timerDiv) timerDiv.innerText = formatTime(remaining);

            if (remaining <= 0) {
                stopSequence('timer');
            }
        }, 1000);
    }

    // 执行
    startTask();

})();