import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Palette, GraduationCap, User, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";
import { setAuthToken, getUserData } from "@/config/api";
import { classService } from "@/services/class.service";
import type { Class } from "@/types/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(""); // NIP untuk TEACHER, NIS untuk STUDENT
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nip, setNip] = useState("");
  const [nis, setNis] = useState("");
  const [phone, setPhone] = useState("");
  const [classId, setClassId] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]); // For TEACHER - multiple classes
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load classes when role changes to STUDENT or TEACHER
  useEffect(() => {
    if (!isLogin && classes.length === 0) {
      loadClasses();
    }
  }, [role, isLogin, classes.length]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await classService.getClasses();
      if (response.success && response.data) {
        const classList = Array.isArray(response.data) ? response.data : response.data.data || [];
        setClasses(classList);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast({
        title: "Data Tidak Lengkap",
        description: "NIP/NIS dan password harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({
        identifier,
        password,
      });

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store user data with tokens
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            accessToken,
            refreshToken,
            role: user.role.toLowerCase(), // Convert to lowercase for compatibility
          })
        );

        setAuthToken(accessToken, refreshToken);

        toast({
          title: "Selamat datang! 🎨",
          description: `Login berhasil sebagai ${user.role === "TEACHER" ? "Guru" : "Siswa"}`,
        });
        navigate("/dashboard");
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message || "Login gagal. Periksa NIP/NIS dan password Anda.";
      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!name || !password) {
        toast({
          title: "Data Tidak Lengkap",
          description: "Nama dan password harus diisi",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (role === "TEACHER" && !nip) {
        toast({
          title: "Data Tidak Lengkap",
          description: "NIP harus diisi untuk Guru",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (role === "STUDENT" && !nis) {
        toast({
          title: "Data Tidak Lengkap",
          description: "NIS harus diisi untuk Siswa",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (role === "STUDENT" && !classId) {
        toast({
          title: "Data Tidak Lengkap",
          description: "Kelas harus dipilih untuk Siswa",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const registerData: {
        name: string;
        password: string;
        role: "STUDENT" | "TEACHER";
        phone?: string;
        nip?: string;
        nis?: string;
        email?: string;
        classId?: string;
        classIds?: string[];
      } = {
        name,
        password,
        role,
        phone: phone || undefined,
      };

      if (role === "TEACHER") {
        registerData.nip = nip;
        if (email) registerData.email = email;
        // classIds is optional for Teacher
        if (classIds.length > 0) {
          registerData.classIds = classIds;
        }
      } else {
        registerData.nis = nis;
        registerData.classId = classId;
        if (email) registerData.email = email;
      }

      const response = await authService.register(registerData);

      if (response.success && response.data) {
        toast({
          title: "Akun Dibuat! 🎉",
          description: "Selamat bergabung di Allboom. Silakan login.",
        });
        setIsLogin(true);
        setIdentifier(role === "TEACHER" ? nip : nis);
        // Clear form
        setName("");
        setEmail("");
        setNip("");
        setNis("");
        setPhone("");
        setClassId("");
        setClassIds([]);
      }
    } catch (error) {
      const axiosError = error as { 
        response?: { 
          data?: { 
            message?: string;
            errors?: Record<string, string>;
          } 
        }; 
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        (axiosError.response?.data?.errors
          ? Object.values(axiosError.response.data.errors).join(", ")
          : axiosError.message ||
            "Registrasi gagal. Periksa data yang Anda masukkan.");
      toast({
        title: "Registrasi Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pattern-dots relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 blob blob-animate -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/20 blob blob-animate translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-accent/20 blob blob-animate translate-x-1/2" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Title */}
          <div className="text-center animate-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-pink mb-6 shadow-glow">
              <Palette className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-display font-bold text-gradient mb-2">Allboom</h1>
            <p className="text-muted-foreground font-medium">E-Portfolio Seni Digital</p>
          </div>

          {/* Auth Card */}
          <Card className="card-playful animate-in delay-100">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center font-display">
                {isLogin ? "Masuk" : "Daftar"}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin 
                  ? "Masukkan kredensial untuk melanjutkan" 
                  : "Buat akun baru untuk memulai"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">
                      NIP / NIS
                      <span className="text-xs text-muted-foreground ml-2">
                        (NIP untuk Guru, NIS untuk Siswa)
                      </span>
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Masukkan NIP atau NIS"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? "Memuat..." : "Masuk"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pilih Role</Label>
                      <Tabs
                      value={role}
                      onValueChange={(v) => {
                        setRole(v as "TEACHER" | "STUDENT");
                        setClassIds([]); // Reset classIds when switching roles
                        if (classes.length === 0) {
                          loadClasses();
                        }
                      }}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl">
                        <TabsTrigger
                          value="STUDENT"
                          className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                        >
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Siswa
                        </TabsTrigger>
                        <TabsTrigger
                          value="TEACHER"
                          className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Guru
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  {role === "TEACHER" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="nip">
                          NIP <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="nip"
                          type="text"
                          placeholder="Nomor Induk Pegawai"
                          value={nip}
                          onChange={(e) => setNip(e.target.value)}
                          className="h-12 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email (Opsional)</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="contoh@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacher-classes">
                          Kelas yang Dibina (Opsional)
                          <span className="text-xs text-muted-foreground ml-2">
                            Bisa dipilih nanti setelah registrasi
                          </span>
                        </Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-xl p-3">
                          {loadingClasses ? (
                            <p className="text-sm text-muted-foreground">Memuat kelas...</p>
                          ) : classes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada kelas tersedia</p>
                          ) : (
                            classes.map((cls) => (
                              <div key={cls.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`class-${cls.id}`}
                                  checked={classIds.includes(cls.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setClassIds([...classIds, cls.id]);
                                    } else {
                                      setClassIds(classIds.filter((id) => id !== cls.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                                <label
                                  htmlFor={`class-${cls.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {cls.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="nis">
                          NIS <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="nis"
                          type="text"
                          placeholder="Nomor Induk Siswa"
                          value={nis}
                          onChange={(e) => setNis(e.target.value)}
                          className="h-12 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class">
                          Kelas <span className="text-destructive">*</span>
                        </Label>
                        <Select value={classId} onValueChange={setClassId} required disabled={loadingClasses}>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder={loadingClasses ? "Memuat kelas..." : "Pilih kelas"} />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email (Opsional)</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="contoh@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon (Opsional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 3 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl pr-10"
                        required
                        minLength={3}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isLoading || (role === "STUDENT" && !classId)}>
                    {isLoading ? "Memuat..." : "Daftar"}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-playful"
                >
                  {isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
                </button>
              </div>

              {/* Info */}
              {isLogin && (
                <div className="mt-6 p-4 bg-muted/50 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground text-center">Cara Login</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-medium">Guru:</span> Gunakan NIP (Nomor Induk Pegawai)</p>
                    <p><span className="font-medium">Siswa:</span> Gunakan NIS (Nomor Induk Siswa)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
