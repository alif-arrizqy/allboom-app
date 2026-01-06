import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FrontendUser } from "@/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Image, Grid, List, Award, Calendar, Star, User as UserIcon, GraduationCap, Palette } from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedWork, setSelectedWork] = useState<Portfolio | null>(null);
  const [categories, setCategories] = useState<string[]>(["Semua"]);

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
          // Extract unique categories from assignment.category.name
          const uniqueCategories = ["Semua", ...Array.from(new Set(
            portfoliosData
              .map(p => p.assignment?.category?.name || p.category)
              .filter(Boolean)
          ))];
          setCategories(uniqueCategories);
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

  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch = portfolio.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         portfolio.student?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const portfolioCategory = portfolio.assignment?.category?.name || portfolio.category;
    const matchesCategory = selectedCategory === "Semua" || portfolioCategory === selectedCategory;
    return matchesSearch && matchesCategory;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Galeri <span className="text-gradient">Karya Siswa</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            {isStudent 
              ? "Koleksi karya terbaik yang sudah disetujui dan dinilai oleh guru"
              : "Koleksi semua karya siswa yang sudah Anda setujui dan nilai"
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-playful">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari karya atau nama siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
              <TabsList className="h-10 rounded-xl bg-muted/50 overflow-x-auto flex-nowrap">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-lg whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Grid/List */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Memuat portfolio...</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortfolios.map((portfolio) => (
            <Card 
              key={portfolio.id} 
              className="card-playful group overflow-hidden cursor-pointer"
              onClick={() => setSelectedWork(portfolio)}
            >
              <div className="relative aspect-square overflow-hidden">
                  <img
                    src={getPortfolioImageUrl(portfolio, 'thumbnail') || `https://picsum.photos/seed/${portfolio.title}/400/400`}
                    alt={portfolio.title || "Portfolio"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
                  
                  {/* Grade Badge - Top Right, Not overlapping image badly */}
                  {portfolio.grade && (
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg ${getGradeColor(portfolio.grade)}`}>
                        {portfolio.grade}
                      </span>
                    </div>
                  )}

                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-display font-bold text-lg line-clamp-1">{portfolio.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <UserIcon className="w-3 h-3" />
                      <span className="text-sm opacity-90">{portfolio.student?.name || "-"}</span>
                      <span className="opacity-50">•</span>
                      <span className="text-sm opacity-90">{portfolio.student?.className || "-"}</span>
                    </div>
                  </div>
              </div>
              <CardContent className="p-4 space-y-3">
                {/* Assignment Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Palette className="w-4 h-4 text-primary" />
                  <span className="line-clamp-1">{portfolio.assignment?.title || "-"}</span>
                </div>
                
                {/* Date and Category */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                    {portfolio.category || "-"}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {portfolio.submittedAt ? new Date(portfolio.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPortfolios.map((portfolio) => (
            <Card 
              key={portfolio.id} 
              className="card-playful group cursor-pointer"
              onClick={() => setSelectedWork(portfolio)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img
                      src={getPortfolioImageUrl(portfolio, 'thumbnail') || `https://picsum.photos/seed/${portfolio.title}/200/200`}
                      alt={portfolio.title || "Portfolio"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-lg truncate">{portfolio.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <UserIcon className="w-4 h-4" />
                          <span>{portfolio.student?.name || "-"}</span>
                          <span className="opacity-50">•</span>
                          <span>{portfolio.student?.className || "-"}</span>
                        </div>
                      </div>
                      {portfolio.grade && (
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 ${getGradeColor(portfolio.grade)}`}>
                          {portfolio.grade}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Palette className="w-4 h-4 text-primary" />
                      <span>{portfolio.assignment?.title || "-"}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="bg-muted px-2 py-1 rounded-lg text-xs">{portfolio.category || "-"}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {portfolio.submittedAt ? new Date(portfolio.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Work Detail Dialog */}
      <Dialog open={!!selectedWork} onOpenChange={(open) => !open && setSelectedWork(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedWork?.title}</DialogTitle>
            <DialogDescription>
              Tugas: {selectedWork?.assignment?.title || "-"}
            </DialogDescription>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img
                  src={getPortfolioImageUrl(selectedWork, 'medium') || `https://picsum.photos/seed/${selectedWork.title}/800/450`}
                  alt={selectedWork.title || "Portfolio"}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selectedWork.student?.name || "-"}</p>
                  <p className="text-sm text-muted-foreground">{selectedWork.student?.className || "-"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                  <Award className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nilai</p>
                    <p className="font-bold">{selectedWork.grade || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                  <Calendar className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal</p>
                    <p className="font-semibold text-sm">{selectedWork.submittedAt ? new Date(selectedWork.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                  <Star className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Kategori</p>
                    <p className="font-semibold text-sm">{selectedWork.category || "-"}</p>
                  </div>
                </div>
              </div>

              {selectedWork.feedback && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-sm font-semibold mb-2">Feedback Guru:</p>
                  <p className="text-sm text-muted-foreground">{selectedWork.feedback}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredPortfolios.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-muted flex items-center justify-center mb-4">
            <Image className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">Belum Ada Karya</h3>
          <p className="text-muted-foreground">
            Belum ada karya yang disetujui dan dinilai
          </p>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
