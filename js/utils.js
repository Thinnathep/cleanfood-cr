// ═══════════════════════════════════════════════════════════
//  SWAL THEME
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

const SwalSuccess = (title, text) => SwalBase.fire({
    icon: 'success', title, text,
    timer: 2000, showConfirmButton: false, timerProgressBar: true,
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
function isValidThaiPhone(tel) {
    return /^0[0-9]{8,9}$/.test(tel.replace(/[-\s]/g, ""));
}
function setFieldError(id, msg) {
    const el = document.getElementById(id);
    const err = document.getElementById(id + "-err");
    if (!el) return;
    if (msg) {
        el.classList.add("border-rose-400"); el.classList.remove("border-slate-200");
        if (err) { err.innerText = msg; err.classList.remove("hidden"); }
    } else {
        el.classList.remove("border-rose-400"); el.classList.add("border-slate-200");
        if (err) err.classList.add("hidden");
    }
}
function clearFieldErrors() {
    ["cust-name", "cust-tel", "cust-slot"].forEach(id => setFieldError(id, ""));
}

// ─── วันจัดส่ง (ข้ามวันอาทิตย์ + วันหยุดใน CONFIG.HOLIDAYS) ───
function getNextDeliveryDate() {
    let d = new Date();
    d.setDate(d.getDate() + 1);
    while (true) {
        const dow = d.getDay();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        if (dow === 0 || (CONFIG.HOLIDAYS && CONFIG.HOLIDAYS.includes(dateStr))) {
            d.setDate(d.getDate() + 1);
        } else {
            break;
        }
    }
    return d;
}

function getDeliveryDateThai() {
    return getNextDeliveryDate().toLocaleDateString("th-TH", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
}
