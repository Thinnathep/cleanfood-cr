// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
    // PROMPTPAY: "0962386554",
    LINE_OA: "@282ovoyd",
    GAS_URL: "https://script.google.com/macros/s/AKfycbz0OmeBxY8Hzz4okOzOwDbssI3FNSEk7m9mb580hxdFN4xzUe8JkAQspY0i9Cse2UJ2/exec",
    CHIANG_RAI: [19.9071, 99.8310],
    //วันหยุดอัพเดทเอง
    HOLIDAYS: [
        // "2026-03-05", // 🚩 ใส่พรุ่งนี้ (5 มี.ค.) เข้าไปเพื่อทดสอบระบบ!
        // "2026-03-13", 
    ],
};

const STORAGE_KEY = "CF_CR_CART_DATA";
const EXPIRY_TIME = 12 * 60 * 60 * 1000; // 12 ชั่วโมง

// ─── MENU DATA ─────────────────────────────────────────────
const menuData = [
    {
        id: 101, category: "chicken", name: "อกไก่นุ่มสมุนไพร", price: 119, badge: "🔥 แนะนำ",
        image: "Img/DSC04962.JPG",
        desc: "อกไก่คัดพิเศษหมักสมุนไพรเชียงราย ย่างจนนุ่มหอม เสิร์ฟกับผักนึ่งหลากชนิดและข้าวไรซ์เบอร์รี่",
        kcal: 310, macros: { pro: 40, carb: 10, fat: 5 },
        ingredients: ["อกไก่", "ข้าวไรซ์เบอร์รี่", "บร็อคโคลี่", "หน่อไม้ฝรั่ง", "แครอท", "ฟักทอง", "พริกหยวก", "ไข่ต้ม"],
    },
    {
        id: 102, category: "chicken", name: "อกไก่หมักพริกไทยดำ", price: 139, badge: "✨ ขายดี",
        image: "Img/DSC04968.JPG",
        desc: "อกไก่ชิ้นโตหมักพริกไทยดำจนเข้าเนื้อ เสิร์ฟพร้อมผักสด ผักนึ่ง และไข่ต้ม",
        kcal: 330, macros: { pro: 40, carb: 12, fat: 6 },
        ingredients: ["อกไก่", "ข้าวไรซ์เบอร์รี่", "บร็อคโคลี่", "เห็ดเข็มทอง", "แครอท", "ฟักทอง", "ไข่ต้ม"],
    },
    // เพิ่มเมนูใหม่ได้ที่นี่ ↓
];

 // เพิ่มไอเทมเสริมใหม่ได้ที่นี่ ↓
const ADDONS = {
    protein: {
        label: "โปรตีนหลัก", type: "radio", required: true,
        options: [
            { id: "p_chicken", label: "อกไก่", price: 0, default: true },
            // { id: "p_dory", label: "ปลาดอลลี่", price: 15 },
        ],
    },
    carbs: {
        label: "คาร์โบไฮเดรต", type: "radio", required: true,
        options: [
            { id: "c_riceberry", label: "ข้าวไรซ์เบอร์รี่", price: 0, default: true },
            // { id: "c_brown", label: "ข้าวกล้องหอมมะลิ", price: 0 },
        ],
    },
    toppings: {
        label: "ท็อปปิ้งเสริม", type: "checkbox", required: false,
        options: [
            { id: "t_egg_boil", label: "ไข่ต้ม", price: 10 },
            { id: "t_avo", label: "อะโวคาโด ½ ลูก", price: 30 },
        ],
    }
};

// ─── STATE ─────────────────────────────────────────────────
let cart = [];
let currentModalItem = null;
let tempQty = 1;
let map, marker;
let checkoutLockedCart = [];
let checkoutTotal = 0;
let isCheckoutMode = false;

// ═══════════════════════════════════════════════════════════
//  SWAL THEME — ปรับ SweetAlert2 ให้เข้ากับ Clean Food
// ═══════════════════════════════════════════════════════════
const SwalBase = Swal.mixin({
    customClass: {
        popup: 'swal-cf-popup',
        confirmButton: 'swal-cf-confirm',
        cancelButton: 'swal-cf-cancel',
        title: 'swal-cf-title',
    },
    buttonsStyling: false,
    fontFamily: 'Prompt, sans-serif',
});

// ── Shorthand helpers ──────────────────────────────────────
const SwalSuccess = (title, text) => SwalBase.fire({
    icon: 'success', title, text,
    timer: 2000, showConfirmButton: false,
    timerProgressBar: true,
});
const SwalError = (title, text) => SwalBase.fire({
    icon: 'error', title, text, confirmButtonText: 'ตกลง',
});
const SwalWarning = (title, text) => SwalBase.fire({
    icon: 'warning', title, text, confirmButtonText: 'ตกลง',
});
const SwalToast = (title, icon = 'success') => Swal.mixin({
    toast: true, position: 'bottom', showConfirmButton: false,
    timer: 2800, timerProgressBar: true,
    customClass: { popup: 'swal-cf-toast' },
}).fire({ icon, title });

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function getDeliveryDateThai() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function isValidThaiPhone(tel) {
    return /^0[0-9]{8,9}$/.test(tel.replace(/[-\s]/g, ""));
}

function setFieldError(id, msg) {
    const el = document.getElementById(id);
    const err = document.getElementById(id + "-err");
    if (!el) return;
    if (msg) {
        el.classList.add("border-rose-400");
        el.classList.remove("border-slate-200");
        if (err) { err.innerText = msg; err.classList.remove("hidden"); }
    } else {
        el.classList.remove("border-rose-400");
        el.classList.add("border-slate-200");
        if (err) err.classList.add("hidden");
    }
}

function clearFieldErrors() {
    ["cust-name", "cust-tel", "cust-slot"].forEach(id => setFieldError(id, ""));
}

// ═══════════════════════════════════════════════════════════
//  1. CLOCK (อัปเกรดให้ดึงสถานะจาก isShopOpen() ที่เดียว)
// ═══════════════════════════════════════════════════════════
function updateDateTime() {
    const now = new Date(); 
    const shopStatus = isShopOpen(); // 🟢 ดึงสถานะจากศูนย์กลาง

    // 1. อัปเดตเวลา 
    const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    const el = document.getElementById("datetime-display");
    if (el) el.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleDateString("th-TH", opts)}`;

    // 2. อัปเดต Status Badge
    const badge = document.getElementById("shop-status-badge");
    if (badge) {
        if (shopStatus) {
            badge.innerText = "● OPEN (10:00 - 20:00)";
            badge.className = "text-[9px] px-2 py-0.5 rounded-full font-bold leading-none bg-emerald-100 text-emerald-600 border border-emerald-200";
        } else {
            badge.innerText = "● CLOSED (เปิด 10:00)";
            badge.className = "text-[9px] px-2 py-0.5 rounded-full font-bold leading-none bg-rose-100 text-rose-600 border border-rose-200";
        }
    }
}
setInterval(updateDateTime, 60000);
updateDateTime();

// ═══════════════════════════════════════════════════════════
//  2. RENDER MENU
// ═══════════════════════════════════════════════════════════
function getCategoryLabel(cat) {
    return { chicken: "🍗 อกไก่", fish: "🐟 ปลา", beef: "🥩 เนื้อ", salad: "🥗 สลัด" }[cat] || cat;
}

function renderMenu(data = menuData) {
    const grid = document.getElementById("menu-grid");
    const empty = document.getElementById("empty-state");
    if (!grid) return;
    grid.innerHTML = "";
    if (data.length === 0) { empty?.classList.remove("hidden"); return; }
    empty?.classList.add("hidden");
    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "menu-card menu-item flex flex-col";
        card.setAttribute("data-category", item.category);
        card.setAttribute("data-name", item.name.toLowerCase());
        card.style.cssText = "opacity:0; transform:translateY(30px)";
        card.innerHTML = `
            <div class="relative h-48 bg-slate-100 overflow-hidden">
                <div class="kcal-badge absolute top-3 left-3 text-white text-[10px] px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                    <i class="fa-solid fa-fire text-amber-400 text-[9px]"></i> ${item.kcal} kcal
                </div>
                ${item.badge ? `<div class="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">${item.badge}</div>` : ""}
                <img src="${item.image}" class="food-img w-full h-full object-cover" loading="lazy"
                    onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70'">
            </div>
            <div class="p-4 flex flex-col flex-grow">
                <div class="text-[10px] font-semibold text-emerald-600 mb-0.5 uppercase tracking-wide">${getCategoryLabel(item.category)}</div>
                <h3 class="text-base font-extrabold text-slate-800 leading-tight mb-1">${item.name}</h3>
                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 flex-grow">${item.desc}</p>
                <div class="flex items-center gap-2 mb-3">
                    <div class="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <i class="fa-solid fa-dumbbell text-[8px]"></i> P ${item.macros.pro}g
                    </div>
                    <div class="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <i class="fa-solid fa-wheat-awn text-[8px]"></i> C ${item.macros.carb}g
                    </div>
                    <div class="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        <i class="fa-solid fa-droplet text-[8px]"></i> F ${item.macros.fat}g
                    </div>
                </div>
                <div class="flex justify-between items-center border-t border-slate-50 pt-3">
                    <span class="text-xl font-extrabold text-emerald-600">฿${item.price}</span>
                    <button onclick="openModal(${item.id}); event.stopPropagation();"
                        class="flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-emerald-500 transition-colors">
                        <i class="fa-solid fa-plus text-[10px]"></i> เพิ่ม
                    </button>
                </div>
            </div>`;
        card.addEventListener("click", () => openModal(item.id));
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
    gsap.to(".menu-card", { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: "power2.out", delay: 0.05 });
}

function handleSearch(term) {
    const q = term.trim().toLowerCase();
    if (!q) { renderMenu(); return; }
    renderMenu(menuData.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.ingredients.some(ing => ing.toLowerCase().includes(q))
    ));
    resetFilterBtns();
}

document.getElementById("search-desktop")?.addEventListener("input", e => handleSearch(e.target.value));
document.getElementById("search-mobile")?.addEventListener("input", e => handleSearch(e.target.value));

function resetFilterBtns() {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === "all"));
}

// ═══════════════════════════════════════════════════════════
//  3. FILTER
// ═══════════════════════════════════════════════════════════
gsap.registerPlugin(Flip);
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const filter = e.currentTarget.getAttribute("data-filter");
        document.getElementById("search-desktop").value = "";
        if (document.getElementById("search-mobile")) document.getElementById("search-mobile").value = "";
        renderMenu(filter === "all" ? menuData : menuData.filter(i => i.category === filter));
    });
});

// ═══════════════════════════════════════════════════════════
//  4. MAP
// ═══════════════════════════════════════════════════════════
function initMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 300); return; }
    map = L.map("map").setView(CONFIG.CHIANG_RAI, 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
    const icon = L.divIcon({
        html: `<div style="background:#16a34a;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32],
    });
    marker = L.marker(CONFIG.CHIANG_RAI, { draggable: true, icon }).addTo(map);
    const updateCoords = () => {
        const pos = marker.getLatLng();
        const lat = pos.lat.toFixed(6), lng = pos.lng.toFixed(6);
        document.getElementById("cust-address").value = `https://www.google.com/maps?q=${lat},${lng}`;
        document.getElementById("cust-lat").value = lat;
        document.getElementById("cust-lng").value = lng;
        const gpsCoordsEl = document.getElementById("gps-coords-text");
        const gpsDv = document.getElementById("gps-display");
        if (gpsCoordsEl) gpsCoordsEl.innerText = `${lat}, ${lng}`;
        gpsDv?.classList.remove("hidden");
        checkFormValidity();
    };
    marker.on("dragend", updateCoords);
    map.on("click", e => { marker.setLatLng(e.latlng); updateCoords(); });
    updateCoords();
}

// ═══════════════════════════════════════════════════════════
//  5. ITEM MODAL
// ═══════════════════════════════════════════════════════════
function openModal(id) {
    currentModalItem = menuData.find(i => i.id === id);
    if (!currentModalItem) return;
    tempQty = 1;
    document.getElementById("modal-qty").innerText = 1;
    document.getElementById("modal-img").src = currentModalItem.image;
    document.getElementById("modal-badge").innerText = currentModalItem.badge || "Clean Food";
    document.getElementById("modal-category-label").innerText = getCategoryLabel(currentModalItem.category);
    document.getElementById("modal-title").innerText = currentModalItem.name;
    document.getElementById("modal-price").innerText = `฿${currentModalItem.price}`;
    document.getElementById("modal-desc").innerText = currentModalItem.desc;
    document.getElementById("modal-kcal-val").innerText = currentModalItem.kcal;
    document.getElementById("nutrition-box").style.display = "block";
    document.getElementById("modal-pro").innerText = `${currentModalItem.macros.pro}g`;
    document.getElementById("modal-carb").innerText = `${currentModalItem.macros.carb}g`;
    document.getElementById("modal-fat").innerText = `${currentModalItem.macros.fat}g`;
    document.getElementById("ingredients-title").innerHTML = `<i class="fa-solid fa-basket-wheat text-emerald-500 mr-1"></i> ส่วนประกอบหลัก`;
    document.getElementById("modal-ingredients").innerHTML = currentModalItem.ingredients.map(ing => `<span class="ing-tag">${ing}</span>`).join("");
    gsap.set(".progress-bar-fill", { width: 0 });
    document.getElementById("modal-container").classList.remove("hidden");
    gsap.to("#modal-backdrop", { opacity: 1, duration: 0.25 });
    gsap.to("#modal-content", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.2)" });
    document.body.style.overflow = "hidden";
    setTimeout(() => {
        document.getElementById("bar-pro").style.width = `${Math.min((currentModalItem.macros.pro / 60) * 100, 100)}%`;
        document.getElementById("bar-carb").style.width = `${Math.min((currentModalItem.macros.carb / 60) * 100, 100)}%`;
        document.getElementById("bar-fat").style.width = `${Math.min((currentModalItem.macros.fat / 30) * 100, 100)}%`;
    }, 250);
}

// 🟢 โค้ดใหม่ที่ปลดล็อกหน้าจอแล้ว!
function closeModal() {
    gsap.to("#modal-content", { opacity: 0, scale: 0.95, duration: 0.2, ease: "power2.in" });
    gsap.to("#modal-backdrop", {
        opacity: 0, duration: 0.2, onComplete: () => {
            document.getElementById("modal-container").classList.add("hidden");
            // 🔓 คลายล็อกหน้าจอให้กลับมาเลื่อนได้ปกติ
            document.body.style.overflow = ""; 
        }
    });
}

function openSubscriptionModal() {
    currentModalItem = {
        id: "SUB_WEEKLY", name: "แพ็กเกจผูกปิ่นโต", price: 1290,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        desc: "อาหารคลีนสดใหม่ทุกสัปดาห์ จัดส่ง 2 รอบ (จ./พ.) รอบเช้า 09:00–11:00 น. ประหยัดกว่า 15%",
    };
    tempQty = 1;
    document.getElementById("modal-qty").innerText = 1;
    document.getElementById("modal-img").src = currentModalItem.image;
    document.getElementById("modal-badge").innerText = "🔥 Hot Deal";
    document.getElementById("modal-category-label").innerText = "📦 สมาชิกรายสัปดาห์";
    document.getElementById("modal-title").innerText = currentModalItem.name;
    document.getElementById("modal-price").innerText = `฿${currentModalItem.price}`;
    document.getElementById("modal-desc").innerText = currentModalItem.desc;
    document.getElementById("modal-kcal-val").innerText = "—";
    document.getElementById("nutrition-box").style.display = "none";
    document.getElementById("ingredients-title").innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500 mr-1"></i> สิ่งที่ได้รับ`;
    document.getElementById("modal-ingredients").innerHTML = `
        <ul class="text-xs text-slate-600 space-y-2 w-full">
            <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> อาหารคลีน 2 มื้อ × 2 รอบ/สัปดาห์</li>
            <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> ส่งในเขตเมืองเชียงราย</li>
            <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> ประหยัดกว่าสั่งปกติ ~15%</li>
            <li class="flex items-center gap-2"><span class="text-amber-500">⚠</span> สั่งวันนี้ เริ่มส่ง "วันถัดไป"</li>
        </ul>`;
    document.getElementById("modal-container").classList.remove("hidden");
    gsap.to("#modal-backdrop", { opacity: 1, duration: 0.25 });
    gsap.to("#modal-content", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.2)" });
    document.body.style.overflow = "hidden";
}

// ═══════════════════════════════════════════════════════════
//  6. CART
// ═══════════════════════════════════════════════════════════
function updateQty(change) {
    tempQty = Math.max(1, Math.min(tempQty + change, 10));
    document.getElementById("modal-qty").innerText = tempQty;
    document.getElementById("modal-price").innerText = `฿${currentModalItem.price * tempQty}`;
}

function confirmAddToCart() {

    pushToCart({ ...currentModalItem, qty: tempQty });
    closeModal();
}

function pushToCart(newItem) {

    if (isCheckoutMode) {
        SwalWarning("กำลังอยู่ในขั้นตอนชำระเงิน", "กรุณากดย้อนกลับก่อนแก้ไขรายการ");
        return;
    }

    const existing = cart.find(i => i.id === newItem.id);
    if (existing) existing.qty += newItem.qty;
    else cart.push({ ...newItem });
    updateCartUI();
    SwalToast(`เพิ่ม "${newItem.name}" ลงตะกร้าแล้ว ✓`, 'success');
}

function editCartQty(index, change) {
    if (isCheckoutMode) {
        SwalWarning("กำลังอยู่ในขั้นตอนชำระเงิน", "กรุณากดย้อนกลับก่อนแก้ไขรายการ");
        return;
    }

    const newQty = cart[index].qty + change;
    
    // 💡 ถ้าลูกค้ากดลดจำนวนจนเหลือ 0 (หรือน้อยกว่า) ให้โยนไปเรียกฟังก์ชันยืนยันการลบแทน
    if (newQty <= 0) {
        removeCartItem(index); 
    } else {
        cart[index].qty = newQty;
        updateCartUI();
    }
}

function removeCartItem(index) {
    if (isCheckoutMode) {
        SwalWarning("กำลังอยู่ในขั้นตอนชำระเงิน", "กรุณากดย้อนกลับก่อนแก้ไขรายการ");
        return;
    }

    const itemName = cart[index].name;

    // 🔴 เรียก SweetAlert ขึ้นมาถามเพื่อความชัวร์
    SwalBase.fire({
        title: '🗑️ ยืนยันการลบ?',
        html: `ต้องการลบ <b>"${itemName}"</b><br>ออกจากตะกร้าใช่ไหมคะ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#cbd5e1',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            cart.splice(index, 1);
            updateCartUI();
            SwalToast(`ลบ "${itemName}" ออกแล้ว`, 'info');
        }
    });
}

function updateCartUI() {
    const cartItemsEl = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total-price");
    const checkoutBtn = document.getElementById("checkout-btn");
    const badge = document.getElementById("cart-count");
    const formEl = document.getElementById("checkout-form-container");
    const summaryEl = document.getElementById("cart-items-summary");
    const countLabel = document.getElementById("cart-item-count-label");

    cartItemsEl.innerHTML = "";
    let total = 0, totalQty = 0;

    // 🛵 ดึงค่าธรรมเนียมจากโซนที่เลือก
    const zoneEl = document.getElementById("cust-zone");
    const deliveryFee = cart.length > 0 ? parseInt(zoneEl?.value || 5) : 0;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = `
            <div class="text-center text-slate-400 py-16 flex flex-col items-center gap-3">
                <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <i class="fa-solid fa-basket-shopping text-2xl opacity-40"></i>
                </div>
                <p class="font-semibold text-sm">ตะกร้าว่างเปล่า</p>
                <p class="text-xs">เลือกเมนูสุขภาพที่ชอบได้เลยนะ 😊</p>
            </div>`;
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add("opacity-40", "cursor-not-allowed");
        formEl.classList.add("hidden");
        document.getElementById("qr-container").classList.add("hidden");
        document.getElementById("qr-container").style.display = "none";
        checkoutBtn.classList.remove("hidden");
        if (summaryEl) summaryEl.innerText = "";
        if (countLabel) countLabel.innerText = "รายการสินค้า";
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove("opacity-40", "cursor-not-allowed");
        formEl.classList.remove("hidden");

        cartItemsEl.innerHTML = `
            <div id="delivery-date-banner">
                <i class="fa-solid fa-calendar-check"></i>
                <span>จัดส่งวันพรุ่งนี้: <strong>${getDeliveryDateThai()}</strong></span>
            </div>
            <div class="bg-amber-50 border border-amber-100 text-amber-800 text-[11px] px-3 py-2 rounded-xl font-medium flex items-start gap-2">
                <i class="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 shrink-0"></i>
                <span>หิวด่วน? สั่งผ่าน <a href="https://grab.com" target="_blank" class="underline font-bold text-emerald-600">Grab</a> ได้ทันที (10:00–19:00 น.)</span>
            </div>`;

        cart.forEach((item, index) => {
            const currentPrice = item.priceWithAddon || item.price;
            
            total += currentPrice * item.qty;
            totalQty += item.qty;

            let addonHtml = "";
            if (item.addonText) {
                addonHtml += `<div class="text-[10px] text-emerald-600 mt-1 font-medium leading-tight">
                                <i class="fa-solid fa-wrench mr-1"></i>${item.addonText}
                              </div>`;
            }
            if (item.allergyText) {
                addonHtml += `<div class="text-[10px] text-rose-500 mt-0.5 font-bold leading-tight">
                                <i class="fa-solid fa-triangle-exclamation mr-1"></i>แพ้: ${item.allergyText}
                              </div>`;
            }
            if (item.itemNote) {
                addonHtml += `<div class="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                <i class="fa-solid fa-note-sticky mr-1"></i>${item.itemNote}
                              </div>`;
            }

            cartItemsEl.innerHTML += `
                <div class="cart-item-row flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <img src="${item.image}" class="w-14 h-14 rounded-xl object-cover shrink-0"
                        onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=60'">
                    
                    <div class="flex-grow min-w-0">
                        <h4 class="font-extrabold text-slate-800 text-sm leading-tight truncate">${item.name}</h4>
                        
                        ${addonHtml}

                        <div class="text-emerald-600 font-bold text-sm mt-1">฿${(currentPrice * item.qty).toLocaleString()}</div>
                        <div class="text-[10px] text-slate-400">฿${currentPrice} × ${item.qty}</div>
                    </div>

                    <div class="flex items-center bg-slate-50 rounded-xl border border-slate-100 px-1">
                        <button onclick="editCartQty(${index},-1)" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors">
                            <i class="fa-solid fa-minus text-[9px]"></i>
                        </button>
                        <span class="w-6 text-center font-extrabold text-slate-700 text-xs">${item.qty}</span>
                        <button onclick="editCartQty(${index},1)" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition-colors">
                            <i class="fa-solid fa-plus text-[9px]"></i>
                        </button>
                    </div>
                    <button onclick="removeCartItem(${index})" class="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shrink-0">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>`;
        });

        cartItemsEl.innerHTML += `
            <div class="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs mt-2">
                <span class="font-bold text-slate-600">
                    <i class="fa-solid fa-truck-fast text-emerald-500 mr-2"></i> 
                    ค่าจัดส่ง (${deliveryFee === 5 ? 'ในเมือง' : 'นอกเมือง'})
                </span>
                <span class="font-extrabold text-emerald-700 text-sm">฿${deliveryFee}</span>
            </div>`;

        if (summaryEl) summaryEl.innerText = `${totalQty} รายการ (ไม่รวมค่าส่ง)`;
        if (countLabel) countLabel.innerText = `${totalQty} รายการในตะกร้า`;
    }

    const grandTotal = total + deliveryFee;
    totalEl.innerText = `฿${grandTotal.toLocaleString()}`;
    badge.innerText = totalQty;
    checkFormValidity();
    saveToLocal(); 
}

function checkFormValidity() {
    const shopStatus = isShopOpen();

    const name = document.getElementById("cust-name")?.value.trim() || "";
    const tel = document.getElementById("cust-tel")?.value.trim() || "";
    const address = document.getElementById("cust-address")?.value.trim() || "";
    const slot = document.getElementById("cust-slot")?.value || "";
    const pdpa = document.getElementById("pdpa-consent")?.checked;
    const btn = document.getElementById("checkout-btn");

    if (!btn) return;

    const telOk = isValidThaiPhone(tel);
    const formFilled = cart.length > 0 && name && telOk && address && slot && pdpa;
    const canCheckout = formFilled && shopStatus;

    btn.disabled = !canCheckout;
    btn.classList.toggle("opacity-40", !canCheckout);
    btn.classList.toggle("cursor-not-allowed", !canCheckout);

    if (!shopStatus) {
        btn.innerHTML = `<i class="fa-solid fa-moon"></i> ร้านปิดแล้ว (เปิด 10:00 - 20:00 น.)`;
    } else {
        btn.innerHTML = canCheckout
            ? `<i class="fa-solid fa-qrcode"></i> สร้าง QR ชำระเงิน`
            : `<i class="fa-solid fa-qrcode"></i> กรอกข้อมูลให้ครบ แล้วสร้าง QR`;
    }

    if (tel && !telOk) setFieldError("cust-tel", "กรุณากรอกเบอร์โทรให้ถูกต้อง (10 หลัก)");
    else setFieldError("cust-tel", "");
}

["cust-name", "cust-tel", "cust-slot", "pdpa-consent"].forEach(id =>
    document.getElementById(id)?.addEventListener("change", checkFormValidity)
);
document.getElementById("cust-name")?.addEventListener("input", checkFormValidity);
document.getElementById("cust-tel")?.addEventListener("input", checkFormValidity);

// ─── TOGGLE CART ──────────────────────────────────────────
function toggleCart() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer.classList.contains("open")) {
        drawer.classList.remove("open");
        gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => overlay.classList.add("hidden") });
        document.body.style.overflow = "";
    } else {
        overlay.classList.remove("hidden");
        gsap.to(overlay, { opacity: 1, duration: 0.3 });
        drawer.classList.add("open");
        document.body.style.overflow = "hidden";
        setTimeout(initMap, 450);
    }
}

// ─── ย้อนกลับจากหน้า QR ──────────────────────────────────
function backToCart() {
    const backBtn = document.getElementById("back-to-cart-btn");
    if (backBtn) backBtn.style.display = "none";
    isCheckoutMode = false;
    checkoutLockedCart = [];
    checkoutTotal = 0;
    document.getElementById("qr-container").classList.add("hidden");
    document.getElementById("qr-container").style.display = "none";
    document.getElementById("checkout-btn").classList.remove("hidden");
    document.getElementById("cart-items").style.display = "";
    document.getElementById("checkout-form-container").style.display = "";
    document.getElementById("back-to-cart-btn").classList.add("hidden");
}


// ═══════════════════════════════════════════════════════════
//  7. GENERATE QR
// ═══════════════════════════════════════════════════════════
function generateQR() {
    const name = document.getElementById("cust-name").value.trim();
    const tel = document.getElementById("cust-tel").value.trim();
    const address = document.getElementById("cust-address").value.trim();
    const slot = document.getElementById("cust-slot").value;
    const pdpa = document.getElementById("pdpa-consent").checked;
    
    clearFieldErrors();
    let hasError = false;

    if (!name) { setFieldError("cust-name", "กรุณากรอกชื่อ-นามสกุล"); hasError = true; }
    if (!isValidThaiPhone(tel)) { setFieldError("cust-tel", "กรุณากรอกเบอร์โทรให้ถูกต้อง (10 หลัก)"); hasError = true; }
    if (!slot) { setFieldError("cust-slot", "กรุณาเลือกรอบจัดส่ง"); hasError = true; }
    if (!address) { SwalWarning("ยังไม่ได้ปักหมุด", "กรุณาปักหมุดแผนที่ก่อน"); hasError = true; }
    if (!pdpa) { SwalWarning("ยังไม่ได้ยอมรับ PDPA", "กรุณายอมรับนโยบายก่อน"); hasError = true; }

    if (hasError) return;

    const zoneEl = document.getElementById("cust-zone");
    const deliveryFee = cart.length > 0 ? parseInt(zoneEl?.value || 5) : 0;

    let tempCart = JSON.parse(JSON.stringify(cart));
    const itemsTotal = tempCart.reduce((s, i) => {
        const p = i.priceWithAddon || i.price;
        return s + (p * i.qty);
    }, 0);
    const tempTotal = itemsTotal + deliveryFee;

    const orderSummary = tempCart.map(i => {
        const p = i.priceWithAddon || i.price;
        let line = `• <b class="text-slate-800">${i.name}</b> ×${i.qty} = ฿${(p * i.qty).toLocaleString()}`;
        if (i.addonText) line += `<br><span class="text-[10px] text-emerald-600 ml-3">↳ 🔧 ${i.addonText}</span>`;
        if (i.allergyText) line += `<br><span class="text-[10px] text-rose-500 ml-3 font-bold">↳ 🚨 แพ้: ${i.allergyText}</span>`;
        if (i.itemNote) line += `<br><span class="text-[10px] text-slate-400 ml-3">↳ 📝 ${i.itemNote}</span>`;
        return line;
    }).join("<br><div class='my-1 border-b border-dashed border-slate-200'></div>");

    SwalBase.fire({
        title: '📋 ตรวจสอบออเดอร์',
        html: `
            <div style="text-align:left; font-size:13px; line-height:1.6">
                <div style="background:#f0fdf4; border-radius:12px; padding:12px 14px; margin-bottom:12px; border:1px solid #86efac;">
                    <b>👤 ${name}</b>  |  📱 ${tel}<br>
                    🕐 รอบส่ง: <b>${slot}</b><br>
                    📅 จัดส่ง: <b>${getDeliveryDateThai()}</b>
                </div>
                <div style="background:#f8fafc; border-radius:10px; padding:10px; margin-bottom:10px; border:1px solid #e2e8f0; max-height:150px; overflow-y:auto;">
                    ${orderSummary}
                </div>
                <div style="background:#fef9c3; border-radius:10px; padding:10px 12px; font-size:12px; border:1px solid #fde047;">
                    ⚠️ กรุณาตรวจสอบท็อปปิ้งและหมายเหตุให้ถูกต้อง
                </div>
            </div>
            <div style="margin-top:14px; background:#ecfdf5; border-radius:12px; padding:10px; font-size:18px; font-weight:800; color:#15803d; border:2px solid #86efac;">
                <div style="font-size:11px; color:#475569; margin-bottom:4px; font-weight:normal;">
                    ค่าอาหาร ฿${itemsTotal.toLocaleString()} + ค่าส่ง ฿${deliveryFee}
                </div>
                💰 ยอดชำระ: ฿${tempTotal.toLocaleString()}
            </div>`,
        confirmButtonText: 'ถูกต้องและไปชำระเงิน',
        cancelButtonText: 'แก้ไขออเดอร์',
        showCancelButton: true,
        reverseButtons: true,
    }).then(result => {
        if (!result.isConfirmed) return;

        checkoutLockedCart = tempCart;
        checkoutTotal = tempTotal;
        isCheckoutMode = true;

        const amountEl = document.getElementById("qr-total-amount");
        if (amountEl) amountEl.innerText = checkoutTotal.toLocaleString();
        document.getElementById("qr-container").classList.remove("hidden");
        document.getElementById("qr-container").style.display = "flex";
        document.getElementById("checkout-btn").classList.add("hidden");
        document.getElementById("cart-items").style.display = "none";
        document.getElementById("checkout-form-container").style.display = "none";
        
        const backBtn = document.getElementById("back-to-cart-btn");
        if (backBtn) { backBtn.style.display = "flex"; backBtn.classList.remove("hidden"); }
    });
}

// ═══════════════════════════════════════════════════════════
//  8. SEND ORDER → GAS → LINE
//  ✅ แก้ไขระบบเปิด LINE ให้ถูกต้อง + รองรับกรณียังไม่เป็นเพื่อน
// ═══════════════════════════════════════════════════════════
async function sendOrderToLINE() {
    const name = document.getElementById("cust-name").value.trim();
    const tel = document.getElementById("cust-tel").value.trim();
    const gpsLink = document.getElementById("cust-address").value.trim();
    const lat = document.getElementById("cust-lat").value;
    const lng = document.getElementById("cust-lng").value;
    const landmark = document.getElementById("cust-landmark").value.trim();
    const slot = document.getElementById("cust-slot").value;
    const note = document.getElementById("cust-note")?.value.trim() || "";
    
    const zoneEl = document.getElementById("cust-zone");
    const deliveryFee = checkoutLockedCart.length > 0 ? parseInt(zoneEl?.value || 5) : 0;
    
    const total = checkoutTotal;
    const cartForSend = checkoutLockedCart;
    
    if (cartForSend.length === 0) {
        SwalError("เกิดข้อผิดพลาด", "ไม่พบรายการสินค้าในตะกร้า");
        return;
    }

    // 1. สร้างรายการสำหรับส่งเข้าแชท LINE
    const orderItems = cartForSend.map(i => {
        const p = i.priceWithAddon || i.price;
        let str = `- ${i.name} ×${i.qty} = ฿${(p * i.qty).toLocaleString()}`;
        if (i.addonText) str += `\n    🔧 ${i.addonText}`;
        if (i.allergyText) str += `\n    🚨 แพ้: ${i.allergyText}`;
        if (i.itemNote) str += `\n    📝 หมายเหตุ: ${i.itemNote}`;
        return str;
    }).join("\n");

    // 2. สร้างรายการแบบสั้นสำหรับ Google Sheet
    const itemNamesForSheet = cartForSend.map(i => {
        let str = `${i.name} ×${i.qty}`;
        if (i.addonText) str += ` [${i.addonText}]`;
        if (i.allergyText) str += ` (แพ้:${i.allergyText})`;
        return str;
    }).join(", ");
    
    const deliveryDateThai = getDeliveryDateThai();
    const targetObj = getNextDeliveryDate();
    const dd = String(targetObj.getDate()).padStart(2, '0');
    const mm = String(targetObj.getMonth() + 1).padStart(2, '0');
    const yyyy = targetObj.getFullYear();
    const systemDeliveryDate = `${dd}/${mm}/${yyyy}`; 

    // 3. ยืนยันการชำระเงิน
    const confirmResult = await SwalBase.fire({
        title: '💳 ยืนยันการชำระเงิน',
        html: `
            <div style="font-size:13px; line-height:2; text-align:left">
                <div style="background:#fef9c3; border:1px solid #fde047; border-radius:12px; padding:12px 14px; margin-bottom:12px;">
                    <b style="font-size:14px;">🎯 ขั้นตอนการยืนยันชำระเงิน</b><br>
                    ✔️ ชำระเงินผ่าน QR Code สำเร็จ<br>
                    💾 บันทึกหลักฐานการโอน (สลิป) เรียบร้อย<br>
                    📲 ระบบจะนำท่านเข้าสู่แชทร้านโดยอัตโนมัติ<br>
                        เพื่อจัดส่งอาหารในรอบวันถัดไปครับ
                </div>
            </div>
            <div style="margin-top:12px; background:#ecfdf5; border-radius:12px; padding:10px; font-weight:800; color:#15803d; font-size:16px; border:2px solid #86efac;">
                💰 ยอดที่โอน: ฿${total.toLocaleString()}
            </div>`,
        confirmButtonText: 'โอนแล้ว ส่งสลิปที่ LINE',
        cancelButtonText: 'ยังไม่ได้โอน',
        showCancelButton: true,
        reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    const btn = document.getElementById("submit-order-btn");
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> กำลังบันทึกออเดอร์...`;
    btn.disabled = true;

    // 4. เตรียมข้อมูลส่งเข้า GAS
    const payload = {
        customerName: name,
        phone: "'" + tel,
        address: landmark ? `${landmark} | พิกัด: ${gpsLink}` : gpsLink,
        latitude: lat,
        longitude: lng,
        deliverySlot: slot,
        deliveryDate: systemDeliveryDate, 
        orderDetails: itemNamesForSheet,
        totalAmount: total,
        note: note,
        source: "web",
    };

    try {
        await fetch(CONFIG.GAS_URL, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        // 5. สร้างข้อความสำหรับส่งเข้าแชท LINE
        const lineMsg = [
            `🛒 ออเดอร์ใหม่ — Clean Food CR`,
            `──────────────────────`,
            `👤 ${name}`,
            `📱 ${tel}`,
            `🕐 รอบส่ง: ${slot}`,
            `📅 วันที่ส่ง: ${deliveryDateThai}`, 
            `📍 ${gpsLink}`,
            landmark ? `🏠 จุดสังเกต: ${landmark}` : "",
            `──────────────────────`,
            `รายการอาหาร:`, 
            orderItems,
            `──────────────────────`,
            `🛵 ค่าจัดส่ง: ฿${deliveryFee}`,
            `💰 ยอดรวมทั้งสิ้น: ฿${total.toLocaleString()}`,
            note ? `📝 หมายเหตุร้าน: ${note}` : "",
            `──────────────────────`,
            `📎 รบกวนแนบสลิปโอนเงินด้วยนะคะ`
        ].filter(Boolean).join("\n");

        const encodedMsg = encodeURIComponent(lineMsg);
        const lineOA = "282ovoyd"; // ไม่ใส่ @ ใน URL

        // ✅ Deep link ที่ถูกต้องสำหรับเปิดแอป LINE ตรงหน้าโปรไฟล์ร้าน
        const lineAppUrl = `line://ti/p/@${lineOA}`;
        // ✅ Web fallback กรณีไม่มีแอป LINE (เปิดหน้าโปรไฟล์บนเว็บ)
        const lineWebUrl = `https://line.me/R/ti/p/@${lineOA}`;

        // 6. แจ้งให้ลูกค้าเพิ่มเพื่อนก่อน (สำคัญมาก! ถ้ายังไม่เป็นเพื่อน LINE จะไม่รับข้อความ)
        const addFriendResult = await SwalBase.fire({
            title: '📲 เพิ่มเพื่อน LINE ร้านก่อนนะคะ',
            html: `
                <div style="font-size:13px; line-height:1.8; text-align:left">
                    <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:12px; padding:12px 14px; margin-bottom:12px;">
                        <b style="color:#15803d;">⚠️ สำคัญ!</b><br>
                        ถ้ายังไม่ได้เป็นเพื่อนกับร้าน<br>
                        LINE จะ<b>ไม่ส่งข้อความออเดอร์</b>ให้อัตโนมัติ<br><br>
                        กรุณาเพิ่มเพื่อนก่อน แล้วกลับมากด<br>
                        <b>"เพิ่มเพื่อนแล้ว → ส่งออเดอร์"</b> ค่ะ
                    </div>
                    <div style="background:#fafafa; border-radius:10px; padding:10px; font-size:12px; color:#64748b; border:1px solid #e2e8f0; text-align:center;">
                        🪪 LINE OA: <b>@${lineOA}</b>
                    </div>
                </div>`,
            confirmButtonText: '✅ เพิ่มเพื่อนแล้ว → ส่งออเดอร์',
            cancelButtonText: '➕ เปิด LINE เพิ่มเพื่อนก่อน',
            showCancelButton: true,
            reverseButtons: false,
            allowOutsideClick: false,
        });

        if (!addFriendResult.isConfirmed) {
            // 🔴 กดปุ่ม "เปิด LINE เพิ่มเพื่อนก่อน"
            // → เปิดแอป LINE ตรงหน้าโปรไฟล์ร้าน (กด Add Friend ได้เลย)
            // → ลูกค้ากลับมาเว็บแล้วกด "เพิ่มเพื่อนแล้ว" เพื่อส่งออเดอร์
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            window.location.href = lineAppUrl;
            setTimeout(() => {
                if (document.hasFocus()) {
                    window.open(lineWebUrl, '_blank');
                }
            }, 1500);
            return;
        }

        // 7. ลูกค้ายืนยันว่าเพิ่มเพื่อนแล้ว → แสดง success แล้วเปิด LINE พร้อมข้อความออเดอร์
        await SwalBase.fire({
            icon: 'success',
            title: 'บันทึกออเดอร์แล้ว!',
            html: `<div style="font-size:13px; color:#475569">ระบบกำลังพาไปที่ LINE ร้าน<br>เพื่อส่งสลิปยืนยันการโอนค่ะ 📲</div>`,
            timer: 2000, showConfirmButton: false, timerProgressBar: true,
        });

        // 🧹 เคลียร์ทุกอย่างให้สะอาด
        cart = []; 
        checkoutLockedCart = [];
        checkoutTotal = 0;
        clearLocal();
        isCheckoutMode = false;
        updateCartUI();

        // ✅ เปิดแอป LINE ตรงห้องแชทร้านพร้อมข้อความออเดอร์
        // line://ti/p/@OA_ID  → เปิดแอปตรงหน้าแชทได้เลย (ต้องเป็นเพื่อนแล้ว)
        window.location.href = `line://ti/p/@${lineOA}`;
        setTimeout(() => {
            if (document.hasFocus()) {
                // Fallback: เปิดเว็บ LINE พร้อมข้อความ (กรณีไม่มีแอปหรือเปิดไม่ขึ้น)
                window.open(`https://line.me/R/oaMessage/@${lineOA}/?text=${encodedMsg}`, '_blank');
            }
        }, 1500);

    } catch (err) {
        console.error(err);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        SwalError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกออเดอร์ได้ กรุณาลองใหม่อีกครั้งนะคะ");
    }
}

// ═══════════════════════════════════════════════════════════
//  9. ORDER TRACKER
// ═══════════════════════════════════════════════════════════
function openOrderTracker() {
    document.getElementById("tracker-modal").classList.remove("hidden");
    setTimeout(() => {
        const c = document.getElementById("tracker-content");
        c.style.transform = "translateY(0)";
        c.style.opacity = "1";
    }, 10);
}
function closeOrderTracker() {
    const c = document.getElementById("tracker-content");
    c.style.transform = "translateY(16px)";
    c.style.opacity = "0";
    setTimeout(() => document.getElementById("tracker-modal").classList.add("hidden"), 300);
}
async function checkOrderStatus() {
    const query = document.getElementById("tracker-input").value.trim();
    const resultEl = document.getElementById("tracker-result");
    const cardEl = document.getElementById("tracker-order-card");
    if (!query) { SwalWarning("ยังไม่ได้กรอก", "กรุณากรอกรหัสออเดอร์หรือเบอร์โทรก่อนนะคะ"); return; }
    resultEl.innerHTML = `<div class="flex items-center justify-center gap-2 text-slate-400 py-4"><i class="fa-solid fa-spinner fa-spin"></i> กำลังค้นหา...</div>`;
    resultEl.classList.remove("hidden");
    cardEl.classList.add("hidden");
    try {
        const res = await fetch(`${CONFIG.GAS_URL}?action=search&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.status === "found" && data.order) {
            const o = data.order;
            document.getElementById("tr-orderid").innerText = o.orderId || "—";
            document.getElementById("tr-name").innerText = o.customerName || "—";
            document.getElementById("tr-slot").innerText = `${o.deliverySlot} | ${o.deliveryDate || ""}`;
            document.getElementById("tr-total").innerText = `฿${Number(o.totalAmount || 0).toLocaleString()}`;
            document.getElementById("tr-items").innerText = o.orderDetails || "—";
            const statusMap = {
                "รอตรวจสลิป": { label: "⏳ รอตรวจสลิป", cls: "bg-amber-100 text-amber-700" },
                "ยืนยันแล้ว": { label: "✅ ยืนยันแล้ว", cls: "bg-emerald-100 text-emerald-700" },
                "กำลังเตรียม": { label: "🍳 กำลังเตรียม", cls: "bg-sky-100 text-sky-700" },
                "กำลังส่ง": { label: "🛵 กำลังส่ง", cls: "bg-blue-100 text-blue-700" },
                "ส่งสำเร็จ": { label: "🎉 ส่งสำเร็จ", cls: "bg-green-100 text-green-700" },
                "ยกเลิก": { label: "❌ ยกเลิก", cls: "bg-rose-100 text-rose-700" },
            };
            const st = statusMap[o.paymentStatus] || { label: o.paymentStatus, cls: "bg-slate-100 text-slate-600" };
            const bdg = document.getElementById("tr-status-badge");
            bdg.className = `status-badge ${st.cls}`;
            bdg.innerText = st.label;
            resultEl.classList.add("hidden");
            cardEl.classList.remove("hidden");
        } else {
            resultEl.innerHTML = `<div class="text-2xl mb-2">🔍</div><p class="font-semibold text-sm">ไม่พบออเดอร์นี้</p><p class="text-xs mt-1 text-slate-400">ตรวจสอบรหัสออเดอร์หรือเบอร์โทรอีกครั้ง</p>`;
        }
    } catch {
        resultEl.innerHTML = `<div class="text-2xl mb-2">⚠️</div><p class="text-sm">ไม่สามารถเชื่อมต่อได้ในขณะนี้</p>`;
    }
}

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
//  11. INIT
// ═══════════════════════════════════════════════════════════
loadFromLocal();
renderMenu();
updateCartUI();

function openGrab() {
    const appUrl = "grab://open?screenType=SEARCH&searchKeyword=Clean%20Food%20Chiang%20Rai";
    const webUrl = "https://food.grab.com/th/th/search/?search=Clean%20Food%20Chiang%20Rai";
    window.location.href = appUrl;
    setTimeout(() => {
        if (document.hasFocus()) {
            window.location.href = webUrl;
        }
    }, 500);
}

// ✅ แก้ไข: ลบ visibilitychange ที่ทำให้รีโหลดหน้าเมื่อกลับจาก LINE ออก
// เดิมจะ reload ทันทีที่กลับมา ทำให้ออเดอร์ที่เพิ่งส่งหาย
// window.addEventListener("visibilitychange", function () {
//     if (document.visibilityState === "visible" && isCheckoutMode) {
//         location.reload();
//     }
// });

// 🕒 เช็คว่าร้านเปิดอยู่ไหม (10:00 - 20:00)
function isShopOpen() {
    const hr = new Date().getHours();
    // return hr >= 10 && hr < 20; // <--- [ใช้งานจริง] 10:00-20:00
    return hr >= 0 && hr < 24;    // <--- [ทดสอบตอนนี้] เปิด 24 ชม.
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
            checkoutBtn.innerHTML = `<i class="fa-solid fa-clock"></i> ร้านเปิดรับออเดอร์ 10:00 น.`;
        }
    } else {
        banner?.classList.add("hidden");
        checkFormValidity();
    }
}
setInterval(updateShopStatusUI, 60000);


// 💾 บันทึกทุกอย่างลง LocalStorage
function saveToLocal() {
    const data = {
        cart: cart,
        customer: {
            name: document.getElementById("cust-name")?.value,
            tel: document.getElementById("cust-tel")?.value,
            zone: document.getElementById("cust-zone")?.value,
            slot: document.getElementById("cust-slot")?.value,
            landmark: document.getElementById("cust-landmark")?.value,
            address: document.getElementById("cust-address")?.value,
            lat: document.getElementById("cust-lat")?.value,
            lng: document.getElementById("cust-lng")?.value
        }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
}

function saveCustomerInfo() {
    const customerData = {
        name: document.getElementById("cust-name")?.value,
        tel: document.getElementById("cust-tel")?.value,
        landmark: document.getElementById("cust-landmark")?.value,
        zone: document.getElementById("cust-zone")?.value,
        slot: document.getElementById("cust-slot")?.value
    };
    localStorage.setItem("CF_CUSTOMER_INFO", JSON.stringify(customerData));
}

["cust-name", "cust-tel", "cust-landmark", "cust-zone", "cust-slot"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", saveCustomerInfo);
    document.getElementById(id)?.addEventListener("change", saveCustomerInfo);
});

function loadSavedData() {
    const saved = localStorage.getItem("CF_CUSTOMER_INFO");
    if (saved) {
        const data = JSON.parse(saved);
        if (data.name) document.getElementById("cust-name").value = data.name;
        if (data.tel) document.getElementById("cust-tel").value = data.tel;
        if (data.landmark) document.getElementById("cust-landmark").value = data.landmark;
        if (data.zone) document.getElementById("cust-zone").value = data.zone;
        if (data.slot) document.getElementById("cust-slot").value = data.slot;
    }
}

function openGrabSearch() {
    const searchTerm = encodeURIComponent("Clean Food Chiang Rai");
    const appUrl = `grab://open?screenType=SEARCH&searchKeyword=${searchTerm}`;
    const webUrl = `https://food.grab.com/th/th/search/?search=${searchTerm}`;
    window.location.href = appUrl;
    setTimeout(() => {
        if (document.hasFocus()) {
            window.open(webUrl, '_blank');
        }
    }, 500);
}

function getNextDeliveryDate() {
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);

    while (true) {
        const dayOfWeek = targetDate.getDay();
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const isSunday = dayOfWeek === 0;
        const isManualHoliday = CONFIG.HOLIDAYS && CONFIG.HOLIDAYS.includes(dateStr);

        if (isSunday || isManualHoliday) {
            targetDate.setDate(targetDate.getDate() + 1);
        } else {
            break; 
        }
    }
    return targetDate;
}

function getDeliveryDateThai() {
    const d = getNextDeliveryDate();
    return d.toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function updateHolidayWarning() {
    const nextDate = getNextDeliveryDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isSkipped = nextDate.getDate() !== tomorrow.getDate();
    const banner = document.getElementById("delivery-date-banner");

    if (isSkipped && banner) {
        banner.style.background = "linear-gradient(135deg, #fff7ed, #ffedd5)";
        banner.style.borderColor = "#fb923c";
        banner.style.color = "#9a3412";
        
        const note = document.createElement("div");
        note.className = "text-[10px] mt-1 font-bold opacity-80";
        note.innerHTML = `<i class="fa-solid fa-circle-info"></i> เนื่องจากร้านหยุดวันที่ ${CONFIG.HOLIDAYS.join(", ")} หรือวันอาทิตย์ค่ะ`;
        banner.appendChild(note);
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
                <span>ขออภัย ร้านหยุดชั่วคราว: ออเดอร์ช่วงนี้จะเริ่มจัดส่งใน <b>${getDeliveryDateThai()}</b> ค่ะ</span>
            </span>
        `;
    }
}

window.addEventListener('DOMContentLoaded', updateHolidayAlerts);


// ═══════════════════════════════════════════════════════════
//  ITEM MODAL (รวมร่างกับระบบ Add-on)
// ═══════════════════════════════════════════════════════════
let currentAddonTotal = 0;

function openModal(id) {
    currentModalItem = menuData.find(i => i.id === id);
    if (!currentModalItem) return;
    
    tempQty = 1;
    currentAddonTotal = 0;
    document.getElementById("modal-qty").innerText = 1;
    document.getElementById("modal-special-note").value = "";
    document.getElementById("modal-note-section").classList.remove("hidden");

    document.getElementById("modal-img").src = currentModalItem.image;
    document.getElementById("modal-badge").innerText = currentModalItem.badge || "Clean Food";
    document.getElementById("modal-category-label").innerText = getCategoryLabel(currentModalItem.category);
    document.getElementById("modal-title").innerText = currentModalItem.name;
    document.getElementById("modal-desc").innerText = currentModalItem.desc;
    document.getElementById("modal-kcal-val").innerText = currentModalItem.kcal;
    document.getElementById("nutrition-box").style.display = "block";
    document.getElementById("modal-pro").innerText = `${currentModalItem.macros.pro}g`;
    document.getElementById("modal-carb").innerText = `${currentModalItem.macros.carb}g`;
    document.getElementById("modal-fat").innerText = `${currentModalItem.macros.fat}g`;
    document.getElementById("ingredients-title").innerHTML = `<i class="fa-solid fa-basket-wheat text-emerald-500 mr-1"></i> ส่วนประกอบหลัก`;
    document.getElementById("modal-ingredients").innerHTML = currentModalItem.ingredients.map(ing => `<span class="ing-tag">${ing}</span>`).join("");
    
    renderModalAddons();
    calculateModalPrice();

    gsap.set(".progress-bar-fill", { width: 0 });
    document.getElementById("modal-container").classList.remove("hidden");
    gsap.to("#modal-backdrop", { opacity: 1, duration: 0.25 });
    gsap.to("#modal-content", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.2)" });
    document.body.style.overflow = "hidden";
    setTimeout(() => {
        document.getElementById("bar-pro").style.width = `${Math.min((currentModalItem.macros.pro / 60) * 100, 100)}%`;
        document.getElementById("bar-carb").style.width = `${Math.min((currentModalItem.macros.carb / 60) * 100, 100)}%`;
        document.getElementById("bar-fat").style.width = `${Math.min((currentModalItem.macros.fat / 30) * 100, 100)}%`;
    }, 250);
}

function renderModalAddons() {
    const container = document.getElementById("modal-addon-section");
    container.innerHTML = "";
    
    if (!currentModalItem.macros || typeof ADDONS === 'undefined') {
        document.getElementById("modal-note-section").classList.add("hidden");
        return;
    }

    for (const [key, category] of Object.entries(ADDONS)) {
        let html = `
            <div class="mb-2">
                <div class="flex items-center justify-between mb-2">
                    <label class="font-bold text-slate-700 text-sm">${category.label}</label>
                    ${category.required 
                        ? '<span class="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">บังคับเลือก</span>' 
                        : '<span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">เลือกเพิ่มได้</span>'}
                </div>
                <div class="space-y-2">
        `;

        category.options.forEach(opt => {
            const inputName = `modal_addon_${key}`;
            const isChecked = opt.default ? "checked" : "";
            const priceText = opt.price > 0 ? `+฿${opt.price}` : "ฟรี";

            html += `
                <label class="flex items-center justify-between p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors bg-white">
                    <div class="flex items-center gap-3">
                        <input type="${category.type}" name="${inputName}" value="${opt.id}" data-price="${opt.price}" data-name="${opt.label}" 
                               class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                               onchange="calculateModalPrice()" ${isChecked}>
                        <span class="text-sm text-slate-700">${opt.label}</span>
                    </div>
                    <span class="text-xs font-bold ${opt.price > 0 ? 'text-emerald-600' : 'text-slate-400'}">${priceText}</span>
                </label>
            `;
        });
        html += `</div></div>`;
        container.innerHTML += html;
    }
}

function calculateModalPrice() {
    if (!currentModalItem) return;
    let extraPrice = 0;
    const checkedInputs = document.querySelectorAll('#modal-addon-section input:checked');
    checkedInputs.forEach(input => extraPrice += parseFloat(input.getAttribute('data-price') || 0));

    currentAddonTotal = extraPrice;
    const grandTotal = (currentModalItem.price + currentAddonTotal) * tempQty;
    document.getElementById("modal-price").innerText = `฿${grandTotal.toLocaleString()}`;
}

function updateQty(change) {
    tempQty = Math.max(1, Math.min(tempQty + change, 10));
    document.getElementById("modal-qty").innerText = tempQty;
    calculateModalPrice();
}

// ═══════════════════════════════════════════════════════════
//  CART (ตอนกดยืนยันลงตะกร้า)
// ═══════════════════════════════════════════════════════════
function confirmAddToCart() {
    if (!currentModalItem) return;

    let missingRequired = false;
    let missingLabel = "";
    if (currentModalItem.id !== "SUB_WEEKLY" && typeof ADDONS !== 'undefined') {
        for (const [key, category] of Object.entries(ADDONS)) {
            if (category.required && !document.querySelector(`input[name="modal_addon_${key}"]:checked`)) {
                missingRequired = true;
                missingLabel = category.label;
                break;
            }
        }
    }

    if (missingRequired) {
        SwalWarning("ข้อมูลไม่ครบ", `กรุณาเลือก "${missingLabel}" ด้วยนะคะ 🥺`);
        return;
    }

    let selectedAddons = [];
    document.querySelectorAll('#modal-addon-section input:checked').forEach(input => {
        const name = input.getAttribute('data-name');
        const price = parseFloat(input.getAttribute('data-price') || 0);
        selectedAddons.push(price > 0 ? `${name} (+฿${price})` : name);
    });

    const addonText = selectedAddons.join(", ");
    const specialNote = document.getElementById("modal-special-note")?.value.trim() || "";
    let allergyText = "";
    let itemNote = "";
    if (specialNote) {
        if (specialNote.includes("แพ้")) allergyText = specialNote;
        else itemNote = specialNote;
    }

    const cartItem = {
        cartItemId: "item_" + Date.now().toString(), 
        id: currentModalItem.id,
        name: currentModalItem.name,
        price: currentModalItem.price,
        priceWithAddon: currentModalItem.price + currentAddonTotal,
        qty: tempQty,
        addonText: addonText,
        allergyText: allergyText,
        itemNote: itemNote,
        image: currentModalItem.image
    };

    if (isCheckoutMode) {
        SwalWarning("กำลังอยู่ในขั้นตอนชำระเงิน", "กรุณากดย้อนกลับก่อนแก้ไขรายการ");
        return;
    }

    const existingIndex = cart.findIndex(i => 
        i.id === cartItem.id && i.addonText === cartItem.addonText && 
        i.allergyText === cartItem.allergyText && i.itemNote === cartItem.itemNote
    );

    if (existingIndex > -1) {
        cart[existingIndex].qty += cartItem.qty;
    } else {
        cart.push(cartItem);
    }

    updateCartUI();
    closeModal();
    SwalToast(`เพิ่ม "${cartItem.name}" ลงตะกร้าแล้ว ✓`, 'success');
}

// ═══════════════════════════════════════════════════════════
//  12. SMART LOCAL STORAGE (ระบบจดจำข้อมูล 12 ชม.)
// ═══════════════════════════════════════════════════════════
function saveToLocal() {
    if (isCheckoutMode) return; 

    const data = {
        timestamp: Date.now(),
        cart: cart,
        customer: {
            name: document.getElementById("cust-name")?.value || "",
            tel: document.getElementById("cust-tel")?.value || "",
            zone: document.getElementById("cust-zone")?.value || "5",
            slot: document.getElementById("cust-slot")?.value || "",
            landmark: document.getElementById("cust-landmark")?.value || "",
            address: document.getElementById("cust-address")?.value || "",
            lat: document.getElementById("cust-lat")?.value || "",
            lng: document.getElementById("cust-lng")?.value || ""
        }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromLocal() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        if (Date.now() - data.timestamp > EXPIRY_TIME) {
            clearLocal();
            return;
        }

        cart = data.cart || [];
        if (data.customer) {
            if (data.customer.name) document.getElementById("cust-name").value = data.customer.name;
            if (data.customer.tel) document.getElementById("cust-tel").value = data.customer.tel;
            if (data.customer.zone) document.getElementById("cust-zone").value = data.customer.zone;
            if (data.customer.slot) document.getElementById("cust-slot").value = data.customer.slot;
            if (data.customer.landmark) document.getElementById("cust-landmark").value = data.customer.landmark;
            if (data.customer.address) document.getElementById("cust-address").value = data.customer.address;
            if (data.customer.lat) document.getElementById("cust-lat").value = data.customer.lat;
            if (data.customer.lng) document.getElementById("cust-lng").value = data.customer.lng;
            
            if (data.customer.lat && data.customer.lng) {
                const gpsCoordsEl = document.getElementById("gps-coords-text");
                const gpsDv = document.getElementById("gps-display");
                if (gpsCoordsEl) gpsCoordsEl.innerText = `${data.customer.lat}, ${data.customer.lng}`;
                if (gpsDv) gpsDv.classList.remove("hidden");
            }
        }
    } catch (e) {
        clearLocal();
    }
}   

["cust-name", "cust-tel", "cust-landmark", "cust-zone", "cust-slot"].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener("input", saveToLocal);
        el.addEventListener("change", saveToLocal);
    }
});