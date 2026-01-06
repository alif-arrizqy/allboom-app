import { useEffect, useState } from "react";
import { FrontendUser } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ClipboardList, Image, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardService } from "@/services/dashboard.service";
import { useToast } from "@/hooks/use-toast";
import type { DashboardOverview } from "@/types/api";

interface TeacherDashboardProps {
  user: FrontendUser;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
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
    { label: "Total Siswa", value: dashboardData.statistics.totalStudents?.toString() || "0", icon: Users, color: "bg-secondary" },
    { label: "Tugas Aktif", value: dashboardData.statistics.activeAssignments?.toString() || "0", icon: ClipboardList, color: "bg-primary" },
    { label: "Menunggu Review", value: dashboardData.statistics.pendingSubmissions?.toString() || "0", icon: Image, color: "bg-purple" },
    { label: "Rata-rata Nilai", value: dashboardData.statistics.averageScore?.toFixed(1) || "0", icon: Star, color: "bg-accent" },
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
            Selamat Datang, <span className="text-gradient">{user.name}</span>! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Pantau perkembangan siswa dan kelola tugas dengan mudah
          </p>
        </div>
        <Link to="/assignments">
          <Button variant="gradient" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Buat Tugas Baru
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="card-playful group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-display font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <Card className="card-playful lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Pengumpulan Terbaru</CardTitle>
            <CardDescription>Karya siswa yang baru dikumpulkan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentSubmissions && dashboardData.recentSubmissions.length > 0 ? (
                dashboardData.recentSubmissions.map((submission) => (
                  <div 
                    key={submission.id} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-pink/20 flex items-center justify-center">
                        <Image className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{submission.studentName}</p>
                        <p className="text-sm text-muted-foreground">{submission.assignmentTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" />
                        {formatTimeAgo(submission.submittedAt)}
                      </div>
                      {submission.grade !== null ? (
                        <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                          submission.grade >= 90 ? 'bg-green/20 text-green' : submission.grade >= 80 ? 'bg-secondary/20 text-secondary' : 'bg-accent/20 text-accent-foreground'
                        }`}>
                          {submission.grade}
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-lg text-sm font-semibold bg-secondary/20 text-secondary">
                          Menunggu
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada pengumpulan terbaru</p>
              )}
            </div>
            <Link to="/students">
              <Button variant="ghost" className="w-full mt-4">
                Lihat Semua
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card className="card-playful">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Siswa Terbaik</CardTitle>
            <CardDescription>Berdasarkan nilai rata-rata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.topStudents && dashboardData.topStudents.length > 0 ? (
                dashboardData.topStudents.map((student, index) => (
                  <div 
                    key={student.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <img 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                        alt={student.name}
                        className="w-12 h-12 rounded-xl"
                      />
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-accent-foreground fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">Skor: {student.avgScore}</p>
                    </div>
                    <div className={`text-xl font-display font-bold ${
                      index === 0 ? 'text-accent' : index === 1 ? 'text-secondary' : 'text-primary'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data siswa terbaik</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
