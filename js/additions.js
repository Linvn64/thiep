/* ════════════════════════════════════════════════════
   ADDITIONS — paste vào CUỐI file js/app.js
   ════════════════════════════════════════════════════ */

// ── 1. PHOTOS ────────────────────────────────────────
const PHOTO_EXTS   = ['png','PNG','jpg','jpeg','JPG','JPEG','webp','HEIC'];
const MAX_PHOTOS   = 30;
const PHOTO_PREFIX = 'assets/photo';

async function resolvePhotos() {
  const found = []; let misses = 0;
  for (let i = 1; i <= MAX_PHOTOS; i++) {
    const src = await tryExtensions(`${PHOTO_PREFIX}${i}`);
    if (src) { found.push(src); misses = 0; }
    else { misses++; if (misses >= 3) break; }
  }
  return found;
}

function tryExtensions(base) {
  return new Promise(resolve => {
    let idx = 0;
    function next() {
      if (idx >= PHOTO_EXTS.length) { resolve(null); return; }
      const img = new Image();
      img.onload  = () => resolve(`${base}.${PHOTO_EXTS[idx]}`);
      img.onerror = () => { idx++; next(); };
      img.src = `${base}.${PHOTO_EXTS[idx]}`;
    }
    next();
  });
}

function buildFrameHTMLSafe(src) {
  // decoding="async" → không block main thread khi giải mã ảnh
  return `<div class="photo-frame"><img src="${src}" alt="Ảnh lễ tốt nghiệp" loading="lazy" decoding="async"/></div>`;
}

// Inject CSS keyframe động rồi áp vào element
function applyCSSScroll(el, halfW, speed) {
  const styleId = el.id + '-kf';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const duration = halfW / speed;
  styleEl.textContent = `@keyframes ${styleId} { from{transform:translateX(0)} to{transform:translateX(-${halfW}px)} }`;
  el.style.animation = `${styleId} ${duration}s linear infinite`;
  el.style.willChange = 'transform';
}

// Compress ảnh từ assets/ về 400px trước khi render vào strip
// → ảnh gốc HEIC/JPG trên mobile thường 3-5MB, sau compress còn ~100KB
function compressImageFromUrl(url, maxWidth = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, maxWidth / img.width);
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(url); // fallback: dùng URL gốc nếu lỗi
    img.src = url;
  });
}

async function setupHardcodedPhotos() {
  const track     = document.getElementById('photo-strip-track');
  const uploadBtn = document.getElementById('upload-btn');
  if (!track) return;
  if (uploadBtn) uploadBtn.style.display = 'none';

  const photos = await resolvePhotos();
  if (!photos.length) return;

  // Compress song song toàn bộ ảnh → không đợi từng cái
  const compressed = await Promise.all(photos.map(src => compressImageFromUrl(src, 400)));

  const FRAME_W   = 220 + 16;
  const minFrames = Math.ceil((window.innerWidth * 3) / FRAME_W);
  const setSize   = compressed.length;
  let setsNeeded  = Math.ceil(minFrames / setSize) + 1;
  if (setsNeeded % 2 !== 0) setsNeeded++;

  const allFrames = Array(setsNeeded).fill(compressed).flat();
  track.innerHTML = allFrames.map(buildFrameHTMLSafe).join('');
  track.style.animation = 'none';
  track.style.transform = 'translateX(0)';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const halfW = track.scrollWidth / 2;
    applyCSSScroll(track, halfW, 80);
  }));
}

// Override startSeamlessStrip gốc (RAF loop) → không cần nữa khi dùng CSS animation
window.startSeamlessStrip = function() {};

// ── 2. BOKEH ─────────────────────────────────────────
function initBokeh() {
  const bg = document.getElementById('bokeh-bg');
  if (!bg) return;
  const orbs = [
    { w:340, h:340, top:'5%',  left:'10%', color:'#D4A843', peak:0.10, dur:20, delay:0  },
    { w:280, h:280, top:'60%', left:'70%', color:'#F2C96E', peak:0.08, dur:17, delay:4  },
    { w:200, h:200, top:'30%', left:'55%', color:'#D4A843', peak:0.07, dur:23, delay:8  },
    { w:380, h:380, top:'75%', left:'5%',  color:'#8A6820', peak:0.12, dur:19, delay:2  },
    { w:160, h:160, top:'20%', left:'80%', color:'#F2C96E', peak:0.06, dur:15, delay:11 },
    { w:240, h:240, top:'50%', left:'30%', color:'#D4A843', peak:0.09, dur:25, delay:6  },
  ];
  orbs.forEach(o => {
    const el = document.createElement('div');
    el.className = 'bokeh-orb';
    el.style.cssText = `width:${o.w}px;height:${o.h}px;top:${o.top};left:${o.left};background:${o.color};--dur:${o.dur}s;--delay:${o.delay}s;--peak:${o.peak};`;
    bg.appendChild(el);
  });
}

// ── 3. TICKER ────────────────────────────────────────
const TICKER_ITEMS = [
  { text:'COME TO MY SCHOOL',           highlight:true  },
  { text:'21 · 06 · 2026',              highlight:false },
  { text:'HỘI TRƯỜNG HA11 · LĨNH NAM',  highlight:false },
  { text:'GIANG · CLASS OF 2026',        highlight:true  },
  { text:'08:00 SÁNG · CHỦ NHẬT',        highlight:false },
  { text:'LỄ TỐT NGHIỆP · GRADUATION',   highlight:false },
  { text:'COME MY WAY ✦',                highlight:true  },
  { text:'HOÀNG MAI · HÀ NỘI',           highlight:false },
  { text:'CẢM ƠN VÌ ĐÃ ĐẾN ĐÂY',        highlight:false },
  { text:'MỘT DẤU MỐC ĐÁNG NHỚ ✦',      highlight:true  },
];

function buildTickerHTML() {
  const make = (item) =>
    `<span class="ticker-item ${item.highlight?'highlight-item':''}">
      <span class="ticker-dot"></span>${item.text}
    </span>`;
  return [...TICKER_ITEMS, ...TICKER_ITEMS].map(make).join('');
}

function injectTicker() {
  const photoSection = document.querySelector('.photo-strip-section');
  if (!photoSection) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'ticker-wrapper';
  const trackEl = document.createElement('div');
  trackEl.className = 'ticker-track';
  trackEl.id = 'ticker-track';
  trackEl.innerHTML = buildTickerHTML();
  wrapper.appendChild(trackEl);
  photoSection.insertAdjacentElement('afterend', wrapper);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const halfW = trackEl.scrollWidth / 2;
    applyCSSScroll(trackEl, halfW, 120);
  }));

  return wrapper;
}

// ── 4. MUSIC TOGGLE ──────────────────────────────────
function patchMusicToggle() {
  const _orig = window.tryPlayMusic;
  window.tryPlayMusic = function() {
    _orig && _orig();
    setTimeout(() => {
      document.body.classList.toggle('music-on', window.musicPlaying);
    }, 120);
  };
}

// ── 5. INIT ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initBokeh();

  const _origEnterMain = window.enterMain;
  window.enterMain = function(name) {
    _origEnterMain && _origEnterMain(name);

    if (!document.querySelector('.ticker-wrapper')) {
      const tickerEl = injectTicker();
      setTimeout(() => { if (tickerEl) tickerEl.classList.add('visible'); }, 5*180+100);
    }

    setTimeout(() => setupHardcodedPhotos(), 50);
  };

  patchMusicToggle();
});

// ── 6. EMAILJS RSVP ──────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_ih6ep4i';
const EMAILJS_TEMPLATE_ID = 'template_xqr1s2p';
const EMAILJS_PUBLIC_KEY  = 'kHQv4Txwm0xsQKjy3';
const NOTIFY_EMAIL        = 'lethianhlinh2005@gmail.com';

function loadEmailJS() {
  if (window.emailjs) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = () => { emailjs.init(EMAILJS_PUBLIC_KEY); resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function sendRSVPEmail(answer) {
  try {
    await loadEmailJS();
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      guest_name: window.guestName || 'Khách',
      rsvp:       answer === 'yes' ? '✅ Mình sẽ đến!' : '❌ Xin lỗi Giang',
      time:       new Date().toLocaleString('vi-VN'),
      to_email:   NOTIFY_EMAIL,
    });
    console.log('Email đã gửi');
  } catch (err) {
    console.warn('Gửi email thất bại:', err);
  }
}

(function() {
  const _origYes = window.rsvpYes;
  const _origNo  = window.rsvpNo;

  window.rsvpYes = function() {
    sendRSVPEmail('yes');
    _origYes && _origYes();
  };

  window.rsvpNo = function() {
    sendRSVPEmail('no');
    _origNo && _origNo();
  };
})();