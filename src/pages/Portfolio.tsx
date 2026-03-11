import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FrontendUser } from "@/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Image, Grid, List, Award, Calendar, Tag, User as UserIcon, Palette } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { portfolioService } from "@/services/portfolio.service";
import { useToast } from "@/hooks/use-toast";
import type { Portfolio } from "@/types/api";

// Helper function to get optimized image URL with fallback
const getPortfolioImageUrl = (
  portfolio: Portfolio | null,
  type: 'thumbnail' | 'medium' | 'full' = 'full'
): string => {
  if (!portfolio) return '';
  
  switch (type) {
    case 'thumbnail':
      return portfolio.imageThumbnail || portfolio.imageMedium || portfolio.imageUrl;
    case 'medium':
      return portfolio.imageMedium || portfolio.imageUrl;
    case 'full':
    default:
      return portfolio.imageUrl;
  }
};

const Portfolio = () => {
  const { user } = useOutletContext<{ user: FrontendUser }>();
  const { toast } = useToast();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState("Semua");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedWork, setSelectedWork] = useState<Portfolio | null>(null);
  const [mediaTypes, setMediaTypes] = useState<string[]>(["Semua"]);
  const [classes, setClasses] = useState<string[]>(["Semua"]);

  const isStudent = user.role === "student";

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setLoading(true);
        const response = await portfolioService.getPortfolios({
          page: 1,
          limit: 100,
          search: searchQuery || undefined,
        });
        if (response.success && response.data) {
          // Response structure: { items: Portfolio[], pagination: {...} }
          let portfoliosData: Portfolio[] = [];
          if (Array.isArray(response.data)) {
            portfoliosData = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            portfoliosData = response.data.items;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            portfoliosData = response.data.data;
          }
          
          setPortfolios(portfoliosData);
          // Extract unique media types
          const uniqueMediaTypes = ["Semua", ...Array.from(new Set(
            portfoliosData
              .map(p => p.assignment?.mediaType?.name || p.mediaType?.name)
              .filter(Boolean)
          ))];
          setMediaTypes(uniqueMediaTypes);
          // Extract unique classes from students
          const uniqueClasses = ["Semua", ...Array.from(new Set(
            portfoliosData
              .map(p => p.student?.className)
              .filter(Boolean)
          )).sort()];
          setClasses(uniqueClasses);
        }
      } catch (error) {
        console.error("Error fetching portfolios:", error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal memuat portfolio";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, [searchQuery, toast]);

  const filteredPortfolios = portfolios
    .filter((portfolio) => {
      const matchesSearch = portfolio.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           portfolio.student?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const portfolioMediaType = portfolio.assignment?.mediaType?.name || portfolio.mediaType?.name;
      const matchesMediaType = selectedMediaType === "Semua" || portfolioMediaType === selectedMediaType;
      const matchesClass = selectedClass === "Semua" || portfolio.student?.className === selectedClass;
      return matchesSearch && matchesMediaType && matchesClass;
    })
    .sort((a, b) => {
      const gradeA = typeof a.grade === 'number' ? a.grade : parseInt(a.grade as string) || 0;
      const gradeB = typeof b.grade === 'number' ? b.grade : parseInt(b.grade as string) || 0;
      return gradeB - gradeA;
    });

  const getGradeColor = (grade: number | string) => {
    const gradeNum = typeof grade === 'number' ? grade : parseInt(grade);
    if (gradeNum >= 90) return "bg-green text-white";
    if (gradeNum >= 80) return "bg-secondary text-white";
    if (gradeNum >= 70) return "bg-accent text-white";
    if (gradeNum >= 60) return "bg-orange-500/20 text-orange-600";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold break-words">
            Galeri <span className="text-gradient">Karya Siswa</span>
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isStudent 
              ? "Koleksi karya terbaik yang sudah disetujui dan dinilai oleh guru"
              : "Koleksi semua karya siswa yang sudah Anda setujui dan nilai"
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-playful overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {/* Search - full width on mobile */}
            <div className="relative w-full min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari karya atau nama siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl w-full"
              />
            </div>

            {/* Class + View Mode row on mobile; full row on desktop */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full min-w-0 sm:w-44 rounded-xl flex-1 sm:flex-initial">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls === "Semua" ? "Semua Kelas" : `Kelas ${cls}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 shrink-0">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-lg touch-manipulation"
                  onClick={() => setViewMode("grid")}
                  aria-label="Tampilan grid"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-lg touch-manipulation"
                  onClick={() => setViewMode("list")}
                  aria-label="Tampilan list"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Media Type Tabs - horizontal scroll on mobile */}
            <Tabs value={selectedMediaType} onValueChange={setSelectedMediaType} className="w-full min-w-0">
              <TabsList className="h-10 rounded-xl bg-muted/50 overflow-x-auto flex-nowrap w-full justify-start sm:justify-start gap-0.5 pb-1 -mx-0.5 px-0.5 min-h-[2.75rem]">
                {mediaTypes.map((mt) => (
                  <TabsTrigger
                    key={mt}
                    value={mt}
                    className="rounded-lg whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shrink-0 px-3 sm:px-4 py-2 text-sm"
                  >
                    {mt}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Grid/List */}
      {loading ? (
        <div className="text-center py-12 sm:py-16">
          <p className="text-muted-foreground text-sm sm:text-base">Memuat portfolio...</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPortfolios.map((portfolio) => (
            <Card 
              key={portfolio.id} 
              className="card-playful group overflow-hidden cursor-pointer touch-manipulation"
              onClick={() => setSelectedWork(portfolio)}
            >
              <div className="relative aspect-square overflow-hidden">
                  <img
                    src={getPortfolioImageUrl(portfolio, 'thumbnail') || `https://picsum.photos/seed/${portfolio.title}/400/400`}
                    alt={portfolio.title || "Portfolio"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />

                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                    <h3 className="font-display font-bold text-base sm:text-lg line-clamp-1">{portfolio.title}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                      <UserIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm opacity-90 truncate">{portfolio.student?.name || "-"}</span>
                      <span className="opacity-50 flex-shrink-0">•</span>
                      <span className="text-xs sm:text-sm opacity-90">{portfolio.student?.className || "-"}</span>
                    </div>
                  </div>
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
                  <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="line-clamp-1 min-w-0">{portfolio.assignment?.title || "-"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredPortfolios.map((portfolio) => (
            <Card 
              key={portfolio.id} 
              className="card-playful group cursor-pointer touch-manipulation"
              onClick={() => setSelectedWork(portfolio)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4 min-w-0">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={getPortfolioImageUrl(portfolio, 'thumbnail') || `https://picsum.photos/seed/${portfolio.title}/200/200`}
                      alt={portfolio.title || "Portfolio"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-display font-bold text-base sm:text-lg truncate">{portfolio.title}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 flex-wrap">
                      <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{portfolio.student?.name || "-"}</span>
                      <span className="opacity-50 flex-shrink-0">•</span>
                      <span>{portfolio.student?.className || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 min-w-0">
                      <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                      <span className="line-clamp-1 truncate">{portfolio.assignment?.title || "-"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Work Detail Dialog - mobile friendly */}
      <Dialog open={!!selectedWork} onOpenChange={(open) => !open && setSelectedWork(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-display text-base sm:text-lg pr-8 break-words">
              {selectedWork?.title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Tugas: {selectedWork?.assignment?.title || "-"}
            </DialogDescription>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-3 sm:space-y-4">
              <div className="rounded-lg sm:rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center -mx-1 sm:mx-0">
                <img
                  src={getPortfolioImageUrl(selectedWork, 'full') || `https://picsum.photos/seed/${selectedWork.title}/800/600`}
                  alt={selectedWork.title || "Portfolio"}
                  className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-contain"
                />
              </div>

              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{selectedWork.student?.name || "-"}</p>
                  <p className="text-sm text-muted-foreground">{selectedWork.student?.className || "-"}</p>
                </div>
              </div>

              {/* Info cards - stack on mobile, 3 cols on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl min-w-0">
                  <Award className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Nilai</p>
                    <p className="font-bold truncate">{selectedWork.grade || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl min-w-0">
                  <Calendar className="w-5 h-5 text-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Tanggal</p>
                    <p className="font-semibold text-sm truncate">
                      {selectedWork.submittedAt ? new Date(selectedWork.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl min-w-0">
                  <Tag className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Tipe Media</p>
                    <p className="font-semibold text-sm truncate">{selectedWork.mediaType?.name || "-"}</p>
                  </div>
                </div>
              </div>

              {selectedWork.description && (
                <div className="p-3 sm:p-4 bg-muted/50 rounded-xl min-w-0">
                  <p className="text-sm font-semibold mb-2">Deskripsi Karya:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed break-words">{selectedWork.description}</p>
                </div>
              )}

              {selectedWork.feedback && (
                <div className="p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/10 min-w-0">
                  <p className="text-sm font-semibold mb-2">Feedback Guru:</p>
                  <p className="text-sm text-muted-foreground break-words">{selectedWork.feedback}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredPortfolios.length === 0 && !loading && (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-muted flex items-center justify-center mb-3 sm:mb-4">
            <Image className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-display font-bold mb-2">Belum Ada Karya</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Belum ada karya yang disetujui dan dinilai
          </p>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
