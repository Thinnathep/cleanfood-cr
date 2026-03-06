// ═══════════════════════════════════════════════════════════
//  2. RENDER MENU
// ═══════════════════════════════════════════════════════════
function getCategoryLabel(cat) {
    return { chicken: "🍗 อกไก่", fish: "🐟 ปลา", beef: "🥩 เนื้อ", salad: "🥗 สลัด", set: "🍱 เมนูเซ็ต" }[cat] || cat;
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
        card.setAttribute("data-category", item.category);
        card.setAttribute("data-name", item.name.toLowerCase());
        card.style.cssText = "opacity:0; transform:translateY(30px)";

        if (item.category === "set") {
            // ══ SET CARD — vertical, same size as regular, with premium border ══
            card.className = "menu-card menu-item flex flex-col ring-2 ring-emerald-400 ring-offset-1";
            card.innerHTML = `
                <div class="relative h-48 bg-slate-100 overflow-hidden">
                    <div class="kcal-badge absolute top-3 left-3 text-white text-[10px] px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                        <i class="fa-solid fa-fire text-amber-400 text-[9px]"></i> ${item.kcal} kcal
                    </div>
                    <!-- Set banner top-right -->
                    <div class="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1">
                        🍱 Value Set
                    </div>
                    <img src="${item.image}" class="food-img w-full h-full object-cover" loading="lazy"
                        onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70'">
                </div>
                <div class="p-4 flex flex-col flex-grow bg-emerald-50/40">
                    <div class="text-[10px] font-bold text-emerald-600 mb-0.5 uppercase tracking-wide">🍱 เมนูเซ็ต</div>
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
                    ${item.badge ? `<div class="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-lg mb-2 flex items-center gap-1"><i class="fa-solid fa-tag text-[9px]"></i> ${item.badge}</div>` : ""}
                    <div class="flex justify-between items-center border-t border-emerald-100 pt-3">
                        <div>
                            <div class="text-[9px] text-emerald-500 font-semibold">ราคาเซ็ต</div>
                            <span class="text-xl font-extrabold text-emerald-600">฿${item.price}</span>
                        </div>
                        <button onclick="openModal(${item.id}); event.stopPropagation();"
                            class="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                            <i class="fa-solid fa-plus text-[10px]"></i> สั่งเลย
                        </button>
                    </div>
                    <!-- Review Bar -->
                    <div class="flex items-center justify-between mt-2.5 pt-2.5 border-t border-emerald-100">
                        <div class="flex items-center gap-3">
                            <button id="like-btn-${item.id}" onclick="likeMenu(event, ${item.id})"
                                class="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-500 transition-colors group">
                                <i class="fa-heart fa-regular group-hover:fa-solid text-sm"></i>
                                <span id="like-count-${item.id}">0</span>
                            </button>
                        </div>
                        <button onclick="shareMenu(event, ${item.id})" title="แชร์เมนู"
                            class="text-slate-300 hover:text-emerald-500 transition-colors">
                            <i class="fa-solid fa-arrow-up-from-bracket text-sm"></i>
                        </button>
                    </div>
                </div>`;
        } else {
            // ══ REGULAR CARD ══
            card.className = "menu-card menu-item flex flex-col";
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
                    <!-- Review Bar -->
                    <div class="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-50">
                        <div class="flex items-center gap-3">
                            <button id="like-btn-${item.id}" onclick="likeMenu(event, ${item.id})"
                                class="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-500 transition-colors group">
                                <i class="fa-heart fa-regular group-hover:fa-solid text-sm"></i>
                                <span id="like-count-${item.id}">0</span>
                            </button>
                        </div>
                        <button onclick="shareMenu(event, ${item.id})" title="แชร์เมนู"
                            class="text-slate-300 hover:text-emerald-500 transition-colors">
                            <i class="fa-solid fa-arrow-up-from-bracket text-sm"></i>
                        </button>
                    </div>
                </div>`;
        }


        card.addEventListener("click", () => openModal(item.id));
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
    if (typeof gsap !== 'undefined') gsap.to(".menu-card", { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: "power2.out", delay: 0.05 });
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

function filterMenu(category) {
    if (category === "all") {
        renderMenu();
    } else {
        renderMenu(menuData.filter(item => item.category === category));
    }

    // อัปเดต UI ปุ่ม
    document.querySelectorAll(".filter-btn").forEach(b => {
        if (b.dataset.filter === category) {
            b.classList.add("active");
            b.classList.replace("bg-white", "bg-emerald-600");
            b.classList.replace("text-slate-600", "text-white");
        } else {
            b.classList.remove("active");
            b.classList.replace("bg-emerald-600", "bg-white");
            b.classList.replace("text-white", "text-slate-600");
        }
    });
}

function resetFilterBtns() {
    document.querySelectorAll(".filter-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === "all");
        if (b.dataset.filter === "all") {
            b.classList.add("bg-emerald-600", "text-white");
            b.classList.remove("bg-white", "text-slate-600");
        } else {
            b.classList.remove("bg-emerald-600", "text-white");
            b.classList.add("bg-white", "text-slate-600");
        }
    });
}

// ═══════════════════════════════════════════════════════════
//  5. ITEM MODAL + ADD-ONS
// ═══════════════════════════════════════════════════════════
function openModal(id) {
    currentModalItem = menuData.find(i => i.id === id);
    if (!currentModalItem) return;

    tempQty = 1;
    currentAddonTotal = 0;
    document.getElementById("modal-qty").innerText = 1;
    const specialNoteEl = document.getElementById("modal-special-note");
    if (specialNoteEl) specialNoteEl.value = "";
    document.getElementById("modal-note-section")?.classList.remove("hidden");

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

    if (typeof gsap !== 'undefined') {
        gsap.set(".progress-bar-fill", { width: 0 });
        document.getElementById("modal-container").classList.remove("hidden");
        gsap.to("#modal-backdrop", { opacity: 1, duration: 0.25 });
        gsap.to("#modal-content", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.2)" });
    } else {
        document.getElementById("modal-container").classList.remove("hidden");
    }
    document.body.style.overflow = "hidden";
    setTimeout(() => {
        document.getElementById("bar-pro").style.width = `${Math.min((currentModalItem.macros.pro / 60) * 100, 100)}%`;
        document.getElementById("bar-carb").style.width = `${Math.min((currentModalItem.macros.carb / 60) * 100, 100)}%`;
        document.getElementById("bar-fat").style.width = `${Math.min((currentModalItem.macros.fat / 30) * 100, 100)}%`;
    }, 250);
}

function closeModal() {
    if (typeof gsap !== 'undefined') {
        gsap.to("#modal-content", { opacity: 0, scale: 0.95, duration: 0.2, ease: "power2.in" });
        gsap.to("#modal-backdrop", {
            opacity: 0, duration: 0.2, onComplete: () => {
                document.getElementById("modal-container").classList.add("hidden");
                document.body.style.overflow = "";
            }
        });
    } else {
        document.getElementById("modal-container").classList.add("hidden");
        document.body.style.overflow = "";
    }
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
    if (typeof gsap !== 'undefined') {
        gsap.to("#modal-backdrop", { opacity: 1, duration: 0.25 });
        gsap.to("#modal-content", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.2)" });
    }
    document.body.style.overflow = "hidden";
}

function renderModalAddons() {
    const container = document.getElementById("modal-addon-section");
    if (!container) return;
    container.innerHTML = "";
    if (!currentModalItem.macros || typeof ADDONS === 'undefined') {
        document.getElementById("modal-note-section")?.classList.add("hidden");
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
                <div class="space-y-2">`;
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
                </label>`;
        });
        html += `</div></div>`;
        container.innerHTML += html;
    }
}

function calculateModalPrice() {
    if (!currentModalItem) return;
    let extraPrice = 0;
    document.querySelectorAll('#modal-addon-section input:checked').forEach(input => {
        extraPrice += parseFloat(input.getAttribute('data-price') || 0);
    });
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
//  REVIEW — Like / Star / Share
// ═══════════════════════════════════════════════════════════

// ── โหลด review จาก GAS เมื่อเปิดหน้า ───────────────────────────
function loadReviews() {
    fetch(`${CONFIG.GAS_URL}?action=getReviews`)
        .then(r => r.json())
        .then(data => {
            if (data.status !== "ok" || !data.reviews) return;
            Object.entries(data.reviews).forEach(([menuId, rev]) => {
                const likeEl = document.getElementById(`like-count-${menuId}`);
                if (likeEl) likeEl.textContent = rev.likes || 0;
            });
        })
        .catch(() => { }); // silent fail
}

const likeStates = {}; // จัดเก็บสถานะไลค์และดีเลย์ของแต่ละเมนู

// ── กดหัวใจ — ระบบ Like/Unlike พร้อมป้องกันการคลิกรัว (Debounce & Spam Check) ──
function likeMenu(event, menuId) {
    event.stopPropagation();
    const btn = document.getElementById(`like-btn-${menuId}`);
    const icon = btn?.querySelector('i');
    const count = document.getElementById(`like-count-${menuId}`);

    // กำหนด State เริ่มต้นให้เมนูหากยังไม่มี
    if (!likeStates[menuId]) {
        likeStates[menuId] = { liked: false, pendingVal: 0, timeout: null, clickCount: 0, lastClickTime: 0 };
    }
    const state = likeStates[menuId];
    const now = Date.now();

    // 1. ตรวจสอบการกดรัว (Spam Check) 
    if (now - state.lastClickTime < 800) {
        state.clickCount++;
        if (state.clickCount > 4) {
            SwalToast('ใจเย็นๆ น้าาา ระบบกำลังประมวลผลอยู่ค่ะ 😅', 'warning');
            return; // บล็อคถ้ากดรัวเกิน 4 ครั้งในเสี้ยววิ
        }
    } else {
        state.clickCount = 1;
    }
    state.lastClickTime = now;

    // 2. สลับสถานะ Like / Unlike
    state.liked = !state.liked;
    const change = state.liked ? 1 : -1;
    state.pendingVal += change; // เก็บยอดสุทธิที่จะส่ง

    // 3. อัปเดต UI ทันที (โดดเด่นขึ้น)
    if (icon && btn) {
        if (state.liked) {
            // โหมด Liked (เด่น)
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid', 'text-rose-500');
            btn.classList.add('bg-rose-50', 'text-rose-600', 'px-2.5', 'py-1', 'rounded-full');
            btn.classList.remove('text-slate-400');
        } else {
            // โหมด Unliked (ปกติ)
            icon.classList.add('fa-regular');
            icon.classList.remove('fa-solid', 'text-rose-500');
            btn.classList.remove('bg-rose-50', 'text-rose-600', 'px-2.5', 'py-1', 'rounded-full');
            btn.classList.add('text-slate-400');
        }
        // Animate เด้งดึ๋ง
        icon.style.transform = 'scale(1.4)';
        setTimeout(() => { icon.style.transform = 'scale(1)'; icon.style.transition = 'transform 0.15s ease-out'; }, 150);
    }
    
    // อัปเดตตัวเลข
    if (count) {
        let currentCount = parseInt(count.textContent) || 0;
        count.textContent = Math.max(0, currentCount + change); // ไม่ให้ติดลบ
    }

    // แสดงข้อความแค่ตอน Like
    if (state.liked && state.clickCount <= 2) {
        SwalToast('💚 ขอบคุณที่ชื่นชอบเมนูนี้ค่ะ!', 'success');
    }

    // 4. ตั้งเวลา (Debounce) ก่อนส่งไปหลังบ้าน
    // ถ้ายูเซอร์กดคลิกอีก จะยกเลิกเวลาเก่าและเริ่มนับ 1.5 วินาทีใหม่ 
    if (state.timeout) clearTimeout(state.timeout);
    
    state.timeout = setTimeout(() => {
        // ถ้ายอดรวมสุทธิไม่เท่ากับ 0 ถึงจะส่งค่าไป GAS
        if (state.pendingVal !== 0) {
            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'like', menuId: String(menuId), value: state.pendingVal }),
            }).catch(() => { });
            state.pendingVal = 0; // รีเซ็ตยอดรอส่ง
        }
    }, 1500); // รอผู้ใช้หยุดกด 1.5 วินาทีค่อยส่งไปลบ/บวกใน Sheet
}


// ── แชร์เมนู ──────────────────────────────────────────────────
function shareMenu(event, menuId) {
    event.stopPropagation();
    const item = menuData.find(m => m.id === menuId);
    if (!item) return;
    const text = `🍱 ${item.name} — Clean Food Chiang Rai`;
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
        navigator.share({ title: text, url: url }).catch(() => { });
    } else {
        navigator.clipboard.writeText(`${text}\n${url}`)
            .then(() => SwalToast('🔗 คัดลอกลิงก์ไว้แล้ว!', 'success'))
            .catch(() => SwalToast('ไม่สามารถคัดลอกได้', 'error'));
    }
}
