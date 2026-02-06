import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink } from "lucide-react";
import {
    certificateService,
    type CertificateData as ServiceCertificateData,
} from "@/services/certificate.service";
import { useToast } from "@/hooks/use-toast";
import {
    Certificate,
    type CertificateData,
} from "@/components/certificate/Certificate";
import { generateCertificatePDF } from "@/components/certificate/PDFKitGenerator";

interface CertificateViewProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    token: string;
    studentName: string;
    artworkTitle: string;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
    isOpen,
    onOpenChange,
    token,
    studentName,
    artworkTitle,
}) => {
    const [certificate, setCertificate] =
        useState<ServiceCertificateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const { toast } = useToast();

    const loadCertificate = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await certificateService.getCertificateData(token);
            if (response.success && response.data) {
                setCertificate(response.data);
            } else {
                throw new Error("Data tidak ditemukan");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Gagal memuat sertifikat",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    React.useEffect(() => {
        if (isOpen && token) {
            loadCertificate();
        }
    }, [isOpen, token, loadCertificate]);

    const certificateData: CertificateData | null = certificate
        ? {
              id: certificate.token,
              recipientName: certificate.studentName,
              artworkTitle: certificate.artworkTitle,
              media: certificate.mediaTypeName || "Mixed Media",
              dimensions: certificate.artworkSize
                  ? `${certificate.artworkSize} cm`
                  : "-",
              year: certificate.yearCreated.toString(),
              description: certificate.description,
              issuedDate: new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              }),
              verificationUrl: `${window.location.origin}/certificates/${token}`,
              imageUrl: certificate.imageUrl,
          }
        : null;

    const handleDownload = async () => {
        if (!certificateData) return;

        try {
            setDownloading(true);

            // Generate the PDF blob using PDFKit
            const blob = await generateCertificatePDF(certificateData);

            // Create target filename
            const filename = `sertifikat-${studentName?.toLowerCase().replace(/\s+/g, "-")}-${token.substring(0, 8)}.pdf`;

            // Download the blob
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "Berhasil",
                description: "Sertifikat berhasil didownload sebagai PDF",
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "Error",
                description: "Gagal mendownload sertifikat",
                variant: "destructive",
            });
        } finally {
            setDownloading(false);
        }
    };

    const handleOpenInNewTab = () => {
        certificateService.openCertificateInNewTab(token);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>Sertifikat Karya</DialogTitle>
                    <DialogDescription>
                        Sertifikat untuk {studentName} - {artworkTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur rounded-2xl">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                            <span className="text-muted-foreground font-medium">
                                Menyiapkan sertifikat...
                            </span>
                        </div>
                    ) : (
                        <>
                            {certificateData && (
                                <div className="scale-[0.9] sm:scale-100 origin-top">
                                    <Certificate data={certificateData} />
                                </div>
                            )}

                            <div className="flex gap-3 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="gap-2 bg-white/80 backdrop-blur"
                                >
                                    {downloading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleOpenInNewTab}
                                    variant="gradient"
                                    className="gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Buka di Tab Baru
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
