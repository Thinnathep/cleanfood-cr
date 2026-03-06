// ═══════════════════════════════════════════════════════════
//  6. CART & LOCAL STORAGE
// ═══════════════════════════════════════════════════════════

function confirmAddToCart() {
    if (!currentModalItem) return;

    // ด่าน 1: เช็ก required addons
    if (currentModalItem.id !== "SUB_WEEKLY" && typeof ADDONS !== 'undefined') {
        for (const [key, category] of Object.entries(ADDONS)) {
            if (category.required && !document.querySelector(`input[name="modal_addon_${key}"]:checked`)) {
                SwalWarning("ข้อมูลไม่ครบ", `กรุณาเลือก "${category.label}" ด้วยนะคะ 🥺`);
                return;
            }
        }
    }

    // ด่าน 2: กวาดข้อมูล addons
    let selectedAddons = [];
    document.querySelectorAll('#modal-addon-section input:checked').forEach(input => {
        const name = input.getAttribute('data-name');
        const price = parseFloat(input.getAttribute('data-price') || 0);
        selectedAddons.push(price > 0 ? `${name} (+฿${price})` : name);
    });

    const addonText = selectedAddons.join(", ");
    const specialNote = document.getElementById("modal-special-note")?.value.trim() || "";
    let allergyText = "", itemNote = "";
    if (specialNote) {
        if (specialNote.includes("แพ้")) allergyText = specialNote;
        else itemNote = specialNote;
    }

    // ด่าน 3: สร้าง cartItem
    const cartItem = {
        cartItemId: "item_" + Date.now().toString(),
        id: currentModalItem.id,
        name: currentModalItem.name,
        price: currentModalItem.price,
        priceWithAddon: currentModalItem.price + currentAddonTotal,
        qty: tempQty,
        addonText, allergyText, itemNote,
        image: currentModalItem.image
    };

    if (isCheckoutMode) {
        SwalWarning("กำลังอยู่ในขั้นตอนชำระเงิน", "กรุณากดย้อนกลับก่อนแก้ไขรายการ");
        return;
    }

    // ด่าน 4: ใส่ตะกร้า (รวมกับของเดิมถ้า option เหมือนกัน)
    const existingIndex = cart.findIndex(i =>
        i.id === cartItem.id &&
        i.addonText === cartItem.addonText &&
        i.allergyText === cartItem.allergyText &&
        i.itemNote === cartItem.itemNote
    );
    if (existingIndex > -1) {
        cart[existingIndex].qty += cartItem.qty;
    } else {
        cart.push(cartItem);
    }

    updateCartUI();   // ✅ อัปเดต UI ทันที ไม่ต้อง reload
    saveToLocal();
    closeModal();
    SwalToast(`เพิ่ม "${cartItem.name}" ลงตะกร้าแล้ว ✓`, 'success');
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
    if (newQty <= 0) { removeCartItem(index); }
    else { cart[index].qty = newQty; updateCartUI(); }
}

function removeCartItem(index) {
    if (isCheckoutMode) {
        SwalWarning("กำลังอยู่ในขั้นตอนชำระเงิน", "กรุณากดย้อนกลับก่อนแก้ไขรายการ");
        return;
    }
    const itemName = cart[index].name;
    SwalBase.fire({
        title: '🗑️ ยืนยันการลบ?',
        html: `ต้องการลบ <b>"${itemName}"</b><br>ออกจากตะกร้าใช่ไหมคะ?`,
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'ใช่, ลบเลย!', cancelButtonText: 'ยกเลิก', reverseButtons: true
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
    const zoneEl = document.getElementById("cust-zone");
    const selectedZone = zoneEl?.value || "";
    const deliveryFee = cart.length > 0 && selectedZone && DELIVERY_ZONES[selectedZone]
        ? DELIVERY_ZONES[selectedZone].fee
        : 0;

    // อัปเดตข้อความแสดงค่าส่ง
    const feeDisplayEl = document.getElementById("delivery-fee-display");
    if (feeDisplayEl) {
        if (!selectedZone) {
            feeDisplayEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i>กรุณาเลือกเขตการจัดส่ง`;
            feeDisplayEl.className = "text-[10px] text-amber-600 px-1 font-medium";
        } else if (DELIVERY_ZONES[selectedZone]) {
            feeDisplayEl.innerHTML = `✓ ค่าส่ง: <strong>฿${DELIVERY_ZONES[selectedZone].fee}</strong>`;
            feeDisplayEl.className = "text-[10px] text-emerald-600 px-1 font-medium";
        }
    }

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

        // แบนเนอร์วันส่ง
        cartItemsEl.innerHTML = `
            <div id="delivery-date-banner" class="delivery-date-banner mb-3">
                <i class="fa-solid fa-calendar-check"></i>
                <span>จัดส่งวันถัดไป: <strong>${getDeliveryDateThai()}</strong></span>
            </div>`;

        cart.forEach((item, index) => {
            const currentPrice = item.priceWithAddon || item.price;
            total += currentPrice * item.qty;
            totalQty += item.qty;

            let addonHtml = "";
            if (item.addonText) addonHtml += `<div class="text-[10px] text-emerald-600 mt-1 font-medium leading-tight"><i class="fa-solid fa-wrench mr-1"></i>${item.addonText}</div>`;
            if (item.allergyText) addonHtml += `<div class="text-[10px] text-rose-500 mt-0.5 font-bold leading-tight"><i class="fa-solid fa-triangle-exclamation mr-1"></i>แพ้: ${item.allergyText}</div>`;
            if (item.itemNote) addonHtml += `<div class="text-[10px] text-slate-400 mt-0.5 leading-tight"><i class="fa-solid fa-note-sticky mr-1"></i>${item.itemNote}</div>`;

            cartItemsEl.innerHTML += `
                <div class="cart-item-row flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mt-2">
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

        if (summaryEl) summaryEl.innerText = `${totalQty} รายการ (รวมค่าจัดส่ง)`;
        if (countLabel) countLabel.innerText = `${totalQty} รายการในตะกร้า`;

        if(typeof updateHolidayBanner === 'function') updateHolidayBanner();
    }

    const grandTotal = total + deliveryFee;
    totalEl.innerText = `฿${grandTotal.toLocaleString()}`;
    badge.innerText = totalQty;
    if(typeof checkFormValidity === 'function') checkFormValidity();
    saveToLocal();
}

function toggleCart() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer.classList.contains("open")) {
        drawer.classList.remove("open");
        if(typeof gsap !== 'undefined') {
            gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => overlay.classList.add("hidden") });
        } else {
            overlay.classList.add("hidden");
        }
        document.body.style.overflow = "";
    } else {
        overlay.classList.remove("hidden");
        if(typeof gsap !== 'undefined') gsap.to(overlay, { opacity: 1, duration: 0.3 });
        drawer.classList.add("open");
        document.body.style.overflow = "hidden";
        if(typeof initMap === 'function') setTimeout(initMap, 450);
    }
}

// ─── LOCAL STORAGE ──────────────────────────────────────────
function saveToLocal() {
    if (isCheckoutMode) return;
    const data = { timestamp: Date.now(), cart: cart };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromLocal() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        if (Date.now() - data.timestamp > EXPIRY_TIME) { clearLocal(); return; }
        cart = data.cart || [];
    } catch (e) {
        clearLocal();
    }
}

function clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("CF_CUSTOMER_INFO");
}
