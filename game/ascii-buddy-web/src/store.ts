export type BubbleState = 'idle' | 'sleeping' | 'excited' | 'poked' | 'loved' | 'alert';

export interface AppState {
  species: import('./sprites').Species;
  hat: import('./sprites').Hat;
  eye: import('./sprites').Eye;
  theme: 'green' | 'amber' | 'pink';
  useCrt: boolean;
  bubbleText: string | null;
  state: BubbleState;
}

export const QUOTES = {
  idle: [
    "在思考中...",
    "这代码写得不错。",
    "好无聊呀...",
    "我就静静地看着你敲代码。",
    "01101000 01101001",
    "我的咖啡呢？"
  ],
  sleeping: [
    "Zzz...",
    "...",
    "在梦里我是只大恐龙..."
  ],
  poked: [
    "哎哟！",
    "干嘛戳我！",
    "别闹！",
    "？",
    "！"
  ],
  excited: [
    "好耶！",
    "升级啦！",
    "真香！",
    "<3"
  ],
  loved: [
    "好舒服~",
    "呼噜呼噜...",
    "多摸摸我！",
    "(蹭蹭)"
  ],
  alert: [
    "哇啊！",
    "发生什么事了？",
    "慢点，我头晕！",
    "吓我一跳！"
  ],
  // 时间专属语录
  timeBased: {
    lateNight: [
      "还不睡？你的发际线在报警了。",
      "Bug 是抓不完的，休息吧。",
      "夜深了，只有我们两个还醒着。"
    ],
    morning: [
      "早安！又是没有 warning 的一天吗？",
      "一日之计在于晨，先喝杯咖啡吧。",
      "起得真早！"
    ],
    fridayAfternoon: [
      "是不是该准备下班了？",
      "周五啦，今晚吃点好的！",
      "心已经飞走咯~"
    ]
  }
};

// 获取带有时间感知的闲聊台词
export function getAmbientQuote(): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // 摸鱼时段：周五 16:00 - 18:00
  if (day === 5 && hour >= 16 && hour < 18 && Math.random() < 0.4) {
    const quotes = QUOTES.timeBased.fridayAfternoon;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // 深夜时段：00:00 - 05:00
  if (hour >= 0 && hour < 5 && Math.random() < 0.5) {
    const quotes = QUOTES.timeBased.lateNight;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // 早晨时段：06:00 - 09:00
  if (hour >= 6 && hour < 9 && Math.random() < 0.3) {
    const quotes = QUOTES.timeBased.morning;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // 默认闲聊
  return QUOTES.idle[Math.floor(Math.random() * QUOTES.idle.length)];
}
