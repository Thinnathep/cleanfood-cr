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
    if (!query) { SwalWarning("ยังไม่ได้กรอก", "กรุณากรอกรหัสคำสั่งซื้อหรือหมายเลขโทรศัพท์ก่อนนะคะ"); return; }
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
            resultEl.innerHTML = `<div class="text-2xl mb-2">🔍</div><p class="font-semibold text-sm">ไม่พบคำสั่งซื้อนี้</p><p class="text-xs mt-1 text-slate-400">ตรวจสอบรหัสคำสั่งซื้อหรือหมายเลขโทรศัพท์อีกครั้ง</p>`;
        }
    } catch {
        resultEl.innerHTML = `<div class="text-2xl mb-2">⚠️</div><p class="text-sm">ไม่สามารถเชื่อมต่อได้ในขณะนี้</p>`;
    }
}
