/**
 * BE Skin 4D Maker — Custom Bedrock Geometry Renderer
 * Parse geometry.json Bedrock dan render pakai Three.js
 * Mendukung semua custom bones 4D (ekor, sayap, tanduk, dll)
 */

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let _sv3d = {
    renderer: null,
    scene: null,
    camera: null,
    clock: null,
    animFrame: null,
    boneObjects: {},   // name -> THREE.Object3D
    animState: 'idle',
    autoRotate: true,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    spherical: { theta: 0.4, phi: 1.2, radius: 45 },
    currentSkinIdx: 0,
    texture: null,
};

/* ═══════════════════════════════════════════
   PAGE
═══════════════════════════════════════════ */
function pgSkinPreview(skinIdx) {
    _sv3d.currentSkinIdx = (skinIdx !== undefined) ? skinIdx : 0;

    const skinOpts = S.skins.map((sk, i) =>
        `<option value="${i}" ${i === _sv3d.currentSkinIdx ? 'selected' : ''}>${esc(sk.locName || 'Skin ' + (i+1))}</option>`
    ).join('');

    set(`
    <div class="main_title">
        <div class="main_title_area">
            <div class="main_title_span">PREVIEW</div>
            <div class="main_title_span_main">4D Skin Viewer</div>
        </div>
    </div>

    <div class="main main_block">
        <div class="main_block_content">
            <div id="sv3d_wrap" style="
                position:relative;
                background:linear-gradient(180deg,#1a2a3a 0%,#0d1217 100%);
                border:2px solid #333334;
                overflow:hidden;
                user-select:none;
                touch-action:none;
            ">
                <canvas id="sv3d_canvas" style="display:block;width:100%;"></canvas>

                <!-- Placeholder -->
                <div id="sv3d_placeholder" style="
                    display:none;position:absolute;inset:0;
                    align-items:center;justify-content:center;
                    flex-direction:column;gap:12px;
                    color:rgba(255,255,255,0.4);text-align:center;padding:24px;
                ">
                    <div style="font-size:44px;">⚠️</div>
                    <div style="font-family:'NotoSans Bold',sans-serif;font-size:13px;">
                        Perlu texture skin PNG<br>dan geometry.json untuk preview 4D.
                    </div>
                </div>

                <!-- Loading -->
                <div id="sv3d_loading" style="
                    display:none;position:absolute;inset:0;
                    background:rgba(13,18,23,0.85);
                    align-items:center;justify-content:center;
                    flex-direction:column;gap:10px;color:#fff;
                    font-family:'NotoSans Bold',sans-serif;font-size:12px;
                ">
                    <img src="./images/Loading_white.gif" style="height:32px;" alt="">
                    <span id="sv3d_loading_text">Memuat renderer...</span>
                </div>

                <!-- Controls pojok kanan atas -->
                <div style="position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:4px;">
                    <button class="sv3d_ctrl" onclick="_sv3dZoom(-5)" title="Zoom In">＋</button>
                    <button class="sv3d_ctrl" onclick="_sv3dZoom(5)" title="Zoom Out">－</button>
                    <button class="sv3d_ctrl" id="sv3d_rot_btn" onclick="_sv3dToggleRotate()" title="Auto Rotate" style="background:rgba(108,195,73,0.25);color:#6CC349;">⟳</button>
                </div>

                <!-- Geometry badge pojok kiri atas -->
                <div id="sv3d_geo_badge" style="
                    position:absolute;top:8px;left:8px;
                    background:rgba(0,0,0,0.55);
                    font-family:'NotoSans Bold',sans-serif;font-size:10px;
                    color:rgba(255,255,255,0.55);padding:3px 8px;
                    display:none;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                "></div>

                <!-- Skin name badge bawah -->
                <div id="sv3d_name_badge" style="
                    position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
                    background:rgba(0,0,0,0.55);
                    font-family:'NotoSans Bold',sans-serif;font-size:11px;
                    color:rgba(255,255,255,0.65);padding:3px 12px;white-space:nowrap;
                    display:none;
                "></div>
            </div>

            ${S.skins.length > 1 ? `
            <div class="ore_field" style="margin-top:10px;">
                <label class="ore_label">Pilih Skin</label>
                <select class="ore_select" onchange="_sv3dPickSkin(parseInt(this.value))">${skinOpts}</select>
            </div>` : ''}
        </div>
    </div>

    <!-- Animasi -->
    <div class="main main_block">
        <div class="main-header">Animasi</div>
        <div class="main_block_content">
            <div class="sv3d_anim_grid" id="sv3d_anim_grid">
                ${_sv3dAnimBtns()}
            </div>
        </div>
    </div>

    <!-- Info -->
    <div class="main main_block">
        <div class="main-header">Info</div>
        <div class="main_block_content">
            <article_block>
                <article_detail style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.9;">
                    🖱️ <b style="color:rgba(255,255,255,0.7);">Drag</b> untuk orbit · <b style="color:rgba(255,255,255,0.7);">Scroll</b> untuk zoom<br>
                    🧩 Renderer ini membaca <code>geometry.json</code> Bedrock dan merender <b>semua bone</b> termasuk extra bones 4D (ekor, sayap, tanduk, dll).<br>
                    ✅ Upload geometry.json di langkah 3 agar model 4D-nya tampil.
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

    _sv3dInjectStyles();
    setTimeout(() => _sv3dBoot(), 80);
}

function _sv3dAnimBtns() {
    const list = [
        { key:'idle',  icon:'🧍', label:'Idle'    },
        { key:'walk',  icon:'🚶', label:'Jalan'   },
        { key:'run',   icon:'🏃', label:'Lari'    },
        { key:'wave',  icon:'👋', label:'Lambaian'},
        { key:'fly',   icon:'🕊️', label:'Terbang' },
        { key:'crouch',icon:'🦆', label:'Jongkok' },
    ];
    return list.map(a => `
        <button class="sv3d_anim_btn ${_sv3d.animState === a.key ? 'sv3d_anim_active' : ''}"
            onclick="_sv3dSetAnim('${a.key}',this)">
            <span style="font-size:20px;">${a.icon}</span>
            <span class="sv3d_anim_lbl">${a.label}</span>
        </button>
    `).join('');
}

/* ═══════════════════════════════════════════
   BOOT — inisialisasi Three.js + load model
═══════════════════════════════════════════ */
function _sv3dBoot() {
    _sv3dDestroy();

    const wrap   = document.getElementById('sv3d_wrap');
    const canvas = document.getElementById('sv3d_canvas');
    if (!wrap || !canvas) return;

    const skin = S.skins[_sv3d.currentSkinIdx];
    if (!skin || !skin.texPrev) {
        document.getElementById('sv3d_placeholder').style.display = 'flex';
        return;
    }

    const W = wrap.offsetWidth || 360;
    const H = Math.round(W * 0.72);
    canvas.width  = W;
    canvas.height = H;
    wrap.style.height = H + 'px';

    _sv3dShowLoading('Memuat Three.js...');

    // Pastikan Three.js ada
    if (typeof THREE === 'undefined') {
        _sv3dShowLoading('Gagal: Three.js tidak tersedia');
        return;
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    _sv3d.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    _sv3d.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    _sv3d.camera = camera;
    _sv3dUpdateCamera();

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8aa8cc, 0.3);
    fillLight.position.set(-15, 10, -20);
    scene.add(fillLight);

    // Grid bawah
    const grid = new THREE.GridHelper(30, 10, 0x2a4a6a, 0x1a2a3a);
    grid.position.y = 0;
    scene.add(grid);

    _sv3d.clock = new THREE.Clock();
    _sv3d.boneObjects = {};

    _sv3dShowLoading('Memuat texture...');

    // Load texture
    const loader = new THREE.TextureLoader();
    loader.load(skin.texPrev, (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace || THREE.LinearEncoding;
        _sv3d.texture = tex;

        _sv3dShowLoading('Membangun model...');

        setTimeout(() => {
            _sv3dBuildModel(skin);
            _sv3dHideLoading();
            _sv3dStartLoop();
            _sv3dSetupDrag(canvas, wrap);

            // Badge info
            const nameBadge = document.getElementById('sv3d_name_badge');
            if (nameBadge) {
                nameBadge.textContent = skin.locName || 'Skin';
                nameBadge.style.display = 'block';
            }
        }, 50);
    }, undefined, (err) => {
        console.error('Texture load error:', err);
        _sv3dShowLoading('Gagal load texture');
    });
}

/* ═══════════════════════════════════════════
   MODEL BUILDER — parse geometry.json Bedrock
═══════════════════════════════════════════ */
function _sv3dBuildModel(skin) {
    const scene = _sv3d.scene;

    // Cari geometry yang cocok
    let geoData = null;
    let texW = 64, texH = 64;

    if (S.geometryData) {
        // Ada custom geometry.json — cari geometry yang match skin ini
        const targetGeo = skin.geometry;
        geoData = _sv3dFindGeometry(S.geometryData, targetGeo);
        if (geoData) {
            texW = geoData.description?.texture_width  || 64;
            texH = geoData.description?.texture_height || 64;
            const id = geoData.description?.identifier || targetGeo;
            const geoBadge = document.getElementById('sv3d_geo_badge');
            if (geoBadge) {
                geoBadge.textContent = id;
                geoBadge.style.display = 'block';
            }
        }
    }

    // Fallback ke humanoid standar kalau tidak ada geometry custom
    if (!geoData) {
        geoData = _sv3dDefaultHumanoidGeo();
        texW = 64; texH = 64;
    }

    const bones = geoData.bones || [];
    const mat = new THREE.MeshLambertMaterial({
        map: _sv3d.texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.FrontSide,
    });

    // Root group (Y-up, dibalik dari MC coords)
    const root = new THREE.Group();
    root.position.y = 1; // angkat sedikit dari grid
    scene.add(root);

    // Bangun semua bone sebagai Object3D, simpan di map
    const boneMap = {};  // name -> { obj3d, boneDef }

    // Pass 1: buat semua bone
    for (const bone of bones) {
        const obj = new THREE.Group();
        obj.name = bone.name;
        boneMap[bone.name] = { obj, bone };
    }

    // Pass 2: susun hierarki & set pivot
    for (const bone of bones) {
        const { obj } = boneMap[bone.name];
        const pivot = bone.pivot || [0, 0, 0];

        // Pivot dalam koordinat MC → Three.js
        // MC: Y up, Z forward (into screen), X right
        // Three.js: Y up, Z toward camera, X right
        // MC →  Three.js: x = mc_x/16, y = mc_y/16, z = -mc_z/16
        obj.position.set(pivot[0] / 16, pivot[1] / 16, -pivot[2] / 16);

        if (bone.rotation) {
            obj.rotation.set(
                THREE.MathUtils.degToRad(-bone.rotation[0]),
                THREE.MathUtils.degToRad(-bone.rotation[1]),
                THREE.MathUtils.degToRad(bone.rotation[2]),
            );
        }

        if (bone.parent && boneMap[bone.parent]) {
            // Anak relative ke parent pivot
            const parentObj = boneMap[bone.parent].obj;
            parentObj.add(obj);
            // Offset relatif dari parent pivot
            const parentPivot = boneMap[bone.parent].bone.pivot || [0,0,0];
            obj.position.set(
                (pivot[0] - parentPivot[0]) / 16,
                (pivot[1] - parentPivot[1]) / 16,
                -(pivot[2] - parentPivot[2]) / 16,
            );
        } else {
            root.add(obj);
            // Root bones: hitung dari asal (0,0,0 di kaki)
            obj.position.set(pivot[0] / 16, pivot[1] / 16, -pivot[2] / 16);
        }
    }

    // Pass 3: buat mesh cube untuk tiap bone
    for (const bone of bones) {
        const { obj } = boneMap[bone.name];
        const cubes = bone.cubes || [];
        const boneRot = bone.rotation || [0,0,0];

        for (const cube of cubes) {
            const mesh = _sv3dBuildCube(cube, bone, mat, texW, texH);
            if (mesh) obj.add(mesh);
        }
    }

    _sv3d.boneObjects = boneMap;

    // Hitung bounding box & center model
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    root.position.y = -box.min.y + 0.02; // taruh di atas grid
    _sv3d.spherical.radius = Math.max(size.y * 2.2, 30);
    _sv3dUpdateCamera();
}

/* ── Cari geometry yang match ── */
function _sv3dFindGeometry(geoData, targetId) {
    // Format baru: { "minecraft:geometry": [...] }
    const list = geoData['minecraft:geometry'] || [];
    for (const g of list) {
        const id = g.description?.identifier || '';
        if (id === targetId || id.endsWith('.' + targetId.split('.').pop())) return g;
    }
    // Fallback: format lama { "geometry.xxx": { bones: [] } }
    for (const key of Object.keys(geoData)) {
        if (key === 'format_version') continue;
        if (key === targetId) return { description: { identifier: key }, bones: geoData[key].bones || [] };
    }
    // Ambil pertama saja
    if (list.length > 0) return list[0];
    return null;
}

/* ── Build satu cube Three.js dari definisi Bedrock ── */
function _sv3dBuildCube(cubeDef, boneDef, mat, texW, texH) {
    const origin  = cubeDef.origin  || [0, 0, 0];  // sudut bawah-kiri-depan
    const size    = cubeDef.size    || [1, 1, 1];   // [w, h, d]
    const uv      = cubeDef.uv;                     // [u, v] atau object per face
    const inflate = cubeDef.inflate || 0;
    const mirror  = cubeDef.mirror  || boneDef.mirror || false;

    const sx = (size[0] + inflate * 2);
    const sy = (size[1] + inflate * 2);
    const sz = (size[2] + inflate * 2);

    // Tengah cube dalam koordinat lokal bone (relatif terhadap pivot)
    const bonePivot = boneDef.pivot || [0, 0, 0];
    const cx = (origin[0] + size[0] / 2 - bonePivot[0]) / 16;
    const cy = (origin[1] + size[1] / 2 - bonePivot[1]) / 16;
    const cz = -(origin[2] + size[2] / 2 - bonePivot[2]) / 16;

    const geo = new THREE.BoxGeometry(sx / 16, sy / 16, sz / 16);

    // UV mapping — Box UV Bedrock
    // Urutan face Three.js BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
    // Yang jadi: right, left, top, bottom, front, back
    // Bedrock Box UV standard:
    //   uv[u,v] = top-left dari "unfolded" pattern:
    //   [top row]: top (w×d), kemudian right (d×h) dari kanan atas
    //   [bottom row]: sama
    //   Layout: 
    //   (u+d, v)       → top (w×d)    (u, v) → nothing
    //   (u, v+d)       → right (d×h)  (u+d, v+d) → front (w×h)  (u+d+w, v+d) → left (d×h)  (u+d+w+d, v+d) → back (w×h)
    //   (u+d, v+d+h)   → bottom (w×d)

    if (uv && !Array.isArray(uv)) {
        // Per-face UV (format baru Blockbench)
        _sv3dApplyPerFaceUV(geo, uv, texW, texH, mirror);
    } else {
        // Box UV standar
        const u = Array.isArray(uv) ? uv[0] : 0;
        const v = Array.isArray(uv) ? uv[1] : 0;
        const w = size[0], h = size[1], d = size[2];
        _sv3dApplyBoxUV(geo, u, v, w, h, d, texW, texH, mirror);
    }

    // Cube rotation (beberapa cube punya rotation sendiri)
    const cubeMesh = new THREE.Mesh(geo, mat);
    cubeMesh.position.set(cx, cy, cz);

    if (cubeDef.pivot && cubeDef.rotation) {
        const cp = cubeDef.pivot;
        const pr = boneDef.pivot || [0,0,0];
        const rcx = (cp[0] - pr[0]) / 16;
        const rcy = (cp[1] - pr[1]) / 16;
        const rcz = -(cp[2] - pr[2]) / 16;
        cubeMesh.position.set(
            (cubeDef.origin[0] + cubeDef.size[0]/2 - cp[0]) / 16 + rcx,
            (cubeDef.origin[1] + cubeDef.size[1]/2 - cp[1]) / 16 + rcy,
            -(cubeDef.origin[2] + cubeDef.size[2]/2 - cp[2]) / 16 + rcz,
        );
        cubeMesh.rotation.set(
            THREE.MathUtils.degToRad(-cubeDef.rotation[0]),
            THREE.MathUtils.degToRad(-cubeDef.rotation[1]),
            THREE.MathUtils.degToRad(cubeDef.rotation[2]),
        );
    }

    return cubeMesh;
}

/* ── Box UV Bedrock: mapping ke UV attribute ── */
function _sv3dApplyBoxUV(geo, u, v, w, h, d, texW, texH, mirror) {
    // Face index di BoxGeometry Three.js:
    // 0:+X(right), 1:-X(left), 2:+Y(top), 3:-Y(bottom), 4:+Z(front), 5:-Z(back)
    // Bedrock layout untuk (u,v):
    // right  → u,       v+d      size: d×h
    // front  → u+d,     v+d      size: w×h
    // left   → u+d+w,   v+d      size: d×h
    // back   → u+d+w+d, v+d      size: w×h
    // top    → u+d,     v        size: w×d  (flipped Y)
    // bottom → u+d+w,   v        size: w×d  (flipped Y)

    const tw = texW, th = texH;
    const faceUVs = [
        // +X (right)
        [[u,          v+d],   [u+d,        v+d],   [u,          v+d+h], [u+d,        v+d+h]],
        // -X (left)
        [[u+d+w,      v+d],   [u+d+w+d,    v+d],   [u+d+w,      v+d+h], [u+d+w+d,    v+d+h]],
        // +Y (top) — note: Bedrock top face UV is often mirrored
        [[u+d,        v+d],   [u+d+w,      v+d],   [u+d,        v],     [u+d+w,      v]],
        // -Y (bottom)
        [[u+d+w,      v+d],   [u+d+w+w,    v+d],   [u+d+w,      v],     [u+d+w+w,    v]],
        // +Z (front/south)
        [[u+d,        v+d],   [u+d+w,      v+d],   [u+d,        v+d+h], [u+d+w,      v+d+h]],
        // -Z (back/north)
        [[u+d+w+d,    v+d],   [u+d+w+d+w,  v+d],   [u+d+w+d,    v+d+h], [u+d+w+d+w,  v+d+h]],
    ];

    const uvAttr = geo.attributes.uv;
    const uvArr  = uvAttr.array;
    let vi = 0;

    for (let face = 0; face < 6; face++) {
        const [[u0,v0],[u1,v1],[u2,v2],[u3,v3]] = faceUVs[face];
        // Three.js BoxGeometry face vertex order: 0,1,2 dan 2,1,3
        // vertices: TL, TR, BL, BR → indices 0,1,2,3
        // three.js order per face (2 triangles, 4 verts): 0,1,2, 1,3,2
        // actual UV at: vi+0=0, vi+2=1, vi+4=2, vi+6=1, vi+8=3, vi+10=2
        // simpler: 4 unique verts per face at vi/2: 0,1,2,3
        const fu = (pu) => pu / tw;
        const fv = (pv) => 1 - pv / th;

        if (face === 2 || face === 3) {
            // top/bottom — different vert layout
            uvArr[vi+0]  = fu(u0); uvArr[vi+1]  = fv(v0);
            uvArr[vi+2]  = fu(u2); uvArr[vi+3]  = fv(v2);
            uvArr[vi+4]  = fu(u1); uvArr[vi+5]  = fv(v1);
            uvArr[vi+6]  = fu(u2); uvArr[vi+7]  = fv(v2);
            uvArr[vi+8]  = fu(u3); uvArr[vi+9]  = fv(v3);
            uvArr[vi+10] = fu(u1); uvArr[vi+11] = fv(v1);
        } else {
            uvArr[vi+0]  = fu(u0); uvArr[vi+1]  = fv(v0);
            uvArr[vi+2]  = fu(u1); uvArr[vi+3]  = fv(v1);
            uvArr[vi+4]  = fu(u2); uvArr[vi+5]  = fv(v2);
            uvArr[vi+6]  = fu(u1); uvArr[vi+7]  = fv(v1);
            uvArr[vi+8]  = fu(u3); uvArr[vi+9]  = fv(v3);
            uvArr[vi+10] = fu(u2); uvArr[vi+11] = fv(v2);
        }

        vi += 12;
    }
    uvAttr.needsUpdate = true;
}

/* ── Per-face UV (format object) ── */
function _sv3dApplyPerFaceUV(geo, faceObj, texW, texH, mirror) {
    // Map face name → Three.js face index
    // Bedrock: north, south, east, west, up, down
    // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    const faceNames = ['east', 'west', 'up', 'down', 'south', 'north'];
    const uvAttr = geo.attributes.uv;
    const uvArr  = uvAttr.array;

    for (let fi = 0; fi < 6; fi++) {
        const fn = faceNames[fi];
        const face = faceObj[fn] || faceObj.north || null;
        let vi = fi * 12;

        if (!face) { vi += 12; continue; }

        const [pu, pv] = face.uv || [0, 0];
        const [uw, uh] = face.uv_size || [16, 16];
        const u0 = pu / texW, u1 = (pu + uw) / texW;
        const v0 = 1 - pv / texH, v1 = 1 - (pv + uh) / texH;

        uvArr[vi+0]  = u0; uvArr[vi+1]  = v0;
        uvArr[vi+2]  = u1; uvArr[vi+3]  = v0;
        uvArr[vi+4]  = u0; uvArr[vi+5]  = v1;
        uvArr[vi+6]  = u1; uvArr[vi+7]  = v0;
        uvArr[vi+8]  = u1; uvArr[vi+9]  = v1;
        uvArr[vi+10] = u0; uvArr[vi+11] = v1;
    }
    uvAttr.needsUpdate = true;
}

/* ── Geometry humanoid default (kalau tidak ada geometry.json) ── */
function _sv3dDefaultHumanoidGeo() {
    return {
        description: { identifier: 'geometry.humanoid.custom', texture_width: 64, texture_height: 64 },
        bones: [
            { name:'root',       pivot:[0,0,0] },
            { name:'waist',      pivot:[0,12,0],  parent:'root' },
            { name:'body',       pivot:[0,24,0],  parent:'waist',
              cubes:[{ origin:[-4,12,-2], size:[8,12,4], uv:[16,16] }] },
            { name:'head',       pivot:[0,24,0],  parent:'body',
              cubes:[{ origin:[-4,24,-4], size:[8,8,8],  uv:[0,0] }] },
            { name:'hat',        pivot:[0,24,0],  parent:'head', inflate:0.5,
              cubes:[{ origin:[-4,24,-4], size:[8,8,8],  uv:[32,0], inflate:0.5 }] },
            { name:'leftArm',    pivot:[5,22,0],  parent:'body',
              cubes:[{ origin:[4,12,-2],  size:[4,12,4], uv:[32,48] }] },
            { name:'leftSleeve', pivot:[5,22,0],  parent:'leftArm',
              cubes:[{ origin:[4,12,-2],  size:[4,12,4], uv:[48,48], inflate:0.25 }] },
            { name:'rightArm',   pivot:[-5,22,0], parent:'body',
              cubes:[{ origin:[-8,12,-2], size:[4,12,4], uv:[40,16] }] },
            { name:'rightSleeve',pivot:[-5,22,0], parent:'rightArm',
              cubes:[{ origin:[-8,12,-2], size:[4,12,4], uv:[40,32], inflate:0.25 }] },
            { name:'jacket',     pivot:[0,24,0],  parent:'body',
              cubes:[{ origin:[-4,12,-2], size:[8,12,4], uv:[16,32], inflate:0.25 }] },
            { name:'leftLeg',    pivot:[1.9,12,0],parent:'root',
              cubes:[{ origin:[-0.1,0,-2],size:[4,12,4], uv:[16,48] }] },
            { name:'leftPants',  pivot:[1.9,12,0],parent:'leftLeg',
              cubes:[{ origin:[-0.1,0,-2],size:[4,12,4], uv:[0,48],  inflate:0.25 }] },
            { name:'rightLeg',   pivot:[-1.9,12,0],parent:'root',
              cubes:[{ origin:[-3.9,0,-2],size:[4,12,4], uv:[0,16] }] },
            { name:'rightPants', pivot:[-1.9,12,0],parent:'rightLeg',
              cubes:[{ origin:[-3.9,0,-2],size:[4,12,4], uv:[0,32],  inflate:0.25 }] },
        ]
    };
}

/* ═══════════════════════════════════════════
   RENDER LOOP + ANIMASI
═══════════════════════════════════════════ */
function _sv3dStartLoop() {
    const loop = () => {
        _sv3d.animFrame = requestAnimationFrame(loop);
        const t = _sv3d.clock.getElapsedTime();

        if (_sv3d.autoRotate) {
            _sv3d.spherical.theta += 0.008;
        }
        _sv3dUpdateCamera();
        _sv3dTickAnim(t);

        _sv3d.renderer.render(_sv3d.scene, _sv3d.camera);
    };
    loop();
}

function _sv3dTickAnim(t) {
    const bo = _sv3d.boneObjects;
    const get = (name) => bo[name]?.obj;

    const head      = get('head');
    const body      = get('body');
    const leftArm   = get('leftArm');
    const rightArm  = get('rightArm');
    const leftLeg   = get('leftLeg');
    const rightLeg  = get('rightLeg');
    const waist     = get('waist');

    const s = _sv3d.animState;

    // Reset semua bone ke 0 dulu
    [head, body, leftArm, rightArm, leftLeg, rightLeg, waist].forEach(b => {
        if (!b) return;
        b.rotation.x = 0; b.rotation.y = 0; b.rotation.z = 0;
    });

    const sin = Math.sin;
    const cos = Math.cos;
    const d2r = THREE.MathUtils.degToRad;

    if (s === 'idle') {
        if (head)     head.rotation.y     = sin(t * 0.6) * 0.1;
        if (leftArm)  leftArm.rotation.z  = d2r(5) + sin(t * 0.9) * 0.03;
        if (rightArm) rightArm.rotation.z = d2r(-5) - sin(t * 0.9) * 0.03;
        if (body)     body.rotation.y     = sin(t * 0.5) * 0.03;

    } else if (s === 'walk') {
        const spd = 2.5, amp = 0.45;
        if (leftArm)  leftArm.rotation.x  =  sin(t * spd) * amp;
        if (rightArm) rightArm.rotation.x = -sin(t * spd) * amp;
        if (leftLeg)  leftLeg.rotation.x  = -sin(t * spd) * amp;
        if (rightLeg) rightLeg.rotation.x =  sin(t * spd) * amp;
        if (body)     body.rotation.y     =  sin(t * spd) * 0.06;
        if (head)     head.rotation.y     =  sin(t * spd * 0.5) * 0.08;

    } else if (s === 'run') {
        const spd = 5, amp = 0.75;
        if (leftArm)  leftArm.rotation.x  =  sin(t * spd) * amp;
        if (rightArm) rightArm.rotation.x = -sin(t * spd) * amp;
        if (leftLeg)  leftLeg.rotation.x  = -sin(t * spd) * amp;
        if (rightLeg) rightLeg.rotation.x =  sin(t * spd) * amp;
        if (body)     body.rotation.x     = -d2r(12);
        if (body)     body.rotation.y     =  sin(t * spd) * 0.08;
        if (head)     head.rotation.x     =  d2r(8);

    } else if (s === 'fly') {
        if (body)     body.rotation.x     = -d2r(25);
        if (head)     head.rotation.x     =  d2r(20);
        if (leftArm)  { leftArm.rotation.z  = d2r(80); leftArm.rotation.x = -d2r(15); }
        if (rightArm) { rightArm.rotation.z = d2r(-80); rightArm.rotation.x = -d2r(15); }
        if (leftLeg)  leftLeg.rotation.x  = d2r(10);
        if (rightLeg) rightLeg.rotation.x = d2r(10);

    } else if (s === 'wave') {
        if (leftArm) {
            leftArm.rotation.z =  d2r(70) + sin(t * 4) * d2r(25);
            leftArm.rotation.x = -d2r(10);
        }
        if (rightArm) rightArm.rotation.z = -d2r(5);
        if (head)     head.rotation.y = sin(t * 1.2) * 0.12;

    } else if (s === 'crouch') {
        if (waist)    waist.rotation.x    = d2r(25);
        if (head)     head.rotation.x     = -d2r(20);
        if (leftLeg)  leftLeg.rotation.x  = d2r(35);
        if (rightLeg) rightLeg.rotation.x = d2r(35);
        if (leftArm)  leftArm.rotation.x  = d2r(10);
        if (rightArm) rightArm.rotation.x = d2r(10);
    }

    // Animasi extra bones 4D — tail, wings, ears, horn, dll
    _sv3dTickExtraBones(t, s);
}

/* ── Animasi extra bones 4D ── */
function _sv3dTickExtraBones(t, animState) {
    const bo = _sv3d.boneObjects;
    const sin = Math.sin, cos = Math.cos;
    const d2r = THREE.MathUtils.degToRad;

    for (const [name, { obj }] of Object.entries(bo)) {
        const n = name.toLowerCase();

        // Skip bone utama humanoid
        if (['root','waist','body','head','hat','jacket',
             'leftarm','rightarm','leftsleeve','rightsleeve',
             'leftleg','rightleg','leftpants','rightpants',
             'leftitem','rightitem','cape'].includes(n)) continue;

        // Ekor / tail
        if (n.includes('tail') || n.includes('ekor')) {
            obj.rotation.z = sin(t * 2.5) * d2r(15);
            obj.rotation.x = sin(t * 1.8) * d2r(8);
            if (animState === 'walk' || animState === 'run') {
                obj.rotation.z = sin(t * (animState === 'run' ? 5 : 2.5)) * d2r(20);
            }
        }
        // Sayap / wing
        else if (n.includes('wing') || n.includes('sayap')) {
            if (animState === 'fly') {
                obj.rotation.z = sin(t * 5) * d2r(30);
            } else {
                obj.rotation.z = sin(t * 1.5) * d2r(5);
            }
        }
        // Telinga / ear
        else if (n.includes('ear') || n.includes('telinga')) {
            obj.rotation.z = sin(t * 1.2 + (n.includes('right') ? 0.5 : -0.5)) * d2r(8);
        }
        // Tanduk / horn
        else if (n.includes('horn') || n.includes('tanduk')) {
            // Statis, tidak perlu animasi
        }
        // Rambut / hair
        else if (n.includes('hair') || n.includes('rambut')) {
            obj.rotation.z = sin(t * 1.8) * d2r(4);
        }
        // Scarf / selendang
        else if (n.includes('scarf') || n.includes('selendang') || n.includes('ribbon')) {
            obj.rotation.z = sin(t * 2) * d2r(10);
            obj.rotation.x = sin(t * 1.5) * d2r(6);
        }
        // Partikel / floating
        else if (n.includes('float') || n.includes('halo')) {
            obj.rotation.y = t * 1.5;
            obj.position.y += sin(t * 2) * 0.002;
        }
        // Default: sedikit oscillate
        else {
            obj.rotation.z = sin(t * 1.5 + name.length) * d2r(3);
        }
    }
}

/* ═══════════════════════════════════════════
   KAMERA
═══════════════════════════════════════════ */
function _sv3dUpdateCamera() {
    if (!_sv3d.camera) return;
    const { theta, phi, radius } = _sv3d.spherical;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi) + 14;   // sedikit di atas model
    const z = radius * Math.sin(phi) * Math.cos(theta);
    _sv3d.camera.position.set(x, y, z);
    _sv3d.camera.lookAt(0, 14, 0);
}

function _sv3dZoom(delta) {
    _sv3d.spherical.radius = Math.max(10, Math.min(100, _sv3d.spherical.radius + delta));
    _sv3dUpdateCamera();
}

function _sv3dToggleRotate() {
    _sv3d.autoRotate = !_sv3d.autoRotate;
    const btn = document.getElementById('sv3d_rot_btn');
    if (btn) {
        btn.style.background = _sv3d.autoRotate ? 'rgba(108,195,73,0.25)' : 'rgba(255,255,255,0.08)';
        btn.style.color      = _sv3d.autoRotate ? '#6CC349' : 'rgba(255,255,255,0.6)';
    }
}

/* ═══════════════════════════════════════════
   DRAG / TOUCH untuk orbit kamera
═══════════════════════════════════════════ */
function _sv3dSetupDrag(canvas, wrap) {
    // Mouse
    canvas.addEventListener('mousedown', e => {
        _sv3d.isDragging = true;
        _sv3d.dragStart = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mousemove', e => {
        if (!_sv3d.isDragging) return;
        const dx = e.clientX - _sv3d.dragStart.x;
        const dy = e.clientY - _sv3d.dragStart.y;
        _sv3d.spherical.theta -= dx * 0.01;
        _sv3d.spherical.phi    = Math.max(0.2, Math.min(Math.PI - 0.1, _sv3d.spherical.phi + dy * 0.01));
        _sv3d.dragStart = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => { _sv3d.isDragging = false; });

    // Touch
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            _sv3d.isDragging = true;
            _sv3d.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, { passive: true });
    canvas.addEventListener('touchmove', e => {
        if (!_sv3d.isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - _sv3d.dragStart.x;
        const dy = e.touches[0].clientY - _sv3d.dragStart.y;
        _sv3d.spherical.theta -= dx * 0.012;
        _sv3d.spherical.phi    = Math.max(0.2, Math.min(Math.PI - 0.1, _sv3d.spherical.phi + dy * 0.012));
        _sv3d.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    canvas.addEventListener('touchend', () => { _sv3d.isDragging = false; });

    // Scroll zoom
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        _sv3dZoom(e.deltaY * 0.05);
    }, { passive: false });
}

/* ═══════════════════════════════════════════
   KONTROL PUBLIC
═══════════════════════════════════════════ */
function _sv3dSetAnim(key, btn) {
    _sv3d.animState = key;
    document.querySelectorAll('.sv3d_anim_btn').forEach(b => b.classList.remove('sv3d_anim_active'));
    if (btn) btn.classList.add('sv3d_anim_active');
}

function _sv3dPickSkin(idx) {
    _sv3d.currentSkinIdx = idx;
    _sv3dBoot();
}

/* ═══════════════════════════════════════════
   LOADING / DESTROY
═══════════════════════════════════════════ */
function _sv3dShowLoading(msg) {
    const el = document.getElementById('sv3d_loading');
    const txt = document.getElementById('sv3d_loading_text');
    if (el)  el.style.display  = 'flex';
    if (txt) txt.textContent = msg || 'Memuat...';
}
function _sv3dHideLoading() {
    const el = document.getElementById('sv3d_loading');
    if (el) el.style.display = 'none';
}
function _sv3dDestroy() {
    if (_sv3d.animFrame) { cancelAnimationFrame(_sv3d.animFrame); _sv3d.animFrame = null; }
    if (_sv3d.renderer)  { _sv3d.renderer.dispose(); _sv3d.renderer = null; }
    if (_sv3d.texture)   { _sv3d.texture.dispose();  _sv3d.texture  = null; }
    _sv3d.scene = null; _sv3d.camera = null; _sv3d.boneObjects = {};
}

/* ── Cleanup saat nav ── */
const _origNav2 = window.nav;
window.nav = function(page, addHist) {
    if (page !== 'skin_preview') _sv3dDestroy();
    _origNav2(page, addHist);
};

/* ═══════════════════════════════════════════
   INJECT THREE.JS + STYLES
═══════════════════════════════════════════ */
function _sv3dInjectStyles() {
    if (document.getElementById('_sv3d_css')) return;
    const s = document.createElement('style');
    s.id = '_sv3d_css';
    s.textContent = `
        .sv3d_ctrl {
            background:rgba(255,255,255,0.08);
            border:1px solid rgba(255,255,255,0.15);
            color:rgba(255,255,255,0.7);
            cursor:pointer;font-size:15px;
            height:30px;width:30px;
            display:flex;align-items:center;justify-content:center;
            transition:background 0.15s;
        }
        .sv3d_ctrl:hover { background:rgba(255,255,255,0.18); }

        .sv3d_anim_grid {
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:6px;width:100%;
        }
        @media(max-width:400px){ .sv3d_anim_grid{ grid-template-columns:repeat(2,1fr); } }

        .sv3d_anim_btn {
            align-items:center;
            background:rgba(255,255,255,0.06);
            border:2px solid #58585A;
            color:rgba(255,255,255,0.75);
            cursor:pointer;display:flex;
            flex-direction:column;gap:4px;
            min-height:60px;padding:8px 4px;
            transition:background 0.15s,border-color 0.15s;
        }
        .sv3d_anim_btn:hover { background:rgba(255,255,255,0.12);border-color:#888; }
        .sv3d_anim_btn.sv3d_anim_active {
            background:rgba(108,195,73,0.18);
            border-color:#6CC349;color:#6CC349;
        }
        .sv3d_anim_lbl {
            font-family:"NotoSans Bold",sans-serif;font-size:11px;
        }
    `;
    document.head.appendChild(s);
}

/* ── Load Three.js dari CDN kalau belum ada ── */
(function() {
    if (typeof THREE !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => console.log('[4D Preview] Three.js r128 loaded');
    script.onerror = () => console.error('[4D Preview] Gagal load Three.js');
    document.head.appendChild(script);
})();
