/**
 * Dance Tour Pass - 巡演票夹核心配置文件
 * 
 * 💡 使用说明：
 * 所有文案、图片路径、视频链接、音效与学员留言均集中于此。
 * 更换素材只需修改本文件，无需改动任何核心代码。
 */

(function() {
  // 生成高保真街舞潮流矢量占位图（避免未配置本地图片时出现裂图）
  function createSvgDataUrl(title, subtitle, accentColor, bgGradient, type) {
    let artSvg = '';
    if (type === 'teacher') {
      // 导师剪影与街头元素
      artSvg = `
        <defs>
          <linearGradient id="tgrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#ff0055" stop-opacity="0.8"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <!-- 街舞导师剪影 -->
        <circle cx="300" cy="220" r="140" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="6,6" opacity="0.4" />
        <path d="M 300 130 C 315 130 325 142 325 160 C 325 178 315 190 300 190 C 285 190 275 178 275 160 C 275 142 285 130 300 130 Z" fill="url(#tgrad)"/>
        <!-- 鸭舌帽 & 耳机 -->
        <path d="M 270 148 L 330 140 L 345 146 L 270 152 Z" fill="#ffffff"/>
        <path d="M 268 152 Q 300 120 332 152" fill="none" stroke="#fff" stroke-width="4"/>
        <!-- 动作躯干与手臂 Break/Freeze 姿势 -->
        <path d="M 300 195 L 260 250 L 220 230 L 190 270" fill="none" stroke="url(#tgrad)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
        <path d="M 300 195 L 340 240 L 390 220 L 410 180" fill="none" stroke="url(#tgrad)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
        <path d="M 300 195 L 295 310 L 240 370 L 220 420" fill="none" stroke="url(#tgrad)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 295 310 L 350 360 L 380 410" fill="none" stroke="url(#tgrad)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- 涂鸦标语 -->
        <text x="300" y="460" font-family="Impact, sans-serif" font-size="28" fill="${accentColor}" text-anchor="middle" letter-spacing="4">★ DANCE MENTOR MVP ★</text>
      `;
    } else if (type === 'crew') {
      // 齐舞群像剪影
      artSvg = `
        <defs>
          <linearGradient id="cgrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00f0ff" />
            <stop offset="50%" stop-color="${accentColor}" />
            <stop offset="100%" stop-color="#ff0077" />
          </linearGradient>
        </defs>
        <!-- 舞台聚光灯 -->
        <polygon points="100,-20 250,500 50,500" fill="rgba(0,240,255,0.08)"/>
        <polygon points="500,-20 550,500 350,500" fill="rgba(255,0,119,0.08)"/>
        <!-- 5人齐舞剪影姿态 -->
        <g fill="url(#cgrad)" opacity="0.9">
          <!-- C位 -->
          <circle cx="300" cy="200" r="22"/>
          <path d="M 300 230 L 270 290 L 240 270 M 300 230 L 330 290 L 360 270 M 300 230 L 290 350 L 260 430 M 290 350 L 320 430" stroke="url(#cgrad)" stroke-width="14" stroke-linecap="round"/>
          <!-- 左1 -->
          <circle cx="190" cy="220" r="18"/>
          <path d="M 190 245 L 160 300 L 130 290 M 190 245 L 220 300 M 190 245 L 180 360 L 150 430 M 180 360 L 200 430" stroke="url(#cgrad)" stroke-width="12" stroke-linecap="round"/>
          <!-- 右1 -->
          <circle cx="410" cy="220" r="18"/>
          <path d="M 410 245 L 440 300 L 470 290 M 410 245 L 380 300 M 410 245 L 420 360 L 450 430 M 420 360 L 400 430" stroke="url(#cgrad)" stroke-width="12" stroke-linecap="round"/>
          <!-- 左2 -->
          <circle cx="100" cy="250" r="15"/>
          <path d="M 100 270 L 80 340 M 100 270 L 120 330 M 100 270 L 95 380 L 70 440" stroke="url(#cgrad)" stroke-width="10" stroke-linecap="round"/>
          <!-- 右2 -->
          <circle cx="500" cy="250" r="15"/>
          <path d="M 500 270 L 520 340 M 500 270 L 480 330 M 500 270 L 505 380 L 530 440" stroke="url(#cgrad)" stroke-width="10" stroke-linecap="round"/>
        </g>
        <text x="300" y="470" font-family="Impact, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="3">CREW ALL STARS · NIGHT CLASS</text>
      `;
    } else {
      // 视频默认海报
      artSvg = `
        <circle cx="300" cy="240" r="45" fill="none" stroke="${accentColor}" stroke-width="4"/>
        <polygon points="290,225 320,240 290,255" fill="${accentColor}"/>
        <text x="300" y="320" font-family="Impact, sans-serif" font-size="20" fill="${accentColor}" text-anchor="middle" letter-spacing="2">CLICK TO PLAY HIGHLIGHTS</text>
      `;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
      <rect width="600" height="500" fill="${bgGradient}"/>
      <!-- 网格与街头装饰 -->
      <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <line x1="0" y1="450" x2="600" y2="450" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <line x1="50" y1="0" x2="50" y2="500" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <line x1="550" y1="0" x2="550" y2="500" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      ${artSvg}
      <text x="300" y="60" font-family="Impact, -apple-system, sans-serif" font-size="26" fill="#f5f6fa" text-anchor="middle" letter-spacing="3">${title}</text>
      <text x="300" y="86" font-family="-apple-system, sans-serif" font-size="14" fill="${accentColor}" text-anchor="middle" letter-spacing="1">${subtitle}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  window.TOUR_CONFIG = {
    // 1. 基础演出与教师信息
    teacherName: "K-Rock",                     // 导师艺名/称呼
    teacherFullName: "K-Rock 导师",            // 导师全称
    teacherTitle: "夜校嘻哈首席领路人 / Hip-Hop 编舞导师",
    className: "夜校嘻哈舞进阶一期",            // 班级名称
    date: "2026.09.10",                        // 演出/教师节日期
    venue: "NIGHT STUDIO // 01号地下排练厅",    // 演出地点
    ticketNo: "#HIPHOP-2026-VIP",              // 票根序列号
    slogan: "KEEP ON BOUNCING, NEVER STOP THE GROOVE!", // 导师金句

    // 2. 视频与海报素材配置（内置自适应演示/真实素材切换）
    rehearsalVideo: {
      title: "排练花絮 · 从顺拐到卡点",
      description: "记录我们第1节课手忙脚乱到逐渐有范儿的爆笑日常",
      // 若有真实 MP4 视频，填入实际相对路径，例如 "./assets/video/rehearsal.mp4"
      src: "", 
      // 视频海报图
      poster: createSvgDataUrl("REHEARSAL ARCHIVE", "排练档案 · 内部绝密爆笑实录", "#ccff00", "#12141c", "rehearsal")
    },

    mainShowVideo: {
      title: "齐舞正片 · 舞房最终大秀",
      description: "期末终极呈现！全班卡点齐舞，属于我们的舞台高光时刻",
      // 若有真实 MP4 视频，填入实际相对路径，例如 "./assets/video/main_show.mp4"
      src: "", 
      // 视频海报图
      poster: createSvgDataUrl("MAIN SHOWCASE", "齐舞主秀 · 终极舞台高光大片", "#00f0ff", "#0d1017", "main")
    },

    // 3. 照片素材（默认采用高清矢量图，可直接替换为 "./assets/images/teacher.jpg" 等）
    teacherPhoto: createSvgDataUrl("MVP DANCE MENTOR", "2026年度夜校最佳 Hip-Hop 领路人", "#ccff00", "#14161f", "teacher"),
    groupPhoto: createSvgDataUrl("THE NIGHT CREW", "夜校嘻哈舞进阶一期 · 齐舞大家庭毕业合影", "#00f0ff", "#10121a", "crew"),

    // 4. 学员手写留言与外号标签
    wishes: [
      {
        id: 1,
        name: "阿 Jin",
        avatar: "🧢",
        tag: "前排划水担当",
        tagColor: "#ff0055",
        content: "感谢老师每次超有耐心的八拍分解，治好了我三十多年的四肢不协调！老师教师节快乐，带我们一直跳下去！",
        likes: 24
      },
      {
        id: 2,
        name: "小敏",
        avatar: "🎧",
        tag: "卡点狂魔",
        tagColor: "#ccff00",
        content: "白天做写字楼打工人，晚上在舞房做自由的 Dancer！谢谢老师带我们找到属于身体的真实律动与自信！",
        likes: 31
      },
      {
        id: 3,
        name: "大树",
        avatar: "🕶️",
        tag: "Wave绝缘体",
        tagColor: "#00f0ff",
        content: "第一节课做 Wave 像触电抽筋，现在终于能稍微浪起来了，全靠老师手把手硬掰！Respect forever！",
        likes: 19
      },
      {
        id: 4,
        name: "CC",
        avatar: "👟",
        tag: "后排卡点狂魔",
        tagColor: "#ffb700",
        content: "每次上课前疲惫不堪，下课后大汗淋漓却超级开心。老师教的不仅是动作，更是一种生活态度！节日快乐！",
        likes: 28
      },
      {
        id: 5,
        name: "晓琳",
        avatar: "🔥",
        tag: "课后加练卷王",
        tagColor: "#a855f7",
        content: "从顺拐小白到跟上全班齐舞，今年教师节最有牌面的专属票夹送给最酷的 K-Rock！老师太顶了！",
        likes: 36
      },
      {
        id: 6,
        name: "Kevin",
        avatar: "⚡",
        tag: "律动引擎",
        tagColor: "#ec4899",
        content: "夜校最炸的课没有之一！跟着老师 Bounce 的两个小时，是整周最解压的时光！老师辛苦啦！",
        likes: 22
      },
      {
        id: 7,
        name: "圆圆",
        avatar: "🪩",
        tag: "气氛组组长",
        tagColor: "#10b981",
        content: "老师不仅教得好，现场氛围感也直接拉满！祝最帅气的街舞领路人教师节快乐，永远年轻永远 Swag！",
        likes: 25
      },
      {
        id: 8,
        name: "Leo",
        avatar: "🛹",
        tag: "同手同脚受害者",
        tagColor: "#f97316",
        content: "谢谢老师从不嫌弃我们'各有各的想法'的四肢，一遍遍带我们卡拍抠细节！教师节排面必须给您拉满！",
        likes: 29
      }
    ],

    // 5. 教师集体献礼长信
    tributeLetter: {
      title: "TO OUR FAVORITE DANCE MENTOR",
      paragraphs: [
        "致最酷的 K-Rock 导师：",
        "白天，我们散落在城市的各个角落，是穿梭在早高峰与电脑屏幕前的职场人；而夜幕降临后，在泛着木地板微光的夜校舞房里，是您用最纯正的 Boom-Bap 节拍，带我们唤醒了沉睡的身体与热爱。",
        "从最开始同手同脚的局促、数不清八拍的迷茫，到如今音乐一响就能自信踏出 Bounce，每一个律动、每一次齐舞爆发的瞬间，都凝聚着您的悉心示范与鼓励。",
        "感谢您带给我们的不只是舞步，更有面对生活的从容、韧性与街头态度。教师节快乐，愿您永远热血、永远在节奏中闪耀！"
      ],
      sign: "—— 夜校嘻哈舞进阶一期全体学员 敬上"
    },

    // 6. 音频配置
    // 如果有实际音频文件，指定相对路径如 "./assets/audio/boombap_beat.mp3"
    // 若为空或无法加载，系统将通过 Web Audio API 纯原生算法实时合成 Boom-Bap 律动，100% 零外链依赖
    bgm: ""
  };

  // 7. 自愈与高保真兜底资产库 (保证无论外部素材如何替换，关键模块永不崩溃或裂图)
  window.TOUR_FALLBACKS = {
    createSvgDataUrl: createSvgDataUrl,
    teacherPhoto: createSvgDataUrl("MVP DANCE MENTOR", "2026年度夜校最佳 Hip-Hop 领路人", "#ccff00", "#14161f", "teacher"),
    groupPhoto: createSvgDataUrl("THE NIGHT CREW", "夜校嘻哈舞进阶一期 · 齐舞大家庭毕业合影", "#00f0ff", "#10121a", "crew"),
    rehearsalPoster: createSvgDataUrl("REHEARSAL ARCHIVE", "排练档案 · 内部绝密爆笑实录", "#ccff00", "#12141c", "rehearsal"),
    mainShowPoster: createSvgDataUrl("MAIN SHOWCASE", "齐舞主秀 · 终极舞台高光大片", "#00f0ff", "#0d1017", "main")
  };
})();
