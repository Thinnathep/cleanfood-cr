// ═══════════════════════════════════════════════════════════
//  15. INIT & EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

// ผูก Event Listeners ที่ไม่มีใน HTML (inline)
document.addEventListener('DOMContentLoaded', () => {
    // 1. ช่องค้นหา (Desktop & Mobile)
    document.getElementById("search-desktop")?.addEventListener("input", e => handleSearch(e.target.value));
    document.getElementById("search-mobile")?.addEventListener("input", e => handleSearch(e.target.value));

    // 2. ปุ่ม Filter
    if(typeof gsap !== 'undefined' && typeof Flip !== 'undefined') {
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
});
