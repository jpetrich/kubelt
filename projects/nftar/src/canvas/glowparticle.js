// nftar/src/canvas/glowparticle.js

const P12 = Math.PI * 2;

class GlowParticle {
    constructor(x, y, radius, colors) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rgb = colors.rgb;

        this.vx = colors.rnd[3] * 4;
        this.vy = colors.rnd[4] * 4;

        this.sinValue = colors.rnd[5];
    }

    animate(ctx, stageWidth, stageHeight) {
        this.sinValue += 0.01;

        this.radius += Math.sin(this.sinValue);

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) {
            this.vx *= -1;
            this.x += 10;
        } else if (this.x > stageWidth) {
            this.vx *= -1;
            this.x -= 10;
        }

        if (this.y < 0) {
            this.vy *= -1;
            this.y += 10;
        } else if (this.y > stageHeight) {
            this.vy *= -1;
            this.y -= 10;
        }

        ctx.beginPath();
        const g = ctx.createRadialGradient(
            this.x,
            this.y,
            this.radius * 0.01,
            this.x,
            this.y,
            this.radius
        );
        g.addColorStop(0, `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, 0.6)`);
        g.addColorStop(1, `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, 0.0)`);

        ctx.fillStyle = g;
        ctx.arc(this.x, this.y, this.radius, 0, P12, false);
        ctx.fill();
    }
}

module.exports = GlowParticle;
