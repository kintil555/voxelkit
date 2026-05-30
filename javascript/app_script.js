/*
 * app_script.js — voxelkit / BE Skin 4D Maker
 * Load SETELAH public_script.js — semua var global sudah ada di sana
 */

// Responsive sidebar (tidak duplikat var apapun)
document.addEventListener('DOMContentLoaded', function () {
    const mainScrollView = document.querySelector('.main_scroll_view.with_sidebar');
    if (mainScrollView) {
        window.addEventListener('resize', function () {
            mainScrollView.classList.add('animate');
        });
    }
});
