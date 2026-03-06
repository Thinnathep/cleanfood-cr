// ═══════════════════════════════════════════════════════════
//  CHECKOUT & FORM
// ═══════════════════════════════════════════════════════════

function checkFormValidity() {
    const shopStatus = isShopOpen();
    const name = document.getElementById("cust-name")?.value.trim() || "";
    const tel = document.getElementById("cust-tel")?.value.trim() || "";
    const address = document.getElementById("cust-address")?.value.trim() || "";
    const zone = document.getElementById("cust-zone")?.value || "";
    const slot = document.getElementById("cust-slot")?.value || "";
    const pdpa = document.getElementById("pdpa-consent")?.checked;
    const btn = document.getElementById("checkout-btn");
    if (!btn) return;

    const telOk = isValidThaiPhone(tel);
    const formFilled = cart.length > 0 && name && telOk && address && zone && slot && pdpa;
    const canCheckout = formFilled && shopStatus;

    btn.disabled = !canCheckout;
    btn.classList.toggle("opacity-40", !canCheckout);
    btn.classList.toggle("cursor-not-allowed", !canCheckout);

    if (!shopStatus) {
        btn.innerHTML = `<i class="fa-solid fa-moon"></i> ร้านปิดแล้ว (เปิด 10:00 - 20:00 น.)`;
    } else {
        btn.innerHTML = canCheckout
            ? `<i class="fa-solid fa-qrcode"></i> ชำระเงิน`
            : `<i class="fa-solid fa-qrcode"></i> กรอกข้อมูลให้ครบ เพื่อชำระเงิน`;
    }
    if (tel && !telOk) setFieldError("cust-tel", "กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง (10 หลัก)");
    else setFieldError("cust-tel", "");
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
    if (!isValidThaiPhone(tel)) { setFieldError("cust-tel", "กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง (10 หลัก)"); hasError = true; }
    if (!slot) { setFieldError("cust-slot", "กรุณาเลือกรอบจัดส่ง"); hasError = true; }
    if (!address) { SwalWarning("ยังไม่ได้ปักหมุด", "กรุณาปักหมุดแผนที่ก่อน"); hasError = true; }
    if (!pdpa) { SwalWarning("ยังไม่ได้ยอมรับ PDPA", "กรุณายอมรับนโยบายก่อน"); hasError = true; }
    if (hasError) return;

    const zoneEl = document.getElementById("cust-zone");
    const selectedZone = zoneEl?.value || "";
    const deliveryFee = cart.length > 0 && selectedZone && DELIVERY_ZONES[selectedZone]
        ? DELIVERY_ZONES[selectedZone].fee
        : 0;
    let tempCart = JSON.parse(JSON.stringify(cart));
    const itemsTotal = tempCart.reduce((s, i) => s + ((i.priceWithAddon || i.price) * i.qty), 0);
    const tempTotal = itemsTotal + deliveryFee;

    const orderSummary = tempCart.map(i => {
        const p = i.priceWithAddon || i.price;
        let line = `• <b class="text-slate-800">${i.name}</b> ×${i.qty} = ฿${(p * i.qty).toLocaleString()}`;
        if (i.addonText) line += `<br><span class="text-[10px] text-emerald-600 ml-3">↳ 🔧 ${i.addonText}</span>`;
        if (i.allergyText) line += `<br><span class="text-[10px] text-rose-500 ml-3 font-bold">↳ 🚨 แพ้อาหาร: ${i.allergyText}</span>`;
        if (i.itemNote) line += `<br><span class="text-[10px] text-slate-400 ml-3">↳ 📝 ${i.itemNote}</span>`;
        return line;
    }).join("<br><div class='my-1 border-b border-dashed border-slate-200'></div>");

    SwalBase.fire({
        title: '📋 ตรวจสอบคำสั่งซื้อ',
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
                    ⚠️ กรุณาตรวจสอบและหมายเหตุให้ถูกต้อง
                </div>
            </div>
            <div style="margin-top:14px; background:#ecfdf5; border-radius:12px; padding:10px; font-size:18px; font-weight:800; color:#15803d; border:2px solid #86efac;">
                <div style="font-size:11px; color:#475569; margin-bottom:4px; font-weight:normal;">
                    ค่าอาหาร ฿${itemsTotal.toLocaleString()} + ค่าส่ง ฿${deliveryFee}
                </div>
                💰 ยอดชำระ: ฿${tempTotal.toLocaleString()}
            </div>`,
        confirmButtonText: 'ถูกต้องและไปชำระเงิน',
        cancelButtonText: 'แก้ไขคำสั่งซื้อ',
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

function backToCart() {
    isCheckoutMode = false;
    checkoutLockedCart = [];
    checkoutTotal = 0;
    document.getElementById("qr-container").classList.add("hidden");
    document.getElementById("qr-container").style.display = "none";
    document.getElementById("checkout-btn").classList.remove("hidden");
    document.getElementById("cart-items").style.display = "";
    document.getElementById("checkout-form-container").style.display = "";
    const backBtn = document.getElementById("back-to-cart-btn");
    if (backBtn) { backBtn.style.display = "none"; backBtn.classList.add("hidden"); }
}

// ═══════════════════════════════════════════════════════════
//  8. SEND ORDER → GAS → LINE
// ═══════════════════════════════════════════════════════════
async function sendOrderToLINE() {
    // --- 0. กวาดข้อมูลเบื้องต้น ---
    const name = document.getElementById("cust-name").value.trim();
    const tel = document.getElementById("cust-tel").value.trim();
    const gpsLink = document.getElementById("cust-address").value.trim();
    const lat = document.getElementById("cust-lat").value;
    const lng = document.getElementById("cust-lng").value;
    const landmark = document.getElementById("cust-landmark").value.trim();
    const slot = document.getElementById("cust-slot").value;
    const note = document.getElementById("cust-note")?.value.trim() || "";
    const zoneEl = document.getElementById("cust-zone");
    const selectedZone = zoneEl?.value || "";
    const deliveryFee = checkoutLockedCart.length > 0 && selectedZone && DELIVERY_ZONES[selectedZone]
        ? DELIVERY_ZONES[selectedZone].fee
        : 0;
    const total = checkoutTotal;
    const cartForSend = checkoutLockedCart;

    if (cartForSend.length === 0) {
        SwalError("เกิดข้อผิดพลาด", "ไม่พบรายการสินค้าในตะกร้า");
        return;
    }

    // --- 1. เตรียมข้อมูลข้อความ ---
    const deliveryDateThai = getDeliveryDateThai();
    const targetObj = getNextDeliveryDate();
    const systemDeliveryDate = `${String(targetObj.getDate()).padStart(2, '0')}/${String(targetObj.getMonth() + 1).padStart(2, '0')}/${targetObj.getFullYear()}`;

    const orderItems = cartForSend.map(i => {
        const p = i.priceWithAddon || i.price;
        let str = `- ${i.name} ×${i.qty} = ฿${(p * i.qty).toLocaleString()}`;
        if (i.addonText) str += `\n    🔧 ${i.addonText}`;
        if (i.allergyText) str += `\n    🚨 แพ้: ${i.allergyText}`;
        if (i.itemNote) str += `\n    📝 หมายเหตุ: ${i.itemNote}`;
        return str;
    }).join("\n");

    const itemNamesForSheet = cartForSend.map(i => `${i.name} ×${i.qty}${i.addonText ? ` [${i.addonText}]` : ""}`).join(", ");

    // สร้างข้อความ "สะอาด" (ไม่มี text=)
    const lineMsg = [
        `🛒 คำสั่งซื้อใหม่ — Clean Food CR`,
        `──────────────────────`,
        `👤 ${name} | 📱 ${tel}`,
        `🕐 รอบส่ง: ${slot} (${deliveryDateThai})`,
        `📍 ${gpsLink}`,
        landmark ? `🏠 จุดสังเกต: ${landmark}` : "",
        `📦 เขตการจัดส่ง: ${DELIVERY_ZONES[selectedZone]?.name || "ไม่ระบุ"}`,
        `──────────────────────`,
        `รายการอาหาร:`,
        orderItems,
        `──────────────────────`,
        `🛵 ค่าส่ง: ฿${deliveryFee} | 💰 รวม: ฿${total.toLocaleString()}`,
        note ? `📝 หมายเหตุ: ${note}` : "",
        `──────────────────────`,
        `📎 รบกวนแนบสลิปโอนเงินด้วยนะคะ`
    ].filter(Boolean).join("\n");

    // --- 2. ขั้นตอนยืนยันชำระเงิน ---
    const confirmResult = await SwalBase.fire({
        title: '💳 ยืนยันการชำระเงิน',
        html: `
            <div style="font-size:13px; line-height:2; text-align:left">
                <div style="background:#fef9c3; border:1px solid #fde047; border-radius:12px; padding:12px 14px; margin-bottom:12px;">
                    <b style="font-size:14px;">🎯 ขั้นตอนการยืนยันชำระเงิน</b><br>
                    ✔️ ชำระเงินผ่าน QR Code สำเร็จ<br>
                    💾 บันทึกหลักฐานการโอน (สลิป) เรียบร้อย<br>
                    📲 ระบบจะนำท่านเข้าสู่แชทร้านเพื่อส่งสลิปค่ะ
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

    // --- 3. บันทึกเข้า GAS ---
    const btn = document.getElementById("submit-order-btn");
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> กำลังบันทึกคำสั่งซื้อ...`;
    btn.disabled = true;
    const zoneNameForSheet = DELIVERY_ZONES[selectedZone]?.name || "ไม่ระบุโซน";
    const fullAddress = `[${zoneNameForSheet}] ${landmark ? landmark + " | " : ""}พิกัด: ${gpsLink}`;
    try {
      await fetch(CONFIG.GAS_URL, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerName: name, 
                phone: "'" + tel,
                address: fullAddress, 
                latitude: lat, 
                longitude: lng, 
                deliverySlot: slot, 
                deliveryDate: systemDeliveryDate,
                orderDetails: itemNamesForSheet, 
                totalAmount: total, 
                note: note, 
                source: "web"
            }),
        });

        // --- 4. สำเร็จ! เปิด LINE และแสดง Popup คัดลอก ---
        const encodedMsg = encodeURIComponent(lineMsg);
        const lineOA = CONFIG.LINE_OA.replace('@','');
        const lineAppWithMsg = `line://oaMessage/@${lineOA}?text=${encodedMsg}`;
        const lineAddFriend = `https://line.me/R/ti/p/@${lineOA}`;

        // เคลียร์ตะกร้า
        cart = []; checkoutLockedCart = []; checkoutTotal = 0;
        clearLocal(); updateCartUI();
        btn.innerHTML = originalHTML; btn.disabled = false;

        // ✅ เปิด LINE ทันทีหลังจากบันทึกสำเร็จ
        window.open(lineAppWithMsg, '_blank');

        // แสดง Swal แจ้งความสำเร็จ พร้อมช่องให้คัดลอก
        await SwalBase.fire({
            title: '✅ คำสั่งซื้อบันทึกแล้ว!',
            html: `
                <div style="font-size:13px; text-align:left; line-height:1.8;">
                    <div style="background:#ecfdf5; border:1px solid #86efac; border-radius:12px; padding:12px 14px; margin-bottom:14px;">
                        <b>📋 ขั้นตอนการส่งคำสั่งซื้อ:</b><br>
                        <div style="font-size:11px; margin-top:8px; line-height:2;">
                            <div>✅ <strong style="color:#15803d;">1. คัดลอกข้อความ</strong> (ด้านล่าง)</div>
                            <div>📱 <strong>2. เปิด LINE Official Account</strong></div>
                            <div>📝 <strong>3. วางข้อความ + ส่ง</strong></div>
                        </div>
                    </div>
                    <textarea id="msg-box" readonly style="width:100%; height:120px; padding:10px; font-size:11px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc; font-family:Prompt,monospace; resize:none; color:#475569; line-height:1.4; word-wrap:break-word; overflow-y:auto;">${lineMsg}</textarea>
                    <div style="display:flex; gap:8px; margin-top:14px;">
                        <button onclick="
                            const msgBox = document.getElementById('msg-box');
                            navigator.clipboard.writeText(msgBox.value).then(function(){
                                var btn = event.target;
                                btn.innerHTML = '✅ คัดลอกแล้ว!';
                                btn.style.background = '#dcfce7';
                                btn.style.color = '#15803d';
                                btn.style.borderColor = '#86efac';
                                setTimeout(function(){
                                    btn.innerHTML = '📋 คัดลอก';
                                    btn.style.background = '#f1f5f9';
                                    btn.style.color = '#334155';
                                    btn.style.borderColor = '#e2e8f0';
                                }, 2000);
                                document.getElementById('line-open-btn').disabled = false;
                            }).catch(function(){
                                alert('ไม่สามารถคัดลอกได้ กรุณา select ทั้งหมด แล้ว copy เอง');
                            });
                        " style="flex:1; padding:12px; background:#f1f5f9; color:#334155; border:1.5px solid #e2e8f0; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s;">
                            📋 คัดลอก
                        </button>
                        <button id="line-open-btn" onclick="window.open('${lineAddFriend}', '_blank'); Swal.close();"
                            style="flex:1; padding:12px; background:#06c755; color:white; border:none; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            📱 เปิด LINE Official Account
                        </button>
                    </div>
                 
                </div>`,
            showConfirmButton: false,
            showCloseButton: true,
            width: 450,
        }).then(() => window.location.reload());

    } catch (err) {
        console.error(err);
        btn.innerHTML = originalHTML; btn.disabled = false;
        SwalError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้ กรุณาลองใหม่นะคะ");
    }
}
