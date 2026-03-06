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
        if(typeof checkFormValidity === 'function') checkFormValidity();
    };
    marker.on("dragend", updateCoords);
    map.on("click", e => { marker.setLatLng(e.latlng); updateCoords(); });
    updateCoords();
}
