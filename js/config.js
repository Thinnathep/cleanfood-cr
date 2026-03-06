// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
    LINE_OA: "@282ovoyd",
    GAS_URL: "https://script.google.com/macros/s/AKfycbz0OmeBxY8Hzz4okOzOwDbssI3FNSEk7m9mb580hxdFN4xzUe8JkAQspY0i9Cse2UJ2/exec",
    CHIANG_RAI: [19.9071, 99.8310],
    // วันหยุด — ใส่วันที่ YYYY-MM-DD
    HOLIDAYS: [
        // "2026-03-05",
        // "2026-04-13",
    ],
};

// ─── DELIVERY ZONES ────────────────────────────────────────
const DELIVERY_ZONES = {
    inner_city: { name: "ในเมืองเชียงราย (ตัวเมือง)", fee: 20 },
    sankhlong_viang: { name: "เส้นกลางเวียง", fee: 40 },
    ban_du: { name: "บ้านดู่", fee: 60 },
    mae_fah_luang: { name: "แม่ฟ้าหลวง", fee: 70 },
};

const STORAGE_KEY = "CF_CR_CART_DATA";
const EXPIRY_TIME = 12 * 60 * 60 * 1000; // 12 ชั่วโมง

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

// เพิ่มไอเทมเสริมใหม่ได้ที่นี่ ↓
const ADDONS = {
    protein: {
        label: "โปรตีนหลัก", type: "radio", required: true,
        options: [
            { id: "p_chicken", label: "อกไก่", price: 0, default: true },
            // { id: "p_dory", label: "ปลาดอลลี่", price: 15 },
        ],
    },
    carbs: {
        label: "คาร์โบไฮเดรต", type: "radio", required: true,
        options: [
            { id: "c_riceberry", label: "ข้าวไรซ์เบอร์รี่", price: 0, default: true },
            // { id: "c_brown", label: "ข้าวกล้องหอมมะลิ", price: 0 },
        ],
    },
    toppings: {
        label: "ท็อปปิ้งเสริม", type: "checkbox", required: false,
        options: [
            { id: "t_egg_boil", label: "ไข่ต้ม", price: 10 },
            { id: "t_avo", label: "อะโวคาโด ½ ลูก", price: 30 },
        ],
    }
};
