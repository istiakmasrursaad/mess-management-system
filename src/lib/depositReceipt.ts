import jsPDF from "jspdf";

// Converts numbers to English words (Bangladeshi currency format: Crore, Lakh, Thousand, Hundred, etc.)
export function numberToWords(num: number): string {
  if (isNaN(num)) return "Zero Taka Only";
  const isNegative = num < 0;
  let n = Math.abs(Math.round(num));

  if (n === 0) return "Zero Taka Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertChunk(val: number): string {
    let str = "";
    if (val >= 100) {
      str += ones[Math.floor(val / 100)] + " Hundred ";
      val %= 100;
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + " ";
      val %= 10;
    }
    if (val > 0) {
      str += ones[val] + " ";
    }
    return str.trim();
  }

  let words = "";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  if (crore > 0) {
    words += convertChunk(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertChunk(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertChunk(thousand) + " Thousand ";
  }
  if (hundred > 0) {
    words += convertChunk(hundred) + " ";
  }

  return (isNegative ? "Minus " : "") + words.trim() + " Taka Only";
}

// Format Date as dd-mm-yyyy
export function formatReceiptDate(dateVal: any): string {
  if (!dateVal) return "--";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "--";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Convert "MM-YYYY" to Current & Previous Month labels like "October'2026"
export function getMonthLabels(monthYear: string): { currentMonthLabel: string; prevMonthLabel: string } {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  let mNum = new Date().getMonth() + 1;
  let yNum = new Date().getFullYear();

  if (monthYear && monthYear.includes("-")) {
    const [mStr, yStr] = monthYear.split("-");
    mNum = parseInt(mStr, 10) || mNum;
    yNum = parseInt(yStr, 10) || yNum;
  }

  const currentMonthLabel = `${monthNames[mNum - 1]}'${yNum}`;

  let prevMNum = mNum - 1;
  let prevYNum = yNum;
  if (prevMNum < 1) {
    prevMNum = 12;
    prevYNum -= 1;
  }
  const prevMonthLabel = `${monthNames[prevMNum - 1]}'${prevYNum}`;

  return { currentMonthLabel, prevMonthLabel };
}

// Cached faint watermark logo base64 (rendered via canvas with opacity = 0.12)
let cachedWatermarkBase64: string | null = null;

async function getWatermarkLogoBase64(): Promise<string | null> {
  if (cachedWatermarkBase64) return cachedWatermarkBase64;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          // Faint, elegant watermark transparency
          ctx.globalAlpha = 0.12;
          ctx.drawImage(img, 0, 0);
          cachedWatermarkBase64 = canvas.toDataURL("image/png");
          resolve(cachedWatermarkBase64);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = "/icons/icon-192x192.png";
    } catch {
      resolve(null);
    }
  });
}

export interface DepositMemberData {
  member: {
    id: string;
    user: {
      name: string;
      phone?: string | null;
    };
    deposits?: Array<{
      id: string;
      amount: number;
      date: string | Date;
      note?: string | null;
    }>;
  };
  totalDeposits: number;
  previousDue: number;
  previousAdvance: number;
}

export interface FormattedReceiptData {
  memberName: string;
  currentMonthLabel: string;
  prevMonthLabel: string;
  due: number;
  advance: number;
  deposits: Array<{ id: string; amount: number; dateStr: string }>;
  totalBalance: number;
  inWords: string;
  presentYear: number;
}

export function getDepositReceiptFormattedData(
  memberData: DepositMemberData,
  monthYear: string
): FormattedReceiptData {
  const { currentMonthLabel, prevMonthLabel } = getMonthLabels(monthYear);
  const memberName = memberData.member?.user?.name || "Member";
  const due = memberData.previousDue || 0;
  const advance = memberData.previousAdvance || 0;
  const rawDeposits = memberData.member?.deposits || [];
  const deposits = rawDeposits.map((dep) => ({
    id: dep.id,
    amount: dep.amount,
    dateStr: formatReceiptDate(dep.date),
  }));
  const totalDepositAmount = memberData.totalDeposits || 0;
  const totalBalance = totalDepositAmount + advance - due;
  const inWords = numberToWords(totalBalance);
  const presentYear = new Date().getFullYear();

  return {
    memberName,
    currentMonthLabel,
    prevMonthLabel,
    due,
    advance,
    deposits,
    totalBalance,
    inWords,
    presentYear,
  };
}

export async function buildDepositReceiptDoc(
  memberData: DepositMemberData,
  monthYear: string
): Promise<{ doc: jsPDF; filename: string; formatted: FormattedReceiptData }> {
  const formatted = getDepositReceiptFormattedData(memberData, monthYear);
  const {
    memberName,
    currentMonthLabel,
    prevMonthLabel,
    due,
    advance,
    deposits,
    totalBalance,
    inWords,
    presentYear,
  } = formatted;

  // Load faint watermark logo for the background
  const watermarkBase64 = await getWatermarkLogoBase64();

  // Page dimensions: Landscape receipt slip (width 190mm, height dynamically calculated)
  const pageWidth = 190;
  const depositItemCount = Math.max(1, deposits.length);
  const baseHeight = 88;
  const calculatedHeight = baseHeight + (depositItemCount * 5.5) + (inWords.length > 60 ? 5 : 0);
  const pageHeight = Math.max(98, Math.ceil(calculatedHeight));

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageHeight, pageWidth],
  });

  const actualWidth = doc.internal.pageSize.getWidth();
  const actualHeight = doc.internal.pageSize.getHeight();

  const marginX = 10;
  const centerX = actualWidth / 2;
  const rightX = actualWidth - marginX;
  const leftX = marginX;
  const contentWidth = actualWidth - marginX * 2;

  // Outer Border (margin 4mm from page edges)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(4, 4, actualWidth - 8, actualHeight - 8);

  // Watermark Logo right in the middle of the page (large, faint)
  if (watermarkBase64) {
    const watermarkSize = 58; // 58mm x 58mm prominent watermark in the center
    const wmX = (actualWidth - watermarkSize) / 2;
    const wmY = (actualHeight - watermarkSize) / 2;
    doc.addImage(watermarkBase64, "PNG", wmX, wmY, watermarkSize, watermarkSize);
  }

  // 1. Header (Centered, 13pt bold)
  let currentY = 13;
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text("MOSJID-E-NUR COMPLEX", centerX, currentY, { align: "center" });

  currentY += 6;
  doc.text("Mess (2nd Floor & Parts of 1st and 3rd Floors)", centerX, currentY, { align: "center" });

  currentY += 5.5;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text("Terokhadia, Cantonment Road, Rajshahi.", centerX, currentY, { align: "center" });

  // 2. Month: current_month'year (Right aligned under header, 12pt)
  currentY += 6;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(`Month: ${currentMonthLabel}`, rightX, currentY, { align: "right" });

  // 3. Name (12pt, left)
  currentY += 5.5;
  doc.text(`Name: ${memberName}`, leftX, currentY);

  // 4. Due(Previous_month_name'year): Left, Amount: Right
  currentY += 5.5;
  doc.text(`Due(${prevMonthLabel}):`, leftX, currentY);
  doc.text(`${due > 0 ? due : 0} tk`, rightX, currentY, { align: "right" });

  // 5. Advance(Previous_month_name'year): Left, Amount: Right
  currentY += 5.5;
  doc.text(`Advance(${prevMonthLabel}):`, leftX, currentY);
  doc.text(`${advance > 0 ? advance : 0} tk`, rightX, currentY, { align: "right" });

  // 6. Deposit Details
  currentY += 5.5;
  doc.text("Deposit Details:", leftX, currentY);

  // Deposits list: Date on left, Amount on right
  currentY += 5.5;
  if (deposits.length === 0) {
    doc.text("   1. Date: --", leftX, currentY);
    doc.text("0 tk", rightX, currentY, { align: "right" });
    currentY += 5.5;
  } else {
    deposits.forEach((dep, index) => {
      const dateStr = `   ${index + 1}. Date:${dep.dateStr}`;
      const amountStr = `${dep.amount} tk`;
      doc.text(dateStr, leftX, currentY);
      doc.text(amountStr, rightX, currentY, { align: "right" });
      currentY += 5.5;
    });
  }

  // 7. Total Balance: Left, Amount: Right
  currentY += 1;
  doc.text("Total Balance:", leftX, currentY);
  doc.text(`${totalBalance} tk`, rightX, currentY, { align: "right" });

  // 8. In Words:
  currentY += 5.5;
  const inWordsLines = doc.splitTextToSize(`In Words: ${inWords}`, contentWidth);
  doc.text(inWordsLines, leftX, currentY);
  currentY += inWordsLines.length * 5;

  // 9. Footer Notice (Italic 12pt, Centered)
  currentY += 6;
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.text("This is a system-generated receipt and does not require a signature", centerX, currentY, { align: "center" });

  // 10. Present_year@softTech (12pt, Centered)
  currentY += 5;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(`${presentYear}@softTech`, centerX, currentY, { align: "center" });

  const sanitizedName = memberName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Deposit_Receipt_${sanitizedName}_${monthYear}.pdf`;

  return { doc, filename, formatted };
}

// Download PDF directly
export async function generateDepositReceiptPDF(
  memberData: DepositMemberData,
  monthYear: string
) {
  const { doc, filename } = await buildDepositReceiptDoc(memberData, monthYear);
  doc.save(filename);
}

// Create an in-memory File for Web Share API
export async function getDepositReceiptPdfFile(
  memberData: DepositMemberData,
  monthYear: string
): Promise<File> {
  const { doc, filename } = await buildDepositReceiptDoc(memberData, monthYear);
  const blob = doc.output("blob");
  return new File([blob], filename, { type: "application/pdf" });
}
