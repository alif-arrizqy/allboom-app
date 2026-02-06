import { useEffect, useState } from "react";
import { FrontendUser } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Image, ClipboardList, Trophy, Star, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardService } from "@/services/dashboard.service";
import { useToast } from "@/hooks/use-toast";
import type { DashboardOverview } from "@/types/api";

interface StudentDashboardProps {
  user: FrontendUser;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getOverview();
        if (response.success && response.data) {
          setDashboardData(response.data);
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal memuat data dashboard";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [toast]);

  const stats = dashboardData?.statistics ? [
    { label: "Karya Portfolio", value: dashboardData.statistics.portfolioCount?.toString() || "0", icon: Image, color: "bg-secondary" },
    { label: "Tugas Selesai", value: `${dashboardData.statistics.completedAssignments || 0}/${dashboardData.statistics.totalAssignments || 0}`, icon: ClipboardList, color: "bg-primary" },
    { label: "Pencapaian", value: dashboardData.achievements?.filter(a => a.unlockedAt).length.toString() || "0", icon: Trophy, color: "bg-accent" },
    { label: "Nilai Rata-rata", value: dashboardData.statistics.averageScore?.toFixed(1) || "0", icon: Star, color: "bg-purple" },
  ] : [];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Baru saja";
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    if (diffInDays === 1) return "1 hari lalu";
    return `${diffInDays} hari lalu`;
  };

  const calculateDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffInMs = deadlineDate.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 stagger-children">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Hai, <span className="text-gradient">{user.name}</span>! 🎨
          </h2>
          <p className="text-muted-foreground mt-1">
            Ayo terus berkarya dan kembangkan bakat senimu!
          </p>
        </div>
        <Link to="/portfolio">
          <Button variant="gradient" className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Karya
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-playful group">
            <CardContent className="p-4 md:p-5">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform mb-3`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Works */}
        <Card className="card-playful lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display">Karya Terbaru</CardTitle>
                <CardDescription>Portfolio karyamu yang terbaru</CardDescription>
              </div>
              <Link to="/portfolio">
                <Button variant="ghost" size="sm">Lihat Semua</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dashboardData?.recentWorks && dashboardData.recentWorks.length > 0 ? (
                dashboardData.recentWorks.map((work) => (
                  <div 
                    key={work.id}
                    className="group relative rounded-2xl overflow-hidden bg-muted aspect-square cursor-pointer"
                  >
                    <img 
                      src={work.imageThumbnail || work.imageMedium || work.imageUrl || `https://picsum.photos/seed/${work.title}/300/300`}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-primary-foreground font-semibold">{work.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-primary-foreground/80">{work.mediaType?.name || '-'}</span>
                          {work.grade !== null && (
                            <>
                              <span className="text-xs text-primary-foreground/60">•</span>
                              <span className="text-xs text-primary-foreground/60 flex items-center gap-1">
                                <Star className="w-3 h-3" /> {work.grade}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 col-span-3">Belum ada karya terbaru</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="card-playful">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Pencapaian
            </CardTitle>
            <CardDescription>Badge yang sudah kamu raih</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {dashboardData?.achievements && dashboardData.achievements.length > 0 ? (
                dashboardData.achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`p-4 rounded-xl text-center transition-all ${
                      achievement.unlockedAt 
                        ? 'bg-muted/50 hover:bg-muted cursor-pointer' 
                        : 'bg-muted/20 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <p className="text-xs font-medium">{achievement.name}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 col-span-2">Belum ada pencapaian</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Assignments */}
      <Card className="card-playful">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display">Tugas Berlangsung</CardTitle>
              <CardDescription>Tugas yang perlu kamu selesaikan</CardDescription>
            </div>
            <Link to="/assignments">
              <Button variant="ghost" size="sm">Lihat Semua</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.pendingAssignments && dashboardData.pendingAssignments.length > 0 ? (
              dashboardData.pendingAssignments.map((assignment) => {
                const daysRemaining = calculateDaysRemaining(assignment.deadline);
                const progress = assignment.mySubmission ? 100 : 0;
                return (
                  <div 
                    key={assignment.id}
                    className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{assignment.title}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {daysRemaining > 0 ? `${daysRemaining} hari lagi` : "Deadline terlewat"}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada tugas yang perlu diselesaikan</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
