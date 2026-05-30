/*
 * app_script.js — voxelkit / BE Skin 4D Maker
 * Minimal shim - semua definisi ada di public_script.js
 */

// Responsive sidebar
document.addEventListener('DOMContentLoaded', function () {
    const mainScrollView = document.querySelector('.main_scroll_view.with_sidebar');
    if (mainScrollView) {
        window.addEventListener('resize', function () {
            mainScrollView.classList.add('animate');
        });
    }
});
