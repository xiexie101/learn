// ==========================================
// Night Vault - 35 Complete Vaults Database
// Full 5 Acts + Dream Vaults Level Specifications
// ==========================================

export const ACTS = [
  { n: 'I', title: 'The Heist', blurb: 'Dig, climb, run.' },
  { n: 'II', title: 'Upside', blurb: 'Levers turn the vault over.',
    story: 'Somebody built this vault on a pivot. Step on a lever and the whole thing turns over. You and the guards fall; the gold stays bolted where it was. From here on the way out is a vault door, and it opens when the last bar is yours.' },
  { n: 'III', title: 'Freefall', blurb: 'Your shovel is now a button.',
    story: 'Your shovel is gone. In its place is a button. FLIP turns the vault over whenever your feet are on something. Guards can’t flip, so every turn of the vault is your move and their problem.' },
  { n: 'IV', title: 'Tilt', blurb: 'The vault was a toy all along.',
    story: 'Zoom out. The vault was never a building. It’s a pocket puzzle with a little thief rattling around inside, and you’re the one holding it. The pad doesn’t move the thief any more. It tilts the whole box, and everything slides until it hits something.' },
  { n: 'V', title: 'Put It Back', blurb: 'Side B: an arcade game.',
    story: 'Dawn is coming, and the gold was never yours to keep. Turn the toy over: Side B is an arcade game. Throw every bar back up into the vault before sunrise. Bars that bounce off something fall back down, so catch them before they hit the floor. Drag anywhere on the board to run.' },
];

export const ENDING = 'Every bar is back in its slot. The sun is up, the vault is locked, and nobody will ever know you were here.';

export const TOTAL_VAULTS = 35;

export const LEVELS = [
  {
    "name": "Ground Floor",
    "hint": "Grab every gold bar. Then a ladder appears: climb it out the top.",
    "act": 0,
    "mode": "run",
    "map": [
      "                  S ",
      "                  S ",
      "  $         $     S ",
      "####H#########H#####",
      "    H         H     ",
      "    H  $      H     ",
      "    H#####    H     ",
      "    H     ----H     ",
      "    H             $ ",
      "    H        H######",
      "    H        H      ",
      " P  H    $   H   $  ",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Dig Down",
    "hint": "DIG blasts the brick below-left or below-right. Drop through, or trap a guard in the hole.",
    "act": 0,
    "mode": "run",
    "map": [
      "                 S  ",
      "                 S  ",
      "                 S $",
      "             ####H##",
      "            @    H  ",
      "            @    H  ",
      "            @    H  ",
      " P    $     @  $ H  ",
      "#################H##",
      "                 H  ",
      "                 H  ",
      "                 H  ",
      "    $     $   E  H  ",
      "####################"
    ]
  },
  {
    "name": "Wire Walk",
    "hint": "Hang from wires to cross gaps. Press down to let go.",
    "act": 0,
    "mode": "run",
    "map": [
      "                   S",
      "                   S",
      "                   S",
      "$     -------- E  $S",
      "##H###        ###H##",
      "  H              H  ",
      "  H              H  ",
      "  H      $       H  ",
      "  H    ###H##    H  ",
      "  H       H      H  ",
      "  H       H  ~---H  ",
      "  H       H      H  ",
      "  H P$  E H   $  H  ",
      "####################"
    ]
  },
  {
    "name": "Cellar",
    "hint": "Some gold floats between floors. Dig a hole above it and fall through.",
    "act": 0,
    "mode": "run",
    "map": [
      "          S         ",
      "          S         ",
      "          S         ",
      "    P  $  S     $   ",
      "#H##################",
      " H                  ",
      " H            $     ",
      " H          $   E   ",
      "##################H#",
      "                  H ",
      "     $            H ",
      "   $    E      $  H ",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Long Drop",
    "hint": "Wires catch you when you fall.",
    "act": 0,
    "mode": "run",
    "map": [
      "         S          ",
      "   P     S         $",
      "#H################H#",
      " H    @      @    H ",
      " H    @      @    H ",
      " H--~-@      @    H ",
      " H    @---~--@$   H ",
      " H    @      @####H ",
      " H    @      @    H ",
      " H--~-@      @    H ",
      " H    @-~----@    H ",
      " H    @      @    H ",
      " H  E     E$   E  H ",
      "####################"
    ]
  },
  {
    "name": "Crossfire",
    "hint": "Guards are slower than you. Lead them into holes.",
    "act": 0,
    "mode": "run",
    "map": [
      "    S          S    ",
      "    S          S    ",
      "    S          S    ",
      " $  S  P    $  S  $ ",
      "H#########H########H",
      "H         H        H",
      "H         H        H",
      "H  $      H   E $  H",
      "H #######H######## H",
      "H        H         H",
      "H        H         H",
      "H E  $   H    $  E H",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Steel Cage",
    "hint": "Steel plates cannot be dug. Find the brick.",
    "act": 0,
    "mode": "run",
    "map": [
      "                   S",
      "                   S",
      "                   S",
      "  P         $      S",
      "@@@@@@@@####@@@@@@H@",
      "                  H ",
      "         $        H ",
      "  $             E H ",
      "@H@###@@@@@@@@###@@@",
      " H                  ",
      " H  $          $    ",
      " H      $ E      $  ",
      "@@@@@@########@@@@@@",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Clockwork",
    "hint": "",
    "act": 0,
    "mode": "run",
    "map": [
      "                   S",
      "$     ---~----  $  S",
      "#H####        ####H#",
      " H                H ",
      " H                H ",
      " H  $         E$  H ",
      " H  #####H######  H ",
      " H       H        H ",
      " H       H        H ",
      " H      --~-     EH ",
      "#H######    ######H#",
      " H                H ",
      " H $  E  $ P    $ H ",
      "####################"
    ]
  },
  {
    "name": "Deep Mine",
    "hint": "Dig down one floor at a time. The only way back up is the ladder.",
    "act": 0,
    "mode": "run",
    "map": [
      "                 @S ",
      "                 @S ",
      " P             $  H ",
      "#################@H#",
      "                 @H ",
      "   $    E   $    @H ",
      "#################@H ",
      "                 @H ",
      "      $       $  @H ",
      "#################@H ",
      "                 @H ",
      "  $      $ E      H ",
      "#################@H@",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Gauntlet",
    "hint": "",
    "act": 0,
    "mode": "run",
    "map": [
      "         S          ",
      "         S          ",
      "         S          ",
      "P $   $  S     $    ",
      "##################H#",
      "   -----~---------H ",
      "                  H ",
      "     $       $E   H ",
      "#H########H#########",
      " H--------H---~--   ",
      " H        H         ",
      " H  $ E   H $   E  $",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Vault Door",
    "hint": "The vault has one brick roof and one brick floor.",
    "act": 0,
    "mode": "run",
    "map": [
      "                   S",
      "                   S",
      "$               E $S",
      "##H##@@@@##@@@@##H##",
      "  H  @        @  H  ",
      "  H  @        @  H  ",
      "  H  @ $  E$  @  H  ",
      "  H  @######H#@  H  ",
      "  H  @      H @  H  ",
      "  H  @   $  H @  H  ",
      "  H  @@@#@@@@@@  H  ",
      "  HE$   P      $ H  ",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Grand Heist",
    "hint": "",
    "act": 0,
    "mode": "run",
    "map": [
      "                   S",
      "$    -G--~-----  $ S",
      "#H###          ###H#",
      " H                H ",
      " H                H ",
      " H  $     $ E  $  H ",
      " H ######H####### H ",
      " H       H        H ",
      " H       H    $   H ",
      " HE      H       EH ",
      "#H####H---~--#####H#",
      " H    H           H ",
      " H $  H E   P   $ H ",
      "####################"
    ]
  },
  {
    "name": "Turnover",
    "hint": "Step on the lever. The whole vault turns over and everything falls.",
    "act": 1,
    "mode": "run",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "@@@@@@@@@@@@@@@@@@@@",
      "@@@@@@@@@@@@@@@@@@@@",
      "   $    $    $    F ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "P    F     $    $ X ",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Baskets",
    "hint": "Lure the guards under the baskets, then flip. They fall in and stay put.",
    "act": 1,
    "mode": "run",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "@@@@@@@@@@@@@@@@@@@@",
      "F    $    $   $    X",
      "                    ",
      "                    ",
      "  @@@@@@@  @@@@@@@  ",
      "  @     @  @     @  ",
      "  @     @  @     @  ",
      "                    ",
      "                    ",
      "                    ",
      " E $     F P   $  E$",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Elevator",
    "hint": "Each lever drops you somewhere new. Work out the order.",
    "act": 1,
    "mode": "run",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "#####    HH    #####",
      "         HH  $      ",
      "    E$   HH       F ",
      "#######  HH  #######",
      "  $      HH   $     ",
      "       --HH--       ",
      "         HH         ",
      " F       HH      $  ",
      "#######  HH  #######",
      "         HH     F   ",
      "   F  $  HH P  X    ",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Trapdoor",
    "hint": "Dig through the floor to reach the lever room. Holes still refill.",
    "act": 1,
    "mode": "run",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "@         F        @",
      "@P   $     E  $   X@",
      "@##################@",
      "@   $    $     $   @",
      "@                  @",
      "@                  @",
      "@                  @",
      "@                  @",
      "@                  @",
      "@                  @",
      "@F $        E   $  @",
      "@@@@@@@@@@@@@@@@@@@@",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Pendulum",
    "hint": "Each pillar blocks only one way up. Swing between them.",
    "act": 1,
    "mode": "run",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "####################",
      "  $    $ F   @F $$ X",
      "             @      ",
      "             @      ",
      "             @      ",
      "             @      ",
      "      @             ",
      "      @             ",
      "      @             ",
      "      @             ",
      "P$  F @ E $$E  F    ",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Topsy Turvy",
    "hint": "The door hangs from a ceiling. Get it under your feet.",
    "act": 1,
    "mode": "run",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "####################",
      "  $  H F   $  H   $ ",
      "     H        H     ",
      "     H        H     ",
      "     H        H     ",
      " $   H   $    H E   ",
      "#####H########H#####",
      "   $ H    X   H $   ",
      "     H        H     ",
      "     H        H     ",
      " E$  H   P  F H  $E ",
      "####################",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Freefall",
    "hint": "Press FLIP to turn the vault over. You can flip whenever your feet are on something.",
    "act": 2,
    "mode": "flip",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      " $                 X",
      "                    ",
      "                    ",
      "    $          $    ",
      "  @@@@@      @@@@@  ",
      "    $          $    ",
      "         $          ",
      "       @@@@@        ",
      "         $          ",
      "                    ",
      "                    ",
      " P                $ ",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Ceiling Walk",
    "hint": "The middle floor has gaps. Flip above one and you fall straight through to the other room.",
    "act": 2,
    "mode": "flip",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "   $       $     $  ",
      "                    ",
      "                    ",
      "        @@          ",
      "         $         X",
      "@@@@@  @@@@@  @@@@@@",
      "@@@@@  @@@@@  @@@@@@",
      "                    ",
      "   @@          @@   ",
      "                    ",
      "                    ",
      "P $      $      $ E ",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Guard Drop",
    "hint": "Flip while the guards stand under a basket.",
    "act": 2,
    "mode": "flip",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "X$       $        $ ",
      "                    ",
      "                    ",
      "                    ",
      "  @@@@@@    @@@@@@  ",
      "  @    @    @    @  ",
      "  @ $  @  $ @ $  @  ",
      "         @@         ",
      "         HH         ",
      "         HH         ",
      "                    ",
      " $ E     P      E $ ",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Hourglass",
    "hint": "Two rooms, one neck. Mind who falls through it with you.",
    "act": 2,
    "mode": "flip",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "  E      $       E  ",
      "    $   ----   $    ",
      "   @@@        @@@   ",
      "                    ",
      " $       X        $ ",
      "@@@@@@@@@  @@@@@@@@@",
      "@@@@@@@@@  @@@@@@@@@",
      " $                $ ",
      "                    ",
      "   @@@        @@@   ",
      "    $   ----   $    ",
      " P        $       E ",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Mirror Maze",
    "hint": "Last flip of the night. The door can only be reached one way up.",
    "act": 2,
    "mode": "flip",
    "map": [
      "@@@@@@@@@@@@@@@@@@@@",
      "P              E $  ",
      "         $          ",
      "  $    @@@@@@    $  ",
      "@@@@@          @@@@@",
      "      H   $E H      ",
      "      H-~----H      ",
      "      H      H      ",
      "      H      H      ",
      "@@@@@    $     @@@@@",
      "  $    @@@@@@    $  ",
      "          @         ",
      "  $ E              X",
      "@@@@@@@@@@@@@@@@@@@@"
    ]
  },
  {
    "name": "Toy Box",
    "hint": "The pad tilts the whole box now. Everything slides until it hits something. Grab the gold, then drop into the hatch.",
    "act": 3,
    "mode": "tilt",
    "map": [
      "@@@@@@@@@@@@",
      "@    @@    @",
      "@ @      @ @",
      "@@  @  @  @@",
      "@   $      @",
      "@$ $ @@    @",
      "@@ @    @ @@",
      "@ @      @ @",
      "@   P    X @",
      "@@@@@@@@@@@@"
    ],
    "par": 6
  },
  {
    "name": "Rattle",
    "hint": "Some slides can’t be taken back. UNDO can.",
    "act": 3,
    "mode": "tilt",
    "map": [
      "@@@@@@@@@@@@",
      "@          @",
      "@  @ @@ @  @",
      "@    @@    @",
      "@@  @  @  @@",
      "@       $$$@",
      "@          @",
      "@  @    @  @",
      "@@ X @@P $@@",
      "@@@@@@@@@@@@"
    ],
    "par": 9
  },
  {
    "name": "Company",
    "hint": "Guards slide too. If one ends up pressed against you, you’re caught.",
    "act": 3,
    "mode": "tilt",
    "map": [
      "@@@@@@@@@@@@",
      "@  $       @",
      "@  $@  @   @",
      "@ @$ X     @",
      "@    @@    @",
      "@   $      @",
      "@@   @@   @@",
      "@  @ @@ @  @",
      "@   P@@  E @",
      "@@@@@@@@@@@@"
    ],
    "par": 7
  },
  {
    "name": "Pothole",
    "hint": "A hole swallows the first thing that slides onto it. Let a guard go first.",
    "act": 3,
    "mode": "tilt",
    "map": [
      "@@@@@@@@@@@@",
      "@    @@$ X$@",
      "@ @      @ @",
      "@$         @",
      "@@@ o@@  @@@",
      "@      o   @",
      "@   @  @   @",
      "@E         @",
      "@@ E    P @@",
      "@@@@@@@@@@@@"
    ],
    "par": 8
  },
  {
    "name": "Marbles",
    "hint": "Count the slides before you tilt. HINT asks the vault.",
    "act": 3,
    "mode": "tilt",
    "map": [
      "@@@@@@@@@@@@@",
      "@     @  $  @",
      "@  @@   @@ X@",
      "@$@     o @ @",
      "@  @ @ @    @",
      "@@P  $$   E@@",
      "@ @ @  o  @ @",
      "@    @ @    @",
      "@   @  E@   @",
      "@    @ @   E@",
      "@@@@@@@@@@@@@"
    ],
    "par": 13
  },
  {
    "name": "Snow Globe",
    "hint": "Last toy of the night. Shake it gently.",
    "act": 3,
    "mode": "tilt",
    "map": [
      "@@@@@@@@@@@@@",
      "@@    @ $X @@",
      "@ $@  E  @  @",
      "@@ @o @  @ @@",
      "@E @     @  @",
      "@@         @@",
      "@   @   @  $@",
      "@     @o P $@",
      "@  @     @  @",
      "@     @  E  @",
      "@@@@@@@@@@@@@"
    ],
    "par": 16
  },
  {
    "name": "Put It Back",
    "hint": "THROW sends a bar straight up. Fill every slot. Bars that bounce off something fall back down, so catch them.",
    "act": 4,
    "mode": "arcade",
    "map": [
      "@@@@@@@@@@@@",
      "@@O@@@O@@O@@",
      "@          @",
      "@     #    @",
      "@          @",
      "@          @",
      "@  E E E E @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@    P     @"
    ],
    "arc": {
      "bars": 6,
      "hearts": 3,
      "march": 0.9,
      "sway": 1.5,
      "fire": 0
    }
  },
  {
    "name": "Night Watch",
    "hint": "Guards march in a line and shine their flashlights down at you. Three hits and you’re caught.",
    "act": 4,
    "mode": "arcade",
    "map": [
      "@@@@@@@@@@@@",
      "@@O@O@@O@O@@",
      "@          @",
      "@   #  #   @",
      "@          @",
      "@  E E E E @",
      "@          @",
      "@   E E E  @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@     P    @"
    ],
    "arc": {
      "bars": 9,
      "hearts": 3,
      "march": 1.3,
      "sway": 1.2,
      "drop": 0.3,
      "maxDrop": 2.5,
      "fire": 1.5
    }
  },
  {
    "name": "Ricochet",
    "hint": "Straight shots won’t reach these slots. Bank your throws off the mirrors.",
    "act": 4,
    "mode": "arcade",
    "map": [
      "@@@@@@@@@@@@",
      "@O@@@OO@@@O@",
      "@ @@@  @@@ @",
      "@ @@@  @@@ @",
      "@\\ \\@  @/ /@",
      "@ /  /\\  \\ @",
      "@          @",
      "@          @",
      "@          @",
      "@  E E E E @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@     P    @"
    ],
    "arc": {
      "bars": 9,
      "hearts": 3,
      "march": 1,
      "sway": 1.5,
      "fire": 2.2
    }
  },
  {
    "name": "Divebomb",
    "hint": "The vault door slides. Lead your throws, and bonk the guards who dive at you.",
    "act": 4,
    "mode": "arcade",
    "map": [
      "@@@@@@@@@@@@",
      "@@@O@@O@@O@@",
      "@          @",
      "@          @",
      "@          @",
      "@  D D D D @",
      "@          @",
      "@   E   E  @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@     P    @"
    ],
    "arc": {
      "bars": 9,
      "hearts": 3,
      "march": 0.8,
      "sway": 1,
      "fire": 2.8,
      "diveEvery": 1.7,
      "slide": {
        "amp": 1.6,
        "speed": 0.9
      }
    }
  },
  {
    "name": "Bricklayers",
    "hint": "They rebuild the wall as fast as you knock it down. Bonk the bricklayers first.",
    "act": 4,
    "mode": "arcade",
    "map": [
      "@@@@@@@@@@@@",
      "@@O@O@@O@O@@",
      "@          @",
      "@##########@",
      "@  B    B  @",
      "@          @",
      "@          @",
      "@          @",
      "@  E E E E @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@     P    @"
    ],
    "arc": {
      "bars": 12,
      "hearts": 3,
      "march": 1.1,
      "sway": 1.3,
      "fire": 2.4,
      "layEvery": 1.6
    }
  },
  {
    "name": "Daybreak",
    "hint": "The vault door itself. Its slots spin around the dial. Fill all eight before sunrise.",
    "act": 4,
    "mode": "arcade",
    "map": [
      "@@@@@@@@@@@@",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@          @",
      "@     P    @"
    ],
    "arc": {
      "bars": 14,
      "hearts": 4
    },
    "boss": true
  }
];

// CommonJS compatibility for Node.js / tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ACTS, ENDING, TOTAL_VAULTS, LEVELS };
}
