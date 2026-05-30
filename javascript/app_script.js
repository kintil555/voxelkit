/*
 * app_script.js — replacement untuk public_script.js
 * Dimodifikasi untuk voxelkit: hapus touchstart preventDefault
 */

const currentURL = window.location.href;
const currentPagePath = window.location.pathname;
let hostPath = window.location.origin;
const parts = currentPagePath.split('/').filter(Boolean);
let rootPath = '/' + (parts.length > 0 ? parts[0] : '');
const slashCount = (currentPagePath.match(/\//g) || []).length;

window.logManager = {
    log: function (message, level = 'info') {}
};

// Responsive sidebar
document.addEventListener('DOMContentLoaded', function () {
    const mainScrollView = document.querySelector('.main_scroll_view.with_sidebar');
    if (mainScrollView) {
        window.addEventListener('resize', function () {
            mainScrollView.classList.add('animate');
        });
    }
});

// Klik header logo → scroll ke atas
document.addEventListener('DOMContentLoaded', function () {
    const logo = document.querySelector('.header_logo');
    if (logo) logo.addEventListener('click', scrollToTop);
});

let isNavigating = false;
function ifNavigating(way, url) {
    if (isNavigating) return;
    isNavigating = true;
    if (way === 'open') {
        setTimeout(function () {
            window.open(url);
            setTimeout(function () { isNavigating = false; }, 100);
        }, 100);
    } else {
        setTimeout(function () {
            window.location.href = url;
            setTimeout(function () { isNavigating = false; }, 100);
        }, 100);
    }
}

function openLink(url) { ifNavigating('open', url); }

function scrollToTop() {
    const sc = document.querySelector('.primary_scroll_container');
    if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' });
}
function toTop() {
    const sc = document.querySelector('.primary_scroll_container');
    if (sc) sc.scrollTo({ top: 0, behavior: 'instant' });
}

// Sound paths
const soundPaths = {
    click: rootPath + '/sounds/click.ogg',
    button: rootPath + '/sounds/button.ogg',
    pop: rootPath + '/sounds/pop.ogg',
    hide: rootPath + '/sounds/hide.ogg',
    open: rootPath + '/sounds/drawer_open.ogg',
    close: rootPath + '/sounds/drawer_close.ogg',
    toast: rootPath + '/sounds/toast.ogg'
};

function playSound(type) {
    try {
        const path = soundPaths[type];
        if (!path) return;
        new Audio(path).play().catch(()=>{});
    } catch(e) {}
}

function playSoundType(button) {
    if (!button) return;
    if (button.classList.contains('normal_btn') || button.classList.contains('red_btn')) {
        playSound('click');
    } else if (button.classList.contains('green_btn')) {
        playSound('button');
    }
}
