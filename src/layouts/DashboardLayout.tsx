import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Notifications } from "@/components/Notifications";
import { authService } from "@/services/auth.service";
import { clearAuthToken, getUserData } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types/api";

// Extended User type for frontend compatibility
export interface FrontendUser extends Omit<User, 'role'> {
  accessToken?: string;
  refreshToken?: string;
  role: "teacher" | "student" | "TEACHER" | "STUDENT" | "ADMIN";
}

const DashboardLayout = () => {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = getUserData();
      if (!storedUser) {
        navigate("/auth");
        return;
      }

      // Try to get current user from API to validate token
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          const apiUser = response.data.user;
          // Merge with stored user data (to keep tokens)
          const mergedUser: FrontendUser = {
            ...apiUser,
            accessToken: storedUser.accessToken,
            refreshToken: storedUser.refreshToken,
            role: (apiUser.role.toLowerCase() as "teacher" | "student") || storedUser.role,
          };
          setUser(mergedUser);
          // Update localStorage with fresh user data
          localStorage.setItem("user", JSON.stringify(mergedUser));
        }
      } catch (error) {
        // If token is invalid, clear and redirect to login
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          clearAuthToken();
          navigate("/auth");
          toast({
            title: "Sesi Berakhir",
            description: "Silakan login kembali",
            variant: "destructive",
          });
          return;
        }
        // If API fails but we have stored user, use it (for offline mode)
        if (storedUser) {
          setUser(storedUser as FrontendUser);
        } else {
          navigate("/auth");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthToken();
      navigate("/auth");
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sistem",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/portfolio")) return "Portfolio";
    if (path.includes("/profile")) return "Profile";
    if (path.includes("/students")) return "Daftar Siswa";
    if (path.includes("/assignments")) return "Tugas";
    return "Dashboard";
  };

  const userRole = user.role === "TEACHER" || user.role === "teacher" ? "teacher" : "student";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar user={user} />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center justify-between h-full px-4 md:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-foreground" />
                <h1 className="text-xl font-display font-bold hidden md:block">{getPageTitle()}</h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="hidden md:flex items-center relative">
                  <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari..." 
                    className="pl-9 w-64 h-10 rounded-xl bg-muted/50 border-none"
                  />
                </div>

                {/* Notifications */}
                <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-auto" align="end" sideOffset={8}>
                    <Notifications 
                      isTeacher={userRole === "teacher"} 
                      onClose={() => setNotificationOpen(false)} 
                    />
                  </PopoverContent>
                </Popover>

                {/* User Avatar */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="w-9 h-9 avatar-ring">
                        <AvatarImage
                          src={
                            user.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                          }
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {userRole === "teacher" ? "Guru" : "Siswa"}
                        </p>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Keluar
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
