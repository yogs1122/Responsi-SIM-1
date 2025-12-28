import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

// =========================================
// 1. SETUP ENGINE & SCENE
// =========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 2, 20); // Kabut lebih dekat biar dramatis

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// =========================================
// 2. LIGHTING
// =========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// =========================================
// 3. GAME VARIABLES
// =========================================
let playerCow = null;
let isPopupOpen = false; // Supaya sapi gak jalan pas baca
const keys = { w: false, a: false, s: false, d: false, shift: false };

const interactMsg = document.getElementById('interact-msg');
const infoModal = document.getElementById('info-modal');
const closeBtn = document.getElementById('close-btn');

// === RAYCASTING UNTUK BUBBLE CLICK ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let bubbleObjects = {}; // Objek bubble yang bisa diklik
let model3D = null; // Simpan reference ke model

function navigateToPage(pageName) {
    const overlay = document.getElementById('overlay');
    const navItems = document.querySelectorAll('.nav-item');
    
    // Buka overlay
    overlay?.classList.add('active');
    
    // Trigger click nav item
    navItems.forEach(btn => {
        if (btn.dataset.page === pageName) {
            btn.click();
        }
    });
}

// Logic Tutup Tombol
closeBtn.addEventListener('click', () => {
    infoModal.style.display = 'none';
    isPopupOpen = false;
});

// --- CONFIG FIRST PERSON ---
const eyeHeight = 1.0;  // Tinggi mata dari tanah (sesuaikan kalau kependekan)
const lookAheadDist = 10; // Seberapa jauh pandangan ke depan

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (keys.hasOwnProperty(k) || k === 'shift') keys[k] = true;

    // --- TAMBAHAN BARU: TOMBOL ENTER ---
    if (e.key === 'Enter' && interactMsg.style.display === 'block') {
        infoModal.style.display = 'block';
        isPopupOpen = true; // Kunci pergerakan
        interactMsg.style.display = 'none';
    }
    
    // --- TOMBOL ESC ---
    if (e.key === 'Escape' && infoModal.style.display === 'block') {
        infoModal.style.display = 'none';
        isPopupOpen = false;
    }
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (keys.hasOwnProperty(k) || k === 'shift') keys[k] = false;
});

// =========================================
// 4. LOADERS
// =========================================
const textureLoader = new THREE.TextureLoader();
textureLoader.setPath('public/models/'); // Set base path untuk texture

const loader = new GLTFLoader();
loader.setPath('public/models/'); // Set base path untuk model & texture

loader.load('LowPoly Farm V2.gltf', (gltf) => {
    const model = gltf.scene;
    model3D = model; // Simpan reference
    console.log('✅ Model loaded!');
    console.log('📋 Mesh names:');

    model.traverse((child) => {
        if (child.isMesh) {
            console.log(`  - ${child.name}`);
            
            // Jangan override material
            child.castShadow = true;
            child.receiveShadow = true;

            // --- PLAYER SETUP ---
            if (child.name === "Plane008" || child.name === "plane.008" || child.name === "Plane.008") {
                playerCow = child;
                playerCow.position.set(4, 0, 0); 
                playerCow.rotation.y = Math.PI;
            }
            
            // --- BUBBLE DETECTION ---
            // Coba cari bubble berdasarkan nama
            if (child.name.includes('Bubble')) {
                bubbleObjects[child.name] = child;
                console.log(`✅ Bubble found: ${child.name}`);
            }

            // --- NPC SETUP ---
        }
    });

    model.scale.set(0.5, 0.5, 0.5);
    model.position.y = -2; 
    scene.add(model);

}, undefined, (err) => console.error(err));

// =========================================
// 5. BUBBLE CLICK HANDLER
// =========================================
window.addEventListener('click', (event) => {
    // Hanya jika click pada canvas, bukan HTML element
    if (event.target !== renderer.domElement) return;
    
    if (Object.keys(bubbleObjects).length === 0) return; // Tidak ada bubble
    
    // Convert mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    // Cek interseksi dengan semua bubble
    const bubbleArray = Object.values(bubbleObjects);
    const intersects = raycaster.intersectObjects(bubbleArray);
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const bubbleName = clickedObject.name;
        
        console.log(`🎯 Bubble diklik: ${bubbleName}`);
        
        // Navigate berdasarkan nama bubble
        if (bubbleName.includes('About')) {
            navigateToPage('beranda');
        } else if (bubbleName.includes('Consult')) {
            const overlay = document.getElementById('overlay');
            const openFormBtn = document.getElementById('openForm');
            overlay?.classList.add('active');
            openFormBtn?.click();
        } else if (bubbleName.includes('Founder')) {
            navigateToPage('layanan');
        } else if (bubbleName.includes('Koleksi') || bubbleName.includes('Artikel')) {
            navigateToPage('artikel');
        } else if (bubbleName.includes('Game')) {
            navigateToPage('game');
        }
    }
});

// =========================================
// 5B. RESIZE
// =========================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========================================
// 5C. MOUSE MOVE (HOVER EFFECT)
// =========================================
window.addEventListener('mousemove', (event) => {
    if (event.target !== renderer.domElement) return;
    if (Object.keys(bubbleObjects).length === 0) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const bubbleArray = Object.values(bubbleObjects);
    const intersects = raycaster.intersectObjects(bubbleArray);
    
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
    }
});

// =========================================
// 6. ANIMATION LOOP (FPS MODE)
// =========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    if (playerCow) {
        // Target item interaction removed
        interactMsg.style.display = 'none';

        // --- MODIFIKASI GERAKAN SAPI ---
        // Tambahkan syarat "&& !isPopupOpen" supaya sapi diam pas baca
        if (!isPopupOpen) { 
            // --- A. MOVEMENT (SAMA SEPERTI GAME) ---
            let isMoving = false;
            const speed = keys.shift ? 0.15 : 0.08; 

            // Gerak Relatif terhadap Dunia
            // W = Maju (Ke arah Z negatif)
            if (keys.w) {
                playerCow.position.z -= speed;
                playerCow.rotation.y = Math.PI; // Hadap Depan (Z-)
                isMoving = true;
            }
            if (keys.s) {
                playerCow.position.z += speed;
                playerCow.rotation.y = 0; // Hadap Belakang (Z+)
                isMoving = true;
            }
            if (keys.a) {
                playerCow.position.x -= speed;
                playerCow.rotation.y = -Math.PI / 2; // Hadap Kiri
                isMoving = true;
            }
            if (keys.d) {
                playerCow.position.x += speed;
                playerCow.rotation.y = Math.PI / 2; // Hadap Kanan
                isMoving = true;
            }

            // Efek Membal (Head Bobbing)
            // Di FPS, ini penting biar kerasa lagi jalan
            let bobbing = 0;
            if (isMoving) {
                bobbing = Math.sin(time * 15) * 0.1; // Naik turun dikit
            }
            
            // Update Posisi Fisik Sapi (Biar bayangannya ikut gerak)
            playerCow.position.y = 1.5 + bobbing; // 1.5 tinggi dasar sapi
        }

        // --- B. KAMERA LOGIC (FIRST PERSON) ---
        // 1. Tempel Kamera di Posisi Kepala Sapi
        // Kita pakai posisi X dan Z sapi, tapi Y nya kita atur manual (eyeHeight)
        // Ditambah bobbing biar kameranya goyang dikit pas jalan
        
        camera.position.x = playerCow.position.x;
        camera.position.y = playerCow.position.y + 0.5; // Offset dikit dari pusat badan
        camera.position.z = playerCow.position.z;

        // 2. Kamera Menghadap Ke Mana?
        // Kita hitung titik di depan sapi berdasarkan rotasinya
        const angle = playerCow.rotation.y;
        
        // Rumus Trigonometri: Cari titik di depan sejauh 'lookAheadDist'
        const targetX = playerCow.position.x + Math.sin(angle) * lookAheadDist;
        const targetZ = playerCow.position.z + Math.cos(angle) * lookAheadDist;
        
        // Suruh kamera melihat titik imajiner di depan itu
        camera.lookAt(targetX, camera.position.y, targetZ);
    }

    // Animasi NPC
    scene.traverse((obj) => {
        if (obj.userData.isNPC) {
            const breath = 1 + Math.sin(time * 2) * 0.05;
            obj.scale.copy(obj.userData.baseScale).multiplyScalar(breath);
        }
    });

    renderer.render(scene, camera);
}

animate();