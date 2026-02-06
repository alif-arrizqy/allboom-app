import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { certificateService } from '@/services/certificate.service';
import { useToast } from '@/hooks/use-toast';

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
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
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
      const html = await certificateService.getCertificateHTML(token);
      setHtmlContent(html);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat sertifikat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([htmlContent || ''], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `sertifikat-${studentName?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleOpenInNewTab = () => {
    certificateService.openCertificateInNewTab(token);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Sertifikat Karya</DialogTitle>
          <DialogDescription>
            Sertifikat untuk {studentName} - {artworkTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat sertifikat...</span>
            </div>
          ) : (
            <>
              {htmlContent && (
                <div
                  className="border-2 border-border rounded-xl p-6 min-h-96 bg-white"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-2"
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
