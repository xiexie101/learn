// 单词数据
const allWords = [
    // 人物与家庭 (People & Family)
    // {
    //     english: 'Mother',
    //     chinese: '妈妈',
    //     image: 'https://images.unsplash.com/photo-1547212371-eb5e6a4b590c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'people'
    // },
    // {
    //     english: 'Father',
    //     chinese: '爸爸',
    //     image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'people'
    // },
    // {
    //     english: 'Baby',
    //     chinese: '宝宝',
    //     image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'people'
    // },
    
    // 动物 (Animals)
    {
        english: 'Cat',
        chinese: '猫',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'animals'
    },
    {
        english: 'Dog',
        chinese: '狗',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'animals'
    },
    {
        english: 'Panda',
        chinese: '熊猫',
        image: 'https://images.unsplash.com/photo-1527118732049-c88155f2107c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'animals'
    },
    
    // 身体部位 (Body Parts)
    {
        english: 'Eye',
        chinese: '眼睛',
        image: 'https://images.unsplash.com/photo-1496737018672-b1a6be2e949c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'bodyparts'
    },
    
    // 食物与饮料 (Food & Drink)
    {
        english: 'Apple',
        chinese: '苹果',
        image: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'food'
    },
    {
        english: 'Banana',
        chinese: '香蕉',
        image: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'food'
    },
    
    // 颜色 (Colors)
    // {
    //     english: 'Red',
    //     chinese: '红色',
    //     image: 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'colors'
    // },
    
    // 数字 (Numbers)
    {
        english: 'One',
        chinese: '一',
        image: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'numbers'
    },
    
    // 形状 (Shapes)
    {
        english: 'Circle',
        chinese: '圆形',
        image: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'shapes'
    },
    
    // 恐龙
    {
        english: 'Dinosaur',
        chinese: '恐龙',
        image: 'https://images.unsplash.com/photo-1525877442103-5ddb2089b2bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'dinosaurs'
    },
    
    // 交通工具 (Vehicles & Transportation)
    {
        english: 'Car',
        chinese: '小汽车',
        image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        category: 'vehicles'
    },
    {
        english: 'Bus',
        chinese: '巴士',
        image: './images/bus.png',
        category: 'vehicles'
    },
    // {
    //     english: 'School bus',
    //     chinese: '校车',
    //     image: 'https://images.unsplash.com/photo-1603104397975-11014728d15a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    {
        english: 'Truck',
        chinese: '卡车',
        image: './images/piece_0_2.png',
        category: 'vehicles'
    },
    {
        english: 'Fire engine',
        chinese: '消防车',
        image: './images/piece_1_0.png',
        category: 'vehicles'
    },
    {
        english: 'Dump truck',
        chinese: '工程车',
        image: './images/piece_1_1.png',
        category: 'vehicles'
    },
    {
        english: 'Police car',
        chinese: '警车',
        image: './images/piece_1_2.png',
        category: 'vehicles'
    },
    {
        english: 'Ambulance',
        chinese: '救护车',
        image: './images/piece_2_0.png',
        category: 'vehicles'
    },
    {
        english: 'Motorbike',
        chinese: '摩托车',
        image: './images/piece_2_1.png',
        category: 'vehicles'
    },
    {
        english: 'Bike',
        chinese: '自行车',
        image: './images/piece_2_2.png',
        category: 'vehicles'
    }
    // {
    //     english: 'Train',
    //     chinese: '火车',
    //     image: 'https://images.unsplash.com/photo-1550907249-f61da9fe66c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Plane',
    //     chinese: '飞机',
    //     image: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Ship',
    //     chinese: '船',
    //     image: 'https://images.unsplash.com/photo-1520937152144-7fd5ff7b1439?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Metro',
    //     chinese: '地铁',
    //     image: 'https://images.unsplash.com/photo-1515695455516-6797055c3334?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Taxi',
    //     chinese: '出租车',
    //     image: 'https://images.unsplash.com/photo-1554461096-e85be8948b39?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Wheel',
    //     chinese: '轮子',
    //     image: 'https://images.unsplash.com/photo-1530883374232-2d5eaf326cb7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Door',
    //     chinese: '车门',
    //     image: 'https://images.unsplash.com/photo-1535655685871-dc8158ff167e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Window',
    //     chinese: '车窗',
    //     image: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Seat',
    //     chinese: '座位',
    //     image: 'https://images.unsplash.com/photo-1597743447377-16c5dd2bc0f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Light',
    //     chinese: '车灯',
    //     image: 'https://images.unsplash.com/photo-1514878954891-5d0ead0dadf0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Road',
    //     chinese: '马路',
    //     image: 'https://images.unsplash.com/photo-1516822003754-cca485356ecb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Traffic light',
    //     chinese: '红绿灯',
    //     image: 'https://images.unsplash.com/photo-1446221304953-f8a01e9e6438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Garage',
    //     chinese: '车库',
    //     image: 'https://images.unsplash.com/photo-1562051036-e0eea191d42f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Station',
    //     chinese: '车站',
    //     image: 'https://images.unsplash.com/photo-1517522628113-2020a25dbc3c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // },
    // {
    //     english: 'Airport',
    //     chinese: '机场',
    //     image: 'https://images.unsplash.com/photo-1523367806339-27ad57bd9311?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    //     category: 'vehicles'
    // }
]; 