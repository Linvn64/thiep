// ── NAME → XƯNG HÔ MAP ──────────────────────────────────────────
const xungHoMap = {
  anh: ['Nam', 'Tuấn', 'Hùng', 'Minh', 'Đức', 'Quân', 'Long', 'Bình', 'Dũng', 'Khoa'],
  chị: ['Chinh', 'Hồng', 'Lan', 'Hà', 'Thảo', 'Linh', 'Mai', 'Phương', 'Thu', 'Ngọc'],
  em:  []   // để trống – bạn thêm tên vào đây nếu muốn xưng 'em'
};
// Còn lại mặc định xưng "bạn"

function getXungHo(name) {
  const clean = name.trim();
  // Lấy tên (phần cuối nếu họ tên đầy đủ)
  const lastName = clean.split(/\s+/).pop();
  for (const [xung, names] of Object.entries(xungHoMap)) {
    if (names.some(n => n.toLowerCase() === lastName.toLowerCase())) return xung;
  }
  return 'bạn';
}

function buildGreeting(name, xung) {
  const map = {
    anh: `Trân trọng kính mời <span class="greeting-name">${name}</span> — <em>anh</em> là người mình muốn có mặt trong ngày đặc biệt này nhất! 🎓`,
    chị: `Trân trọng kính mời <span class="greeting-name">${name}</span> — <em>chị</em> là người mình muốn có mặt trong ngày đặc biệt này nhất! 🎓`,
    em:  `Rất vui được mời <span class="greeting-name">${name}</span> — <em>em</em> là người mình muốn cùng chia sẻ khoảnh khắc này! 🎓`,
    bạn: `Trân trọng kính mời <span class="greeting-name">${name}</span> — <em>bạn</em> là người mình muốn có mặt trong ngày đặc biệt này! 🎓`
  };
  return map[xung] || map['bạn'];
}

// ── STATE ────────────────────────────────────────────────────────
let guestName = '';
let guestXung = 'bạn';
let musicPlaying = false;
let musicAudio = null;
let photoImages = [];

// ── PARTICLES ───────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.size = Math.random() * 1.5 + 0.3;
      this.speed = Math.random() * 0.4 + 0.1;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.drift = (Math.random() - 0.5) * 0.3;
    }
    update() {
      this.y -= this.speed;
      this.x += this.drift;
      this.opacity += (Math.random() - 0.5) * 0.01;
      this.opacity = Math.max(0.05, Math.min(0.6, this.opacity));
      if (this.y < -5) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#D4A843';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 60; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
}

// ── MUSIC via YouTube IFrame API ────────────────────────────────
// Video ID: Come My Way - Sơn Tùng MTP ft. Tyga (thay nếu cần)
// ── MUSIC — file local ──────────────────────────────────────────
const MUSIC_FILE = '{css,js,assets}/come_my_way.mp3';
let audio = null;

function loadYouTubeAPI() { /* không dùng */ }

function initAudio() {
  if (audio) return;
  audio = new Audio(MUSIC_FILE);
  audio.loop = true;
  audio.volume = 0.55;
  audio.preload = 'auto';
}

function tryPlayMusic() {
  const ind = document.getElementById('music-indicator');
  initAudio();

  if (musicPlaying) {
    audio.pause();
    musicPlaying = false;
    ind.classList.remove('playing');
    ind.querySelector('.music-label').textContent = 'NHẠC';
    return;
  }

  audio.play().then(() => {
    musicPlaying = true;
    ind.classList.add('playing');
    ind.querySelector('.music-label').textContent = 'ĐANG PHÁT';
  }).catch(() => {
    showToast('⚠️ Không tìm thấy file nhạc trong assets/');
  });
}

// ── PHOTO STRIP ──────────────────────────────────────────────────
function initPhotoUpload() {
  const input = document.getElementById('photo-upload-input');
  const strip = document.getElementById('photo-strip-track');

  if (!input || !strip) return;

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    photoImages = [];
    files.slice(0, 10).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        photoImages.push(ev.target.result);
        if (photoImages.length === Math.min(files.length, 10)) renderPhotos();
      };
      reader.readAsDataURL(file);
    });
  });
}

function renderPhotos() {
  const track = document.getElementById('photo-strip-track');
  if (!track || !photoImages.length) return;

  // Clone đủ để lấp kín: ít nhất viewport*3 hoặc x2 set gốc
  const minFrames = Math.ceil((window.innerWidth * 3) / 140);
  const needed = Math.max(minFrames, photoImages.length * 2);
  const repeated = [];
  while (repeated.length < needed) {
    repeated.push(...photoImages);
  }

  // Chỉ lấy chẵn bội của photoImages.length để seamless
  const setSize = photoImages.length;
  const sets = Math.ceil(needed / setSize);
  const fullSet = Array(sets).fill(photoImages).flat();

  track.innerHTML = fullSet.map(src => buildFrameHTML(src)).join('');
  track.style.transform = 'translateX(0)';
  stripX = 0;

  // halfWidth = 1 set gốc * 140px
  // Override stripSpeed sau khi re-measure
  requestAnimationFrame(() => {
    startSeamlessStrip();
    // Patch halfWidth cho đúng set size
    window._stripHalfWidth = setSize * 140;
  });
}

// ── SEAMLESS STRIP ENGINE ────────────────────────────────────────
let stripRAF = null;
let stripX = 0;
let stripSpeed = 0.5; // px per frame

function startSeamlessStrip() {
  const section = document.querySelector('.photo-strip-section');
  const track = document.getElementById('photo-strip-track');
  if (!track || !section) return;

  if (stripRAF) cancelAnimationFrame(stripRAF);

  // Đo chiều rộng của 1 set gốc (nửa đầu)
  // Track đã được clone x2 → chạy từ 0 đến -halfWidth rồi reset
  let halfWidth = 0;

  function measure() {
    const frames = track.querySelectorAll('.photo-frame');
    if (!frames.length) return;
    const count = frames.length;
    halfWidth = (count / 2) * 140; // 140px mỗi frame, không gap
    stripSpeed = Math.max(0.4, halfWidth / 5000); // tốc độ tỷ lệ với số ảnh
  }

  measure();

  function tick() {
    stripX -= stripSpeed;
    const resetAt = window._stripHalfWidth || halfWidth;
    if (resetAt > 0 && Math.abs(stripX) >= resetAt) {
      stripX = 0; // reset về đầu — seamless vì track = set1 + set1 clone
    }
    track.style.transform = `translateX(${stripX}px)`;
    stripRAF = requestAnimationFrame(tick);
  }

  stripRAF = requestAnimationFrame(tick);
}

function buildFrameHTML(src) {
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('assets/')) {
    return `<div class="photo-frame"><img src="${src}" alt="Ảnh lễ tốt nghiệp" loading="lazy"/></div>`;
  }
  return `<div class="photo-frame">
    <div class="photo-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>GIANG</span>
    </div>
  </div>`;
}

function setupDefaultPhotos() {
  const track = document.getElementById('photo-strip-track');
  if (!track) return;

  // 10 placeholder frames, nhân đôi để loop liền mạch
  const frameHTML = Array(10).fill(0).map(() => buildFrameHTML('placeholder')).join('');
  track.innerHTML = frameHTML + frameHTML;
  track.style.transform = 'translateX(0)';
  stripX = 0;

  // Start sau 1 tick để browser render xong
  requestAnimationFrame(() => startSeamlessStrip());
}

// ── RSVP ─────────────────────────────────────────────────────────
function rsvpYes() {
  const modal = document.getElementById('modal');
  const icon = document.getElementById('modal-icon');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  icon.textContent = '🥂';
  title.textContent = 'TUYỆT VỜI!';
  body.innerHTML = `Cảm ơn <strong>${guestName}</strong> đã xác nhận!<br><br>
    Mình rất vui vì sẽ có ${guestXung} bên cạnh trong ngày đặc biệt này. Hẹn gặp ${guestXung} tại lễ tốt nghiệp nhé! ✨`;
  modal.classList.add('show');
}

function rsvpNo() {
  const modal = document.getElementById('modal');
  const icon = document.getElementById('modal-icon');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  icon.textContent = '🌸';
  title.textContent = 'KHÔNG SAO ĐÂU!';
  body.innerHTML = `Cảm ơn ${guestXung} đã báo trước, <strong>${guestName}</strong> ơi!<br><br>
    Mình hiểu ${guestXung} có lý do riêng. Chúc ${guestXung} mọi điều tốt đẹp, và mình vẫn sẽ gửi lời yêu thương đến ${guestXung} từ xa nhé 💛`;
  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

// ── TOAST ────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── MAP + CALENDAR ────────────────────────────────────────────────
function openMap() {
  const address = encodeURIComponent('Hội trường tầng 3 HA11, ngõ 218 đường Lĩnh Nam, Hoàng Mai, Hà Nội');
  window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
}

function addToCalendar() {
  const start = '20260621T080000';
  const end   = '20260621T120000';
  const title = encodeURIComponent('Lễ Tốt Nghiệp - Giang');
  const loc   = encodeURIComponent('Hội trường tầng 3 HA11, ngõ 218 Lĩnh Nam, Hoàng Mai, Hà Nội');
  const details = encodeURIComponent('Come to my graduation 🎓 — Hơn cả một lễ tốt nghiệp!');
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${loc}`,
    '_blank'
  );
}

// ── TRANSITION SCREEN → MAIN ──────────────────────────────────────
function enterMain(name) {
  guestName = name || 'Bạn';
  guestXung = getXungHo(guestName);

  // Update greeting
  document.getElementById('greeting-text').innerHTML = buildGreeting(guestName, guestXung);

  // Hide intro, show main
  document.getElementById('intro-screen').classList.remove('active');
  document.getElementById('main-screen').classList.add('active');

  // Animate elements in sequence
  const revealOrder = [
    '.event-tag',
    '.invite-main-title',
    '.invite-subtitle-tag',
    '.greeting-band',
    '.photo-strip-section',
    '.invite-card',
    '.rsvp-section',
    '.thankyou-section',
  ];

  revealOrder.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 50);
      });
    }, i * 180);
  });

  // Hiện nút nhạc và phát — lúc này đã có user gesture (click Enter)
  setTimeout(() => {
    document.getElementById('music-indicator').style.display = 'flex';
    tryPlayMusic();
  }, 800);
}

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  setupDefaultPhotos();
  initPhotoUpload();
  loadYouTubeAPI(); // load sẵn API ngay từ đầu

  // Intro screen – submit on Enter or button click
  const nameInput = document.getElementById('name-input');
  const enterBtn  = document.getElementById('enter-btn');

  function submit() {
    const val = nameInput.value.trim();
    if (!val) {
      nameInput.style.borderBottomColor = '#c0392b';
      nameInput.placeholder = 'Nhập tên của bạn nhé...';
      setTimeout(() => { nameInput.style.borderBottomColor = ''; }, 1000);
      return;
    }
    // Fade out intro
    const intro = document.getElementById('intro-screen');
    intro.style.transition = 'opacity 0.6s ease';
    intro.style.opacity = '0';
    setTimeout(() => enterMain(val), 600);
  }

  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  enterBtn.addEventListener('click', submit);

  // Upload button
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('photo-upload-input').click();
  });

  // Modal close on overlay click
  document.getElementById('modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) closeModal();
  });

  // Music indicator
  document.getElementById('music-indicator')?.addEventListener('click', tryPlayMusic);

  // Hide music indicator initially
  document.getElementById('music-indicator').style.display = 'none';
});
