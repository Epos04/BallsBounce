// UI Elements
const moneyText = document.getElementById('money');
const levelText = document.getElementById('level');
const targetText = document.getElementById('target');
const addBallCostText = document.getElementById('addBallCost');
const addPadCostText = document.getElementById('addPadCost');
const mergeCostText = document.getElementById('mergeCost');
const mergeBtn = document.getElementById('mergeBtn');
const addBallBtn = document.getElementById('addBallBtn');
const addPadBtn = document.getElementById('addPadBtn');

const levelLayouts = [
    // Level 1: U-shape
    {
        pads: [
            { x: 200, y: 550, w: 300, h: 10 }, // Bottom
        ],
        walls: [
            { x: 50, y: 450, w: 10, h: 200 }, // Left
            { x: 350, y: 450, w: 10, h: 200 }  // Right
        ]
    },
    // Level 2: O-shape
    {
        pads: [
            { x: 200, y: 550, w: 300, h: 10 }, // Bottom
            { x: 200, y: 150, w: 300, h: 10 }  // Top
        ],
        walls: [
            { x: 50, y: 350, w: 10, h: 400 }, // Left
            { x: 350, y: 350, w: 10, h: 400 } // Right
        ]
    },
    // Level 3: S-shape
    {
        pads: [
            { x: 150, y: 550, w: 200, h: 10 }, // Bottom-left
            { x: 200, y: 350, w: 200, h: 10 }, // Middle
            { x: 250, y: 150, w: 200, h: 10 }  // Top-right
        ],
        walls: [
            { x: 50, y: 450, w: 10, h: 200 }, // Middle-left
            { x: 350, y: 250, w: 10, h: 200 } // Middle-right
        ]
    }
];

const COLORS = [
    0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF,
    0xFFA500, 0x800080, 0x008000, 0xFFC0CB
];

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Create textures
        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('ball', 16, 16);

        graphics.fillStyle(0x8B4513);
        graphics.fillRect(0, 0, 1, 1); // Use a 1x1 texture and scale it
        graphics.generateTexture('pad', 1, 1);
        graphics.destroy();
    }

    create() {
        // Background gradient
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4682B4, 0x4682B4, 1);
        graphics.fillRect(0, 0, this.game.config.width, this.game.config.height);

        // Spawner tube
        this.add.rectangle(this.game.config.width / 2, 25, 50, 50, 0xA9A9A9).setStrokeStyle(2, 0x696969);

        // Game variables
        this.money = 0;
        this.level = 1;
        this.targetMoney = 1000;
        this.addBallCost = 10;
        this.addPadCost = 100;
        this.mergeCost = 200;

        // Create groups for balls and pads
        this.balls = this.physics.add.group();
        this.pads = this.physics.add.staticGroup();
        this.walls = this.physics.add.staticGroup();

        // Initial setup
        this.loadLevel();
        this.updateUI();

        // Add a ball
        this.addBall();

        // Particle emitter
        this.emitter = this.add.particles(0, 0, 'ball', {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 500
        });

        // Collision handlers
        this.physics.add.collider(this.balls, this.pads, this.handleBounce, null, this);
        this.physics.add.collider(this.balls, this.walls);

        // UI Event Listeners
        addBallBtn.addEventListener('click', () => {
            if (this.money >= this.addBallCost) {
                this.money -= this.addBallCost;
                this.addBallCost = Math.ceil(this.addBallCost * 1.2);
                this.addBall();
                this.updateUI();
            }
        });

        addPadBtn.addEventListener('click', () => {
            if (this.money >= this.addPadCost) {
                this.money -= this.addPadCost;
                this.addPadCost = Math.ceil(this.addPadCost * 1.5);
                const x = Phaser.Math.Between(100, 300);
                const y = Phaser.Math.Between(200, 500);
                const newPad = this.pads.create(x, y, 'pad').setDisplaySize(100, 10);
                newPad.refreshBody();
                this.updateUI();
            }
        });

        mergeBtn.addEventListener('click', () => {
            if (this.money >= this.mergeCost) {
                const mergeable = this.findMergeableBalls();
                if (mergeable) {
                    this.money -= this.mergeCost;
                    this.mergeCost = Math.ceil(this.mergeCost * 1.8);

                    const newLevel = mergeable[0].getData('level') + 1;
                    const newX = (mergeable[0].x + mergeable[1].x) / 2;

                    mergeable[0].destroy();
                    mergeable[1].destroy();

                    this.addBall(newLevel, newX);
                    this.updateUI();
                }
            }
        });
    }

    update() {
        // Respawn balls that fall off the screen
        this.balls.children.each(ball => {
            if (ball.y > this.game.config.height) {
                this.respawnBall(ball);
            }
        });

        // Check for level completion
        if (this.money >= this.targetMoney) {
            this.level++;
            this.targetMoney *= 2;
            alert(`Level ${this.level - 1} complete! Starting level ${this.level}.`);
            this.loadLevel();
        }
    }

    handleBounce(ball, pad) {
        this.money += 1 * Math.pow(2, ball.getData('level') - 1);
        this.updateUI();

        this.emitter.setTint(ball.tintTopLeft); // Match particle color to ball color
        this.emitter.explode(20, ball.x, ball.y);
    }

    addBall(level = 1, x = null) {
        const ballX = x || this.game.config.width / 2 + (Math.random() - 0.5) * 20;
        const ball = this.balls.create(ballX, 50, 'ball');
        ball.setTint(COLORS[level - 1] || 0x000000);
        ball.setData('level', level);
        ball.setBounce(1);
    }

    respawnBall(ball) {
        ball.setPosition(this.game.config.width / 2 + (Math.random() - 0.5) * 20, 50);
        ball.setVelocity(0, 0);
    }

    loadLevel() {
        this.pads.clear(true, true);
        this.walls.clear(true, true);
        const layout = levelLayouts[this.level - 1] || levelLayouts[0];

        // Load all pads for the level
        layout.pads.forEach(padData => {
            const pad = this.pads.create(padData.x, padData.y, 'pad').setDisplaySize(padData.w, padData.h);
            pad.refreshBody();
        });

        // Load walls
        layout.walls.forEach(wallData => {
            const wall = this.walls.create(wallData.x, wallData.y, null).setSize(wallData.w, wallData.h).setVisible(false);
            wall.refreshBody();
        });
    }

    updateUI() {
        moneyText.textContent = this.money.toFixed(0);
        levelText.textContent = this.level;
        targetText.textContent = this.targetMoney;
        addBallCostText.textContent = this.addBallCost;
        addPadCostText.textContent = this.addPadCost;
        mergeCostText.textContent = this.mergeCost;
    }

    findMergeableBalls() {
        const ballsByLevel = {};
        this.balls.children.each(ball => {
            const level = ball.getData('level');
            if (!ballsByLevel[level]) {
                ballsByLevel[level] = [];
            }
            ballsByLevel[level].push(ball);
        });

        for (const level in ballsByLevel) {
            if (ballsByLevel[level].length >= 2) {
                return [ballsByLevel[level][0], ballsByLevel[level][1]];
            }
        }
        return null;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);
