/**
 * BE Skin 4D Maker — 3D Skin Preview
 * Menggunakan skinview3d untuk render preview skin Minecraft
 */

/* ═══════════════════════════════════════════
   SKIN PREVIEW PAGE
═══════════════════════════════════════════ */

let _skinViewer = null;
let _currentAnim = 'idle';
let _autoRotate = true;
let _currentSkinIdx = 0;

function pgSkinPreview(skinIdx) {
    _currentSkinIdx = (skinIdx !== undefined) ? skinIdx : 0;
    const skin = S.skins[_currentSkinIdx];

    // Kumpulkan nama skin untuk dropdown
    const skinOpts = S.skins.map((sk, i) =>
        `<option value="${i}" ${i === _currentSkinIdx ? 'selected' : ''}>${esc(sk.locName || 'Skin ' + (i+1))}</option>`
    ).join('');

    set(`
    <div class="main_title">
        <div class="main_title_area">
            <div class="main_title_span">PREVIEW</div>
            <div class="main_title_span_main">3D Skin Viewer</div>
        </div>
    </div>

    <div class="main main_block">
        <div class="main_block_content">
            <!-- Canvas preview -->
            <div id="skin3d_wrap" style="
                display:flex;flex-direction:column;align-items:center;
                background:linear-gradient(180deg,#1a2a3a 0%,#0d1a26 100%);
                border:2px solid #333334;
                position:relative;overflow:hidden;
                min-height:340px;
            ">
                <!-- Grid lines bawah ala MC -->
                <div id="skin3d_grid" style="
                    position:absolute;bottom:0;left:0;right:0;height:60px;
                    background:repeating-linear-gradient(90deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 40px),
                               repeating-linear-gradient(0deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 40px);
                    pointer-events:none;
                "></div>

                <canvas id="skin3d_canvas" style="display:block;width:100%;max-height:340px;"></canvas>

                <!-- No skin placeholder -->
                <div id="skin3d_placeholder" style="
                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                    gap:10px;padding:40px 20px;color:rgba(255,255,255,0.4);
                    text-align:center;min-height:280px;
                ">
                    <div style="font-size:48px;">👤</div>
                    <div style="font-family:'NotoSans Bold',sans-serif;font-size:13px;">
                        Belum ada skin yang bisa di-preview.<br>
                        Tambahkan skin dengan texture PNG dulu.
                    </div>
                </div>

                <!-- Loading overlay -->
                <div id="skin3d_loading" style="
                    display:none;position:absolute;inset:0;
                    background:rgba(13,26,38,0.8);
                    align-items:center;justify-content:center;
                    flex-direction:column;gap:10px;color:#fff;
                    font-family:'NotoSans Bold',sans-serif;font-size:12px;
                ">
                    <img src="./images/Loading_white.gif" style="height:32px;" alt="">
                    <span>Memuat preview...</span>
                </div>

                <!-- Zoom & rotate controls -->
                <div style="
                    position:absolute;top:8px;right:8px;
                    display:flex;flex-direction:column;gap:4px;
                ">
                    <button class="preview_ctrl_btn" onclick="sv3dZoom(0.1)" title="Zoom In">＋</button>
                    <button class="preview_ctrl_btn" onclick="sv3dZoom(-0.1)" title="Zoom Out">－</button>
                    <button class="preview_ctrl_btn" id="btn_rotate" onclick="sv3dToggleRotate()" title="Toggle Rotate">🔄</button>
                </div>

                <!-- Current skin name badge -->
                <div id="skin3d_badge" style="
                    position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
                    background:rgba(0,0,0,0.6);
                    font-family:'NotoSans Bold',sans-serif;font-size:11px;
                    color:rgba(255,255,255,0.7);
                    padding:3px 10px;white-space:nowrap;
                    display:none;
                "></div>
            </div>

            <!-- Skin selector (kalau ada banyak skin) -->
            ${S.skins.length > 1 ? `
            <div class="ore_field" style="margin-top:10px;">
                <label class="ore_label">Pilih Skin</label>
                <select class="ore_select" onchange="sv3dLoadSkin(parseInt(this.value))">
                    ${skinOpts}
                </select>
            </div>` : ''}
        </div>
    </div>

    <!-- Animation Controls -->
    <div class="main main_block">
        <div class="main-header">Animasi</div>
        <div class="main_block_content">
            <div class="sv3d_anim_grid" id="anim_grid">
                ${_animButtons()}
            </div>
        </div>
    </div>

    <!-- Tips -->
    <div class="main main_block">
        <div class="main-header">Tips</div>
        <div class="main_block_content">
            <article_block>
                <article_detail style="font-size:12px;color:rgba(255,255,255,0.5);text-align:left;line-height:1.8;">
                    🖱️ <strong style="color:rgba(255,255,255,0.7);">Drag</strong> canvas untuk rotate · 
                    <strong style="color:rgba(255,255,255,0.7);">Scroll</strong> untuk zoom<br>
                    🧵 Preview ini menampilkan skin UV standar Minecraft (64×64).<br>
                    ⚠️ Extra bones 4D (ekor, sayap, dll) tidak tampil di preview ini —
                    hanya body utama yang divisualisasikan.
                </article_detail>
            </article_block>
        </div>
    </div>

    <div class="main main_block">
        <div class="main_block_content">
            <div class="btn_group">
                <button class="btn large_btn normal_btn" onclick="goBack()">Kembali</button>
            </div>
        </div>
    </div>
    `);

    // Inject styles
    _injectSv3dStyles();

    // Init viewer setelah DOM siap
    setTimeout(() => _sv3dInit(skin), 100);
}

/* ── Animation button list ── */
function _animButtons() {
    const anims = [
        { key: 'idle',    label: 'Idle',     icon: '🧍' },
        { key: 'walk',    label: 'Jalan',    icon: '🚶' },
        { key: 'run',     label: 'Lari',     icon: '🏃' },
        { key: 'fly',     label: 'Terbang',  icon: '🕊️' },
        { key: 'crouching', label: 'Jongkok', icon: '🦆' },
        { key: 'wave',    label: 'Lambaian', icon: '👋' },
    ];
    return anims.map(a => `
        <button class="sv3d_anim_btn ${_currentAnim === a.key ? 'sv3d_anim_active' : ''}"
            onclick="sv3dSetAnim('${a.key}', this)">
            <span style="font-size:20px;">${a.icon}</span>
            <span class="sv3d_anim_label">${a.label}</span>
        </button>
    `).join('');
}

/* ── Init skinview3d ── */
function _sv3dInit(skin) {
    const wrap = document.getElementById('skin3d_wrap');
    const canvas = document.getElementById('skin3d_canvas');
    const placeholder = document.getElementById('skin3d_placeholder');
    const loading = document.getElementById('skin3d_loading');
    const badge = document.getElementById('skin3d_badge');

    if (!canvas || !wrap) return;

    // Hancurkan viewer lama
    if (_skinViewer) {
        try { _skinViewer.dispose(); } catch(e) {}
        _skinViewer = null;
    }

    // Tidak ada skin atau skin tidak punya texture
    if (!skin || !skin.texPrev) {
        placeholder.style.display = 'flex';
        canvas.style.display = 'none';
        badge.style.display = 'none';
        return;
    }

    placeholder.style.display = 'none';
    canvas.style.display = 'block';
    loading.style.display = 'flex';

    // Ukuran responsif
    const wrapW = wrap.offsetWidth || 360;
    const viewW = Math.min(wrapW, 500);
    const viewH = Math.round(viewW * 0.75);

    // Pastikan library ada
    if (typeof skinview3d === 'undefined') {
        loading.style.display = 'none';
        _sv3dFallbackCanvas(canvas, skin, viewW, viewH);
        badge.textContent = esc(skin.locName || 'Skin');
        badge.style.display = 'block';
        return;
    }

    try {
        _skinViewer = new skinview3d.SkinViewer({
            canvas: canvas,
            width: viewW,
            height: viewH,
            skin: skin.texPrev,
        });

        if (skin.capePrev) {
            _skinViewer.loadCape(skin.capePrev);
        }

        _skinViewer.autoRotate = _autoRotate;
        _skinViewer.autoRotateSpeed = 0.8;
        _skinViewer.zoom = 0.9;
        _skinViewer.fov = 70;
        _skinViewer.background = null; // transparan

        // Terapkan animasi
        _sv3dApplyAnim(_currentAnim);

        loading.style.display = 'none';
        badge.textContent = skin.locName || 'Skin';
        badge.style.display = 'block';
    } catch(err) {
        console.error('skinview3d error:', err);
        loading.style.display = 'none';
        _sv3dFallbackCanvas(canvas, skin, viewW, viewH);
        badge.textContent = skin.locName || 'Skin';
        badge.style.display = 'block';
    }
}

/* ── Fallback: tampilkan texture flat di canvas kalau skinview3d gagal ── */
function _sv3dFallbackCanvas(canvas, skin, w, h) {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0d1a26';
    ctx.fillRect(0, 0, w, h);

    const img = new Image();
    img.onload = () => {
        // Render kepala (8×8 face dari UV 8,8)
        const scale = Math.floor(h / 64);
        const px = scale;
        // Badan proporsi
        const bH = Math.round(h * 0.7);
        const bW = Math.round(bH * 0.5);
        const bX = Math.round((w - bW) / 2);
        const bY = Math.round((h - bH) / 2);

        ctx.imageSmoothingEnabled = false;
        // Render full texture flat tapi scale besar
        ctx.drawImage(img, bX, bY, bW, bH);

        // Overlay teks
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `bold ${Math.max(10,scale*3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Preview (flat)', w/2, h - 10);
    };
    img.src = skin.texPrev;
}

/* ── Apply animation ── */
function _sv3dApplyAnim(key) {
    if (!_skinViewer) return;

    // Hapus animasi lama
    _skinViewer.animation = null;

    switch (key) {
        case 'walk':
            _skinViewer.animation = new skinview3d.WalkingAnimation();
            _skinViewer.animation.speed = 1;
            break;
        case 'run':
            _skinViewer.animation = new skinview3d.RunningAnimation();
            _skinViewer.animation.speed = 1.2;
            break;
        case 'fly':
            _skinViewer.animation = new skinview3d.FlyingAnimation();
            break;
        case 'crouching':
            // Idle tapi sedikit membungkuk — simulasi manual
            _skinViewer.animation = new skinview3d.IdleAnimation();
            if (_skinViewer.playerObject) {
                try {
                    _skinViewer.playerObject.rotation.x = 0.3;
                } catch(e) {}
            }
            break;
        case 'wave':
            _skinViewer.animation = new skinview3d.WaveAnimation
                ? new skinview3d.WaveAnimation()
                : new skinview3d.IdleAnimation();
            break;
        case 'idle':
        default:
            _skinViewer.animation = new skinview3d.IdleAnimation();
            break;
    }
}

/* ── Kontrol dari tombol ── */
function sv3dSetAnim(key, btnEl) {
    _currentAnim = key;
    // Update button aktif
    document.querySelectorAll('.sv3d_anim_btn').forEach(b => b.classList.remove('sv3d_anim_active'));
    if (btnEl) btnEl.classList.add('sv3d_anim_active');
    _sv3dApplyAnim(key);
}

function sv3dZoom(delta) {
    if (!_skinViewer) return;
    _skinViewer.zoom = Math.max(0.3, Math.min(2.5, _skinViewer.zoom + delta));
}

function sv3dToggleRotate() {
    _autoRotate = !_autoRotate;
    if (_skinViewer) _skinViewer.autoRotate = _autoRotate;
    const btn = document.getElementById('btn_rotate');
    if (btn) {
        btn.style.background = _autoRotate ? 'rgba(108,195,73,0.3)' : 'rgba(255,255,255,0.08)';
        btn.style.color = _autoRotate ? '#6CC349' : 'rgba(255,255,255,0.7)';
    }
}

function sv3dLoadSkin(idx) {
    _currentSkinIdx = idx;
    const skin = S.skins[idx];
    if (skin) _sv3dInit(skin);
}

/* ── Cleanup saat ganti halaman ── */
const _origNav = window.nav;
window.nav = function(page, addHist) {
    if (_skinViewer && page !== 'skin_preview') {
        try { _skinViewer.dispose(); } catch(e) {}
        _skinViewer = null;
    }
    _origNav(page, addHist);
};

/* ── Inject CSS untuk preview page ── */
function _injectSv3dStyles() {
    if (document.getElementById('_sv3d_styles')) return;
    const s = document.createElement('style');
    s.id = '_sv3d_styles';
    s.textContent = `
        /* Control buttons di pojok canvas */
        .preview_ctrl_btn {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            font-size: 14px;
            height: 30px;
            line-height: 1;
            padding: 0;
            text-align: center;
            width: 30px;
            transition: background 0.15s;
        }
        .preview_ctrl_btn:hover {
            background: rgba(255,255,255,0.18);
        }

        /* Grid tombol animasi */
        .sv3d_anim_grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            width: 100%;
        }
        @media (max-width: 400px) {
            .sv3d_anim_grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        /* Tombol animasi */
        .sv3d_anim_btn {
            align-items: center;
            background: rgba(255,255,255,0.06);
            border: 2px solid #58585A;
            color: rgba(255,255,255,0.75);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-height: 60px;
            padding: 8px 4px;
            transition: background 0.15s, border-color 0.15s;
        }
        .sv3d_anim_btn:hover {
            background: rgba(255,255,255,0.12);
            border-color: #888;
        }
        .sv3d_anim_btn.sv3d_anim_active {
            background: rgba(108,195,73,0.18);
            border-color: #6CC349;
            color: #6CC349;
        }
        .sv3d_anim_label {
            font-family: "NotoSans Bold", sans-serif;
            font-size: 11px;
        }
    `;
    document.head.appendChild(s);
}
