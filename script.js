// Root UI logic: menus, tank selection, settings, start/multiplayer hooks
(function () {
  const mainMenu = document.getElementById('mainMenu');
  const tankModal = document.getElementById('tankModal');
  const settingsModal = document.getElementById('settingsModal');
  const howtoModal = document.getElementById('howtoModal');
  const photonModal = document.getElementById('photonModal');
  const tankGrid = document.getElementById('tankGrid');
  const selectTankBtn = document.getElementById('selectTankBtn');

  const btnPlay = document.getElementById('btnPlay');
  const btnPhoton = document.getElementById('btnPhoton');
  const btnChangeTank = document.getElementById('btnChangeTank');
  const btnSettings = document.getElementById('btnSettings');
  const btnHow = document.getElementById('btnHow');

  // Prevent auto-start (index.html inline script has been disabled)
  let gameStarted = false;

  // Tank data similar to diep/arras styles
  const tanks = [
    { id: 'classic', name: 'Classic', desc: 'Balanced turret', color: '#58c7ff', stats: { dmg: 60, hp: 60, spd: 60, fir: 60 } },
    { id: 'blade', name: 'Blade', desc: 'Fast skirmisher', color: '#58ff9a', stats: { dmg: 55, hp: 40, spd: 90, fir: 65 } },
    { id: 'heavy', name: 'Heavy', desc: 'High armor cannon', color: '#ff8a58', stats: { dmg: 85, hp: 90, spd: 30, fir: 45 } },
    { id: 'stealth', name: 'Stealth', desc: 'High speed crits', color: '#ffd558', stats: { dmg: 70, hp: 45, spd: 85, fir: 55 } },
    { id: 'phoenix', name: 'Phoenix', desc: 'Burning rounds', color: '#ff5858', stats: { dmg: 80, hp: 55, spd: 55, fir: 70 } },
    { id: 'vortex', name: 'Vortex', desc: 'Energy pulses', color: '#b46bff', stats: { dmg: 65, hp: 65, spd: 55, fir: 80 } },
    { id: 'titan', name: 'Titan', desc: 'Ultimate defense', color: '#9cff58', stats: { dmg: 60, hp: 100, spd: 25, fir: 40 } }
  ];

  let selectedTankId = localStorage.getItem('selectedTankId') || 'classic';

  function openModal(el) { if (!el) return; el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); }
  function closeModal(el) { if (!el) return; el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); }

  function renderTankGrid() {
    if (!tankGrid) return;
    tankGrid.innerHTML = tanks.map(t => {
      const sel = t.id === selectedTankId ? ' selected' : '';
      return `
        <div class="tank-card${sel}" data-id="${t.id}">
          <div class="preview-wrap"><canvas class="tank-preview" data-id="${t.id}" width="160" height="120"></canvas></div>
          <div class="tank-name">${t.name}</div>
          <div class="tank-desc">${t.desc}</div>
          <div class="stat"><label>Damage</label><div class="bar"><div class="fill" style="width:${t.stats.dmg}%"></div></div><div class="value">${t.stats.dmg}</div></div>
          <div class="stat"><label>Health</label><div class="bar"><div class="fill" style="width:${t.stats.hp}%"></div></div><div class="value">${t.stats.hp}</div></div>
          <div class="stat"><label>Speed</label><div class="bar"><div class="fill" style="width:${t.stats.spd}%"></div></div><div class="value">${t.stats.spd}</div></div>
          <div class="stat"><label>Firerate</label><div class="bar"><div class="fill" style="width:${t.stats.fir}%"></div></div><div class="value">${t.stats.fir}</div></div>
        </div>`;
    }).join('');

    // Click select behavior
    tankGrid.querySelectorAll('.tank-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        selectedTankId = id;
        tankGrid.querySelectorAll('.tank-card').forEach(c => c.classList.toggle('selected', c === card));
      });
    });

    // Draw previews
    requestAnimationFrame(drawAllPreviews);
  }

  function drawAllPreviews() {
    document.querySelectorAll('canvas.tank-preview').forEach(c => {
      const id = c.getAttribute('data-id');
      const tank = tanks.find(t => t.id === id);
      drawTankPreview(c, tank?.color || '#46b2ff');
    });
  }

  function drawTankPreview(canvas, color) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // background grid
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < w; x += 16) {
      ctx.fillRect(x, 0, 1, h);
    }
    for (let y = 0; y < h; y += 16) {
      ctx.fillRect(0, y, w, 1);
    }

    const cx = w / 2, cy = h / 2, r = 26;

    // body
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#102030';
    ctx.lineWidth = 3;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // cannon
    ctx.fillStyle = color;
    ctx.strokeStyle = '#102030';
    ctx.lineWidth = 2;
    ctx.fillRect(cx, cy - 6, r + 16, 12);
    ctx.strokeRect(cx, cy - 6, r + 16, 12);

    // inner core
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  function attachMenuHandlers() {
    // Top-level buttons
    btnPlay?.addEventListener('click', () => startSolo());
    btnPhoton?.addEventListener('click', () => openModal(photonModal));
    btnChangeTank?.addEventListener('click', () => { renderTankGrid(); openModal(tankModal); });
    btnSettings?.addEventListener('click', () => openModal(settingsModal));
    btnHow?.addEventListener('click', () => openModal(howtoModal));

    // Close buttons
    document.querySelectorAll('[data-close]')?.forEach(el => {
      el.addEventListener('click', () => {
        const target = document.getElementById(el.getAttribute('data-close'));
        closeModal(target);
      });
    });

    // Photon placeholder
    document.getElementById('photonConnect')?.addEventListener('click', () => {
      // Placeholder: In real integration, init Photon client here
      alert('Photon: Connection placeholder. Using Socket.IO for this project.');
      closeModal(photonModal);
      startSolo();
    });

    // Select tank
    selectTankBtn?.addEventListener('click', () => {
      localStorage.setItem('selectedTankId', selectedTankId);
      closeModal(tankModal);
    });

    // Settings controls
    const volumeRange = document.getElementById('volumeRange');
    const qualitySelect = document.getElementById('qualitySelect');
    const togglePostFX = document.getElementById('togglePostFX');

    volumeRange?.addEventListener('input', () => {
      // Optional: send to audio system if present
    });

    qualitySelect?.addEventListener('change', () => {
      document.body.dataset.quality = qualitySelect.value;
    });

    togglePostFX?.addEventListener('change', () => {
      document.body.dataset.postfx = togglePostFX.checked ? 'on' : 'off';
    });
  }

  function applyTankToPlayer() {
    // After game connection, we can tint myPlayer color based on selected tank
    const tank = tanks.find(t => t.id === selectedTankId);
    if (!tank) return;
    // Try to adjust local player color once connection is ready
    const tryApply = () => {
      try {
        if (window.myPlayer) {
          window.myPlayer.color = tank.color;
          return; // applied
        }
      } catch {}
      requestAnimationFrame(tryApply);
    };
    tryApply();
  }

  // Start the Socket.IO solo session by calling the original functions
  function startSolo() {
    if (gameStarted) return;
    gameStarted = true;
    // Hide menu
    mainMenu?.classList.add('hidden');
    // Call functions defined in inline script of index.html
    if (typeof window.initConnection === 'function') {
      window.initConnection();
    }
    if (typeof window.gameLoop === 'function') {
      window.gameLoop();
    }
    // Expose myPlayer for tank apply (hooked in try loop)
    Object.defineProperty(window, 'myPlayer', {
      get: function () { try { return window.__myPlayerRef || (typeof myPlayer !== 'undefined' ? myPlayer : undefined); } catch { return undefined; } },
      set: function (v) { window.__myPlayerRef = v; }
    });
    applyTankToPlayer();
  }

  // Expose hooks for internal scripts if needed
  window.__menu = { startSolo };

  // Bootstrap
  attachMenuHandlers();
})();
