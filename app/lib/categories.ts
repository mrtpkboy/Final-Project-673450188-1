// สีประจำหมวดหมู่ (ใช้ทั้งชิปในรายการและแท่งสรุป)
export const CATEGORY_COLORS: Record<string, string> = {
  อาหาร: "#e07a2f",
  เดินทาง: "#2f7fe0",
  ที่พัก: "#7b5cc4",
  ช้อปปิ้ง: "#d6447f",
  สุขภาพ: "#1f8a5b",
  บันเทิง: "#c9a100",
  อื่นๆ: "#6b7785",
};
export const colorOf = (c: string) => CATEGORY_COLORS[c] ?? "#6b7785";
