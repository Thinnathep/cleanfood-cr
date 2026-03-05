// ═══════════════════════════════════════════════════════════
//  Clean Food Chiang Rai · Google Apps Script
//  Version 2.0 — ปรับปรุงโครงสร้าง + ค้นหาคำสั่งซื้อ + LINE notify
// ═══════════════════════════════════════════════════════════

// ─── CONFIG ────────────────────────────────────────────────
var SHEET_NAME   = "Orders";
var LINE_TOKEN   = ""; // ← ใส่ LINE Notify Token ถ้ามี (optional)
var SHOP_NAME    = "Clean Food Chiang Rai";

// คอลัมน์ใน Sheet (ตรงตามลำดับนี้เป๊ะ)
var COLUMNS = [
  "OrderID",        // A  รหัสคำสั่งซื้อ อัตโนมัติ
  "Timestamp",      // B  วันเวลาที่สั่ง
  "CustomerName",   // C  ชื่อลูกค้า
  "Phone",          // D  หมายเลขโทรศัพท์
  "DeliverySlot",   // E  รอบส่ง
  "DeliveryDate",   // F  วันที่ส่ง (อัตโนมัติ = วันถัดไป)
  "Address",        // G  ที่อยู่ + พิกัด
  "Latitude",       // H  latitude
  "Longitude",      // I  longitude
  "OrderDetails",   // J  รายการอาหาร
  "TotalAmount",    // K  ยอดรวม
  "Note",           // L  หมายเหตุจากลูกค้า
  "Source",         // M  ช่องทางสั่ง (web / grab / etc.)
  "PaymentStatus",  // N  สถานะการชำระ
  "KitchenStatus",  // O  สถานะครัว
  "DeliveryStatus", // P  สถานะการส่ง
  "Rider",          // Q  ชื่อไรเดอร์
  "UpdatedAt",      // R  อัปเดตล่าสุด
];

// ═══════════════════════════════════════════════════════════
//  doPost — รับคำสั่งซื้อใหม่
// ═══════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss);

    var data  = JSON.parse(e.postData.contents);

    var now       = new Date();


    var orderId      = "CF-" + Utilities.formatDate(now, "GMT+7", "yyMMddHHmmss");
    var timestamp    = Utilities.formatDate(now,      "GMT+7", "dd/MM/yyyy HH:mm:ss");
    
    // 🟢 สั่งให้ดึงค่าวันที่ ที่หน้าเว็บคำนวณเสร็จแล้วมาใช้ตรงๆ!
    var deliveryDate = data.deliveryDate || "";

    // เตรียมข้อมูลตามลำดับ COLUMNS (ต้องตรงทุก index)
    // A=OrderID, B=Timestamp, C=CustomerName, D=Phone, E=DeliverySlot,
    // F=DeliveryDate, G=Address, H=Latitude, I=Longitude, J=OrderDetails,
    // K=TotalAmount, L=Note, M=Source, N=PaymentStatus, O=KitchenStatus,
    // P=DeliveryStatus, Q=Rider, R=UpdatedAt
    var row = [
      orderId,                        // A - OrderID
      timestamp,                      // B - Timestamp
      data.customerName  || "",       // C - CustomerName
      data.phone         || "",       // D - Phone
      data.deliverySlot  || "",       // E - DeliverySlot
      deliveryDate,                   // F - DeliveryDate (auto = วันถัดไป)
      data.address       || "",       // G - Address (landmark + google maps link)
      data.latitude      || "",       // H - Latitude
      data.longitude     || "",       // I - Longitude
      data.orderDetails  || "",       // J - OrderDetails
      data.totalAmount   || 0,        // K - TotalAmount
      data.note          || "",       // L - Note
      data.source        || "web",    // M - Source
      "รอตรวจสลิป",                  // N - PaymentStatus
      "รอยืนยัน",                    // O - KitchenStatus
      "รอส่ง",                        // P - DeliveryStatus
      "",                             // Q - Rider
      timestamp,                      // R - UpdatedAt
    ];

    sheet.appendRow(row);

    // Auto-format row ใหม่
    var lastRow = sheet.getLastRow();
    formatNewRow(sheet, lastRow);

    // LINE Notify (optional)
    if (LINE_TOKEN) {
      sendLineNotify(data, orderId, deliveryDate);
    }

    return jsonResponse({ status: "success", orderId: orderId, deliveryDate: deliveryDate });

  } catch (err) {
    Logger.log("doPost error: " + err.toString());
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ═══════════════════════════════════════════════════════════
//  doGet — ค้นหาคำสั่งซื้อ (สำหรับ Order Tracker หน้าเว็บ)
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  try {
    var action = e.parameter.action || "";
    var query  = (e.parameter.query  || "").trim();

    if (action === "search" && query) {
      var order = findOrder(query);
      if (order) {
        return jsonResponse({ status: "found", order: order });
      } else {
        return jsonResponse({ status: "notfound" });
      }
    }

    // Health check
    return jsonResponse({ status: "ok", service: SHOP_NAME });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

// ─── ค้นหาคำสั่งซื้อด้วย OrderID หรือ Phone ─────────────────
function findOrder(query) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return null;

  var data  = sheet.getDataRange().getValues();
  query     = query.toLowerCase().trim();

  for (var i = data.length - 1; i >= 1; i--) {  // วนจากล่างขึ้น (ล่าสุดก่อน)
    var orderId = String(data[i][0]).toLowerCase();
    var phone   = String(data[i][3]).toLowerCase().replace(/[^0-9]/g, "");
    var qPhone  = query.replace(/[^0-9]/g, "");

    if (orderId === query || (qPhone && phone === qPhone)) {
      return {
        orderId:       data[i][0],
        timestamp:     data[i][1],
        customerName:  data[i][2],
        phone:         data[i][3],
        deliverySlot:  data[i][4],
        deliveryDate:  data[i][5],
        address:       data[i][6],
        orderDetails:  data[i][9],
        totalAmount:   data[i][10],
        note:          data[i][11],
        paymentStatus: data[i][13],
        kitchenStatus: data[i][14],
        deliveryStatus:data[i][15],
      };
    }
  }
  return null;
}

// ─── สร้าง Sheet ถ้ายังไม่มี + ใส่ Header ──────────────────
function getOrCreateSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupSheetHeaders(sheet);
  }
  // ตรวจว่า Header row มีครบไหม
  var firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell || firstCell === "") {
    setupSheetHeaders(sheet);
  }
  return sheet;
}

// ─── ตั้งค่า Header Row ─────────────────────────────────────
function setupSheetHeaders(sheet) {
  // ใส่ header
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);

  // Styling header
  var headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
  headerRange.setBackground("#064e3b");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 40);

  // กำหนดความกว้างคอลัมน์
  var widths = [160, 145, 120, 110, 120, 100, 220, 80, 80, 240, 90, 150, 80, 120, 120, 100, 100, 145];
  widths.forEach(function(w, i) {
    sheet.setColumnWidth(i + 1, w);
  });

  // Freeze header row
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  // Named range สำหรับ dropdown validation
  setupDropdowns(sheet);

  Logger.log("Headers setup complete.");
}

// ─── Dropdown Validation สำหรับ Status columns ─────────────
function setupDropdowns(sheet) {
  // PaymentStatus (N = col 14)
  var paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["รอตรวจสลิป", "ยืนยันแล้ว", "ยกเลิก"], true)
    .build();
  sheet.getRange(2, 14, 1000, 1).setDataValidation(paymentRule);

  // KitchenStatus (O = col 15)
  var kitchenRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["รอยืนยัน", "กำลังเตรียม", "เสร็จแล้ว"], true)
    .build();
  sheet.getRange(2, 15, 1000, 1).setDataValidation(kitchenRule);

  // DeliveryStatus (P = col 16)
  var deliveryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["รอส่ง", "กำลังส่ง", "ส่งสำเร็จ", "ลูกค้ายกเลิก"], true)
    .build();
  sheet.getRange(2, 16, 1000, 1).setDataValidation(deliveryRule);
}

// ─── Format row ใหม่ (สีพื้นหลัง zebra) ────────────────────
function formatNewRow(sheet, rowNum) {
  var bg    = rowNum % 2 === 0 ? "#f0fdf4" : "#ffffff";
  var range = sheet.getRange(rowNum, 1, 1, COLUMNS.length);
  range.setBackground(bg);
  range.setVerticalAlignment("middle");
  sheet.setRowHeight(rowNum, 36);

  // Highlight status cells
  sheet.getRange(rowNum, 14).setBackground("#fef3c7").setFontWeight("bold"); // PaymentStatus
  sheet.getRange(rowNum, 15).setBackground("#e0f2fe").setFontWeight("bold"); // KitchenStatus
  sheet.getRange(rowNum, 16).setBackground("#f0f9ff").setFontWeight("bold"); // DeliveryStatus
}

// ─── LINE Notify ─────────────────────────────────────────────
function sendLineNotify(data, orderId, deliveryDate) {
  try {
    var msg = [
      "",
      "🛒 คำสั่งซื้อใหม่! — " + SHOP_NAME,
      "ID: " + orderId,
      "👤 " + data.customerName + " (" + data.phone + ")",
      "🕐 " + data.deliverySlot + " | 📅 ส่ง " + deliveryDate,
      "📦 " + data.orderDetails,
      "💰 ฿" + Number(data.totalAmount).toLocaleString(),
      data.note ? "📝 หมายเหตุ: " + data.note : "",
    ].filter(Boolean).join("\n");

    UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
      method:  "post",
      headers: { Authorization: "Bearer " + LINE_TOKEN },
      payload: { message: msg },
    });
  } catch (err) {
    Logger.log("LINE Notify error: " + err.toString());
  }
}

// ─── JSON Response helper ─────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════
//  TRIGGER: Auto-update UpdatedAt เมื่อ Status เปลี่ยน
// ═══════════════════════════════════════════════════════════
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  var col = e.range.getColumn();
  var row = e.range.getRow();
  if (row <= 1) return; // skip header

  // ถ้าแก้ไข status column (N, O, P = 14, 15, 16) → update UpdatedAt (R = 18)
  if (col >= 14 && col <= 16) {
    var now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    sheet.getRange(row, 18).setValue(now);

    // Color-code status
    var val = e.range.getValue();
    var colorMap = {
      "รอตรวจสลิป":  "#fef3c7",
      "ยืนยันแล้ว":  "#d1fae5",
      "ยกเลิก":      "#fee2e2",
      "รอยืนยัน":    "#e0f2fe",
      "กำลังเตรียม": "#bfdbfe",
      "เสร็จแล้ว":   "#bbf7d0",
      "รอส่ง":       "#f1f5f9",
      "กำลังส่ง":    "#bfdbfe",
      "ส่งสำเร็จ":   "#bbf7d0",
      "ลูกค้ายกเลิก": "#fee2e2",
    };
    if (colorMap[val]) {
      e.range.setBackground(colorMap[val]);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  MANUAL SETUP — รันครั้งแรกเพื่อ setup Sheet
//  ไปที่ Apps Script Editor → เลือก setupNewSheet → Run
// ═══════════════════════════════════════════════════════════
function setupNewSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss);
  SpreadsheetApp.getUi().alert("✅ ตั้งค่า Sheet เรียบร้อย!\n\nคอลัมน์ที่มีทั้งหมด:\n" + COLUMNS.join(", "));
}