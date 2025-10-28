// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mergeInstructions = document.getElementById('mergeInstructions');

// Game constants
const GRAVITY = 0.5;
const COLORS = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#008000', '#FFC0CB'
];

// Set canvas dimensions
canvas.width = 400;
canvas.height = 600;

const levelLayouts = [
    // Level 1: U-shape
    [
        { x: 50, y: 550 }, { x: 150, y: 550 }, { x: 250, y: 550 },
        { x: 50, y: 450 }, { x: 50, y: 350 }, { x: 50, y: 250 },
        { x: 250, y: 450 }, { x: 250, y: 350 }, { x: 250, y: 250 }
    ],
    // Level 2: O-shape
    [
        { x: 50, y: 550 }, { x: 150, y: 550 }, { x: 250, y: 550 },
        { x: 50, y: 450 }, { x: 50, y: 350 }, { x: 50, y: 250 },
        { x: 250, y: 450 }, { x: 250, y: 350 }, { x: 250, y: 250 },
        { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 250, y: 150 }
    ],
    // Level 3: S-shape
    [
        { x: 50, y: 550 }, { x: 150, y: 550 }, { x: 250, y: 550 },
        { x: 50, y: 450 }, { x: 50, y: 350 },
        { x: 150, y: 350 }, { x: 250, y: 350 },
        { x: 250, y: 250 }, { x: 250, y: 150 },
        { x: 50, y: 150 }, { x: 150, y: 150 }
    ]
];

class Game {
    constructor() {
        this.balls = [];
        this.pads = [];
        this.money = 0;
        this.level = 1;
        this.targetMoney = 1000;
        this.addBallCost = 10;
        this.addPadCost = 100;
        this.selectedBalls = [];
        this.particles = [];

        this.loadLevel();
    }

    loadLevel() {
        this.pads = [];
        const layout = levelLayouts[this.level - 1] || levelLayouts[0];
        this.pads.push(new Pad(layout[0].x, layout[0].y));
        if (this.balls.length === 0) {
            this.balls.push(new Ball(canvas.width / 2 + (Math.random() - 0.5) * 20, 50, 1));
        }
        this.updateUI();
    }

    update() {
        // Update all game objects
        const layout = levelLayouts[this.level - 1] || levelLayouts[0];
        const minX = Math.min(...layout.map(p => p.x));
        const maxX = Math.max(...layout.map(p => p.x + 100));

        this.balls.forEach(ball => {
            ball.update(this.pads);
            if (ball.y > canvas.height || ball.x < minX || ball.x > maxX) {
                ball.reset();
            }
        });

        // Update particles
        this.particles = this.particles.filter(p => p.lifespan > 0);
        this.particles.forEach(p => p.update());

        // Check for level completion
        if (this.money >= this.targetMoney) {
            this.level++;
            this.targetMoney *= 2;
            alert(`Level ${this.level - 1} complete! Starting level ${this.level}.`);
            this.loadLevel();
        }
    }

    draw() {
        // Draw background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#4682B4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the tube
        this.drawTube();

        // Draw all game objects
        this.pads.forEach(pad => pad.draw());
        this.balls.forEach(ball => ball.draw());
        this.particles.forEach(p => p.draw());
    }

    updateUI() {
        document.getElementById('money').textContent = this.money.toFixed(0);
        document.getElementById('level').textContent = this.level;
        document.getElementById('target').textContent = this.targetMoney;
        document.getElementById('addBallCost').textContent = this.addBallCost;
        document.getElementById('addPadCost').textContent = this.addPadCost;
        this.updateMergeInstructions();
    }

    updateMergeInstructions() {
        switch (this.selectedBalls.length) {
            case 0:
                mergeInstructions.textContent = "Click a ball to select it for merging.";
                break;
            case 1:
                mergeInstructions.textContent = "Select another ball of the same level.";
                break;
            case 2:
                mergeInstructions.textContent = "Click 'Merge Balls' to combine them!";
                break;
            default:
                mergeInstructions.textContent = "";
        }
    }

    drawTube() {
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(canvas.width / 2 - 25, 0, 50, 50);
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 25, 0, 50, 50);
    }
}

class Ball {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.radius = 8;
        this.dx = (Math.random() - 0.5) * 5;
        this.dy = 0;
        this.color = COLORS[level - 1] || '#000000';
        this.selected = false;
    }

    update(pads) {
        // Apply gravity
        this.dy += GRAVITY;

        // Move the ball
        this.x += this.dx;
        this.y += this.dy;

        // Pad collisions
        pads.forEach(pad => {
            if (
                this.y + this.radius > pad.y &&
                this.y - this.radius < pad.y + pad.height &&
                this.x > pad.x &&
                this.x < pad.x + pad.width
            ) {
                this.dy *= -1.1; // Elastic bounce
                game.money += 1 * Math.pow(2, this.level - 1);
                game.updateUI();
                for (let i = 0; i < 10; i++) {
                    game.particles.push(new Particle(this.x, this.y, this.color));
                }
            }
        });
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        if (this.selected) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.closePath();
    }

    reset() {
        this.y = 50;
        this.x = canvas.width / 2 + (Math.random() - 0.5) * 20;
        this.dy = 0;
        this.dx = (Math.random() - 0.5) * 5;
    }
}

class Pad {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 10;
    }

    draw() {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 1;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.lifespan = 100;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.lifespan--;
    }

    draw() {
        ctx.globalAlpha = this.lifespan / 100;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1;
    }
}

const game = new Game();

function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

// Event Listeners
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    game.balls.forEach(ball => {
        const distance = Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2);
        if (distance < ball.radius) {
            if (ball.selected) {
                ball.selected = false;
                game.selectedBalls = game.selectedBalls.filter(b => b !== ball);
                game.updateMergeInstructions();
            } else {
                if (game.selectedBalls.length < 2) {
                    if (game.selectedBalls.length === 0 || game.selectedBalls[0].level === ball.level) {
                        ball.selected = true;
                        game.selectedBalls.push(ball);
                        game.updateMergeInstructions();
                    }
                }
            }
        }
    });
});

document.getElementById('addBallBtn').addEventListener('click', () => {
    if (game.money >= game.addBallCost) {
        game.money -= game.addBallCost;
        game.balls.push(new Ball(canvas.width / 2 + (Math.random() - 0.5) * 20, 50, 1));
        game.addBallCost = Math.ceil(game.addBallCost * 1.2);
        game.updateUI();
    }
});

document.getElementById('addPadBtn').addEventListener('click', () => {
    if (game.money >= game.addPadCost) {
        const layout = levelLayouts[game.level - 1] || levelLayouts[0];
        if (game.pads.length < layout.length) {
            game.money -= game.addPadCost;
            const nextPadPos = layout[game.pads.length];
            game.pads.push(new Pad(nextPadPos.x, nextPadPos.y));
            game.addPadCost = Math.ceil(game.addPadCost * 1.5);
            game.updateUI();
        }
    }
});

document.getElementById('mergeBtn').addEventListener('click', () => {
    if (game.selectedBalls.length === 2) {
        const ball1 = game.selectedBalls[0];
        const ball2 = game.selectedBalls[1];
        if (ball1.level === ball2.level) {
            const newBall = new Ball((ball1.x + ball2.x) / 2, (ball1.y + ball2.y) / 2, ball1.level + 1);
            game.balls = game.balls.filter(b => b !== ball1 && b !== ball2);
            game.balls.push(newBall);
            game.selectedBalls = [];
            game.updateMergeInstructions();
        }
    }
});

gameLoop();