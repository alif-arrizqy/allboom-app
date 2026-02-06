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
    const { toast } = useToast();

    React.useEffect(() => {
        if (isOpen && token) {
            loadCertificate();
        }
    }, [isOpen, token]);

    const loadCertificate = async () => {
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
    };

    const handleDownload = async () => {
        try {
            const html = await certificateService.getCertificateHTML(token);
            const element = document.createElement("a");
            const file = new Blob([html], { type: "text/html" });
            element.href = URL.createObjectURL(file);
            element.download = `sertifikat-${studentName?.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.html`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (error) {
            toast({
                title: "Error",
                description: "Gagal mendownload sertifikat",
                variant: "destructive",
            });
        }
    };

    const handleOpenInNewTab = () => {
        certificateService.openCertificateInNewTab(token);
    };

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
              quote: certificate.description,
              issuedDate: new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              }),
              validUntil: new Date(
                  certificate.yearCreated + 3,
                  11,
                  31,
              ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              }),
              verificationUrl: `${window.location.origin}/certificates/${token}`,
              imageUrl: certificate.imageUrl,
          }
        : null;

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
                                    className="gap-2 bg-white/80 backdrop-blur"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
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
