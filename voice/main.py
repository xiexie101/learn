import asyncio
import os
import platform
from capture import AudioCapturer
from client_doubao import DoubaoTranslationClient # 更改导入的客户端
from playback import AudioPlayer

# --- 配置 ---
# 从环境变量获取密钥，更安全
VOLCANO_ACCESS_KEY = os.environ.get("VOLCANO_ACCESS_KEY")
VOLCANO_SECRET_KEY = os.environ.get("VOLCANO_SECRET_KEY")

if not VOLCANO_ACCESS_KEY or not VOLCANO_SECRET_KEY:
    raise ValueError("请设置环境变量 VOLCANO_ACCESS_KEY 和 VOLCANO_SECRET_KEY")

# 根据操作系统选择默认的虚拟音频设备名称
if platform.system() == "Windows":
    VIRTUAL_DEVICE_NAME = "CABLE Output"
elif platform.system() == "Darwin": # Darwin is the system name for macOS
    VIRTUAL_DEVICE_NAME = "BlackHole 2ch"
else:
    # For Linux, the name can vary. User might need to set it manually.
    VIRTUAL_DEVICE_NAME = "pulse" # This is a common default, but may need adjustment

SAMPLE_RATE = 16000
CHANNELS = 1

async def main():
    # 创建共享队列
    audio_capture_queue = asyncio.Queue()
    translated_playback_queue = asyncio.Queue()

    # 初始化各个模块
    capturer = AudioCapturer(audio_capture_queue, VIRTUAL_DEVICE_NAME, SAMPLE_RATE, CHANNELS)
    # 使用 DoubaoTranslationClient
    client = DoubaoTranslationClient(audio_capture_queue, translated_playback_queue, VOLCANO_ACCESS_KEY, VOLCANO_SECRET_KEY)
    player = AudioPlayer(translated_playback_queue, SAMPLE_RATE, CHANNELS)

    # 启动音频捕获
    capturer.start_stream()

    print("系统启动。按 Ctrl+C 退出。")

    # 并发运行客户端和播放器
    client_task = asyncio.create_task(client.run())
    player_task = asyncio.create_task(player.run())

    try:
        await asyncio.gather(client_task, player_task)
    except KeyboardInterrupt:
        print("\n正在关闭...")
    finally:
        # 优雅地停止所有组件
        client.stop()
        player.stop()
        capturer.stop_stream()
        
        # 等待任务完成
        await client_task
        await player_task
        print("系统已关闭。")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except ValueError as e:
        print(f"配置错误: {e}")
    except Exception as e:
        print(f"发生未处理的异常: {e}")