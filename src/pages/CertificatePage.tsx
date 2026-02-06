import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft, Share2 } from "lucide-react";
import {
    certificateService,
    type CertificateData as ServiceCertificateData,
} from "@/services/certificate.service";
import { useToast } from "@/hooks/use-toast";
import {
    Certificate,
    type CertificateData,
} from "@/components/certificate/Certificate";
import html2pdf from "html2pdf.js";

export const CertificatePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const certificateRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [certificate, setCertificate] =
        useState<ServiceCertificateData | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (token) {
            loadCertificate();
        } else {
            navigate("/");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const loadCertificate = async () => {
        try {
            setLoading(true);
            const response = await certificateService.getCertificateData(
                token!,
            );
            if (response.success && response.data) {
                setCertificate(response.data);
            } else {
                throw new Error("Data sertifikat tidak ditemukan");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Gagal memuat sertifikat",
                variant: "destructive",
            });
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const handleDownload = async () => {
        const certificateElement = certificateRef.current;
        if (!certificateElement) return;

        try {
            setDownloading(true);

            // Configure PDF options for landscape A4
            const opt: any = {
                margin: [0.3, 0.3, 0.3, 0.3],
                filename: `sertifikat-${token}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true
                },
                jsPDF: { 
                    unit: 'in', 
                    format: [11, 8.5], // Landscape A4
                    orientation: 'landscape'
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // Generate and download PDF
            await html2pdf().set(opt).from(certificateElement).save();

            toast({
                title: "Berhasil",
                description: "Sertifikat berhasil didownload sebagai PDF",
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "Error",
                description: "Gagal mendownload PDF. Silakan coba lagi.",
                variant: "destructive",
            });
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Sertifikat Karya",
                    text: `Lihat sertifikat karya ${certificate?.studentName} - ${certificate?.artworkTitle}`,
                    url,
                });
                toast({
                    title: "Berhasil",
                    description: "Link berhasil dibagikan",
                });
            } catch (err) {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(url);
            toast({
                title: "Berhasil",
                description: "Link disalin ke clipboard",
            });
        }
    };

    const getVerificationUrl = () => {
        const base = window.location.origin;
        return `${base}/certificates/${token}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Memuat sertifikat...
                    </p>
                </div>
            </div>
        );
    }

    if (!certificate) return null;

    const certificateData: CertificateData = {
        id: certificate.token,
        recipientName: certificate.studentName,
        artworkTitle: certificate.artworkTitle,
        media: certificate.mediaTypeName || "Mixed Media",
        dimensions: certificate.artworkSize
            ? certificate.artworkSize.toString()
            : "-",
        year: certificate.yearCreated.toString(),
        description: certificate.description,
        issuedDate: formatDate(new Date()),
        verificationUrl: getVerificationUrl(),
        imageUrl: certificate.imageUrl,
    };

    return (
        <div
            className="min-h-screen py-8 px-4"
            style={{
                background:
                    "linear-gradient(135deg, hsl(40 33% 97%) 0%, hsl(174 62% 95%) 50%, hsl(12 90% 96%) 100%)",
            }}
        >
            {/* Decorative background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative max-w-5xl mx-auto mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-2 mb-4 hover:bg-white/80"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Button>
            </div>

            {/* Certificate Container */}
            <div className="relative w-full max-w-[11in] mx-auto" ref={certificateRef}>
                <Certificate data={certificateData} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-center mt-8 flex-wrap">
                <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="gap-2"
                >
                    {downloading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mendownload PDF...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download PDF
                        </>
                    )}
                </Button>
                <Button
                    variant="gradient"
                    onClick={handleShare}
                    className="gap-2"
                >
                    <Share2 className="w-4 h-4" />
                    Bagikan
                </Button>
            </div>

            {/* Info */}
            <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
                <p className="text-sm text-muted-foreground mb-2">
                    <strong>Tips:</strong> Klik Download PDF untuk menyimpan
                    sertifikat sebagai PDF. Setiap sertifikat memiliki ID unik
                    yang dapat diverifikasi.
                </p>
            </div>
        </div>
    );
};

export default CertificatePage;
