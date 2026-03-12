import jsPDF from "jspdf";

export interface CertificateData {
    id: string;
    recipientName: string;
    artworkTitle: string;
    media: string;
    dimensions: string;
    year: string;
    description?: string;
    issuedDate: string;
    verificationUrl: string;
    imageUrl?: string;
}

// Helper: format text ke Title Case HANYA jika seluruh huruf alfabet-nya ALL CAPS.
// Tujuannya merapikan input yang seperti "HUSEIN IBRAHIM SHAH",
// tapi tetap menjaga case asli jika sudah rapi atau mengandung kombinasi huruf/angka (misal: "Husein-17-10C").
const toTitleCaseIfAllCaps = (value: string): string => {
    if (!value) return "";
    const hasLetter = /[A-Z]/i.test(value);
    const allAlphaCaps = hasLetter && value === value.toUpperCase();
    if (!allAlphaCaps) return value; // biarkan apa adanya

    return value
        .trim()
        .split(/\s+/)
        .map((word) => {
            if (!word) return "";
            const lower = word.toLowerCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
};

// Helper: hitung dimensi gambar agar tetap menjaga aspect ratio
// dan muat di dalam bounding box (maxWidth x maxHeight).
const getFittedImageSize = (
    img: HTMLImageElement,
    maxWidth: number,
    maxHeight: number,
): { width: number; height: number } => {
    const { width: w, height: h } = img;
    if (!w || !h) return { width: maxWidth, height: maxHeight };

    const ratio = Math.min(maxWidth / w, maxHeight / h);
    return {
        width: w * ratio,
        height: h * ratio,
    };
};

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export const generateCertificatePDF = async (
    data: CertificateData,
): Promise<Blob> => {
    // Create PDF in landscape mode, 11 x 8.5 inches
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [792, 612], // 11 x 8.5 inches in points
    });

    // Colors (matching web design)
    const amber600 = [217, 119, 6];
    const amber400 = [251, 191, 36];
    const amber200 = [253, 230, 138];
    const rose500 = [244, 63, 94];
    const rose400 = [251, 113, 133];
    const rose200 = [253, 164, 175];
    const slate900 = [15, 23, 42];
    const slate800 = [30, 41, 59];
    const slate600 = [71, 85, 105];
    const slate500 = [100, 116, 139];
    const white = [255, 255, 255];

    // === BACKGROUND ===
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 792, 612, "F");

    // Subtle dot pattern (simplified)
    doc.setFillColor(0, 0, 0);
    doc.setGState((doc as any).GState({ opacity: 0.04 }));
    for (let x = 0; x < 792; x += 40) {
        for (let y = 0; y < 612; y += 40) {
            doc.circle(x + 20, y + 20, 1, "F");
        }
    }
    doc.setGState((doc as any).GState({ opacity: 1 }));

    // === CORNER DECORATIONS ===
    // Top-left
    doc.setDrawColor(251, 191, 36); // amber400
    doc.setLineWidth(4);
    doc.line(40, 40, 110, 40); // top
    doc.line(40, 40, 40, 110); // left
    doc.setLineWidth(2);
    doc.setGState((doc as any).GState({ opacity: 0.6 }));
    doc.line(46, 46, 104, 46);
    doc.line(46, 46, 46, 104);
    doc.setGState((doc as any).GState({ opacity: 1 }));

    // Top-right
    doc.setDrawColor(251, 113, 133); // rose400
    doc.setLineWidth(4);
    doc.line(682, 40, 752, 40);
    doc.line(752, 40, 752, 110);
    doc.setLineWidth(2);
    doc.setGState((doc as any).GState({ opacity: 0.6 }));
    doc.line(688, 46, 746, 46);
    doc.line(746, 46, 746, 104);
    doc.setGState((doc as any).GState({ opacity: 1 }));

    // Bottom-left
    doc.setDrawColor(251, 191, 36); // amber400
    doc.setLineWidth(4);
    doc.line(40, 572, 110, 572);
    doc.line(40, 502, 40, 572);
    doc.setLineWidth(2);
    doc.setGState((doc as any).GState({ opacity: 0.6 }));
    doc.line(46, 566, 104, 566);
    doc.line(46, 508, 46, 566);
    doc.setGState((doc as any).GState({ opacity: 1 }));

    // Bottom-right
    doc.setDrawColor(251, 113, 133); // rose400
    doc.setLineWidth(4);
    doc.line(682, 572, 752, 572);
    doc.line(752, 502, 752, 572);
    doc.setLineWidth(2);
    doc.setGState((doc as any).GState({ opacity: 0.6 }));
    doc.line(688, 566, 746, 566);
    doc.line(746, 508, 746, 566);
    doc.setGState((doc as any).GState({ opacity: 1 }));

    // === HEADER ===
    // Title
    doc.setFontSize(34);
    doc.setTextColor(217, 119, 6); // amber600
    doc.setFont("helvetica", "bold");
    doc.text("SERTIFIKAT KARYA SENI", 396, 100, { align: "center" });

    // Subtitle with decorative lines
    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6); // amber600
    doc.text("ALLBOOM", 396, 130, { align: "center" });

    // Decorative lines
    doc.setDrawColor(253, 230, 138); // amber200
    doc.setLineWidth(1.5);
    doc.line(250, 135, 340, 135);
    doc.setDrawColor(253, 164, 175); // rose200
    doc.line(450, 135, 540, 135);

    // === MAIN CONTENT - TWO COLUMNS ===
    const leftX = 80;
    const rightX = 412;
    const topY = 170;

    // LEFT COLUMN - Artist Name & Title
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate600
    doc.setFont("helvetica", "normal");
    doc.text("DENGAN INI MENYATAKAN BAHWA", 240, topY, { align: "center" });

    const leftColCenterX = 246; // center of left column (80 to 412)

    // Artist Name Label
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate500
    doc.setFont("helvetica", "bold");
    doc.text("NAMA SENIMAN", leftColCenterX, topY + 25, { align: "center" });

    // Artist Name - multi-line, fixed but lebih kecil & aman, max width 280pt
    const nameMaxWidth = 280;
    const formattedName = toTitleCaseIfAllCaps(data.recipientName);
    const nameLines = doc.splitTextToSize(formattedName, nameMaxWidth);
    const nameFontSize = 20; // sedikit lebih kecil agar tidak bertabrakan
    doc.setFontSize(nameFontSize);
    doc.setTextColor(15, 23, 42); // slate900
    doc.setFont("helvetica", "bold");
    const nameLineHeight = nameFontSize * 1.25;
    nameLines.forEach((line: string, i: number) => {
        doc.text(line, leftColCenterX, topY + 48 + i * nameLineHeight, {
            align: "center",
        });
    });
    const nameBlockBottom = topY + 48 + nameLines.length * nameLineHeight;

    // Decorative palette icon (simplified as lines)
    const decorY = nameBlockBottom + 12;
    doc.setDrawColor(251, 191, 36); // amber400
    doc.setLineWidth(1.5);
    doc.line(166, decorY, 206, decorY);
    doc.setDrawColor(251, 113, 133); // rose400
    doc.line(286, decorY, 326, decorY);

    // Artwork Title Label
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate500
    doc.setFont("helvetica", "bold");
    doc.text("JUDUL KARYA", leftColCenterX, decorY + 22, { align: "center" });

    // Artwork Title - multi-line, fixed font size yang lebih kecil
    const titleMaxWidth = 280;
    const formattedTitle = toTitleCaseIfAllCaps(data.artworkTitle);

    // Aturan khusus:
    // - Jika judul punya lebih dari 3 kata, paksa pecah menjadi 2 baris:
    //   baris 1: semua kata kecuali kata terakhir
    //   baris 2: kata terakhir saja
    //   Contoh: "Karya Sketsa Nirmana Husein Ibrahim Shah"
    //   -> "Karya Sketsa Nirmana Husein Ibrahim"
    //      "Shah"
    let titleLines: string[];
    const words = formattedTitle.trim().split(/\s+/);
    if (words.length > 3) {
        const firstLine = words.slice(0, words.length - 1).join(" ");
        const lastWord = words[words.length - 1];
        titleLines = [`"${firstLine}`, `${lastWord}"`];
    } else {
        const titleText = `"${formattedTitle}"`;
        titleLines = doc.splitTextToSize(titleText, titleMaxWidth);
    }
    const titleFontSize = 16; // lebih kecil agar tetap rapi untuk judul panjang
    doc.setFontSize(titleFontSize);
    doc.setTextColor(30, 41, 59); // slate800
    doc.setFont("helvetica", "bolditalic");
    const titleLineHeight = titleFontSize * 1.25;
    titleLines.forEach((line: string, i: number) => {
        doc.text(line, leftColCenterX, decorY + 42 + i * titleLineHeight, {
            align: "center",
        });
    });
    const titleBlockBottom = decorY + 42 + titleLines.length * titleLineHeight;

    // Image (if exists)
    if (data.imageUrl) {
        try {
            const imageLabelY = titleBlockBottom + 18;
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139); // slate500
            doc.setFont("helvetica", "bold");
            doc.text("FOTO KARYA", leftColCenterX, imageLabelY, { align: "center" });

            const imageData = await loadImageAsBase64(data.imageUrl);
            const frameX = leftX + 25;
            const frameY = imageLabelY + 10;
            const frameW = 250;
            const frameH = 160;

            // Frame border
            doc.setDrawColor(251, 191, 36); // amber400
            doc.setLineWidth(2);
            doc.rect(frameX, frameY, frameW, frameH);

            // Hitung dimensi gambar dengan aspect ratio asli di dalam frame
            const imgEl = new Image();
            imgEl.src = imageData;
            await new Promise((resolve, reject) => {
                imgEl.onload = () => resolve(null);
                imgEl.onerror = reject;
            });
            const fitted = getFittedImageSize(imgEl, frameW - 10, frameH - 10);
            const imgX = frameX + (frameW - fitted.width) / 2;
            const imgY = frameY + (frameH - fitted.height) / 2;

            // Image (tidak di-crop, hanya di-scale mempertahankan proporsi)
            doc.addImage(
                imageData,
                "JPEG",
                imgX,
                imgY,
                fitted.width,
                fitted.height,
                undefined,
                "FAST",
            );
        } catch (e) {
            console.error("Failed to load image:", e);
        }
    }

    // RIGHT COLUMN - Details Panel
    // Background panel
    doc.setFillColor(255, 251, 235); // amber-50
    doc.setGState((doc as any).GState({ opacity: 0.5 }));
    doc.roundedRect(rightX, topY, 300, 280, 15, 15, "F");
    doc.setGState((doc as any).GState({ opacity: 1 }));
    doc.setDrawColor(254, 243, 199);
    doc.setLineWidth(1);
    doc.roundedRect(rightX, topY, 300, 280, 15, 15, "S");

    // Helper function for detail rows
    const drawDetailRow = (
        label: string,
        value: string,
        y: number,
        borderR: number,
        borderG: number,
        borderB: number,
    ) => {
        // Box
        doc.setFillColor(255, 255, 255);
        doc.setGState((doc as any).GState({ opacity: 0.6 }));
        doc.roundedRect(rightX + 15, y, 270, 45, 8, 8, "F");
        doc.setGState((doc as any).GState({ opacity: 1 }));

        // Left accent line
        doc.setDrawColor(borderR, borderG, borderB);
        doc.setLineWidth(2);
        doc.line(rightX + 15, y, rightX + 15, y + 45);

        // Label
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105); // slate600
        doc.setFont("helvetica", "bold");
        doc.text(label, rightX + 45, y + 15);

        // Value
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); // slate900
        doc.setFont("helvetica", "normal");
        doc.text(value, rightX + 45, y + 32, { maxWidth: 240 });
    };

    // Details
    drawDetailRow("MEDIA", data.media.toUpperCase(), topY + 15, 217, 119, 6);
    drawDetailRow(
        "UKURAN KARYA",
        data.dimensions.includes("cm")
            ? data.dimensions
            : `${data.dimensions} cm`,
        topY + 70,
        244,
        63,
        94,
    );
    drawDetailRow("TAHUN DIBUAT", data.year, topY + 125, 217, 119, 6);
    drawDetailRow(
        "TANGGAL DITERBITKAN",
        data.issuedDate,
        topY + 180,
        217,
        119,
        6,
    );

    // Description (deskripsi karya siswa, if exists)
    if (data.description) {
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // slate600
        doc.setFont("helvetica", "bold");
        doc.text("DESKRIPSI", rightX + 15, topY + 245);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate500
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(data.description, 270);
        const maxDescLines = 5;
        doc.text(descLines.slice(0, maxDescLines), rightX + 15, topY + 260);
    }

    // === FOOTER ===
    const footerY = 530;

    // Decorative lines
    doc.setDrawColor(253, 230, 138); // amber200
    doc.setLineWidth(1.5);
    doc.line(80, footerY, 370, footerY);
    doc.setDrawColor(253, 164, 175); // rose200
    doc.line(422, footerY, 712, footerY);

    // Verification text
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate600
    doc.setFont("helvetica", "bold");
    doc.text(`Verifikasi Sertifikat ID: ${data.id}`, 396, footerY + 15, {
        align: "center",
    });

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate500
    doc.setFont("helvetica", "normal");
    doc.text(data.verificationUrl, 396, footerY + 28, { align: "center" });

    // Bottom accent bar
    doc.setFillColor(217, 119, 6); // amber600
    doc.rect(0, 604, 792, 8, "F");

    // Return as Blob
    return doc.output("blob");
};
