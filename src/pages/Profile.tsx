import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FrontendUser } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, User as UserIcon, Phone, MapPin, Calendar, Edit, Save, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { dashboardService } from "@/services/dashboard.service";
import type { UpdateUserRequest, User } from "@/types/api";

const Profile = () => {
  const { user: contextUser } = useOutletContext<{ user: FrontendUser }>();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    // Teacher stats
    totalStudents: 0,
    totalClasses: 0,
    activeAssignments: 0,
    // Student stats
    portfolioCount: 0,
    completedAssignments: 0,
    averageScore: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    birthdate: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await authService.getCurrentUser();
        const userData = response.data.user;
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          bio: userData.bio || "",
          birthdate: userData.birthdate ? userData.birthdate.split("T")[0] : "",
        });
        if (userData.avatar) {
          setAvatarPreview(userData.avatar);
        }

        // Fetch stats from overview endpoint
        const overviewResponse = await dashboardService.getOverview();
        const overviewData = overviewResponse.data;
        
        if (userData.role === "TEACHER") {
          setStats({
            totalStudents: overviewData.statistics.totalStudents || 0,
            totalClasses: overviewData.statistics.totalClasses || 0,
            activeAssignments: overviewData.statistics.activeAssignments || 0,
            portfolioCount: 0,
            completedAssignments: 0,
            averageScore: 0,
          });
        } else {
          setStats({
            totalStudents: 0,
            totalClasses: 0,
            activeAssignments: 0,
            portfolioCount: overviewData.statistics.portfolioCount || 0,
            completedAssignments: overviewData.statistics.completedAssignments || 0,
            averageScore: overviewData.statistics.averageScore || 0,
          });
        }
      } catch (error: unknown) {
        console.error("Error fetching user data:", error);
        const errorMessage = error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          : undefined;
        toast({
          title: "Error",
          description: errorMessage || "Gagal memuat data profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!user) return;

      const updateData: UpdateUserRequest = {
        name: formData.name,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        bio: formData.bio || undefined,
        birthdate: formData.birthdate || undefined,
      };

      if (avatarFile) {
        updateData.avatar = avatarFile;
      }

      const response = await userService.updateUser(user.id, updateData);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      
      // Update context user if needed
      if (updatedUser.avatar) {
        setAvatarPreview(updatedUser.avatar);
      }

      setIsEditing(false);
      setAvatarFile(null);
      toast({
        title: "Profile Disimpan! ✨",
        description: "Perubahan profile berhasil disimpan",
      });
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        : undefined;
      toast({
        title: "Error",
        description: errorMessage || "Gagal menyimpan perubahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        birthdate: user.birthdate ? user.birthdate.split("T")[0] : "",
      });
      setAvatarFile(null);
      setAvatarPreview(user.avatar);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Gagal memuat data profile</p>
      </div>
    );
  }

  const displayStats = user.role === "TEACHER" 
    ? [
        { label: "Total Siswa", value: stats.totalStudents.toString() },
        { label: "Total Kelas", value: stats.totalClasses.toString() },
        { label: "Tugas Dibuat", value: stats.activeAssignments.toString() },
      ]
    : [
        { label: "Karya Portfolio", value: stats.portfolioCount.toString() },
        { label: "Tugas Selesai", value: stats.completedAssignments.toString() },
        { label: "Nilai Rata-rata", value: stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "0" },
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card className="card-playful overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary via-pink to-purple relative">
          <div className="absolute inset-0 pattern-dots opacity-20" />
        </div>
        
        <CardContent className="relative pb-6">
          {/* Avatar */}
          <div className="absolute -top-16 left-6 md:left-8">
            <div className="relative">
              <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-card shadow-lg">
                <AvatarImage 
                  src={avatarPreview || (user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`)} 
                />
                <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-md hover:bg-primary/90 transition-colors cursor-pointer">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
              {!isEditing && (
                <button 
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                  disabled
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex justify-end pt-4">
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-1" /> Batal
                </Button>
                <Button 
                  variant="gradient" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" /> Simpan
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-1" /> Edit Profile
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className="mt-8 md:mt-4 md:ml-40">
            <h2 className="text-2xl md:text-3xl font-display font-bold">{user.name}</h2>
            <p className="text-muted-foreground capitalize mt-1">
              {user.role === "TEACHER" ? "Guru Seni" : "Siswa"} 
              {user.className && ` • ${user.className}`}
              {user.nis && ` • ${user.nis}`}
              {user.nip && ` • ${user.nip}`}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            {displayStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-display font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="card-playful">
        <CardHeader>
          <CardTitle className="font-display">Informasi Personal</CardTitle>
          <CardDescription>Detail informasi akun kamu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                Nama Lengkap
              </Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-foreground font-medium py-2">{formData.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="rounded-xl bg-muted"
                />
              ) : (
                <p className="text-foreground font-medium py-2">{formData.email || "-"}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Nomor Telepon
              </Label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl"
                  placeholder="+62 812 3456 7890"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-foreground font-medium py-2">{formData.phone || "-"}</p>
              )}
            </div>

            {/* Birthdate */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Tanggal Lahir
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="rounded-xl"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-foreground font-medium py-2">
                  {formData.birthdate 
                    ? new Date(formData.birthdate).toLocaleDateString("id-ID", { 
                        day: "numeric", 
                        month: "long", 
                        year: "numeric" 
                      })
                    : "-"
                  }
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Alamat
              </Label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl"
                  placeholder="Jakarta, Indonesia"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-foreground font-medium py-2">{formData.address || "-"}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2 md:col-span-2">
              <Label>Bio</Label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="rounded-xl min-h-24"
                  placeholder="Ceritakan tentang dirimu..."
                  disabled={isSaving}
                />
              ) : (
                <p className="text-foreground font-medium py-2 whitespace-pre-wrap">
                  {formData.bio || "-"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
