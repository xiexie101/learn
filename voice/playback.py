import asyncio
import sounddevice as sd
import numpy as np

class AudioPlayer:
    def __init__(self, queue: asyncio.Queue, samplerate=16000, channels=1):
        self.queue = queue
        self.samplerate = samplerate
        self.channels = channels
        self.is_running = False

    async def run(self):
        """主播放循环"""
        self.is_running = True
        print("启动音频播放器...")
        
        with sd.OutputStream(samplerate=self.samplerate, channels=self.channels, dtype='int16') as stream:
            while self.is_running:
                try:
                    # 从播放队列获取音频数据
                    audio_data_bytes = await self.queue.get()
                    
                    # 将字节数据转换为NumPy数组
                    audio_data_np = np.frombuffer(audio_data_bytes, dtype=np.int16)
                    
                    # 播放音频
                    stream.write(audio_data_np)
                    
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    print(f"播放器运行时发生错误: {e}")
                    break
        
        print("音频播放器已停止。")

    def stop(self):
        self.is_running = False

# 示例用法（需要与其他模块结合）
# player = AudioPlayer(playback_queue)
# await player.run()