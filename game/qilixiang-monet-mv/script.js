/**
 * 《七里香》× 莫奈印象派 MV 交互引擎与导演时间轴核心
 * 全片 4分59秒 (299秒)，精准对齐周杰伦旋律、鼓点与方文山词意
 * 包含 8 大篇章、28 个电影级分镜、实时 Canvas 莫奈笔触渲染、运镜模拟器、歌词同步器
 */

// 1. 完整分镜数据库 (4分59秒 秒级对齐)
const STORYBOARD_DATA = [
    {
        id: 1,
        timeStart: 0,
        timeEnd: 12,
        section: "前奏 Intro (A)",
        lyrics: "（吉他分解和弦缓缓流淌，清晨风铃轻颤）",
        title: "吉维尼清晨·塞纳河的薄雾",
        monetInspiration: "《日出·印象》(Impression, Sunrise, 1872)",
        palette: ["#8fa3b0", "#e8c3a1", "#587286", "#df9b6d", "#3b4d61"],
        shotType: "远景 (Extreme Long Shot)",
        camera: "极缓推镜头 (Slow Push-In, 0.5x speed)",
        vfx: "晨雾微粒流动，水面泛起第一缕粉橙色光学反光，短促横向笔触",
        metaphor: "记忆的苏醒。如同一幅尚未干透的湿画法画布，夏天的故事在晨光中苏醒。",
        promptMJ: "Cinematic wide shot of Giverny Seine river at dawn, impressionist painting style by Claude Monet, soft pastel blue and peachy orange mist, visible wet oil impasto brushstrokes, golden hour glow, dreamy atmosphere, 8k --ar 16:9"
    },
    {
        id: 2,
        timeStart: 12,
        timeEnd: 25,
        section: "前奏 Intro (B)",
        lyrics: "（弦乐群如麦浪般起伏涌入，贝斯滑音切入）",
        title: "电线杆与晨光中的第一对羽翼",
        monetInspiration: "《塞纳河畔的阿让特伊》(Argenteuil, 1874)",
        palette: ["#a1b5c4", "#f4e0b9", "#6b8272", "#415058", "#d9822b"],
        shotType: "仰角中景 (Low-angle Medium Shot)",
        camera: "仰拍微摇 (Low-angle Pan & Tilt Up)",
        vfx: "晨曦穿透电线，形成一道道微颤的光谱光晕，背景树冠呈现点彩跳跃",
        metaphor: "现代物象（电线杆）被彻底印象派化，成为五线谱般的横线，等待音符降临。",
        promptMJ: "Low angle shot of wooden telegraph poles and wires against a glowing impressionist morning sky, Claude Monet style, vibrant dappled light, broken color technique, birds perching on wires, cinematic composition --ar 16:9"
    },
    {
        id: 3,
        timeStart: 25,
        timeEnd: 37,
        section: "主歌 Verse 1 (A1)",
        lyrics: "窗外的麻雀 在电线杆上多嘴",
        title: "雀鸟与金线·跳跃的光斑",
        monetInspiration: "《喜鹊》(The Magpie, 1869)",
        palette: ["#4a5568", "#fbd38d", "#9ae6b4", "#cbd5e0", "#e2e8f0"],
        shotType: "特写 (Close-Up)",
        camera: "水平滑轨跟移 (Tracking Shot Left-to-Right)",
        vfx: "麻雀翅膀轮廓泛着强烈金色逆光轮廓，羽毛由独立色块点画而成",
        metaphor: "“多嘴”的不是麻雀，而是少年心中按捺不住、雀跃欲飞的悸动。",
        promptMJ: "Close-up of little sparrows on telegraph wires chirping, sparkling golden rim light on feathers, impressionist thick paint texture by Claude Monet, blurred leafy bokeh in background, morning warmth --ar 16:9"
    },
    {
        id: 4,
        timeStart: 37,
        timeEnd: 49,
        section: "主歌 Verse 1 (A1)",
        lyrics: "你说这一句 很有夏天的感觉",
        title: "撑阳伞的少女·微风拂过绿丘",
        monetInspiration: "《撑阳伞的女人》(Woman with a Parasol, 1875)",
        palette: ["#68d391", "#bee3f8", "#faf089", "#ffffff", "#4a5568"],
        shotType: "低仰角全景 (Low-angle Full Shot)",
        camera: "逆风环绕推进 (Windward Push & Arc)",
        vfx: "白色长裙与绿草顺着风势剧烈翻涌，云朵如同厚涂白色奶油般在天幕飞掠",
        metaphor: "夏天的具象化：不是温度，而是少女转头时伞沿倾斜的角度与被风吹起的发丝。",
        promptMJ: "Iconic impressionist painting of a girl holding a green parasol standing on a windy grassy hill, Claude Monet masterpiece, white dress flowing in wind, wild grass and poppies, sunny blue sky with fluffy moving clouds --ar 16:9"
    },
    {
        id: 5,
        timeStart: 49,
        timeEnd: 61,
        section: "主歌 Verse 1 (A2)",
        lyrics: "手中的铅笔 在纸上来来回回",
        title: "画架、草稿与颤抖的铅芯",
        monetInspiration: "《画室角》(Corner of a Studio, 1861)",
        palette: ["#744210", "#ecc94b", "#f7fafc", "#4a5568", "#975a16"],
        shotType: "俯视微距特写 (Top-Down Extreme Close-Up)",
        camera: "焦点平移 (Rack Focus from Paper to Window)",
        vfx: "铅笔在糙面水彩纸上摩擦出的石墨碎屑，百叶窗斜射下被光线点亮的尘埃丁达尔效应",
        metaphor: "“写”与“画”的同构：情书是无法说出口的文字，也是画布上第一笔未干的试色。",
        promptMJ: "Macro overhead shot of artist hands sketching with a pencil on rough paper by a sunlit wooden window, dust motes dancing in warm light beam, Monet painterly style, nostalgic cozy summer vibes --ar 16:9"
    },
    {
        id: 6,
        timeStart: 61,
        timeEnd: 74,
        section: "主歌 Verse 1 (A2)",
        lyrics: "我用几行字形容你是我的谁",
        title: "虚焦的光斑与不可言说的倒影",
        monetInspiration: "《吉维尼塞纳河支流》(Arm of the Seine near Giverny)",
        palette: ["#fed7d7", "#feebc8", "#b2f5ea", "#bee3f8", "#e9d8fd"],
        shotType: "中景移焦 (Medium Shot with Soft Focus)",
        camera: "缓慢拉远变焦 (Slow Pull-out Dolly)",
        vfx: "水面上文字字迹融化为水彩波纹，画面逐渐被圆形复古色散光斑充满",
        metaphor: "语言在极致的爱意面前失效，最终全部坍缩为莫奈眼中流动的光晕。",
        promptMJ: "Impressionist water surface with reflection of green trees and pink sky, ripples dissolving into pure colorful optical bokeh, Claude Monet, dreamlike poetry, soft lens flare --ar 16:9"
    },
    {
        id: 7,
        timeStart: 74,
        timeEnd: 86,
        section: "主歌 Verse 1 (A3)",
        lyrics: "秋刀鱼的滋味 猫跟妳都想了解",
        title: "窗台上的白猫与泛着银蓝微光的静物",
        monetInspiration: "《静物与甜瓜》(Still Life, 1878)",
        palette: ["#2b6cb0", "#e2e8f0", "#d69e2e", "#c53030", "#4a5568"],
        shotType: "静物中景 (Still Life Medium Shot)",
        camera: "侧向慢滑轨 (Lateral Dolly Left)",
        vfx: "竹篮中秋刀鱼鳞片反射出莫奈特有的群青与银白短笔触，白猫胡须在暖阳中轻微抖动",
        metaphor: "最烟火气的温存。猫的好奇与少女的娇憨在吉维尼木窗前合二为一。",
        promptMJ: "Impressionist still life by Claude Monet, a gentle white cat on a rustic wooden windowsill curious about a woven basket with silvery fresh fish, warm sunlight streaming through glass, rich textures --ar 16:9"
    },
    {
        id: 8,
        timeStart: 86,
        timeEnd: 99,
        section: "主歌 Verse 1 (A3)",
        lyrics: "初恋的香味就这样被我们寻回",
        title: "花园深处·第一朵盛开的七里香",
        monetInspiration: "《吉维尼莫奈花园的花道》(The Garden Path at Giverny, 1902)",
        palette: ["#38a169", "#ffffff", "#faf089", "#d6bcfa", "#2f855a"],
        shotType: "特写推进 (Close-up Push-in)",
        camera: "深景深推镜头 (Deep Focus Push to Flower Petals)",
        vfx: "白色的七里香小花苞在镜头前如延时摄影般悄然绽放，花粉在微光中散落成金星",
        metaphor: "香气不可见，莫奈用绿叶丛中突然跳跃出的纯白与嫩黄笔触，画出了初恋的嗅觉。",
        promptMJ: "Macro shot of pure white Jasmine Orange blossoms blooming in Monet lush garden, sunlit dewdrops on petals, vibrant green foliage with purple iris shadows, Claude Monet impasto, sweet summer romance --ar 16:9"
    },
    {
        id: 9,
        timeStart: 99,
        timeEnd: 114,
        section: "主歌 Verse 1 (A4)",
        lyrics: "那温暖的阳光 像刚摘的鲜艳草莓 / 妳说妳舍不得吃掉这一种感觉",
        title: "草莓的朱红与白瓷盘的碎金",
        monetInspiration: "《阿让特伊的罂粟田》(Poppy Field, 1873)",
        palette: ["#e53e3e", "#fff5f5", "#f6e05e", "#276749", "#c53030"],
        shotType: "微距俯拍 (Macro Top-Down)",
        camera: "俯拍缓慢旋转 (Slow Top-Down Rotation)",
        vfx: "红宝石般剔透的草莓表面挂着露珠，少女纤细指尖触碰草莓，光晕随指尖波动",
        metaphor: "通感极致：阳光的温度被赋予了草莓的酸甜，舍不得吃掉的是夏天的易逝。",
        promptMJ: "Vibrant ripe red strawberries glistening in a white porcelain dish on grass, morning dew drops, Claude Monet impressionist painting, warm sunlight sparkling, brilliant crimson and emerald green, pure sensory bliss --ar 16:9"
    },
    {
        id: 10,
        timeStart: 114,
        timeEnd: 126,
        section: "副歌 Chorus 1 (B1)",
        lyrics: "雨下整夜 我的爱溢出就像雨水",
        title: "吉维尼池塘的夏夜骤雨·睡莲的战栗",
        monetInspiration: "《睡莲：暴风雨》(Water Lilies, Morning, 1914)",
        palette: ["#1a365d", "#2b6cb0", "#4fd1c5", "#90cdf4", "#e2e8f0"],
        shotType: "全景大俯拍 (Overhead Master Shot)",
        camera: "高空升降下潜 (Crane Downward Dive)",
        vfx: "密集的暴雨雨滴砸入深色池塘，激起数千圈交叠的同心圆涟漪，冷色系光影剧烈晃动",
        metaphor: "情感从克制的主歌瞬间暴烈爆发。爱不再是微风，而是席卷整个视界的倾盆夏雨。",
        promptMJ: "Heavy summer rainstorm falling on Claude Monet water lily pond at dusk, concentric ripples colliding across deep indigo water, floating water lilies, stormy purple and electric blue lighting, dynamic oil strokes --ar 16:9"
    },
    {
        id: 11,
        timeStart: 126,
        timeEnd: 139,
        section: "副歌 Chorus 1 (B1)",
        lyrics: "院子落叶 跟我的思念厚厚一叠",
        title: "铺满石径的湿润落叶与思念的厚度",
        monetInspiration: "《秋日的塞纳河》(The Seine at Jeufosse, Autumn, 1884)",
        palette: ["#9c4221", "#dd6b20", "#d69e2e", "#2d3748", "#7b341e"],
        shotType: "贴地低角度特写 (Ground-level Low Angle)",
        camera: "贴地向前急速滑行 (Ground Tracking Shot Forward)",
        vfx: "落叶带有湿漉漉的反光，厚涂油画颜料层层叠叠，每一片落叶都是一片燃烧的赤金",
        metaphor: "方文山的“厚厚一叠”与莫奈的“厚涂法（Impasto）”完美共振：思念是可见的物理分量。",
        promptMJ: "Ground-level shot of garden path covered in thick layers of wet autumn leaves, deep amber, burnt orange, and gold, impressionist oil texture, water reflections on cobblestones, Claude Monet, melancholic beauty --ar 16:9"
    },
    {
        id: 12,
        timeStart: 139,
        timeEnd: 151,
        section: "副歌 Chorus 1 (B1)",
        lyrics: "几句是非 也无法将我的热情冷却 / 妳出现在我诗的每一页",
        title: "狂风暴雨中的日本桥·坚固的守望",
        monetInspiration: "《吉维尼的日本桥》(The Japanese Footbridge, 1899)",
        palette: ["#234e52", "#319795", "#81e6d9", "#d6bcfa", "#1a202c"],
        shotType: "中远景对角线构图 (Diagonal Medium-Long Shot)",
        camera: "剧烈风动横摇 (Wind-driven Whip Pan to Bridge)",
        vfx: "紫藤在风雨中狂舞，日本桥在深青色水面上投下顽固的绿色倒影，穿透雨帘依然明亮",
        metaphor: "外界的是非只是过眼云烟的暴雨，而“桥”与“诗”是爱人之间永不被冲垮的通道。",
        promptMJ: "Claude Monet iconic Japanese footbridge in Giverny amidst wind and rain, wisteria weeping willow hanging, vibrant emerald and turquoise reflections in pond water, dramatic lighting, romantic resilience --ar 16:9"
    },
    {
        id: 13,
        timeStart: 151,
        timeEnd: 164,
        section: "副歌 Chorus 1 (B2)",
        lyrics: "雨下整夜 我的爱溢出就像雨水 / 窗台蝴蝶 像诗里纷飞的美丽章节",
        title: "沾湿的蓝闪蝶与透明玻璃窗",
        monetInspiration: "《温室中的茶花》(In the Greenhouse)",
        palette: ["#3182ce", "#63b3ed", "#bee3f8", "#ffffff", "#2d3748"],
        shotType: "微距透光拍摄 (Macro Backlit Shot)",
        camera: "缓推贴近窗玻璃 (Slow Push into Window Pane)",
        vfx: "雨水在玻璃窗上蜿蜒流淌，一只梦幻般的蓝闪蝶收拢翅膀栖息在窗棂，水珠折射出彩虹",
        metaphor: "蝴蝶是凝固的诗，雨水是流动的墨水。脆弱与美丽在最危险的暴雨时刻相逢。",
        promptMJ: "A luminous blue butterfly resting on a rainy window sill, water rivulets streaming down glass pane, bokeh of impressionist garden outside, Claude Monet style, ethereal soft focus, poetical longing --ar 16:9"
    },
    {
        id: 14,
        timeStart: 164,
        timeEnd: 176,
        section: "副歌 Chorus 1 (B2)",
        lyrics: "我接着写 把永远爱你写进诗的结尾",
        title: "烛光与墨迹·画布上永不干涸的油彩",
        monetInspiration: "《在埃特尔塔的落日》(Sunset at Etretat, 1883)",
        palette: ["#dd6b20", "#e53e3e", "#f6ad55", "#4a5568", "#fffaf0"],
        shotType: "中景移轴 (Tilt-Shift Medium Shot)",
        camera: "圆周慢摇 (Slow Circular Orbit 45°)",
        vfx: "羽毛笔蘸上浓稠的金色油彩，在纸页上写下流光的笔迹，背景是渐渐隐去的窗外暴雨",
        metaphor: "“永远”这个词太重，少年把它写成诗的结尾，莫奈把它画成落日余晖里的永恒。",
        promptMJ: "Warm interior desk in vintage artist room, glowing oil lamp casting warm light, calligraphy pen writing on parchment, impressionist painting by Monet outside window, golden sunset breaking through clouds --ar 16:9"
    },
    {
        id: 15,
        timeStart: 176,
        timeEnd: 189,
        section: "副歌 Chorus 1 (B2)",
        lyrics: "妳是我唯一想要的了解",
        title: "雨夜中的凝视·雨丝渐歇的呼吸",
        monetInspiration: "《散步，普尔维尔的悬崖》(Cliff Walk at Pourville, 1882)",
        palette: ["#4a5568", "#cbd5e0", "#fed7d7", "#feebc8", "#2b6cb0"],
        shotType: "肖像特写 (Portrait Close-Up)",
        camera: "超慢推镜头 (Ultra-slow Push to Eyes)",
        vfx: "少女眼眸中倒映出整座水雾弥漫的花园，眼眸周围是细腻纯净的粉灰调笔触",
        metaphor: "整首歌的核心灵魂之问。所有的夏天与风景，只是为了抵达你眼中的那汪清泉。",
        promptMJ: "Cinematic portrait of a young girl with wistful romantic eyes, reflection of rainy Monet water lily garden in her pupils, impressionist oil strokes, delicate features, cinematic golden rim light --ar 16:9"
    },
    {
        id: 16,
        timeStart: 189,
        timeEnd: 213,
        section: "间奏 Interlude",
        lyrics: "（钟兴民小提琴激昂独奏，管弦乐壮丽飞扬，彩虹横跨天际）",
        title: "雨霁天晴·破云而出的神圣金光",
        monetInspiration: "《维特伊的塞纳河崩解》(The Break-up of the Ice, 1880)",
        palette: ["#f6e05e", "#faf089", "#63b3ed", "#48bb78", "#9f7aea"],
        shotType: "全景极速升镜 (Epic Aerial Crane Up)",
        camera: "大范围延时冲顶运镜 (Hyperlapse Soaring Shot to the Heavens)",
        vfx: "厚重的乌云被一束巨大的柠檬黄日光撕裂！水汽蒸腾形成七彩虹晕，睡莲池塘全面苏醒",
        metaphor: "视听体验的最高潮交响！音乐是小提琴的飞驰，画面是莫奈对光线征服黑暗的赞歌。",
        promptMJ: "Epic scene of sunlight bursting through dark storm clouds over Monet Giverny garden, golden God rays, rainbow stretching across sky, sparkling water drops on blooming water lilies, masterpiece, vibrant --ar 16:9"
    },
    {
        id: 17,
        timeStart: 213,
        timeEnd: 226,
        section: "主歌 Verse 2 (A5)",
        lyrics: "那饱满的稻穗 幸福了这个季节",
        title: "丰收的金色干草堆·落日熔金",
        monetInspiration: "《干草堆，夏末落日》(Haystacks, End of Summer, 1890)",
        palette: ["#d69e2e", "#b7791f", "#975a16", "#744210", "#f6e05e"],
        shotType: "大全景广角 (Ultra-Wide Master)",
        camera: "低空掠过麦浪 (Low-Flying Drone Tracking over Wheat)",
        vfx: "饱满的金色稻芒在晚风中如海浪般此起彼伏，背光稻芒如千万根发光的金针",
        metaphor: "从初夏的青涩步入夏末的成熟，爱意结出了沉甸甸的果实，幸福是一种大地的厚实感。",
        promptMJ: "Iconic Claude Monet Haystacks series at golden sunset, vast golden wheat field undulating in the wind, dramatic long shadows, rich cadmium yellow and ochre oil paint textures, warm nostalgic atmosphere --ar 16:9"
    },
    {
        id: 18,
        timeStart: 226,
        timeEnd: 238,
        section: "主歌 Verse 2 (A5)",
        lyrics: "而妳的脸颊像田里熟透的番茄",
        title: "田垄间的绯红·熟透番茄与少女的侧颜",
        monetInspiration: "《在吉维尼的草地上》(In the Meadow at Giverny)",
        palette: ["#e53e3e", "#9b2c2c", "#f6ad55", "#48bb78", "#22543d"],
        shotType: "双主体中近景 (Medium Close-Up Two-Subject)",
        camera: "焦点从番茄滑向脸颊 (Rack Focus from Tomato to Cheek)",
        vfx: "番茄藤蔓上挂着红玛瑙般的果实，晚霞把少女的脸颊镀上一层健康的杏红与绯粉",
        metaphor: "方文山最俏皮的生活化隐喻：爱一个人就是看她像看最饱满成熟的果实，想咬一口。",
        promptMJ: "Close-up of ripe juicy red tomatoes hanging on green vines in a country garden, bathed in warm sunset glow, side profile of a blushing girl smiling in soft background focus, Monet impressionist style --ar 16:9"
    },
    {
        id: 19,
        timeStart: 238,
        timeEnd: 250,
        section: "主歌 Verse 2 (A6)",
        lyrics: "妳突然对我说 七里香的名字很美",
        title: "轻启的朱唇与风中的花名",
        monetInspiration: "《塞纳河畔的春天》(Spring on the River)",
        palette: ["#feebc8", "#fbd38d", "#e2e8f0", "#4a5568", "#68d391"],
        shotType: "浅景深特写 (Shallow DOF Close-Up)",
        camera: "平视微仰推进 (Eye-Level Push-in to Lips)",
        vfx: "白色小花的花瓣随少女说话的气息轻轻飘扬，微光在嘴唇高光处闪烁",
        metaphor: "“七里香”三个字在舌尖吐出的一刹那，整座花园的香气被具象化为一个名字。",
        promptMJ: "Impressionist close-up portrait of a girl whispering, delicate lips, white jasmine flowers floating in gentle summer breeze, golden hour sunlight highlighting her silhouette, Claude Monet artistic style --ar 16:9"
    },
    {
        id: 20,
        timeStart: 250,
        timeEnd: 263,
        section: "主歌 Verse 2 (A6)",
        lyrics: "我此刻却只想亲吻妳倔强的嘴",
        title: "夕阳下的逆光剪影·心动的瞬间",
        monetInspiration: "《博尔迪盖拉的别墅》(Villas at Bordighera, 1884)",
        palette: ["#c53030", "#dd6b20", "#2d3748", "#f6e05e", "#1a202c"],
        shotType: "剪影大特写 (Silhouette Extreme Close-Up)",
        camera: "希区柯克变焦 (Dolly Zoom / Vertigo Effect)",
        vfx: "夕阳完全落到两人接吻剪影的正中央，形成耀眼的日食状光芒漫射，心跳般的画面缩放",
        metaphor: "一切语言归于沉默。最美的歌词不是文字，而是少年克制不住亲吻上去的勇气。",
        promptMJ: "Intimate silhouette of two lovers leaning in for a kiss against a blinding golden sunset, Monet impressionist light flare, fiery orange, deep violet silhouettes, cinematic emotional climax --ar 16:9"
    },
    {
        id: 21,
        timeStart: 263,
        timeEnd: 275,
        section: "副歌 Chorus 2 (B1)",
        lyrics: "雨下整夜 我的爱溢出就像雨水 / 院子落叶 跟我的思念厚厚一叠",
        title: "回旋的重唱·记忆与现实的油画叠印",
        monetInspiration: "《伦敦国会大厦，夕阳》(Houses of Parliament, Sunset, 1904)",
        palette: ["#805ad5", "#d53f8c", "#dd6b20", "#3182ce", "#1a202c"],
        shotType: "双重曝光超现实全景 (Double-Exposure Surreal Master)",
        camera: "360度全景环绕 (360-Degree Continuous Orbit)",
        vfx: "白天的金色麦浪与夜晚的紫雨在同一个画框里以莫奈色彩交融，笔触如同潮水般旋转涌动",
        metaphor: "音乐副歌的二次强化：爱已经跨越了单一时空，白天是麦浪，夜晚是雨水，全都是思念。",
        promptMJ: "Surrealistic impressionist landscape merging wheat field sunset with stormy rain night, swirling oil brushstrokes of violet, magenta, and amber, Claude Monet, dreamscape of endless love --ar 16:9"
    },
    {
        id: 22,
        timeStart: 275,
        timeEnd: 288,
        section: "副歌 Chorus 2 (B1)",
        lyrics: "几句是非 也无法将我的热情冷却 / 妳出现在我诗的每一页",
        title: "漫天纷飞的诗稿与夜雨红莲",
        monetInspiration: "《睡莲池与紫藤》(Water Lilies and Agapanthus, 1917)",
        palette: ["#2c5282", "#2b6cb0", "#9b2c2c", "#e2e8f0", "#4fd1c5"],
        shotType: "升格超慢动作 (High-Speed Slow Motion 120fps)",
        camera: "升格俯仰跟随 (Slow Tilt Down Following Falling Paper)",
        vfx: "写满字迹的泛黄纸页在夜空中如雪花般飘落，落入池塘化为一朵朵盛开的深红色睡莲",
        metaphor: "诗篇化为莲花。每一句是非都是池水，而诗页上的爱是在水中永不沉没的花冠。",
        promptMJ: "Falling poetic manuscript pages drifting down like snow into a moonlit impressionist water lily pond, blooming red lotus, ripples sparkling under moonlight, Claude Monet mystical night --ar 16:9"
    },
    {
        id: 23,
        timeStart: 288,
        timeEnd: 300,
        section: "副歌 Chorus 2 (B2)",
        lyrics: "雨下整夜 我的爱溢出就像雨水 / 窗台蝴蝶 像诗里纷飞的美丽章节",
        title: "群蝶夜舞·荧光闪烁的诗意矩阵",
        monetInspiration: "《吉维尼花园的睡莲》(Nympheas, 1916)",
        palette: ["#4fd1c5", "#81e6d9", "#bee3f8", "#234e52", "#ffffff"],
        shotType: "动态跟焦长镜头 (Dynamic Tracking Shot with Butterfly)",
        camera: "第一人称视角穿梭 (FPV Drone-style Glide through Garden)",
        vfx: "成千上百只散发着青白色荧光的蝴蝶从窗台飞起，在夜色中划出交织的光带轨迹",
        metaphor: "“章节”的具象化。整座花园变成了一本展开的书，蝴蝶是翻动的字里行间。",
        promptMJ: "Swarm of glowing cyan and white butterflies fluttering through Monet nighttime garden, luminous trails across dark pond, water lilies softly glowing, magical impressionist realism, masterpiece --ar 16:9"
    },
    {
        id: 24,
        timeStart: 300,
        timeEnd: 324,
        section: "副歌 Chorus 3 (B3 高潮加花)",
        lyrics: "Ho~ 我接着写 把永远爱你写进诗的结尾 / 妳是我唯一想要的了解",
        title: "全曲最高峰·周杰伦高音加花的宇宙级光爆",
        monetInspiration: "《鲁昂大教堂：全盛日光》(Rouen Cathedral, Full Sunlight, 1894)",
        palette: ["#ffffff", "#f6e05e", "#ed8936", "#e53e3e", "#63b3ed"],
        shotType: "宏大全景推特写 (Epic Crash Zoom to Micro Detail)",
        camera: "光芒穿透疾推 (Speed Ramp Zoom into Brilliant White Flower)",
        vfx: "纯粹的光学混色爆发！所有黄色、蓝色、红色短碎笔触在屏幕中央剧烈旋转汇聚成万丈光芒！",
        metaphor: "周杰伦的华彩假音与方文山的“永远爱你”在此刻化为莫奈追寻一生的终极命题——绝对纯光。",
        promptMJ: "Glorious explosion of optical pure light and vibrant oil colors, Rouen cathedral sunlight intensity, Claude Monet brushwork frenzy, blinding white and golden rays, ultimate artistic ecstasy --ar 16:9"
    },
    {
        id: 25,
        timeStart: 324,
        timeEnd: 348,
        section: "尾奏 Outro (A)",
        lyrics: "（吉他扫弦再起，风铃清脆摇曳，弦乐逐步舒缓）",
        title: "夏夜归宁·吉维尼花园的月华如水",
        monetInspiration: "《睡莲池·暮色》(Water Lilies, Evening, 1916)",
        palette: ["#1a202c", "#2d3748", "#4a5568", "#cbd5e0", "#ffffff"],
        shotType: "固定长镜头 (Static Meditative Long Take)",
        camera: "静止不动，仅光影变化 (Static Frame, Light Timelapse)",
        vfx: "月光穿透柳树枝条，白色七里香树在微风中静静呼吸，水面波光渐渐平息如镜",
        metaphor: "暴风雨与炽热过后，真正的爱沉淀为最深邃的宁静。七里香的香味将永驻心间。",
        promptMJ: "Serene peaceful Monet garden at midnight, silver moonlight reflecting on calm pond surface, weeping willows, blooming white Jasmine bushes gently swaying, cool indigo and silver palette --ar 16:9"
    },
    {
        id: 26,
        timeStart: 348,
        timeEnd: 372,
        section: "尾奏 Outro (B)",
        lyrics: "（周杰伦轻声低吟，电吉他泛音如水滴入梦）",
        title: "画框的显露·橘园美术馆的永恒回响",
        monetInspiration: "巴黎橘园美术馆《睡莲》全景椭圆展厅 (Musée de l'Orangerie)",
        palette: ["#718096", "#a0aec0", "#e2e8f0", "#edf2f7", "#2d3748"],
        shotType: "后拉超大全景 (Extreme Pull-out Shot)",
        camera: "无限后拉穿透画框 (Infinite Pull-out into Museum Hall)",
        vfx: "画面边缘渐渐显现出古朴厚重的金色木雕画框，现实世界的美术馆展厅与画作融为一体",
        metaphor: "这一首夏天的歌，如同一幅珍藏在橘园美术馆的睡莲巨幅壁画，成为了人类记忆中的传世经典。",
        promptMJ: "A massive curved impressionist Monet painting hanging in the elegant white oval hall of Musée de l'Orangerie Paris, soft ambient museum lighting, solitary viewer looking at the artwork, cinematic wide shot --ar 16:9"
    },
    {
        id: 27,
        timeStart: 372,
        timeEnd: 299,
        section: "终曲 Finale",
        lyrics: "（尾音消散，风铃一声脆响，定格）",
        title: "落款·写进诗的结尾",
        monetInspiration: "莫奈晚年签名与花瓣落定",
        palette: ["#1a202c", "#ffffff", "#d69e2e", "#718096", "#e2e8f0"],
        shotType: "特写定格 (Final Freeze Frame)",
        camera: "轻微呼吸缓动 (Subtle Breathing Motion)",
        vfx: "画面右下角由铅笔笔触浮现手写体：“Claude Monet × 周杰伦《七里香》”，一片白色七里香花瓣缓缓飘落覆盖在字迹上",
        metaphor: "夏天的故事在此落款。永远爱你，写进诗的结尾。",
        promptMJ: "Close-up of aged artist canvas corner, handwritten signature in pencil 'Claude Monet x Jay Chou Qilixiang', a single fresh white Jasmine flower petal resting on it, soft romantic museum light, final fade --ar 16:9"
    }
];

// 2. MV 控制器与 Canvas 印象派渲染引擎
class MonetMVController {
    constructor() {
        this.audio = new QilixiangAudioEngine();
        this.canvas = document.getElementById("mv-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.currentShot = STORYBOARD_DATA[0];
        this.currentFilter = "all"; // all, morning, poppy, rain, sunset, night
        this.brushParticles = [];
        this.weatherParticles = [];
        this.time = 0;
        this.animFrame = null;
        this.cinematicBars = true;
        this.isDrawerOpen = false;

        this.initDOM();
        this.initCanvasSize();
        this.initParticles();
        this.bindEvents();
        this.renderDrawer();
        this.startRenderLoop();
    }

    initDOM() {
        this.btnPlay = document.getElementById("btn-play");
        this.timeDisplay = document.getElementById("time-display");
        this.progressBar = document.getElementById("progress-bar");
        this.progressFill = document.getElementById("progress-fill");
        this.lyricCurrent = document.getElementById("lyric-current");
        this.lyricTrans = document.getElementById("lyric-translation");
        this.hudShotNumber = document.getElementById("hud-shot-number");
        this.hudSection = document.getElementById("hud-section");
        this.hudTitle = document.getElementById("hud-title");
        this.hudCamera = document.getElementById("hud-camera");
        this.hudInspiration = document.getElementById("hud-inspiration");
        this.hudPalette = document.getElementById("hud-palette");
        this.metaphorCard = document.getElementById("metaphor-content");
        this.promptCard = document.getElementById("prompt-content");
        this.drawer = document.getElementById("storyboard-drawer");
        this.btnDrawer = document.getElementById("btn-toggle-drawer");
        this.btnCloseDrawer = document.getElementById("btn-close-drawer");
        this.filterSelect = document.getElementById("filter-select");
        this.fileInput = document.getElementById("audio-file-input");
        this.btnUpload = document.getElementById("btn-upload-audio");
        this.btnFullscreen = document.getElementById("btn-fullscreen");
        this.viewport = document.getElementById("mv-viewport");
    }

    initCanvasSize() {
        const resize = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        };
        window.addEventListener("resize", resize);
        resize();
    }

    initParticles() {
        // 创建 150 个莫奈印象派碎笔触粒子与氛围漂浮光斑
        this.brushParticles = [];
        for (let i = 0; i < 160; i++) {
            this.brushParticles.push({
                x: Math.random() * 1920,
                y: Math.random() * 1080,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 25 + 6,
                angle: Math.random() * Math.PI,
                aspect: Math.random() * 2.5 + 1.2,
                alpha: Math.random() * 0.4 + 0.2,
                colorIndex: Math.floor(Math.random() * 5),
                pulse: Math.random() * Math.PI * 2
            });
        }

        // 天气粒子（雨滴、落花、麦芒金屑、萤火虫）
        this.weatherParticles = [];
        for (let i = 0; i < 120; i++) {
            this.weatherParticles.push({
                x: Math.random() * 1920,
                y: Math.random() * 1080,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 1,
                size: Math.random() * 4 + 1.5,
                alpha: Math.random() * 0.7 + 0.3,
                type: 'dust'
            });
        }
    }

    bindEvents() {
        this.btnPlay.addEventListener("click", () => {
            if (this.audio.isPlaying) {
                this.audio.pause();
            } else {
                this.audio.play();
            }
        });

        this.audio.onPlayStateChange = (playing) => {
            this.btnPlay.innerHTML = playing ? 
                `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg><span>暂停</span>` :
                `<svg viewBox="0 0 24 24" width="22" height="22"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg><span>播放 MV</span>`;
        };

        this.audio.onTimeUpdate = (currentTime) => {
            this.updateTimeline(currentTime);
        };

        this.progressBar.addEventListener("click", (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const targetSec = ratio * this.audio.duration;
            this.audio.seek(targetSec);
        });

        this.btnDrawer.addEventListener("click", () => {
            this.toggleDrawer(true);
        });

        this.btnCloseDrawer.addEventListener("click", () => {
            this.toggleDrawer(false);
        });

        this.filterSelect.addEventListener("change", (e) => {
            this.currentFilter = e.target.value;
        });

        this.btnUpload.addEventListener("click", () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                this.audio.loadExternalFile(e.target.files[0]);
                alert("已成功加载外部七里香原曲音频！点击播放开始视听盛宴。");
            }
        });

        this.btnFullscreen.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                this.viewport.requestFullscreen().catch(err => {
                    alert(`全屏失败: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });

        // 键盘空格暂停/播放，左右快进
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                this.btnPlay.click();
            } else if (e.code === "ArrowRight") {
                this.audio.seek(this.audio.currentTime + 5);
            } else if (e.code === "ArrowLeft") {
                this.audio.seek(this.audio.currentTime - 5);
            }
        });
    }

    updateTimeline(seconds) {
        this.time = seconds;
        const progress = (seconds / this.audio.duration) * 100;
        this.progressFill.style.width = `${progress}%`;

        // 格式化时间 00:00 / 04:59
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        this.timeDisplay.innerText = `${m}:${s} / 04:59`;

        // 匹配当前分镜
        const shot = STORYBOARD_DATA.find(item => seconds >= item.timeStart && seconds < item.timeEnd) || STORYBOARD_DATA[STORYBOARD_DATA.length - 1];
        if (shot && shot.id !== this.currentShot.id) {
            this.switchShot(shot);
        }
    }

    switchShot(shot) {
        this.currentShot = shot;

        // 更新歌词与运镜 HUD
        this.lyricCurrent.innerText = shot.lyrics;
        this.lyricCurrent.classList.remove("fade-in-text");
        void this.lyricCurrent.offsetWidth; // 触发 reflow 重启动画
        this.lyricCurrent.classList.add("fade-in-text");

        this.hudShotNumber.innerText = `SHOT ${shot.id.toString().padStart(2, '0')}`;
        this.hudSection.innerText = shot.section;
        this.hudTitle.innerText = shot.title;
        this.hudCamera.innerText = `运镜: ${shot.camera} | 景别: ${shot.shotType}`;
        this.hudInspiration.innerText = `灵感名作: ${shot.monetInspiration}`;

        // 意象与提示词卡片
        this.metaphorCard.innerText = shot.metaphor;
        this.promptCard.innerText = shot.promptMJ;

        // 色彩卡片
        this.hudPalette.innerHTML = shot.palette.map(color => `
            <div class="swatch" style="background-color: ${color};" title="${color}">
                <span class="color-hex">${color}</span>
            </div>
        `).join("");

        // 高亮抽屉中的当前镜头
        const allRows = document.querySelectorAll(".storyboard-card");
        allRows.forEach(row => row.classList.remove("active-shot"));
        const targetCard = document.getElementById(`shot-card-${shot.id}`);
        if (targetCard) {
            targetCard.classList.add("active-shot");
            if (this.isDrawerOpen) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    toggleDrawer(open) {
        this.isDrawerOpen = open;
        if (open) {
            this.drawer.classList.add("open");
        } else {
            this.drawer.classList.remove("open");
        }
    }

    renderDrawer() {
        const container = document.getElementById("drawer-cards-container");
        container.innerHTML = STORYBOARD_DATA.map(shot => `
            <div id="shot-card-${shot.id}" class="storyboard-card ${shot.id === 1 ? 'active-shot' : ''}" onclick="window.mvApp.audio.seek(${shot.timeStart})">
                <div class="card-header">
                    <span class="badge">#${shot.id.toString().padStart(2, '0')}</span>
                    <span class="time-range">${Math.floor(shot.timeStart / 60).toString().padStart(2, '0')}:${Math.floor(shot.timeStart % 60).toString().padStart(2, '0')} - ${Math.floor(shot.timeEnd / 60).toString().padStart(2, '0')}:${Math.floor(shot.timeEnd % 60).toString().padStart(2, '0')}</span>
                    <span class="section-tag">${shot.section}</span>
                </div>
                <h4 class="card-title">${shot.title}</h4>
                <div class="card-lyrics">“${shot.lyrics}”</div>
                <div class="card-detail">
                    <p><strong>莫奈名作：</strong>${shot.monetInspiration}</p>
                    <p><strong>运镜调度：</strong>${shot.camera} (${shot.shotType})</p>
                    <p><strong>动效粒子：</strong>${shot.vfx}</p>
                    <p><strong>意象隐喻：</strong>${shot.metaphor}</p>
                </div>
                <div class="card-palette">
                    ${shot.palette.map(c => `<span class="tiny-swatch" style="background:${c}"></span>`).join("")}
                </div>
            </div>
        `).join("");
    }

    // 核心莫奈动态生成艺术渲染引擎
    startRenderLoop() {
        const render = () => {
            this.renderCanvas();
            this.animFrame = requestAnimationFrame(render);
        };
        render();
    }

    renderCanvas() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (!w || !h) return;

        const palette = this.currentShot.palette;
        const time = this.time;

        // 1. 底层天空与大气渐变 (随着运镜微动)
        const cameraZoom = 1 + Math.sin(time * 0.4) * 0.05;
        const cameraPanX = Math.sin(time * 0.2) * 15;
        const cameraPanY = Math.cos(time * 0.3) * 10;

        this.ctx.save();
        this.ctx.translate(cameraPanX, cameraPanY);

        // 背景渐变
        const skyGrad = this.ctx.createLinearGradient(0, 0, w * 0.2, h);
        skyGrad.addColorStop(0, palette[0]);
        skyGrad.addColorStop(0.5, palette[1]);
        skyGrad.addColorStop(1, palette[2]);
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, w, h);

        // 2. 模拟莫奈厚涂油画的粗糙画布纹理 (Canvas Texture)
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        for (let i = 0; i < 40; i++) {
            const rx = (Math.sin(i * 99 + time * 0.01) * 0.5 + 0.5) * w;
            const ry = (Math.cos(i * 77 + time * 0.01) * 0.5 + 0.5) * h;
            this.ctx.fillRect(rx, ry, 2, 2);
        }

        // 3. 动态地平线与风景轮廓（麦浪/池塘/山丘/树冠）
        this.drawLandscapeShapes(w, h, palette, time);

        // 4. 莫奈印象派短促碎笔触流动粒子 (Impasto Strokes)
        this.drawImpastoBrushstrokes(w, h, palette, time);

        // 5. 天气与环境动态效果（雨丝、水纹涟漪、光斑、落花）
        this.drawWeatherEffects(w, h, palette, time);

        // 6. 镜头晕影与莫奈光影呼吸 (Vignette & Breath)
        this.drawLightingVignette(w, h, palette, time);

        this.ctx.restore();

        // 7. 电影级 2.39:1 宽荧幕黑边
        if (this.cinematicBars) {
            const barH = h * 0.09;
            this.ctx.fillStyle = "#0c0d0e";
            this.ctx.fillRect(0, 0, w, barH);
            this.ctx.fillRect(0, h - barH, w, barH);
        }
    }

    drawLandscapeShapes(w, h, palette, time) {
        const ctx = this.ctx;
        const shotId = this.currentShot.id;

        // 依据当前镜头类型绘制不同自然景深轮廓
        if (shotId <= 2 || shotId === 25 || shotId === 26) {
            // 晨曦远景：宁静塞纳河水面与倒影
            ctx.fillStyle = palette[3] + "55";
            ctx.beginPath();
            ctx.moveTo(0, h * 0.55);
            for (let x = 0; x <= w; x += 40) {
                const wave = Math.sin(x * 0.005 + time) * 15;
                ctx.lineTo(x, h * 0.55 + wave);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();
        } else if (shotId >= 3 && shotId <= 9) {
            // 主歌：阿让特伊起伏的绿丘与罂粟花田
            ctx.fillStyle = palette[2] + "88";
            ctx.beginPath();
            ctx.moveTo(0, h * 0.48);
            ctx.bezierCurveTo(w * 0.3, h * 0.42, w * 0.7, h * 0.62, w, h * 0.45);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            // 罂粟花/草莓朱红点彩
            ctx.fillStyle = palette[4] + "bb";
            for (let i = 0; i < 45; i++) {
                const px = (Math.sin(i * 123) * 0.5 + 0.5) * w;
                const py = h * 0.55 + (Math.cos(i * 321) * 0.5 + 0.5) * (h * 0.4);
                const psize = 3 + (i % 6);
                ctx.beginPath();
                ctx.arc(px, py, psize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if ((shotId >= 10 && shotId <= 15) || (shotId >= 21 && shotId <= 23)) {
            // 副歌：吉维尼睡莲池、日本桥深绿水波
            ctx.fillStyle = palette[2] + "99";
            ctx.beginPath();
            ctx.moveTo(0, h * 0.35);
            ctx.lineTo(w, h * 0.35);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            // 浮动睡莲叶片
            for (let i = 0; i < 16; i++) {
                const lx = (i / 16) * w + Math.sin(time + i) * 10;
                const ly = h * 0.5 + (i % 4) * 60;
                ctx.fillStyle = palette[1] + "aa";
                ctx.beginPath();
                ctx.ellipse(lx, ly, 35, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // 粉白睡莲花瓣点缀
                ctx.fillStyle = palette[3];
                ctx.beginPath();
                ctx.arc(lx - 5, ly - 4, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (shotId >= 16 && shotId <= 20) {
            // 间奏与主歌二：饱满麦浪与干草堆金黄
            ctx.fillStyle = palette[1] + "cc";
            ctx.beginPath();
            ctx.moveTo(0, h * 0.5);
            for (let x = 0; x <= w; x += 30) {
                const sway = Math.sin(x * 0.01 + time * 3) * 18;
                ctx.lineTo(x, h * 0.5 + sway);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            // 干草堆轮廓
            ctx.fillStyle = palette[2] + "ee";
            ctx.beginPath();
            ctx.ellipse(w * 0.72, h * 0.65, 110, 70, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawImpastoBrushstrokes(w, h, palette, time) {
        const ctx = this.ctx;
        const scaleX = w / 1920;
        const scaleY = h / 1080;

        for (let i = 0; i < this.brushParticles.length; i++) {
            const p = this.brushParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.03;

            if (p.x < 0) p.x = 1920;
            if (p.x > 1920) p.x = 0;
            if (p.y < 0) p.y = 1080;
            if (p.y > 1080) p.y = 0;

            const rx = p.x * scaleX;
            const ry = p.y * scaleY;
            const color = palette[p.colorIndex % palette.length];
            const dynamicAlpha = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3);

            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(p.angle + Math.sin(time + i) * 0.1);

            ctx.fillStyle = color;
            ctx.globalAlpha = dynamicAlpha;

            // 莫奈短促厚涂笔触 (矩形油彩块与两端圆角)
            const strokeW = p.size * p.aspect * scaleX;
            const strokeH = p.size * scaleY;
            ctx.beginPath();
            ctx.roundRect(-strokeW / 2, -strokeH / 2, strokeW, strokeH, 4);
            ctx.fill();

            // 笔触高光边缘 (光分法效果)
            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = dynamicAlpha * 0.35;
            ctx.fillRect(-strokeW / 2, -strokeH / 2, strokeW * 0.3, strokeH * 0.4);

            ctx.restore();
        }
    }

    drawWeatherEffects(w, h, palette, time) {
        const ctx = this.ctx;
        const shotId = this.currentShot.id;
        const isRainy = (shotId >= 10 && shotId <= 15) || (shotId >= 21 && shotId <= 22);

        if (isRainy) {
            // 暴雨雨丝效果
            ctx.strokeStyle = "rgba(180, 215, 255, 0.45)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (let i = 0; i < 90; i++) {
                const rx = ((i * 37 + time * 600) % w);
                const ry = ((i * 91 + time * 900) % h);
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 8, ry + 36);
            }
            ctx.stroke();

            // 水面同心圆涟漪
            for (let i = 0; i < 7; i++) {
                const ripX = ((i * 240 + 70) % w);
                const ripY = h * 0.55 + (i * 60) % (h * 0.4);
                const ripR = ((time * 40 + i * 25) % 60);
                const ripAlpha = Math.max(0, 1 - ripR / 60) * 0.5;

                ctx.strokeStyle = `rgba(220, 240, 255, ${ripAlpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(ripX, ripY, ripR * 1.8, ripR * 0.6, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // 晴天风动落花、麦芒与微光光斑 (Bokeh)
            for (let i = 0; i < 40; i++) {
                const bx = (Math.sin(i * 17 + time * 0.3) * 0.5 + 0.5) * w;
                const by = (Math.cos(i * 29 + time * 0.2) * 0.5 + 0.5) * h;
                const bradius = 12 + (i % 5) * 8;
                const grad = ctx.createRadialGradient(bx, by, 0, bx, by, bradius);
                grad.addColorStop(0, "rgba(255, 250, 220, 0.3)");
                grad.addColorStop(0.6, "rgba(255, 230, 180, 0.12)");
                grad.addColorStop(1, "rgba(255, 255, 255, 0)");

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(bx, by, bradius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawLightingVignette(w, h, palette, time) {
        const ctx = this.ctx;
        // 呼吸式柔和暗角
        const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
        vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
        vigGrad.addColorStop(1, "rgba(10, 15, 20, 0.45)");
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, w, h);
    }
}

// 页面加载完成后实例化
window.addEventListener("DOMContentLoaded", () => {
    window.mvApp = new MonetMVController();
});
