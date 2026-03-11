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
            className="certificate-container relative w-full mx-auto bg-white shadow-2xl overflow-hidden min-w-0 md:aspect-[11/8.5]"
            style={{
                maxWidth: '11in',
                minHeight: 'min(80vh, 28rem)',
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

            {/* Ornamental Corner Decorations - smaller on mobile */}
            <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 border-t-2 border-l-2 md:border-t-4 md:border-l-4 border-amber-400/40">
                <div className="absolute top-1 left-1 w-6 h-6 md:top-1.5 md:left-1.5 md:w-12 md:h-12 border-t border-l border-amber-300/30" />
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 border-t-2 border-r-2 md:border-t-4 md:border-r-4 border-rose-400/40">
                <div className="absolute top-1 right-1 w-6 h-6 md:top-1.5 md:right-1.5 md:w-12 md:h-12 border-t border-r border-rose-300/30" />
            </div>
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 border-b-2 border-l-2 md:border-b-4 md:border-l-4 border-amber-400/40">
                <div className="absolute bottom-1 left-1 w-6 h-6 md:bottom-1.5 md:left-1.5 md:w-12 md:h-12 border-b border-l border-amber-300/30" />
            </div>
            <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 border-b-2 border-r-2 md:border-b-4 md:border-r-4 border-rose-400/40">
                <div className="absolute bottom-1 right-1 w-6 h-6 md:bottom-1.5 md:right-1.5 md:w-12 md:h-12 border-b border-r border-rose-300/30" />
            </div>

            {/* Main Content - compact on mobile */}
            <div className="relative z-10 p-3 sm:p-5 md:p-8 lg:p-10 h-full flex flex-col min-h-0 min-w-0">
                {/* Header Section */}
                <div className="text-center mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
                    {/* Logo/Icon Section */}
                    <div className="flex justify-center mb-1.5 sm:mb-2 md:mb-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-rose-500 rounded-full blur-xl opacity-30 animate-pulse" />
                            <div className="relative bg-gradient-to-br from-amber-400 to-rose-500 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg">
                                <Award className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 bg-clip-text text-transparent tracking-wide px-1">
                        SERTIFIKAT KARYA SENI
                    </h1>
                    
                    {/* Subtitle */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="h-px flex-1 min-w-0 bg-gradient-to-r from-transparent via-amber-300 to-amber-400" />
                        <p className="text-amber-700 font-semibold text-xs sm:text-sm md:text-base tracking-widest uppercase flex-shrink-0">
                            Allboom
                        </p>
                        <div className="h-px flex-1 min-w-0 bg-gradient-to-l from-transparent via-rose-300 to-rose-400" />
                    </div>
                </div>

                {/* Main Certificate Content - single column on mobile, two on desktop */}
                <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4 min-h-0 min-w-0 overflow-auto">
                    {/* Left Column - Nama Seniman & Judul */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* NAMA SENIMAN */}
                        <div className="text-center mb-2 sm:mb-3 md:mb-4 min-w-0">
                            <p className="text-slate-600 text-[10px] sm:text-xs mb-1 sm:mb-2 font-medium tracking-wide">
                                Dengan ini menyatakan bahwa
                            </p>
                            <div className="mb-2 sm:mb-3 px-1 sm:px-2">
                                <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1 font-semibold uppercase tracking-wider">
                                    NAMA SENIMAN
                                </p>
                                <h2
                                    className="font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight break-words hyphens-auto"
                                    style={{
                                        fontSize: data.recipientName.length > 30 ? "clamp(0.75rem, 2.5vw + 0.5rem, 1.75rem)" : "clamp(0.95rem, 3vw + 0.5rem, 1.875rem)",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {data.recipientName}
                                </h2>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-1.5 sm:my-2">
                                <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-amber-400" />
                                <Palette className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                                <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-rose-400" />
                            </div>
                        </div>

                        {/* JUDUL KARYA */}
                        <div className="text-center mb-2 sm:mb-3 md:mb-4 min-w-0 px-1 sm:px-2">
                            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1 font-semibold uppercase tracking-wider">
                                JUDUL KARYA
                            </p>
                            <h3
                                className="font-bold text-slate-800 italic break-words hyphens-auto"
                                style={{
                                    fontSize: data.artworkTitle.length > 40 ? "clamp(0.65rem, 2vw + 0.5rem, 1.25rem)" : "clamp(0.8rem, 2.5vw + 0.5rem, 1.5rem)",
                                    lineHeight: 1.35,
                                }}
                            >
                                &quot;{data.artworkTitle}&quot;
                            </h3>
                        </div>

                        {/* FOTO KARYA */}
                        {data.imageUrl && (
                            <div className="mb-2 sm:mb-3 md:mb-4 flex-shrink-0 flex items-center justify-center">
                                <div className="relative group w-full max-w-[200px] sm:max-w-xs mx-auto">
                                    <p className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2 font-semibold uppercase tracking-wider text-center">
                                        FOTO KARYA
                                    </p>
                                    <div className="relative">
                                        <div className="absolute -inset-0.5 sm:-inset-1 bg-gradient-to-r from-amber-400 to-rose-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity" />
                                        <img 
                                            src={data.imageUrl} 
                                            alt={data.artworkTitle}
                                            className="relative rounded-lg shadow-xl w-full h-auto max-h-32 sm:max-h-40 md:max-h-48 object-contain border-2 sm:border-4 border-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Details */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="bg-gradient-to-br from-amber-50/50 to-rose-50/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-amber-200/30 shadow-inner flex-1 flex flex-col min-h-0">
                            {/* Detail Karya */}
                            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 flex-1 min-w-0">
                                {/* MEDIA */}
                                <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 bg-white/60 rounded-md sm:rounded-lg border border-amber-100">
                                    <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            MEDIA
                                        </p>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words">{data.media}</p>
                                    </div>
                                </div>

                                {/* UKURAN KARYA */}
                                <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 bg-white/60 rounded-md sm:rounded-lg border border-rose-100">
                                    <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            UKURAN KARYA
                                        </p>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words">
                                            {data.dimensions.includes('cm') ? data.dimensions : `${data.dimensions} cm`}
                                        </p>
                                    </div>
                                </div>

                                {/* TAHUN DIBUAT */}
                                <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 bg-white/60 rounded-md sm:rounded-lg border border-amber-100">
                                    <SquarePen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            TAHUN DIBUAT
                                        </p>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-800">{data.year}</p>
                                    </div>
                                </div>
                                
                                {/* Tanggal terbit */}
                                <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 bg-white/60 rounded-md sm:rounded-lg border border-amber-100">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
                                            Tanggal Diterbitkan
                                        </p>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words">{data.issuedDate}</p>
                                    </div>
                                </div>

                                {/* DESKRIPSI */}
                                {data.description && (
                                    <div className="pt-2 sm:pt-3 border-t border-amber-200/50 flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2 font-semibold uppercase tracking-wider">
                                            DESKRIPSI
                                        </p>
                                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words line-clamp-4 sm:line-clamp-none">
                                            {data.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-auto pt-2 sm:pt-3 space-y-2 sm:space-y-3 flex-shrink-0">
                    {/* Decorative Line */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
                        <div className="h-px flex-1 min-w-0 bg-gradient-to-r from-transparent via-amber-300 to-amber-400" />
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                        <div className="h-px flex-1 min-w-0 bg-gradient-to-l from-transparent via-rose-300 to-rose-400" />
                    </div>

                    {/* Verification URL */}
                    <div className="text-center min-w-0 px-1">
                        <a 
                            href={data.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500 hover:text-amber-600 transition-colors group break-all"
                        >
                            <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="break-all">Verifikasi Sertifikat ID: {data.id}</span>
                            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Border Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400" />
        </div>
    );
};
