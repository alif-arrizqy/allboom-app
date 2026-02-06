import React from "react";
import {
    Award,
    Calendar,
    ExternalLink,
    Palette,
    Ruler,
    Shield,
    SquarePen 
} from "lucide-react";

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

interface CertificateProps {
    data: CertificateData;
}

export const Certificate: React.FC<CertificateProps> = ({ data }) => {
    return (
        <div 
            className="certificate-container relative w-full mx-auto bg-white shadow-2xl overflow-hidden"
            style={{
                aspectRatio: '11 / 8.5', // Landscape A4 ratio
                maxWidth: '11in',
                minHeight: '8.5in'
            }}
        >
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #000 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-rose-50/30 pointer-events-none" />

            {/* Ornamental Corner Decorations */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-amber-400/40">
                <div className="absolute top-1.5 left-1.5 w-18 h-18 border-t-2 border-l-2 border-amber-300/30" />
                <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-amber-200/20" />
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-rose-400/40">
                <div className="absolute top-1.5 right-1.5 w-18 h-18 border-t-2 border-r-2 border-rose-300/30" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-rose-200/20" />
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-amber-400/40">
                <div className="absolute bottom-1.5 left-1.5 w-18 h-18 border-b-2 border-l-2 border-amber-300/30" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l border-amber-200/20" />
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-rose-400/40">
                <div className="absolute bottom-1.5 right-1.5 w-18 h-18 border-b-2 border-r-2 border-rose-300/30" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-rose-200/20" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 p-8 md:p-10 h-full flex flex-col">
                {/* Header Section */}
                <div className="text-center mb-4 flex-shrink-0">
                    {/* Logo/Icon Section */}
                    <div className="flex justify-center mb-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-rose-500 rounded-full blur-xl opacity-30 animate-pulse" />
                            <div className="relative bg-gradient-to-br from-amber-400 to-rose-500 p-3 rounded-full shadow-lg">
                                <Award className="w-10 h-10 text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 bg-clip-text text-transparent tracking-wide">
                        SERTIFIKAT KARYA SENI
                    </h1>
                    
                    {/* Subtitle */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-amber-400" />
                        <p className="text-amber-700 font-semibold text-base tracking-widest uppercase">
                            Allboom
                        </p>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-rose-300 to-rose-400" />
                    </div>
                </div>

                {/* Main Certificate Content - Landscape Layout */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 mb-4">
                    {/* Left Column - Nama Seniman & Judul */}
                    <div className="flex-1 flex flex-col">
                        {/* NAMA SENIMAN */}
                        <div className="text-center mb-4">
                            <p className="text-slate-600 text-xs mb-2 font-medium tracking-wide">
                                Dengan ini menyatakan bahwa
                            </p>
                            <div className="mb-3">
                                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">
                                    NAMA SENIMAN
                                </p>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                                    {data.recipientName}
                                </h2>
                            </div>
                            <div className="flex items-center justify-center gap-2 my-2">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
                                <Palette className="w-4 h-4 text-amber-500" />
                                <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-400" />
                            </div>
                        </div>

                        {/* JUDUL KARYA */}
                        <div className="text-center mb-4">
                            <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">
                                JUDUL KARYA
                            </p>
                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 italic">
                                "{data.artworkTitle}"
                            </h3>
                        </div>

                        {/* FOTO KARYA */}
                        {data.imageUrl && (
                            <div className="mb-4 flex-1 flex items-center justify-center">
                                <div className="relative group w-full max-w-xs mx-auto">
                                    <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider text-center">
                                        FOTO KARYA
                                    </p>
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-rose-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity" />
                                        <img 
                                            src={data.imageUrl} 
                                            alt={data.artworkTitle}
                                            className="relative rounded-lg shadow-xl w-full h-auto max-h-48 object-contain border-4 border-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Details */}
                    <div className="flex-1 flex flex-col">
                        <div className="bg-gradient-to-br from-amber-50/50 to-rose-50/50 rounded-xl p-4 border border-amber-200/30 shadow-inner flex-1 flex flex-col">
                            {/* Detail Karya */}
                            <div className="space-y-3 flex-1">
                                {/* MEDIA */}
                                <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-amber-100">
                                    <Palette className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            MEDIA
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800 break-words">{data.media}</p>
                                    </div>
                                </div>

                                {/* UKURAN KARYA */}
                                <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-rose-100">
                                    <Ruler className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            UKURAN KARYA
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {data.dimensions.includes('cm') ? data.dimensions : `${data.dimensions} cm`}
                                        </p>
                                    </div>
                                </div>

                                {/* TAHUN DIBUAT */}
                                <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-amber-100">
                                    <SquarePen  className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            TAHUN DIBUAT
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{data.year}</p>
                                    </div>
                                </div>
                                
                                {/* Tanggal terbit */}
                                <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-amber-100">
                                    <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            Tanggal Diterbitkan
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{data.issuedDate}</p>
                                    </div>
                                </div>

                                {/* DESKRIPSI */}
                                {data.description && (
                                    <div className="pt-3 border-t border-amber-200/50 flex-1">
                                        <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                                            DESKRIPSI
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed break-words">
                                            {data.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-auto pt-3 space-y-3 flex-shrink-0">
                    {/* Decorative Line */}
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-amber-400" />
                        <Shield className="w-5 h-5 text-amber-500" />
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-rose-300 to-rose-400" />
                    </div>

                    {/* Verification URL */}
                    <div className="text-center">
                        <a 
                            href={data.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors group"
                        >
                            <Shield className="w-3 h-3" />
                            <span>Verifikasi Sertifikat ID: {data.id}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Border Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400" />
        </div>
    );
};
