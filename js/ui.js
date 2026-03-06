// ═══════════════════════════════════════════════════════════
//  1. CLOCK & SHOP STATUS UI
// ═══════════════════════════════════════════════════════════
function updateDateTime() {
    const now = new Date();
    const shopStatus = isShopOpen();
    const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    const el = document.getElementById("datetime-display");
    if (el) el.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleDateString("th-TH", opts)}`;
    const badge = document.getElementById("shop-status-badge");
    if (badge) {
        if (shopStatus) {
            badge.innerText = "● เปิดรับคำสั่งซื้อ";
            badge.className = "text-[9px] px-2 py-0.5 rounded-full font-bold leading-none bg-emerald-100 text-emerald-600 border border-emerald-200";
        } else {
            badge.innerText = "● ปิดรับคำสั่งซื้อ (เปิด 10:00)";
            badge.className = "text-[9px] px-2 py-0.5 rounded-full font-bold leading-none bg-rose-100 text-rose-600 border border-rose-200";
        }
    }
}
setInterval(updateDateTime, 60000);

function isShopOpen() {
    const hr = new Date().getHours();
    // return hr >= 10 && hr < 20; // ← [ใช้งานจริง] 10:00-20:00
    return hr >= 0 && hr < 24;    // ← [ทดสอบ] เปิด 24 ชม.
}

function updateShopStatusUI() {
    const openStatus = isShopOpen();
    const banner = document.getElementById("shop-close-banner");
    const checkoutBtn = document.getElementById("checkout-btn");
    if (!openStatus) {
        banner?.classList.remove("hidden");
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add("opacity-50", "cursor-not-allowed");
            checkoutBtn.innerHTML = `<i class="fa-solid fa-clock"></i> ร้านเปิดรับคำสั่งซื้อ 10:00 น.`;
        }
    } else {
        banner?.classList.add("hidden");
        if(typeof checkFormValidity === 'function') checkFormValidity();
    }
}
setInterval(updateShopStatusUI, 60000);

// ═══════════════════════════════════════════════════════════
//  12. HOLIDAY ALERTS
// ═══════════════════════════════════════════════════════════
function updateHolidayBanner() {
    const nextDelivery = getNextDeliveryDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isSkipped = nextDelivery.toDateString() !== tomorrow.toDateString();
    const banner = document.getElementById("delivery-date-banner");
    if (!banner) return;
    if (isSkipped) {
        banner.style.background = "linear-gradient(135deg, #fff7ed, #ffedd5)";
        banner.style.borderColor = "#fb923c";
        banner.style.color = "#9a3412";
        if (!banner.querySelector(".holiday-note")) {
            const note = document.createElement("div");
            note.className = "holiday-note";
            note.style.cssText = "font-size:10px; margin-top:4px; font-weight:700; opacity:0.8;";
            note.innerHTML = `<i class="fa-solid fa-circle-info"></i> เนื่องจากหยุดให้บริการ ขออภัยในความไม่สะดวกค่ะ`;
            banner.appendChild(note);
        }
    }
}

function updateHolidayAlerts() {
    const nextDelivery = getNextDeliveryDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isSkipped = nextDelivery.toDateString() !== tomorrow.toDateString();
    const annBar = document.getElementById("top-announcement");
    const annText = document.getElementById("announcement-text");
    if (isSkipped && annBar && annText) {
        annBar.style.backgroundColor = "#fff1f2";
        annBar.style.borderColor = "#fecdd3";
        annText.innerHTML = `
            <span class="flex items-center justify-center gap-2 text-rose-700">
                <i class="fa-solid fa-circle-exclamation animate-pulse"></i>
                <span>ขออภัย ทางร้านหยุดให้บริการชั่วคราว: คำสั่งซื้อจะเริ่มจัดส่งใน <b>${getDeliveryDateThai()}</b> ค่ะ</span>
            </span>`;
    }
}
window.addEventListener('DOMContentLoaded', updateHolidayAlerts);

// ═══════════════════════════════════════════════════════════
//  10. PDPA MODAL
// ═══════════════════════════════════════════════════════════
function openPDPAModal() {
    document.getElementById("pdpa-modal").classList.remove("hidden");
    setTimeout(() => {
        const c = document.getElementById("pdpa-content");
        c.classList.remove("scale-95", "opacity-0");
        c.classList.add("scale-100", "opacity-100");
    }, 10);
}
function closePDPAModal() {
    const c = document.getElementById("pdpa-content");
    c.classList.remove("scale-100", "opacity-100");
    c.classList.add("scale-95", "opacity-0");
    setTimeout(() => document.getElementById("pdpa-modal").classList.add("hidden"), 300);
}

// ═══════════════════════════════════════════════════════════
//  13. GRAB
// ═══════════════════════════════════════════════════════════
function openGrabSearch() {
    const searchTerm = encodeURIComponent("Clean Food Chiang Rai");
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = `grab://open?screenType=SEARCH&searchKeyword=${searchTerm}`;
    } else {
        SwalBase.fire({
            title: '📱 ใช้งานบนอุปกรณ์มือถือได้เลยค่ะ',
            html: `<div style="font-size:13px; line-height:1.8; text-align:center; color:#475569">
                    แอปพลิเคชัน Grab ใช้งานได้บน<b>อุปกรณ์มือถือ</b>เท่านั้นค่ะ<br>
                    กรุณาเปิดเว็บนี้บนอุปกรณ์มือถือ แล้วกดปุ่มอีกครั้ง<br><br>
                    <span style="font-size:11px; color:#94a3b8">หรือค้นหา "Clean Food Chiang Rai" ใน Grab บนอุปกรณ์มือถือได้เลยค่ะ</span>
                   </div>`,
            confirmButtonText: 'รับทราบ', icon: 'info',
        });
    }
}
const openGrab = openGrabSearch;
