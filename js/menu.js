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
    if(typeof gsap !== 'undefined') gsap.to(".menu-card", { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: "power2.out", delay: 0.05 });
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

function resetFilterBtns() {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === "all"));
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

    if(typeof gsap !== 'undefined') {
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
    if(typeof gsap !== 'undefined') {
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
    if(typeof gsap !== 'undefined') {
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
