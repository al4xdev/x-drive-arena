// Solo Draw Controller - Vampire Survivors Style Vertical Unboxing Engine

import { stateManager } from './state.js';
import { audio } from './audio.js';
import { particles } from './particles.js';
import { i18n } from './i18n.js';

export class SoloDrawController {
  constructor() {
    this.isSpinning = false;
    this.tickAnimationFrame = null;
    this.lastTouchTap = null;
    this.doubleTapHintTimer = null;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const ringSpin = document.getElementById('trigger-spin-area');
    if (ringSpin) {
      ringSpin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.executeSoloDraw();
      });
    }

    // Global Click Anywhere on screen (ignoring interactive elements & modals)
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('.modal-drawer') ||
        target.closest('.modal-card') ||
        target.closest('.modal-overlay') ||
        target.closest('.top-broadcast-bar') ||
        target.closest('.side-finish-panel') ||
        target.closest('.draw-focus')
      ) {
        return;
      }

      if (this.requiresTouchConfirmation(e)) {
        const now = performance.now();
        const previousTap = this.lastTouchTap;
        const isDoubleTap = previousTap
          && now - previousTap.time <= 600
          && Math.hypot(e.clientX - previousTap.x, e.clientY - previousTap.y) <= 72;

        if (!isDoubleTap) {
          this.lastTouchTap = { time: now, x: e.clientX, y: e.clientY };
          this.showDoubleTapHint();
          return;
        }

        this.lastTouchTap = null;
        this.hideDoubleTapHint();
      }

      this.executeSoloDraw();
    });
  }

  requiresTouchConfirmation(event) {
    return event.pointerType === 'touch'
      || event.sourceCapabilities?.firesTouchEvents
      || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  showDoubleTapHint() {
    this.hideDoubleTapHint();

    const hint = document.createElement('div');
    hint.className = 'draw-tap-hint';
    hint.textContent = i18n.getLang() === 'en'
      ? 'TAP AGAIN TO DRAW'
      : 'TOQUE NOVAMENTE PARA SORTEAR';
    document.body.appendChild(hint);

    this.doubleTapHintTimer = setTimeout(() => {
      this.lastTouchTap = null;
      this.hideDoubleTapHint();
    }, 700);
  }

  hideDoubleTapHint() {
    document.querySelector('.draw-tap-hint')?.remove();
    clearTimeout(this.doubleTapHintTimer);
    this.doubleTapHintTimer = null;
  }

  async executeSoloDraw() {
    if (this.isSpinning) return;
    this.isSpinning = true;

    const trackRed = document.getElementById('track-my-bey');
    const trackBlue = document.getElementById('track-adv-bey');
    const appContainer = document.getElementById('app');
    const cardRed = document.getElementById('card-bey-red');
    const cardBlue = document.getElementById('card-bey-blue');

    if (!appContainer || !trackRed || !trackBlue || !cardRed || !cardBlue) {
      this.isSpinning = false;
      return;
    }

    const cards = [cardRed, cardBlue];
    const compactRects = cards.map(card => card.getBoundingClientRect());
    const previousRed = trackRed.innerHTML;
    const previousBlue = trackBlue.innerHTML;
    const timings = this.getTimings();

    try {
      const cfg = stateManager.getConfig();
      const min = cfg.minNum || 1;
      const max = cfg.maxNum || 100;
      const allowDup = cfg.allowDup || false;

      let winNum1 = Math.floor(Math.random() * (max - min + 1)) + min;
      let winNum2 = Math.floor(Math.random() * (max - min + 1)) + min;

      if (!allowDup && max - min >= 1) {
        while (winNum2 === winNum1) {
          winNum2 = Math.floor(Math.random() * (max - min + 1)) + min;
        }
      }

      const firstLauncher = Math.random() < 0.5 ? 1 : 2;
      const firstLauncherName = firstLauncher === 1 ? cfg.blader1Name : cfg.blader2Name;
      const winningIndex = 30;
      const totalItems = 36;
      const redItems = this.generateVerticalReelItems(totalItems, winningIndex, winNum1, min, max, 'red');
      const blueItems = this.generateVerticalReelItems(totalItems, winningIndex, winNum2, min, max, 'blue');

      // FLIP: the compact cards themselves grow into the focused draw layout.
      document.body.classList.add('draw-active');
      appContainer.classList.add('draw-focus');
      await this.animateCardsFrom(cards, compactRects, timings.expand);

      trackRed.innerHTML = redItems.html;
      trackBlue.innerHTML = blueItems.html;
      trackRed.setAttribute('aria-label', 'Roleta do meu Beyblade girando');
      trackBlue.setAttribute('aria-label', 'Roleta do Beyblade adversário girando');
      trackRed.style.transform = 'translateY(0px)';
      trackBlue.style.transform = 'translateY(0px)';

      await this.nextFrame();

      const redWindow = trackRed.parentElement;
      const blueWindow = trackBlue.parentElement;
      const redWinner = trackRed.children[winningIndex];
      const blueWinner = trackBlue.children[winningIndex];
      const redTargetY = this.getCenteredTrackOffset(redWindow, redWinner);
      const blueTargetY = this.getCenteredTrackOffset(blueWindow, blueWinner);

      audio.playRipCord();
      particles.setHyperdrive(true);

      const reelEasing = 'cubic-bezier(0.12, 0.58, 0.1, 1)';
      const redAnimation = trackRed.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: `translateY(${redTargetY}px)` }
        ],
        { duration: timings.spin, easing: reelEasing, fill: 'forwards' }
      );
      const blueAnimation = trackBlue.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: `translateY(${blueTargetY}px)` }
        ],
        { duration: timings.spin, easing: reelEasing, fill: 'forwards' }
      );

      const stopRPM = this.animateRPMGauge(timings.spin);
      const stopTicks = this.monitorReelTicks(trackRed, [redWindow, blueWindow], winningIndex);
      await Promise.all([redAnimation.finished, blueAnimation.finished]);
      stopTicks();
      if (stopRPM) stopRPM();

      trackRed.style.transform = `translateY(${redTargetY}px)`;
      trackBlue.style.transform = `translateY(${blueTargetY}px)`;
      redAnimation.cancel();
      blueAnimation.cancel();

      redWinner.classList.add('winner-card', 'rarity-covert');
      blueWinner.classList.add('winner-card', 'rarity-covert');
      appContainer.classList.add('draw-settled');

      particles.triggerShockwaveRing();

      audio.playPointScore(3);
      particles.triggerVictoryConfetti();

      const valLauncher = document.getElementById('val-first-launcher');
      const launcherBadge = document.getElementById('first-launcher-badge');

      if (valLauncher) valLauncher.textContent = `${firstLauncherName.toUpperCase()} ${i18n.t('launchesFirst')}`;
      if (launcherBadge) {
        launcherBadge.className = `first-launcher-badge ${firstLauncher === 1 ? 'launcher-red' : 'launcher-blue'}`;
      }

      stateManager.addGachaResult([winNum1, winNum2], firstLauncherName);
      this.renderHistory();

      await this.delay(timings.hold);

      // Replace the reels with the result before reversing the same FLIP.
      trackRed.innerHTML = `<span id="val-my-bey" class="num-glow">#${winNum1}</span>`;
      trackBlue.innerHTML = `<span id="val-adv-bey" class="num-glow">#${winNum2}</span>`;
      this.resetTrack(trackRed);
      this.resetTrack(trackBlue);

      const expandedRects = cards.map(card => card.getBoundingClientRect());
      appContainer.classList.add('draw-returning');
      appContainer.classList.remove('draw-focus', 'draw-settled');
      await this.animateCardsFrom(cards, expandedRects, timings.collapse);
      appContainer.classList.remove('draw-returning');
    } catch (error) {
      console.error('Falha ao executar o sorteio:', error);
      trackRed.innerHTML = previousRed;
      trackBlue.innerHTML = previousBlue;
      this.resetTrack(trackRed);
      this.resetTrack(trackBlue);
    } finally {
      if (this.tickAnimationFrame) cancelAnimationFrame(this.tickAnimationFrame);
      this.tickAnimationFrame = null;
      appContainer.classList.remove('draw-focus', 'draw-settled', 'draw-returning');
      document.body.classList.remove('draw-active');
      particles.setHyperdrive(false);
      this.isSpinning = false;
    }
  }

  getTimings() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      return { expand: 0, spin: 900, hold: 900, collapse: 0 };
    }
    return { expand: 600, spin: 4000, hold: 1800, collapse: 600 };
  }

  async animateCardsFrom(cards, previousRects, duration) {
    const animations = cards.map((card, index) => {
      const previous = previousRects[index];
      const current = card.getBoundingClientRect();
      const translateX = previous.left - current.left;
      const translateY = previous.top - current.top;
      const scaleX = previous.width / current.width;
      const scaleY = previous.height / current.height;

      return card.animate(
        [
          {
            transformOrigin: 'top left',
            transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`
          },
          {
            transformOrigin: 'top left',
            transform: 'translate(0, 0) scale(1, 1)'
          }
        ],
        {
          duration,
          easing: 'cubic-bezier(0.2, 0.76, 0.16, 1)',
          fill: 'both'
        }
      );
    });

    await Promise.all(animations.map(animation => animation.finished));
    animations.forEach(animation => animation.cancel());
  }

  monitorReelTicks(track, slotWindows, winningIndex) {
    const items = Array.from(track.children);
    const firstItem = items[0];
    const secondItem = items[1];
    if (!firstItem || !secondItem) return () => {};

    const windows = Array.isArray(slotWindows) ? slotWindows : [slotWindows];
    const pointers = [];
    windows.forEach(w => {
      if (w) pointers.push(...w.querySelectorAll('.vs-slot-pointer'));
    });

    const triggerPointerKick = () => {
      pointers.forEach(p => {
        p.classList.remove('pointer-kick');
        void p.offsetWidth;
        p.classList.add('pointer-kick');
      });
    };

    const firstCenter = firstItem.offsetTop + firstItem.offsetHeight / 2;
    const itemStep = secondItem.offsetTop - firstItem.offsetTop;
    let previousIndex = null;
    let active = true;

    const readFrame = () => {
      if (!active) return;

      const transform = getComputedStyle(track).transform;
      const translateY = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
      const markerPosition = windows[0].clientHeight / 2 - translateY;
      const rawIndex = Math.round((markerPosition - firstCenter) / itemStep);
      const currentIndex = Math.max(0, Math.min(winningIndex, rawIndex));

      if (previousIndex === null) {
        previousIndex = currentIndex;
      } else if (currentIndex !== previousIndex) {
        const progress = currentIndex / winningIndex;
        audio.playSpinTick(0.86 + progress * 0.62, 0.12 + progress * 0.08);
        triggerPointerKick();
        previousIndex = currentIndex;
      }

      this.tickAnimationFrame = requestAnimationFrame(readFrame);
    };

    this.tickAnimationFrame = requestAnimationFrame(readFrame);

    return () => {
      active = false;
      if (this.tickAnimationFrame) cancelAnimationFrame(this.tickAnimationFrame);
      this.tickAnimationFrame = null;
    };
  }

  nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  resetTrack(track) {
    track.removeAttribute('style');
    track.removeAttribute('aria-label');
  }

  getCenteredTrackOffset(slotWindow, winner) {
    if (!slotWindow || !winner) return 0;
    return slotWindow.clientHeight / 2 - (winner.offsetTop + winner.offsetHeight / 2);
  }

  generateVerticalReelItems(count, winIndex, winNum, min, max, side) {
    const rarities = ['rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic'];
    let html = '';

    for (let i = 0; i < count; i++) {
      let num;
      let rarity = rarities[Math.floor(Math.random() * rarities.length)];

      if (i === winIndex) {
        num = winNum;
      } else {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      html += `
        <div class="draw-reel-item ${rarity} ${side === 'red' ? 'item-red' : 'item-blue'}">
          <span class="draw-reel-index">${String(i + 1).padStart(2, '0')}</span>
          <span class="draw-reel-num">#${num}</span>
          <div class="draw-reel-bar"></div>
        </div>
      `;
    }

    return { html };
  }

  animateRPMGauge(duration) {
    const gauge = document.getElementById('rpm-gauge');
    const valEl = document.getElementById('val-rpm-num');
    if (!gauge || !valEl) return () => {};

    gauge.classList.remove('hidden');
    const startTime = performance.now();
    let animId = null;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      let speedFactor = 0;
      if (progress < 0.3) {
        speedFactor = progress / 0.3;
      } else {
        speedFactor = Math.pow(1 - (progress - 0.3) / 0.7, 2);
      }

      const rpm = Math.floor(speedFactor * 98400 + Math.random() * 800);
      valEl.textContent = `${rpm.toLocaleString('en-US')} RPM`;

      if (progress < 1) {
        animId = requestAnimationFrame(update);
      } else {
        valEl.textContent = `00,000 RPM`;
        setTimeout(() => gauge.classList.add('hidden'), 500);
      }
    };

    animId = requestAnimationFrame(update);
    return () => {
      if (animId) cancelAnimationFrame(animId);
      gauge.classList.add('hidden');
    };
  }

  renderHistory() {
    const list = document.getElementById('solo-draw-log-list');
    const history = stateManager.getGachaHistory();

    if (!list) return;

    if (history.length === 0) {
      list.innerHTML = '<li class="empty-log">Nenhum sorteio realizado ainda.</li>';
    } else {
      list.innerHTML = history.map(item => `
        <li class="log-item">
          <span>
            🔴 <strong>#${item.num1}</strong> vs 🔵 <strong>#${item.num2}</strong>
            | 🚀 <span style="color: var(--neon-yellow);">${item.firstLauncher}</span>
          </span>
          <small style="color: var(--text-muted);">${item.time}</small>
        </li>
      `).join('');
    }
  }
}
