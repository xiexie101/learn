import sounddevice as sd
import numpy as np
import asyncio

class AudioCapturer:
    def __init__(self, queue: asyncio.Queue, device_name: str, samplerate=16000, channels=1):
        self.queue = queue
        self.device_name = device_name
        self.samplerate = samplerate
        self.channels = channels
        self.device_id = self._find_device_id()
        self.stream = None

    def _find_device_id(self):
        """查找包含指定名称的输入设备ID"""
        devices = sd.query_devices()
        for i, device in enumerate(devices):
            if self.device_name in device['name'] and device['max_input_channels'] > 0:
                print(f"找到设备: {device['name']} (ID: {i})")
                return i
        raise ValueError(f"未找到名为 '{self.device_name}' 的输入设备")

    def _callback(self, indata: np.ndarray, frames: int, time, status):
        """音频流回调函数"""
        if status:
            print(status, flush=True)
        # 将捕获到的音频数据块（NumPy数组）放入异步队列
        self.queue.put_nowait(indata.copy())

    def start_stream(self):
        """启动音频捕获流"""
        print("启动音频捕获...")
        self.stream = sd.InputStream(
            device=self.device_id,
            samplerate=self.samplerate,
            channels=self.channels,
            dtype='float32',
            callback=self._callback
        )
        self.stream.start()
        print("音频捕获已启动。")

    def stop_stream(self):
        """停止音频捕获流"""
        if self.stream:
            self.stream.stop()
            self.stream.close()
            print("音频捕获已停止。")

# 示例用法
async def main():
    audio_queue = asyncio.Queue()
    # 注意：这里的设备名称需要与您系统中 VB-CABLE 的录音设备名称匹配
    capturer = AudioCapturer(audio_queue, device_name="CABLE Output")
    capturer.start_stream()
    
    try:
        # 模拟运行一段时间
        await asyncio.sleep(10)
    finally:
        capturer.stop_stream()

if __name__ == "__main__":
    # 列出所有设备以供参考
    print("可用音频设备:")
    print(sd.query_devices())
    print("-" * 30)
    
    asyncio.run(main())