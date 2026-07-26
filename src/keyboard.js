// Keyboard Shortcuts Controller for Solo Hands-Free PC Play

export class KeyboardController {
  constructor(scorekeeper, soloDraw) {
    this.scorekeeper = scorekeeper;
    this.soloDraw = soloDraw;
  }

  init() {
    window.addEventListener('keydown', (e) => {
      // Handle Escape key to close active modals or dropdown
      if (e.key === 'Escape') {
        let closed = false;
        const visibleModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
        visibleModals.forEach(m => {
          m.classList.add('hidden');
          closed = true;
        });

        const btnHamburger = document.getElementById('btn-hamburger');
        const headerDropdown = document.getElementById('header-dropdown');
        if (btnHamburger && headerDropdown && headerDropdown.classList.contains('open')) {
          btnHamburger.classList.remove('open');
          headerDropdown.classList.remove('open');
          closed = true;
        }
        if (closed) {
          e.preventDefault();
          return;
        }
      }

      // Don't trigger game hotkeys if any modal is open
      const isModalOpen = !!document.querySelector('.modal-overlay:not(.hidden)');
      if (isModalOpen) return;

      // Don't trigger hotkeys if user is typing inside an input/textarea
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = e.key.toLowerCase();

      // Space -> Spin Roulette
      if (e.code === 'Space') {
        e.preventDefault();
        this.soloDraw.executeSoloDraw();
        return;
      }

      // Undo -> Z or Ctrl+Z
      if (key === 'z') {
        e.preventDefault();
        this.scorekeeper.undoLastScore();
        return;
      }

      // Player 1 (Você) Hotkeys
      if (key === 'q') {
        e.preventDefault();
        this.scorekeeper.addScore(1, 1, 'Spin Finish');
      } else if (key === 'w') {
        e.preventDefault();
        this.scorekeeper.addScore(1, 2, 'Burst Finish');
      } else if (key === 'e') {
        e.preventDefault();
        this.scorekeeper.addScore(1, 2, 'Over Finish');
      } else if (key === 'r') {
        e.preventDefault();
        this.scorekeeper.addScore(1, 3, 'Xtreme Finish');
      }

      // Player 2 (Adversário) Hotkeys
      else if (key === 'u') {
        e.preventDefault();
        this.scorekeeper.addScore(2, 1, 'Spin Finish');
      } else if (key === 'i') {
        e.preventDefault();
        this.scorekeeper.addScore(2, 2, 'Burst Finish');
      } else if (key === 'o') {
        e.preventDefault();
        this.scorekeeper.addScore(2, 2, 'Over Finish');
      } else if (key === 'p') {
        e.preventDefault();
        this.scorekeeper.addScore(2, 3, 'Xtreme Finish');
      }
    });
  }
}
