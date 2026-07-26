// Vampire Survivors Style Rayburst Canvas Background & Hyper Particle Engine

class ParticleEngine {
  constructor() {
    this.bgCanvas = null;
    this.bgCtx = null;
    this.confettiCanvas = null;
    this.confettiCtx = null;

    this.particles = [];
    this.confettis = [];
    this.width = 0;
    this.height = 0;
    this.rayAngle = 0;
    this.isHyperdrive = false;
    this.hyperIntensity = 0;
  }

  init() {
    this.bgCanvas = document.getElementById('bg-canvas');
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (!this.bgCanvas || !this.confettiCanvas) return;

    this.bgCtx = this.bgCanvas.getContext('2d');
    this.confettiCtx = this.confettiCanvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.createBgParticles(70);
    this.loop();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (this.bgCanvas) {
      this.bgCanvas.width = this.width;
      this.bgCanvas.height = this.height;
    }
    if (this.confettiCanvas) {
      this.confettiCanvas.width = this.width;
      this.confettiCanvas.height = this.height;
    }
  }

  setHyperdrive(active) {
    this.isHyperdrive = active;
  }

  createBgParticles(count) {
    this.particles = [];
    const colors = ['#00f0ff', '#00ff88', '#ff0055', '#ffcc00', '#b500ff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8 - 0.3,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  triggerVictoryConfetti() {
    const colors = ['#00f0ff', '#00ff88', '#ff0055', '#ffcc00', '#b500ff', '#ffffff'];
    for (let i = 0; i < 160; i++) {
      this.confettis.push({
        x: this.width / 2,
        y: this.height / 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.75) * 20,
        gravity: 0.35,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }
  }

  triggerXDashSparks() {
    const colors = ['#00ff88', '#00f0ff', '#ffffff', '#ffcc00'];
    const cx = this.width / 2;
    for (let i = 0; i < 90; i++) {
      const startY = Math.random() * this.height;
      this.confettis.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: startY,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 22,
        gravity: 0.1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 20,
        opacity: 1
      });
    }
  }

  triggerShockwaveRing(customX, customY) {
    const x = customX || this.width / 2;
    const y = customY || this.height / 2;
    const colors = ['#00f0ff', '#ffcc00', '#ff0055'];
    for (let i = 0; i < 35; i++) {
      const angle = (i * 2 * Math.PI) / 35;
      const speed = Math.random() * 8 + 6;
      this.confettis.push({
        x: x,
        y: y,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.05,
        rotation: Math.random() * 360,
        vRot: 5,
        opacity: 1
      });
    }
  }

  loop() {
    // 1. Render Vampire Survivors Rayburst & Ambient Background
    if (this.bgCtx) {
      this.bgCtx.clearRect(0, 0, this.width, this.height);

      const cx = this.width / 2;
      const cy = this.height / 2;

      // Update Rayburst angle
      const speed = this.isHyperdrive ? 0.015 : 0.003;
      this.rayAngle += speed;

      // Smooth Hyperdrive Intensity ramp
      if (this.isHyperdrive && this.hyperIntensity < 1) {
        this.hyperIntensity += 0.05;
      } else if (!this.isHyperdrive && this.hyperIntensity > 0) {
        this.hyperIntensity -= 0.04;
      }
      this.hyperIntensity = Math.max(0, Math.min(1, this.hyperIntensity));

      // Draw Rotating Sunburst / Light Rays (Vampire Survivors style)
      if (this.hyperIntensity > 0.01) {
        const numRays = 18;
        const maxRadius = Math.max(this.width, this.height) * 1.2;

        this.bgCtx.save();
        this.bgCtx.translate(cx, cy);
        this.bgCtx.rotate(this.rayAngle);

        for (let i = 0; i < numRays; i++) {
          const startAngle = (i * 2 * Math.PI) / numRays;
          const endAngle = startAngle + Math.PI / numRays;

          this.bgCtx.beginPath();
          this.bgCtx.moveTo(0, 0);
          this.bgCtx.arc(0, 0, maxRadius, startAngle, endAngle);
          this.bgCtx.closePath();

          const rayGradient = this.bgCtx.createRadialGradient(0, 0, 50, 0, 0, maxRadius);
          const baseAlpha = 0.08 * this.hyperIntensity;
          if (i % 2 === 0) {
            rayGradient.addColorStop(0, `rgba(255, 204, 0, ${baseAlpha * 2.5})`);
            rayGradient.addColorStop(0.5, `rgba(255, 0, 85, ${baseAlpha * 1.5})`);
            rayGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          } else {
            rayGradient.addColorStop(0, `rgba(0, 240, 255, ${baseAlpha * 2.5})`);
            rayGradient.addColorStop(0.5, `rgba(0, 255, 136, ${baseAlpha * 1.5})`);
            rayGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          }

          this.bgCtx.fillStyle = rayGradient;
          this.bgCtx.fill();
        }

        this.bgCtx.restore();
      }

      // Draw floating cosmic particles
      this.particles.forEach(p => {
        const mult = this.isHyperdrive ? 3 : 1;
        p.x += p.vx * mult;
        p.y += p.vy * mult;

        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;

        this.bgCtx.beginPath();
        this.bgCtx.arc(p.x, p.y, p.radius * (1 + this.hyperIntensity * 0.8), 0, Math.PI * 2);
        this.bgCtx.fillStyle = p.color;
        this.bgCtx.globalAlpha = p.alpha;
        this.bgCtx.fill();
      });
      this.bgCtx.globalAlpha = 1;
    }

    // 2. Render Confetti
    if (this.confettiCtx) {
      this.confettiCtx.clearRect(0, 0, this.width, this.height);

      for (let i = this.confettis.length - 1; i >= 0; i--) {
        const c = this.confettis[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += c.gravity;
        c.rotation += c.vRot;
        c.opacity -= 0.006;

        if (c.opacity <= 0 || c.y > this.height) {
          this.confettis.splice(i, 1);
          continue;
        }

        this.confettiCtx.save();
        this.confettiCtx.translate(c.x, c.y);
        this.confettiCtx.rotate((c.rotation * Math.PI) / 180);
        this.confettiCtx.fillStyle = c.color;
        this.confettiCtx.globalAlpha = Math.max(0, c.opacity);
        this.confettiCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 1.5);
        this.confettiCtx.restore();
      }
    }

    requestAnimationFrame(() => this.loop());
  }
}

export const particles = new ParticleEngine();
