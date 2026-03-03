
// 1. CLOCK & CONFIG
const PROMPTPAY_NUMBER = "0962386554"; // ⚠️ เปลี่ยนเป็นเบอร์พร้อมเพย์ของบัญชี G
const LINE_OA_ID = "@282ovoyd"; // ⚠️ ใส่ LINE OA ของร้าน (เช่น @cleanfood_cr)

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('datetime-display').innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleDateString('th-TH', options)}`;
    document.getElementById('year').innerText = now.getFullYear();
}
setInterval(updateDateTime, 1000);
updateDateTime();

// 2. DATA (เมนูจริงจากร้าน Clean Food Chiang Rai)
const menuData = [

    {
        id: 101, // ตั้ง ID ใหม่ให้ไม่ซ้ำเดิม
        category: 'chicken',
        name: 'อกไก่นุ่ม', // ชื่อเมนูจริง สอดคล้องกับรูปอกไก่
        price: 119,
        badge: '🔥 เมนูแนะนำ', // นี่คือส่วน "ไฮไลท์" จะขึ้นแถบสีแดงที่รูป
        image: 'Img/DSC04962.JPG', // ลิงก์รูปภาพที่สอดคล้องกับ image_1.png
        desc: 'อกไก่คัดพิเศษหมักสมุนไพรเชียงราย ย่างจนนุ่มหอม เสิร์ฟคู่กับผักหลากหลายชนิดและข้าวไรซ์เบอร์รี่',
        kcal: 310,
        macros: { pro: 40, carb: 10, fat: 5 },
        ingredients: ['อกไก่', 'ข้าวไรซ์เบอร์รี่', 'บร็อคโคลี่', 'หน่อไม้ฝรั่ง', 'แครอท', 'ฟักทอง', 'พริกหยวกย่าง', 'ไข่ต้ม']
    },
    {
        id: 102,
        category: 'chicken', // แก้ไขหมวดหมู่จาก fish เป็น chicken
        name: 'อกไก่นุ่มหมักพริกไทยดำ', // แก้ไขชื่อเมนูจากแซลมอนเป็นอกไก่
        price: 139, // ปรับราคาให้เหมาะสมกับเมนูอกไก่
        badge: '✨ ขายดีที่สุด', // ไฮไลท์เมนูเด็ด
        image: 'Img/DSC04968.JPG', // ลิงก์รูปภาพที่สอดคล้องกับ image_2.png
        desc: 'อกไก่ชิ้นโตหมักพริกไทยดำจนเข้าเนื้อ เสิร์ฟพร้อมผักสด ผักนึ่ง และไข่ต้ม',
        kcal: 330, // ปรับค่าแคลอรี่ให้เหมาะสมกับเมนูอกไก่
        macros: { pro: 40, carb: 12, fat: 6 }, // ปรับค่าโปรตีน คาร์โบไฮเดรต และไขมัน
        ingredients: ['อกไก่', 'ข้าวไรซ์เบอร์รี่', 'บร็อคโคลี่', 'เห็ดเข็มทอง', 'แครอท', 'ฟักทอง', 'ไข่ต้ม'] // แก้ไขวัตถุดิบตามรูป
    }

];

let cart = [];
let currentModalItem = null;
let tempQty = 1;

// 3. OPTIMIZED RENDER & SEARCH
function renderMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    menuData.forEach((item) => {
        const card = document.createElement('div');
        card.className = `menu-card menu-item bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col h-full`;
        card.setAttribute('data-category', item.category);
        card.setAttribute('data-name', item.name.toLowerCase());
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        card.innerHTML = `
                    <div class="relative h-48 bg-slate-100 rounded-2xl overflow-hidden mb-4 transform translate-z-0">
                        <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md z-10"><i class="fa-solid fa-fire text-amber-400"></i> ${item.kcal}</div>
                        ${item.badge ? `<div class="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">${item.badge}</div>` : ''}
                        <img src="${item.image}" class="food-img w-full h-full object-cover" loading="lazy">
                    </div>
                    <div class="flex-grow">
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${item.name}</h3>
                        <p class="text-xs text-slate-500 line-clamp-2 mb-3">${item.desc}</p>
                    </div>
                    <div class="flex justify-between items-end mt-auto pt-3 border-t border-slate-50">
                        <span class="text-xl font-bold text-emerald-600">฿${item.price}</span>
                        <button onclick="openModal(${item.id}); event.stopPropagation();" class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-500 hover:text-white transition-colors flex justify-center items-center">
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                `;

        card.addEventListener('click', () => openModal(item.id));
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
    gsap.to('.menu-card', { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.1 });
}

// 🛠️ Smart Search Logic
document.getElementById('search-desktop').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.menu-item').forEach(item => {
        const name = item.getAttribute('data-name');
        if (name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    // รีเซ็ตปุ่มหมวดหมู่กลับไปที่ 'ทั้งหมด'
    document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('bg-slate-800', 'text-white'); b.classList.add('bg-white', 'text-slate-600'); });
    document.querySelector('[data-filter="all"]').classList.add('bg-slate-800', 'text-white');
    document.querySelector('[data-filter="all"]').classList.remove('bg-white', 'text-slate-600');
});

// 4. MODAL LOGIC (รวม Modal แบบผูกปิ่นโต)
function openModal(id) {
    currentModalItem = menuData.find(i => i.id === id);
    tempQty = 1; document.getElementById('modal-qty').innerText = tempQty;

    document.getElementById('modal-img').src = currentModalItem.image;
    document.getElementById('modal-badge').innerText = currentModalItem.badge || 'Clean Food';
    document.getElementById('modal-title').innerText = currentModalItem.name;
    document.getElementById('modal-price').innerText = `฿${currentModalItem.price}`;
    document.getElementById('modal-desc').innerText = currentModalItem.desc;

    // เปิดโชว์โภชนาการสำหรับเมนูปกติ
    document.getElementById('nutrition-box').style.display = 'block';
    document.getElementById('modal-kcal').innerText = currentModalItem.kcal;
    document.getElementById('modal-pro').innerText = `${currentModalItem.macros.pro}g`;
    document.getElementById('modal-carb').innerText = `${currentModalItem.macros.carb}g`;
    document.getElementById('modal-fat').innerText = `${currentModalItem.macros.fat}g`;

    document.getElementById('ingredients-title').innerHTML = '<i class="fa-solid fa-basket-wheat text-emerald-500"></i> ส่วนประกอบหลัก:';
    const tagsHtml = currentModalItem.ingredients.map(ing => `<span class="bg-emerald-50 text-emerald-700 text-[11px] px-2 py-1 rounded-md border border-emerald-100">${ing}</span>`).join('');
    document.getElementById('modal-ingredients').innerHTML = tagsHtml;

    gsap.set('.progress-bar-fill', { width: 0 });

    const container = document.getElementById('modal-container');
    container.classList.remove('hidden');
    gsap.to('#modal-backdrop', { opacity: 1, duration: 0.3 });
    gsap.to('#modal-content', { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.2)" });

    setTimeout(() => {
        document.getElementById('bar-pro').style.width = `${Math.min((currentModalItem.macros.pro / 60) * 100, 100)}%`;
        document.getElementById('bar-carb').style.width = `${Math.min((currentModalItem.macros.carb / 60) * 100, 100)}%`;
        document.getElementById('bar-fat').style.width = `${Math.min((currentModalItem.macros.fat / 60) * 100, 100)}%`;
    }, 200);

    document.body.style.overflow = 'hidden';
}

// // 🛠️ Pinto Modal Logic
// function openSubscriptionModal() {
//     currentModalItem = {
//         id: 'SUB_WEEKLY',
//         name: 'แพ็กเกจผูกปิ่นโต 10 มื้อ',
//         price: 1290,
//         image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
//         desc: 'จัดส่งอาหารคลีนสดใหม่ให้ถึงบ้าน 2 รอบ/สัปดาห์ (วันจันทร์ และ พุธ) รอบละ 5 มื้อ ช่วยให้คุณคุมน้ำหนักและประหยัดค่าส่งไปได้เต็มๆ'
//     };
//     tempQty = 1; document.getElementById('modal-qty').innerText = tempQty;

//     document.getElementById('modal-img').src = currentModalItem.image;
//     document.getElementById('modal-badge').innerText = '🔥 Hot Deal';
//     document.getElementById('modal-title').innerText = currentModalItem.name;
//     document.getElementById('modal-price').innerText = `฿${currentModalItem.price}`;
//     document.getElementById('modal-desc').innerText = currentModalItem.desc;

//     // ปิดโชว์โภชนาการ
//     document.getElementById('nutrition-box').style.display = 'none';
//     document.getElementById('ingredients-title').innerHTML = '<i class="fa-solid fa-truck-fast text-emerald-500"></i> เงื่อนไขการจัดส่ง:';
//     document.getElementById('modal-ingredients').innerHTML = `
//                 <ul class="text-sm text-slate-600 list-disc pl-4 space-y-1">
//                     <li>จัดส่งฟรีภายในตัวเมืองเชียงราย</li>
//                     <li>จัดส่งทุกเช้าวันจันทร์ และ วันพุธ</li>
//                     <li>เมนูจะคละให้ตามโภชนาการที่เหมาะสม</li>
//                 </ul>
//             `;

//     const container = document.getElementById('modal-container');
//     container.classList.remove('hidden');
//     gsap.to('#modal-backdrop', { opacity: 1, duration: 0.3 });
//     gsap.to('#modal-content', { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.2)" });
//     document.body.style.overflow = 'hidden';
// }

function closeModal() {
    gsap.to('#modal-content', { opacity: 0, scale: 0.95, duration: 0.2, ease: "power2.in" });
    gsap.to('#modal-backdrop', {
        opacity: 0, duration: 0.2, onComplete: () => {
            document.getElementById('modal-container').classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('modal-container').classList.contains('hidden')) closeModal();
});

// 5. CART & CHECKOUT
function updateQty(change) {
    tempQty = Math.max(1, tempQty + change);
    document.getElementById('modal-qty').innerText = tempQty;
    document.getElementById('modal-price').innerText = `฿${currentModalItem.price * tempQty}`;
}

function confirmAddToCart() {
    pushToCart({ ...currentModalItem, qty: tempQty });
    closeModal();
}

function pushToCart(newItem) {
    const existing = cart.find(i => i.id === newItem.id);
    if (existing) existing.qty += newItem.qty;
    else cart.push(newItem);

    updateCartUI();

    // Notification
    document.getElementById('toast-msg').innerText = `เพิ่ม "${newItem.name}" ลงตะกร้าแล้ว`;
    gsap.to('#toast', { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" });
    setTimeout(() => gsap.to('#toast', { y: 20, opacity: 0, duration: 0.4 }), 2500);
}

// 🛠️ Cart Editor (+/- ในตะกร้า และ Confirm Delete)
function editCartQty(index, change) {
    const newQty = cart[index].qty + change;
    if (newQty <= 0) {
        if (confirm("ยืนยันการลบเมนูนี้ออกจากตะกร้า?")) {
            removeCartItem(index);
        }
    } else {
        cart[index].qty = newQty;
        updateCartUI();
    }
}

function removeCartItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const badge = document.getElementById('cart-count');
    const formContainer = document.getElementById('checkout-form-container');

    cartItemsContainer.innerHTML = '';
    let total = 0; let totalQty = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="text-center text-slate-400 mt-10"><i class="fa-solid fa-box-open text-4xl mb-3 opacity-50"></i><br>ตะกร้าว่างเปล่า ลองเลือกเมนูสุขภาพสิ!</div>';
        checkoutBtn.disabled = true; checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        formContainer.classList.add('hidden');
        document.getElementById('qr-container').classList.add('hidden');
        document.getElementById('qr-container').style.display = 'none';
        document.getElementById('checkout-btn').classList.remove('hidden');
    } else {
        checkoutBtn.disabled = false; checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        formContainer.classList.remove('hidden');

        cart.forEach((item, index) => {
            total += (item.price * item.qty);
            totalQty += item.qty;
            cartItemsContainer.innerHTML += `
                        <div class="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                            <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover">
                            <div class="flex-grow">
                                <h4 class="font-bold text-slate-800 text-sm leading-tight line-clamp-1">${item.name}</h4>
                                <div class="text-emerald-600 font-bold text-sm mt-1">฿${item.price}</div>
                            </div>
                            <div class="flex items-center bg-slate-50 rounded-lg px-1 py-1 border border-slate-100">
                                <button onclick="editCartQty(${index}, -1)" class="w-6 h-6 text-slate-500 hover:text-rose-500 flex items-center justify-center"><i class="fa-solid fa-minus text-[10px]"></i></button>
                                <span class="w-6 text-center font-bold text-slate-700 text-xs">${item.qty}</span>
                                <button onclick="editCartQty(${index}, 1)" class="w-6 h-6 text-slate-500 hover:text-emerald-500 flex items-center justify-center"><i class="fa-solid fa-plus text-[10px]"></i></button>
                            </div>
                            <button onclick="if(confirm('ยืนยันการลบ?')) removeCartItem(${index})" class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors ml-1"><i class="fa-solid fa-trash text-xs"></i></button>
                        </div>
                    `;
        });
    }

    totalDisplay.innerText = `฿${total.toLocaleString()}`;
    badge.innerText = totalQty;
    gsap.fromTo(badge, { scale: 1.5 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
}

function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => overlay.classList.add('hidden') });
        document.body.style.overflow = '';
    } else {
        overlay.classList.remove('hidden');
        gsap.to(overlay, { opacity: 1, duration: 0.3 });
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

// 🛠️ Generate QR & Form Validation
function generateQR() {
    const name = document.getElementById('cust-name').value;
    const tel = document.getElementById('cust-tel').value;
    const address = document.getElementById('cust-address').value;
    const slot = document.getElementById('cust-slot').value;
    const pdpa = document.getElementById('pdpa-consent').checked;

    if (!name || !tel || !address || !slot) {
        alert("กรุณากรอกข้อมูลจัดส่งให้ครบถ้วนค่ะ!");
        return;
    }
    if (!pdpa) {
        alert("กรุณายอมรับนโยบายข้อมูลส่วนบุคคล (PDPA) ก่อนดำเนินการต่อค่ะ!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (total <= 0) return;

    const qrUrl = `https://promptpay.io/${PROMPTPAY_NUMBER}/${total}.png`;
    document.getElementById('promptpay-qr').src = qrUrl;
    document.getElementById('qr-container').classList.remove('hidden');
    document.getElementById('qr-container').style.display = 'flex';
    document.getElementById('checkout-btn').classList.add('hidden');

    // ซ่อนฟอร์มและตะกร้าเพื่อให้ลูกค้าโฟกัสที่การจ่ายเงิน
    document.getElementById('cart-items').style.display = 'none';
    document.getElementById('checkout-form-container').style.display = 'none';
}

// 🛠️ LINE Order Routing
async function sendOrderToLINE() {
    const name = document.getElementById('cust-name').value;
    const tel = document.getElementById('cust-tel').value;
    const address = document.getElementById('cust-address').value;
    const slot = document.getElementById('cust-slot').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderItems = cart.map(item => `- ${item.name} x${item.qty}`).join('\n');

    // ตรวจสอบความครบถ้วนก่อนส่ง
    if (!name || !tel || !address || !slot) {
        alert("กรุณากรอกข้อมูลจัดส่งให้ครบถ้วนนะคะ G!");
        return;
    }

    // 1. เตรียมข้อมูลส่งไป Google Sheets (JSON Payload)
    const payload = {
        customerName: name,
        phone: tel,
        address: address,
        deliverySlot: slot,
        orderDetails: orderItems,
        totalAmount: total
    };

    // แสดงสถานะการทำงานบนปุ่ม
    const btn = document.querySelector('button[onclick="sendOrderToLINE()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกออเดอร์...';
    btn.disabled = true;

    // 2. ยิงข้อมูลไปที่ Google Apps Script URL ของ G
    const GAS_URL = "https://script.google.com/macros/s/AKfycbxwG10UD8EvNWGlH3wClNF245nmmi52Fhx_PD_50kI90wIuo-unnkOKGq2uP70G4-rY/exec";

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // สำคัญ: เพื่อให้ส่งข้ามโดเมนได้โดยไม่ติด Error
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 3. เตรียมข้อความสำหรับ LINE
        let message = `🛒 *New Order!*\n`;
        message += `-------------------\n`;
        message += `ชื่อ: ${name}\n`;
        message += `โทร: ${tel}\n`;
        message += `รอบส่ง: ${slot}\n`;
        message += `ที่อยู่: ${address}\n`;
        message += `-------------------\n`;
        message += `*รายการอาหาร:*\n${orderItems}\n`;
        message += `-------------------\n`;
        message += `💰 *ยอดชำระ: ฿${total}*\n\n`;
        message += `(ลูกค้าโอนแล้ว รอแนบสลิปด้านล่างนี้ได้เลยครับ 👇)`;

        // 4. เด้งไปเปิดแอป LINE
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
        window.open(lineUrl, '_blank');

        // 5. Reset ระบบหลังส่งออเดอร์
        cart = [];
        document.getElementById('cust-name').value = '';
        document.getElementById('cust-tel').value = '';
        document.getElementById('cust-address').value = '';
        document.getElementById('cust-slot').value = '';
        document.getElementById('pdpa-consent').checked = false;

        document.getElementById('qr-container').classList.add('hidden');
        document.getElementById('checkout-btn').classList.remove('hidden');
        document.getElementById('cart-items').style.display = 'flex';
        document.getElementById('checkout-form-container').style.display = 'block';

        updateCartUI();
        toggleCart();
        
        alert("บันทึกออเดอร์ลง Google Sheet เรียบร้อยแล้วค่ะ!");

    } catch (error) {
        console.error('Error:', error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่นะคะ");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 6. FILTERING (GSAP Flip)
gsap.registerPlugin(Flip);
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('bg-slate-800', 'text-white'); b.classList.add('bg-white', 'text-slate-600'); });
        e.target.classList.remove('bg-white', 'text-slate-600'); e.target.classList.add('bg-slate-800', 'text-white');

        // เคลียร์ช่องค้นหาเมื่อกดปุ่มหมวดหมู่
        document.getElementById('search-desktop').value = '';

        const filter = e.target.getAttribute('data-filter');
        const state = Flip.getState('.menu-item');

        document.querySelectorAll('.menu-item').forEach(item => {
            if (filter === 'all' || item.getAttribute('data-category') === filter) item.style.display = 'flex';
            else item.style.display = 'none';
        });

        Flip.from(state, { duration: 0.3, ease: "power1.inOut", scale: true });
    });
});

// Initialize
renderMenu();

// 🛠️ PDPA Modal Logic
function openPDPAModal() {
    const modal = document.getElementById('pdpa-modal');
    const content = document.getElementById('pdpa-content');
    modal.classList.remove('hidden');

    // ใช้ Timeout สั้นๆ เพื่อให้ transition ทำงานหลังจากลบ class hidden
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closePDPAModal() {
    const modal = document.getElementById('pdpa-modal');
    const content = document.getElementById('pdpa-content');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300); // รอให้ transition จบก่อนซ่อน
}

