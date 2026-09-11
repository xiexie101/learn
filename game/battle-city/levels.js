/**
 * NES Battle City Levels & Map Data
 * 26x26 sub-tile resolution (each sub-tile is 8x8 pixels).
 * Terrain codes:
 * 0 = Empty
 * 1 = Brick
 * 2 = Steel
 * 3 = Water
 * 4 = Trees
 * 5 = Ice
 * 6 = Eagle Base
 */

class LevelManager {
    constructor() {
        this.stages = [
            this.generateStage1(),
            this.generateStage2(),
            this.generateStage3(),
            this.generateStage4(),
            this.generateStage5()
        ];
    }

    createEmptyMap() {
        const map = [];
        for (let r = 0; r < 26; r++) {
            map.push(new Array(26).fill(0));
        }
        this.applyBaseFortress(map);
        return map;
    }

    applyBaseFortress(map) {
        // Eagle Base is at (12, 24) to (13, 25)
        map[24][12] = 6;
        map[24][13] = 6;
        map[25][12] = 6;
        map[25][13] = 6;

        // Base protective brick fortress
        map[23][11] = 1;
        map[23][12] = 1;
        map[23][13] = 1;
        map[23][14] = 1;
        map[24][11] = 1;
        map[24][14] = 1;
        map[25][11] = 1;
        map[25][14] = 1;
    }

    // Classic NES Battle City Stage 1
    generateStage1() {
        const map = this.createEmptyMap();

        // Vertical brick columns
        const cols = [
            { x: [2, 3], yRanges: [[2, 9], [12, 17], [20, 21]] },
            { x: [6, 7], yRanges: [[2, 9], [12, 17]] },
            { x: [10, 11], yRanges: [[4, 9], [14, 17]] },
            { x: [14, 15], yRanges: [[4, 9], [14, 17]] },
            { x: [18, 19], yRanges: [[2, 9], [12, 17]] },
            { x: [22, 23], yRanges: [[2, 9], [12, 17], [20, 21]] }
        ];

        cols.forEach(colDef => {
            colDef.x.forEach(x => {
                colDef.yRanges.forEach(([yStart, yEnd]) => {
                    for (let y = yStart; y <= yEnd; y++) {
                        map[y][x] = 1;
                    }
                });
            });
        });

        // Horizontal steel blocks in the center
        for (let y = 12; y <= 13; y++) {
            for (let x = 12; x <= 13; x++) {
                map[y][x] = 2;
            }
        }

        // Side steel blocks
        for (let y = 10; y <= 11; y++) {
            map[y][0] = 2;
            map[y][1] = 2;
            map[y][24] = 2;
            map[y][25] = 2;
        }

        // Base fortress
        this.applyBaseFortress(map);

        return {
            map: map,
            enemies: [
                'basic', 'basic', 'basic', 'basic', // 4th is bonus
                'basic', 'basic', 'basic', 'basic',
                'fast', 'fast', 'fast',              // 11th is bonus
                'power', 'power', 'power',
                'armor', 'armor', 'armor',          // 18th is bonus
                'armor', 'power', 'fast'
            ],
            bonusIndices: [3, 10, 17]
        };
    }

    // Stage 2: Rivers & Steel Bunkers
    generateStage2() {
        const map = this.createEmptyMap();

        // Water channels
        for (let x = 2; x <= 23; x++) {
            if (x !== 12 && x !== 13) {
                map[8][x] = 3;
                map[9][x] = 3;
            }
        }

        // Brick columns in upper area
        for (let x of [4, 5, 20, 21]) {
            for (let y = 2; y <= 6; y++) {
                map[y][x] = 1;
            }
        }

        // Steel blocks in middle bridge
        for (let y = 12; y <= 13; y++) {
            for (let x of [6, 7, 18, 19]) {
                map[y][x] = 2;
            }
        }

        // Trees along the river banks
        for (let x = 8; x <= 17; x++) {
            if (x !== 12 && x !== 13) {
                map[6][x] = 4;
                map[7][x] = 4;
                map[10][x] = 4;
                map[11][x] = 4;
            }
        }

        // Lower defensive brick walls
        for (let x of [2, 3, 8, 9, 16, 17, 22, 23]) {
            for (let y = 16; y <= 21; y++) {
                map[y][x] = 1;
            }
        }

        this.applyBaseFortress(map);

        return {
            map: map,
            enemies: [
                'basic', 'basic', 'fast', 'basic',
                'fast', 'fast', 'power', 'power',
                'basic', 'fast', 'armor',
                'power', 'power', 'fast',
                'armor', 'armor', 'armor',
                'power', 'fast', 'armor'
            ],
            bonusIndices: [3, 10, 16]
        };
    }

    // Stage 3: Ice Highway & Tree Ambush
    generateStage3() {
        const map = this.createEmptyMap();

        // Central ice roads
        for (let y = 4; y <= 21; y++) {
            for (let x of [10, 11, 14, 15]) {
                map[y][x] = 5;
            }
        }
        for (let x = 2; x <= 23; x++) {
            map[12][x] = 5;
            map[13][x] = 5;
        }

        // Dense tree clusters
        for (let y = 2; y <= 10; y++) {
            for (let x of [4, 5, 20, 21]) {
                map[y][x] = 4;
            }
        }

        // Brick fortress outposts
        for (let y of [4, 5, 16, 17]) {
            for (let x of [0, 1, 24, 25]) {
                map[y][x] = 1;
            }
        }
        for (let y = 16; y <= 20; y++) {
            for (let x of [6, 7, 18, 19]) {
                map[y][x] = 1;
            }
        }

        // Steel centers
        map[6][12] = 2;
        map[6][13] = 2;
        map[7][12] = 2;
        map[7][13] = 2;

        this.applyBaseFortress(map);

        return {
            map: map,
            enemies: [
                'fast', 'fast', 'fast', 'fast',
                'basic', 'fast', 'power', 'power',
                'fast', 'power', 'armor',
                'fast', 'power', 'armor',
                'armor', 'power', 'armor',
                'armor', 'fast', 'armor'
            ],
            bonusIndices: [3, 10, 16]
        };
    }

    // Stage 4: Steel Strongholds & Narrow Chokepoints
    generateStage4() {
        const map = this.createEmptyMap();

        // Steel defensive grids
        for (let y of [4, 5, 14, 15]) {
            for (let x of [2, 3, 10, 11, 14, 15, 22, 23]) {
                map[y][x] = 2;
            }
        }

        // Brick maze lines
        for (let y = 8; y <= 11; y++) {
            for (let x of [4, 5, 8, 9, 16, 17, 20, 21]) {
                map[y][x] = 1;
            }
        }

        // Water ponds
        for (let y of [18, 19]) {
            for (let x of [2, 3, 22, 23]) {
                map[y][x] = 3;
            }
        }

        // Lower tree camouflage
        for (let y = 18; y <= 21; y++) {
            for (let x of [6, 7, 18, 19]) {
                map[y][x] = 4;
            }
        }

        this.applyBaseFortress(map);

        return {
            map: map,
            enemies: [
                'basic', 'power', 'power', 'fast',
                'power', 'fast', 'power', 'armor',
                'power', 'armor', 'armor',
                'power', 'fast', 'power',
                'armor', 'armor', 'power',
                'armor', 'armor', 'armor'
            ],
            bonusIndices: [3, 9, 16]
        };
    }

    // Stage 5: The Ultimate Labyrinth
    generateStage5() {
        const map = this.createEmptyMap();

        // Intricate brick patterns
        for (let y = 2; y <= 21; y += 4) {
            for (let x = 2; x <= 23; x++) {
                if (x % 6 !== 0) {
                    map[y][x] = 1;
                    map[y + 1][x] = 1;
                }
            }
        }

        // Center steel fortress
        for (let y = 10; y <= 13; y++) {
            for (let x of [10, 11, 14, 15]) {
                map[y][x] = 2;
            }
        }

        // Water moats
        for (let x of [6, 7, 18, 19]) {
            map[6][x] = 3;
            map[7][x] = 3;
            map[14][x] = 3;
            map[15][x] = 3;
        }

        // Ice patches
        for (let y = 18; y <= 21; y++) {
            for (let x of [0, 1, 24, 25]) {
                map[y][x] = 5;
            }
        }

        this.applyBaseFortress(map);

        return {
            map: map,
            enemies: [
                'fast', 'power', 'armor', 'fast',
                'power', 'armor', 'fast', 'armor',
                'power', 'armor', 'power',
                'armor', 'fast', 'power',
                'armor', 'armor', 'power',
                'armor', 'armor', 'armor'
            ],
            bonusIndices: [3, 9, 16]
        };
    }

    getStage(num) {
        const idx = (num - 1) % this.stages.length;
        // Deep clone map
        const original = this.stages[idx];
        return {
            map: original.map.map(row => [...row]),
            enemies: [...original.enemies],
            bonusIndices: [...original.bonusIndices],
            stageNumber: num
        };
    }

    // Custom Map LocalStorage Support
    saveCustomMap(map) {
        try {
            localStorage.setItem('battle_city_custom_map', JSON.stringify(map));
            return true;
        } catch (e) {
            console.error("Failed to save custom map:", e);
            return false;
        }
    }

    loadCustomMap() {
        try {
            const data = localStorage.getItem('battle_city_custom_map');
            if (data) {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length === 26) {
                    this.applyBaseFortress(parsed);
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Failed to load custom map:", e);
        }
        return null;
    }
}

// Global level manager singleton
window.levelManager = new LevelManager();
