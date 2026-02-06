import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft, Share2, Printer } from 'lucide-react';
import { certificateService, type CertificateData } from '@/services/certificate.service';
import { useToast } from '@/hooks/use-toast';

export const CertificatePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (token) {
      loadCertificate();
    } else {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      const response = await certificateService.getCertificateData(token!);
      if (response.success && response.data) {
        setCertificate(response.data);
      } else {
        throw new Error('Data sertifikat tidak ditemukan');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat sertifikat',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=1200,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Sertifikat ${certificate?.token}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
            body { font-family: 'Nunito', sans-serif; margin: 0; padding: 24px; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const html = await certificateService.getCertificateHTML(token!);
      const element = document.createElement('a');
      const file = new Blob([html], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = `sertifikat-${token}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      toast({
        title: 'Berhasil',
        description: 'File berhasil didownload',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mendownload file',
        variant: 'destructive',
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
          title: 'Sertifikat Karya',
          text: `Lihat sertifikat karya ${certificate?.studentName} - ${certificate?.artworkTitle}`,
          url,
        });
        toast({ title: 'Berhasil', description: 'Link berhasil dibagikan' });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Berhasil', description: 'Link disalin ke clipboard' });
    }
  };

  const getVerificationUrl = () => {
    const base = window.location.origin;
    return `${base}/certificates/${token}`;
  };

  const expiryDate = certificate
    ? new Date(certificate.yearCreated + 3, 11, 31)
    : new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat sertifikat...</p>
        </div>
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-primary/5 to-secondary/5 py-8 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </div>

      {/* Certificate - Dicoding-style design */}
      <div className="max-w-4xl mx-auto" ref={certificateRef}>
        <div
          className="relative bg-white rounded-sm overflow-hidden shadow-2xl border-[3px] border-[#0f172a]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Top ribbon - right */}
          <div className="absolute top-0 right-0 w-48 md:w-56 h-24 md:h-28 bg-[#0f172a] flex flex-col items-center justify-center px-4 transform translate-x-8 translate-y-4 rotate-12 shadow-lg">
            <span className="text-white text-xs md:text-sm font-bold uppercase tracking-wider text-center leading-tight">
              Sertifikat Pameris
            </span>
            <span className="text-white/80 text-[10px] md:text-xs mt-1">Allboom</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[700px]">
            {/* Main content - left */}
            <div className="lg:col-span-8 p-8 md:p-12 lg:pl-16 lg:pr-12 flex flex-col justify-center order-2 lg:order-1">
              {/* ID badge */}
              <div className="inline-flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded mb-8 w-fit">
                <span className="text-xs font-medium uppercase tracking-wider opacity-90">ID</span>
                <span className="font-mono font-bold text-sm tracking-wider">{certificate.token}</span>
              </div>

              <p className="text-slate-500 text-sm mb-1">Diberikan kepada</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0d9488] mb-6">
                {certificate.studentName}
              </h2>

              <p className="text-slate-500 text-sm mb-1">Atas karyanya pada</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#0d9488] mb-8">
                {certificate.artworkTitle}
              </h3>

              <div className="space-y-2 text-slate-600 text-sm mb-8">
                {certificate.mediaTypeName && (
                  <p>
                    <span className="font-medium text-slate-700">Media:</span> {certificate.mediaTypeName}
                  </p>
                )}
                {certificate.artworkSize && (
                  <p>
                    <span className="font-medium text-slate-700">Ukuran:</span> {certificate.artworkSize} cm
                  </p>
                )}
                <p>
                  <span className="font-medium text-slate-700">Tahun:</span> {certificate.yearCreated}
                </p>
              </div>

              {certificate.description && (
                <p className="text-slate-600 text-sm italic border-l-2 border-primary/30 pl-4 mb-8">
                  &quot;{certificate.description}&quot;
                </p>
              )}

              <p className="text-slate-500 text-sm">
                Diterbitkan pada {formatDate(new Date())}
              </p>

              {/* Signature area */}
              <div className="mt-12 pt-8 border-t border-slate-200">
                <p className="font-semibold text-slate-800">Allboom</p>
                <p className="text-sm text-slate-500">Platform E-Portfolio Seni</p>
              </div>
            </div>

            {/* Right side - artwork + verification */}
            <div className="lg:col-span-4 p-6 md:p-8 bg-slate-50/80 border-l border-slate-200 flex flex-col order-1 lg:order-2">
              {/* Artwork image */}
              {certificate.imageUrl ? (
                <div className="rounded-xl overflow-hidden shadow-lg mb-6 aspect-square">
                  <img
                    src={certificate.imageUrl}
                    alt={certificate.artworkTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-slate-200 aspect-square flex items-center justify-center mb-6">
                  <span className="text-slate-400 text-sm">Gambar karya</span>
                </div>
              )}

              {/* Verification section */}
              <div className="mt-auto space-y-4">
                <p className="text-sm font-semibold text-slate-700">Verifikasi Sertifikat</p>
                <p className="text-xs text-slate-600 break-all font-mono">
                  {getVerificationUrl()}
                </p>
                <p className="text-xs text-slate-500">
                  Berlaku hingga {formatDate(expiryDate)}
                </p>
              </div>
            </div>
          </div>
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
                Mendownload...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </Button>
          <Button variant="gradient" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Bagikan
          </Button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Tips:</strong> Klik Print / Save PDF untuk menyimpan sertifikat sebagai PDF. Setiap sertifikat memiliki ID unik yang dapat diverifikasi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificatePage;
