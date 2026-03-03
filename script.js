// ═══════════════════════════════════════════════════════════
//  Clean Food Chiang Rai · script.js  v3.0
//  + SweetAlert2  + Back button  + Payment confirm flow
// ═══════════════════════════════════════════════════════════

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
    PROMPTPAY: "0962386554",
    LINE_OA: "@282ovoyd",
    GAS_URL: "https://script.google.com/macros/s/AKfycbwkXzOY2q5Pdc0mDxt6U17OesiWFo_ryhXpdfr9DRFESMCWjO91RqoQYo4ovEQwRSTk/exec",
    CHIANG_RAI: [19.9071, 99.8310],
};

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

// ─── STATE ─────────────────────────────────────────────────
let cart = [];
let currentModalItem = null;
let tempQty = 1;
let map, marker;

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
//  1. CLOCK
// ═══════════════════════════════════════════════════════════
function updateDateTime() {
    const now = new Date();
    const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    const el = document.getElementById("datetime-display");
    const yr = document.getElementById("year");
    if (el) el.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleDateString("th-TH", opts)}`;
    if (yr) yr.innerText = now.getFullYear();
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

function closeModal() {
    gsap.to("#modal-content", { opacity: 0, scale: 0.95, duration: 0.2, ease: "power2.in" });
    gsap.to("#modal-backdrop", {
        opacity: 0, duration: 0.2, onComplete: () => {
            document.getElementById("modal-container").classList.add("hidden");
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
            <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> ส่งฟรีในเขตเมืองเชียงราย</li>
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
    const existing = cart.find(i => i.id === newItem.id);
    if (existing) existing.qty += newItem.qty;
    else cart.push({ ...newItem });
    updateCartUI();
    SwalToast(`เพิ่ม "${newItem.name}" ลงตะกร้าแล้ว ✓`, 'success');
}

function editCartQty(index, change) {
    const newQty = cart[index].qty + change;
    if (newQty <= 0) {
        const removedName = cart[index].name;
        cart.splice(index, 1);
        updateCartUI();
        SwalToast(`ลบ "${removedName}" ออกแล้ว`, 'info');
    } else {
        cart[index].qty = newQty;
        updateCartUI();
    }
}

function removeCartItem(index) {
    const removedName = cart[index].name;
    cart.splice(index, 1);
    updateCartUI();
    SwalToast(`ลบ "${removedName}" ออกแล้ว`, 'info');
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
            total += item.price * item.qty;
            totalQty += item.qty;
            cartItemsEl.innerHTML += `
                <div class="cart-item-row flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <img src="${item.image}" class="w-14 h-14 rounded-xl object-cover shrink-0"
                        onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=60'">
                    <div class="flex-grow min-w-0">
                        <h4 class="font-extrabold text-slate-800 text-sm leading-tight truncate">${item.name}</h4>
                        <div class="text-emerald-600 font-bold text-sm mt-0.5">฿${(item.price * item.qty).toLocaleString()}</div>
                        <div class="text-[10px] text-slate-400">฿${item.price} × ${item.qty}</div>
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

        if (summaryEl) summaryEl.innerText = `${totalQty} รายการ`;
        if (countLabel) countLabel.innerText = `${totalQty} รายการในตะกร้า`;
    }

    totalEl.innerText = `฿${total.toLocaleString()}`;
    badge.innerText = totalQty;
    checkFormValidity();
}

// ─── FORM VALIDITY ────────────────────────────────────────
function checkFormValidity() {
    const name = document.getElementById("cust-name")?.value.trim() || "";
    const tel = document.getElementById("cust-tel")?.value.trim() || "";
    const address = document.getElementById("cust-address")?.value.trim() || "";
    const slot = document.getElementById("cust-slot")?.value || "";
    const pdpa = document.getElementById("pdpa-consent")?.checked;
    const btn = document.getElementById("checkout-btn");
    if (!btn) return;
    const telOk = isValidThaiPhone(tel);
    const valid = cart.length > 0 && name && telOk && address && slot && pdpa;
    btn.disabled = !valid;
    btn.classList.toggle("opacity-40", !valid);
    btn.classList.toggle("cursor-not-allowed", !valid);
    btn.innerHTML = valid
        ? `<i class="fa-solid fa-qrcode"></i> สร้าง QR ชำระเงิน`
        : `<i class="fa-solid fa-qrcode"></i> กรอกข้อมูลให้ครบ แล้วสร้าง QR`;
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

// ═══════════════════════════════════════════════════════════
//  7. GENERATE QR — พร้อม SweetAlert confirm
// ═══════════════════════════════════════════════════════════
function generateQR() {
    const name = document.getElementById("cust-name").value.trim();
    const tel = document.getElementById("cust-tel").value.trim();
    const address = document.getElementById("cust-address").value.trim();
    const slot = document.getElementById("cust-slot").value;
    const pdpa = document.getElementById("pdpa-consent").checked;
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const orderSummary = cart.map(i => `• ${i.name} ×${i.qty} = ฿${(i.price * i.qty).toLocaleString()}`).join("<br>");

    clearFieldErrors();
    let hasError = false;
    if (!name) { setFieldError("cust-name", "กรุณากรอกชื่อ-นามสกุล"); hasError = true; }
    if (!isValidThaiPhone(tel)) { setFieldError("cust-tel", "กรุณากรอกเบอร์โทรให้ถูกต้อง (10 หลัก)"); hasError = true; }
    if (!slot) { setFieldError("cust-slot", "กรุณาเลือกรอบจัดส่ง"); hasError = true; }
    if (!address) { SwalWarning("ยังไม่ได้ปักหมุด", "กรุณาแตะหรือลากหมุดในแผนที่เพื่อระบุจุดจัดส่งก่อนนะคะ"); hasError = true; }
    if (!pdpa) { SwalWarning("ยังไม่ได้ยอมรับ PDPA", "กรุณาอ่านและยอมรับนโยบายความเป็นส่วนตัวก่อนดำเนินการต่อค่ะ"); hasError = true; }
    if (hasError) return;

    // ── SweetAlert ยืนยันออเดอร์ก่อนแสดง QR ──────────────
    SwalBase.fire({
        title: '📋 ตรวจสอบออเดอร์',
        html: `
            <div style="text-align:left; font-size:13px; line-height:1.8">
                <div style="background:#f0fdf4; border-radius:12px; padding:12px 14px; margin-bottom:12px; border:1px solid #86efac;">
                    <b>👤 ${name}</b> &nbsp;|&nbsp; 📱 ${tel}<br>
                    🕐 รอบส่ง: <b>${slot}</b><br>
                    📅 จัดส่ง: <b>${getDeliveryDateThai()}</b>
                </div>
                <div style="margin-bottom:10px">${orderSummary}</div>
                <div style="background:#fef9c3; border-radius:10px; padding:10px 12px; font-size:12px; border:1px solid #fde047;">
                    ⚠️ กรุณาตรวจสอบให้ถูกต้องก่อนชำระเงิน<br>
                    หลังโอนแล้วจะแก้ไขออเดอร์ไม่ได้นะคะ
                </div>
            </div>
            <div style="margin-top:14px; background:#ecfdf5; border-radius:12px; padding:10px; font-size:18px; font-weight:800; color:#15803d; border:2px solid #86efac;">
                💰 ยอดชำระ: ฿${total.toLocaleString()}
            </div>`,
        confirmButtonText: 'ถูกต้องและไปชำระเงิน',
        cancelButtonText: 'แก้ไขออเดอร์',
        showCancelButton: true,
        reverseButtons: true,
    }).then(result => {
        if (!result.isConfirmed) return;

        // แสดง QR
        const amountEl = document.getElementById("qr-total-amount");
        if (amountEl) amountEl.innerText = total.toLocaleString();
        document.getElementById("qr-container").classList.remove("hidden");
        document.getElementById("qr-container").style.display = "flex";
        document.getElementById("checkout-btn").classList.add("hidden");
        document.getElementById("cart-items").style.display = "none";
        document.getElementById("checkout-form-container").style.display = "none";
        // แสดงปุ่มย้อนกลับ
        document.getElementById("back-to-cart-btn").classList.remove("hidden");
    });
}

// ─── ย้อนกลับจากหน้า QR ──────────────────────────────────
function backToCart() {
    document.getElementById("qr-container").classList.add("hidden");
    document.getElementById("qr-container").style.display = "none";
    document.getElementById("checkout-btn").classList.remove("hidden");
    document.getElementById("cart-items").style.display = "";
    document.getElementById("checkout-form-container").style.display = "";
    document.getElementById("back-to-cart-btn").classList.add("hidden");
}

// ═══════════════════════════════════════════════════════════
//  8. SEND ORDER → GAS → LINE (พร้อม SweetAlert confirm)
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
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const orderItems = cart.map(i => `- ${i.name} ×${i.qty} = ฿${(i.price * i.qty).toLocaleString()}`).join("\n");
    const itemNames = cart.map(i => `${i.name} ×${i.qty}`).join(", ");
    const deliveryDateThai = getDeliveryDateThai();

    if (!name || !tel || !slot || !gpsLink) {
        SwalWarning("ข้อมูลไม่ครบ", "กรุณากลับไปกรอกข้อมูลจัดส่งให้ครบถ้วนก่อนนะคะ");
        return;
    }

    // ── SweetAlert ยืนยันการโอนเงิน ──────────────────────
    const confirmResult = await SwalBase.fire({
        title: '💳 ยืนยันการชำระเงิน',
        html: `
          <div style="font-size:13px; line-height:2; text-align:left">
    <div style="background:#fef9c3; border:1px solid #fde047; border-radius:12px; padding:12px 14px; margin-bottom:12px;">
        <b style="font-size:14px;">🎯 ขั้นตอนการยืนยันชำระเงิน</b><br>
        ✔️ ชำระเงินผ่าน QR Code สำเร็จ<br>
        💾 บันทึกหลักฐานการโอน (สลิป) เรียบร้อย<br>
        📲 ระบบจะนำท่านเข้าสู่แชทร้านโดยอัตโนมัติ<br>
        &nbsp;&nbsp;&nbsp;&nbsp;เพื่อจัดส่งอาหารในรอบวันถัดไปครับ
    </div>
    <div style="background:#fff1f2; border-radius:10px; padding:10px 12px; font-size:12px; color:#991b1b; border:1px solid #fecdd3;">
        🛑 **ข้อควรระวัง:** โปรดตรวจสอบยอดเงินให้ถูกต้องก่อนกดยืนยัน
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

    // ── Loading ────────────────────────────────────────────
    const btn = document.getElementById("submit-order-btn");
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> กำลังบันทึกออเดอร์...`;
    btn.disabled = true;
    btn.classList.add("opacity-70", "cursor-wait");

    const payload = {
        customerName: name,
        phone: tel,
        address: landmark ? `${landmark} | พิกัด: ${gpsLink}` : gpsLink,
        latitude: lat,
        longitude: lng,
        deliverySlot: slot,
        orderDetails: itemNames,
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
            `รายการ:`, orderItems,
            `💰 รวม: ฿${total.toLocaleString()}`,
            note ? `📝 หมายเหตุ: ${note}` : "",
            `──────────────────────`,
            `📎 แนบสลิปโอนเงินด้วยนะคะ`,
        ].filter(Boolean).join("\n");

        // แสดง success แล้วค่อยไป LINE
        await SwalBase.fire({
            icon: 'success',
            title: 'บันทึกออเดอร์แล้ว!',
            html: `<div style="font-size:13px; color:#475569">ระบบกำลังพาไปที่ LINE ร้าน<br>เพื่อส่งสลิปยืนยันการโอนค่ะ 📲</div>`,
            timer: 2000, showConfirmButton: false, timerProgressBar: true,
        });

        window.location.href = `https://line.me/R/oaMessage/@282ovoyd/?${encodeURIComponent(lineMsg)}`;

    } catch (err) {
        console.error(err);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        btn.classList.remove("opacity-70", "cursor-wait");
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
renderMenu();
updateCartUI();

function openGrab() {
    const appUrl = "grab://open?screenType=SEARCH&searchKeyword=Clean%20Food%20Chiang%20Rai";
    const webUrl = "https://food.grab.com/th/th/search/?search=Clean%20Food%20Chiang%20Rai";
    
    // ลองเปิดแอป
    window.location.href = appUrl;
    
    // ถ้าผ่านไป 500ms แล้วยังอยู่ที่เดิม (เปิดแอปไม่ขึ้น) ให้วาร์ปไปเว็บแทน
    setTimeout(() => {
        if (document.hasFocus()) {
            window.location.href = webUrl;
        }
    }, 500);
}