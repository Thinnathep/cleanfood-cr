// ═══════════════════════════════════════════════════════════
//  15. INIT & EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // 1. ช่องค้นหา (Desktop & Mobile)
    document.getElementById("search-desktop")?.addEventListener("input", e => handleSearch(e.target.value));
    document.getElementById("search-mobile")?.addEventListener("input", e => handleSearch(e.target.value));

    // 2. ปุ่ม Filter
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => filterMenu(btn.dataset.filter));
    });
    
    if (typeof gsap !== 'undefined' && typeof Flip !== 'undefined') {
        gsap.registerPlugin(Flip);
    }

    // 3. ฟอร์มข้อมูลการจัดส่ง
    ["cust-name", "cust-tel", "cust-zone", "cust-slot", "pdpa-consent"].forEach(id =>
        document.getElementById(id)?.addEventListener("change", checkFormValidity)
    );
    document.getElementById("cust-name")?.addEventListener("input", checkFormValidity);
    document.getElementById("cust-tel")?.addEventListener("input", checkFormValidity);
    document.getElementById("cust-zone")?.addEventListener("change", updateCartUI);

    // 4. Initial Load
    loadFromLocal();
    renderMenu();
    updateCartUI();

    // 5. โหลด Reviews จาก GAS (ไม่บล็อก UI)
    loadReviews();

    // 6. เริ่ม Promotion Carousel auto-slide
    startPromoCarousel();
});

// ═══════════════════════════════════════════════════════════
//  PROMOTION CAROUSEL
// ═══════════════════════════════════════════════════════════
let promoCurrent = 0;
const PROMO_TOTAL = 3;
let promoTimer = null;

function promoSlide(dir) {
    promoCurrent = (promoCurrent + dir + PROMO_TOTAL) % PROMO_TOTAL;
    updatePromoUI();
    clearInterval(promoTimer);
    promoTimer = setInterval(() => promoSlide(1), 5000);
}

function updatePromoUI() {
    const track = document.getElementById('promo-track');
    if (track) track.style.transform = `translateX(-${promoCurrent * 100}%)`;
    document.querySelectorAll('.promo-dot').forEach((dot, i) => {
        dot.style.background = i === promoCurrent ? '#10b981' : '#cbd5e1';
    });
}

function startPromoCarousel() {
    promoTimer = setInterval(() => promoSlide(1), 5000);

    // ── Touch / Mouse Drag Swipe ────────────────────────────
    const track = document.getElementById('promo-track');
    if (!track) return;

    let startX = 0;
    let isDragging = false;

    // Touch events (มือถือ)
    track.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        isDragging = true;
    }, { passive: true });

    track.addEventListener('touchend', e => {
        if (!isDragging) return;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) promoSlide(diff > 0 ? 1 : -1);
        isDragging = false;
    }, { passive: true });

    // Mouse events (desktop drag)
    track.addEventListener('mousedown', e => {
        startX = e.clientX;
        isDragging = true;
        track.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', e => {
        if (!isDragging) return;
        const diff = startX - e.clientX;
        if (Math.abs(diff) > 40) promoSlide(diff > 0 ? 1 : -1);
        isDragging = false;
        track.style.cursor = 'grab';
    });
    track.style.cursor = 'grab';
}

// ═══════════════════════════════════════════════════════════
//  ABOUT (วัตถุประสงค์ร้าน) MODAL
// ═══════════════════════════════════════════════════════════
function openAboutModal() {
    const modal   = document.getElementById('about-modal');
    const content = document.getElementById('about-content');
    if (!modal || !content) { console.warn('about-modal not found'); return; }
    modal.classList.remove('hidden');
    // reset ก่อนแล้ว animate
    content.style.transform = 'scale(0.95)';
    content.style.opacity   = '0';
    setTimeout(() => {
        content.style.transform = 'scale(1)';
        content.style.opacity   = '1';
    }, 20);
    document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
    const modal   = document.getElementById('about-modal');
    const content = document.getElementById('about-content');
    if (!modal || !content) return;
    content.style.transform = 'scale(0.95)';
    content.style.opacity   = '0';
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}
