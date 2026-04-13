import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Users, 
  Image, 
  Star, 
  Eye, 
  Mail, 
  Phone, 
  Plus, 
  Upload, 
  Pencil, 
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  KeyRound,
  EyeOff,
  Loader2,
  ListChecks,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/user.service";
import { classService } from "@/services/class.service";
import { submissionService } from "@/services/submission.service";
import { FrontendUser } from "@/layouts/DashboardLayout";
import type { User } from "@/types/api";
import type { Class } from "@/types/api";
import { getApiErrorMessage } from "@/lib/api-error";

type BulkEditRow = {
  id: string;
  name: string;
  phone: string;
  nis: string;
  classId: string;
  email: string;
};

const Students = () => {
  const { user } = useOutletContext<{ user: FrontendUser }>();
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [studentStats, setStudentStats] = useState<Record<string, { count: number; avgGrade: number | null }>>({});
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Array<{ name: string; email: string; phone: string; class: string; valid: boolean; error?: string }>>([]);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "preview">("upload");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nis: "",
    password: "",
    classId: ""
  });

  // Reset password state
  const [resetPasswordData, setResetPasswordData] = useState({ newPassword: "", confirmPassword: "" });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkEditRow[]>([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkSaveErrors, setBulkSaveErrors] = useState<Record<string, string>>({});

  const isTeacher = user.role === "teacher" || user.role === "TEACHER";
  const canManageStudents =
    isTeacher || user.role === "ADMIN" || user.role === "admin";

  // Fetch students and classes
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      
      // For teachers, only fetch students from their classes
      if (isTeacher && user.classes && user.classes.length > 0) {
        const classIds = user.classes.map(c => c.id);
        // Fetch students for each class
        const studentPromises = classIds.map(classId => 
          userService.getUsers({ role: 'STUDENT', classId, limit: 100 })
        );
        const studentResponses = await Promise.all(studentPromises);
        
        // Combine all students and remove duplicates
        const allStudents: User[] = [];
        const studentMap = new Map<string, User>();
        
        studentResponses.forEach(response => {
          if (response.success && response.data) {
            const studentsData = Array.isArray(response.data) ? response.data : response.data.data || [];
            studentsData.forEach(student => {
              if (!studentMap.has(student.id)) {
                studentMap.set(student.id, student);
                allStudents.push(student);
              }
            });
          }
        });
        
        setStudents(allStudents);
      } else if (isTeacher) {
        // Teacher has no classes assigned, show empty
        setStudents([]);
      } else {
        // For non-teachers (admin), fetch all students
        const studentsRes = await userService.getUsers({ role: 'STUDENT', limit: 100 });
        if (studentsRes.success && studentsRes.data) {
          const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.data || [];
          setStudents(studentsData);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Gagal memuat data siswa"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isTeacher, user.classes, toast]);

  const fetchClasses = useCallback(async () => {
    try {
      // For teachers, filter tabs only show their classes
      if (isTeacher && user.classes && user.classes.length > 0) {
        setClasses(user.classes.map(c => ({ id: c.id, name: c.name, description: c.description, createdAt: "", updatedAt: "" })));
      } else {
        const classesRes = await classService.getClasses({ limit: 100 });
        if (classesRes.success && classesRes.data) {
          const classesData = Array.isArray(classesRes.data) ? classesRes.data : classesRes.data.data || [];
          setClasses(classesData);
        }
      }

      // Always fetch all classes for the edit/add dialog dropdown
      const allClassesRes = await classService.getClasses({ limit: 100 });
      if (allClassesRes.success && allClassesRes.data) {
        const allClassesData = Array.isArray(allClassesRes.data) ? allClassesRes.data : allClassesRes.data.data || [];
        setAllClasses(allClassesData);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  }, [isTeacher, user.classes]);

  const fetchStudentStats = useCallback(async () => {
    try {
      const response = await submissionService.getSubmissions({ limit: 100 });
      if (response.success && response.data) {
        const allSubs = Array.isArray(response.data) ? response.data : response.data.data || [];
        const map: Record<string, { count: number; gradeSum: number; gradeCount: number }> = {};

        allSubs.forEach((sub) => {
          if (!sub.studentId || sub.status === "NOT_SUBMITTED") return;
          if (!map[sub.studentId]) map[sub.studentId] = { count: 0, gradeSum: 0, gradeCount: 0 };
          map[sub.studentId].count++;
          if (sub.grade !== null && sub.grade !== undefined) {
            map[sub.studentId].gradeSum += sub.grade;
            map[sub.studentId].gradeCount++;
          }
        });

        const stats: Record<string, { count: number; avgGrade: number | null }> = {};
        Object.entries(map).forEach(([id, { count, gradeSum, gradeCount }]) => {
          stats[id] = { count, avgGrade: gradeCount > 0 ? Math.round(gradeSum / gradeCount) : null };
        });
        setStudentStats(stats);
      }
    } catch {
      console.error("Error fetching student stats");
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchStudentStats();
  }, [fetchStudents, fetchClasses, fetchStudentStats]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.nis?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "Semua" || student.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const availableClasses = ["Semua", ...classes.map(c => c.name)];

  // Reset to page 1 when search or class filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClass]);

  const toggleStudentSelect = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllStudentsOnCurrentPage = () => {
    setSelectedStudentIds(new Set(paginatedStudents.map((s) => s.id)));
  };

  const toggleSelectAllOnCurrentPage = () => {
    if (allOnPageSelected) {
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        paginatedStudents.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      selectAllStudentsOnCurrentPage();
    }
  };

  const clearStudentSelection = () => {
    setSelectedStudentIds(new Set());
  };

  const openBulkEditDialog = () => {
    if (selectedStudentIds.size === 0) return;
    const rows: BulkEditRow[] = [];
    selectedStudentIds.forEach((id) => {
      const s = students.find((st) => st.id === id);
      if (s) {
        rows.push({
          id: s.id,
          name: s.name || "",
          phone: s.phone || "",
          nis: s.nis || "",
          classId: s.classId || "",
          email: s.email || "",
        });
      }
    });
    setBulkRows(rows);
    setBulkSaveErrors({});
    setIsBulkEditOpen(true);
  };

  const updateBulkRow = (id: string, patch: Partial<Omit<BulkEditRow, "id" | "email">>) => {
    setBulkRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setBulkSaveErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleBulkSave = async () => {
    for (const row of bulkRows) {
      if (!row.name.trim() || !row.nis.trim() || !row.classId) {
        toast({
          title: "Data belum lengkap",
          description: "Setiap baris wajib punya Nama, NIS, dan Kelas.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsBulkSaving(true);
    setBulkSaveErrors({});
    const errors: Record<string, string> = {};
    let ok = 0;

    for (const row of bulkRows) {
      try {
        const response = await userService.updateUser(row.id, {
          name: row.name.trim(),
          phone: row.phone.trim() || undefined,
          classId: row.classId,
          nis: row.nis.trim(),
        });
        if (response.success) ok++;
        else errors[row.id] = response.message || "Gagal menyimpan";
      } catch (error) {
        errors[row.id] = getApiErrorMessage(error);
      }
    }

    setIsBulkSaving(false);
    setBulkSaveErrors(errors);

    if (Object.keys(errors).length === 0) {
      toast({
        title: "Berhasil",
        description: `${ok} siswa berhasil diperbarui.`,
      });
      setIsBulkEditOpen(false);
      clearStudentSelection();
      fetchStudents();
    } else {
      toast({
        title: ok > 0 ? "Sebagian gagal" : "Gagal menyimpan",
        description:
          ok > 0
            ? `${ok} berhasil, ${Object.keys(errors).length} baris gagal. Perbaiki yang bertanda merah lalu simpan lagi.`
            : "Tidak ada baris yang tersimpan. Periksa pesan di tabel.",
        variant: "destructive",
      });
      if (ok > 0) fetchStudents();
    }
  };

  const allOnPageSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((s) => selectedStudentIds.has(s.id));

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green bg-green/10";
    if (score >= 80) return "text-secondary bg-secondary/10";
    if (score >= 70) return "text-accent bg-accent/10";
    return "text-destructive bg-destructive/10";
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.nis || !formData.name || !formData.password || !formData.classId) {
        toast({
          title: "Data Tidak Lengkap",
          description: "NIS, Nama, Password, dan Kelas harus diisi",
          variant: "destructive",
        });
        return;
      }

      const response = await userService.createUser({
        nis: formData.nis,
        name: formData.name,
        password: formData.password,
        role: "STUDENT",
        classId: formData.classId,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      if (response.success) {
        toast({
          title: "Siswa Ditambahkan! 🎉",
          description: `${formData.name} berhasil ditambahkan`,
        });
        setIsAddDialogOpen(false);
        setFormData({ name: "", email: "", phone: "", nis: "", password: "", classId: classes[0]?.id || "" });
        fetchStudents(); // Refresh student list
      } else {
        toast({
          title: "Gagal menambahkan siswa",
          description: response.message || "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Gagal menambahkan siswa"),
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const response = await userService.updateUser(selectedStudent.id, {
        name: formData.name,
        phone: formData.phone,
        classId: formData.classId,
        nis: formData.nis.trim(),
      });
      if (response.success) {
        setIsEditDialogOpen(false);
        setSelectedStudent(null);
        toast({
          title: "Data Diperbarui! ✅",
          description: "Data siswa berhasil diperbarui",
        });
        fetchStudents(); // Refresh with correct filter (teacher's classes only if applicable)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Gagal memperbarui data siswa"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      const response = await userService.deleteUser(selectedStudent.id);
      if (response.success) {
        setStudents(students.filter(s => s.id !== selectedStudent.id));
        setIsDeleteDialogOpen(false);
        setSelectedStudent(null);
        toast({
          title: "Siswa Dihapus",
          description: "Data siswa berhasil dihapus",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Gagal menghapus siswa"),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (student: User) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      nis: student.nis || "",
      password: "", // Password tidak ditampilkan untuk edit
      classId: student.classId || ""
    });
    setResetPasswordData({ newPassword: "", confirmPassword: "" });
    setIsEditDialogOpen(true);
  };

  const handleResetStudentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password baru dan konfirmasi tidak cocok",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      await userService.resetStudentPassword(selectedStudent.id, resetPasswordData.newPassword);
      toast({
        title: "Password Direset!",
        description: `Password ${selectedStudent.name} berhasil direset`,
      });
      setResetPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Gagal mereset password"),
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const openDeleteDialog = (student: User) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleImportExcel = async (file: File) => {
    try {
      setImportFile(file);
      // For now, we'll directly import without preview
      // In a real scenario, you might want to parse the Excel file first for preview
      const response = await userService.importStudents(file);
      if (response.success && response.data) {
        setImportPreview(response.data.errors.map(err => ({
          name: "",
          email: "",
          phone: "",
          class: "",
          valid: false,
          error: err.error
        })));
        if (response.data.success > 0) {
          // Refresh students list
          const studentsRes = await userService.getUsers({ role: 'STUDENT', limit: 100 });
          if (studentsRes.success && studentsRes.data) {
            const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.data || [];
            setStudents(studentsData);
          }
          toast({
            title: "Import Berhasil! 📊",
            description: `${response.data.success} siswa berhasil ditambahkan${response.data.failed > 0 ? `, ${response.data.failed} gagal` : ''}`,
          });
        } else {
          toast({
            title: "Import Gagal",
            description: "Tidak ada siswa yang berhasil ditambahkan",
            variant: "destructive",
          });
        }
        setIsImportDialogOpen(false);
        setImportStep("upload");
        setImportFile(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Gagal mengimpor file Excel"),
        variant: "destructive",
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) return;
    await handleImportExcel(importFile);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Daftar <span className="text-gradient">Siswa</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Kelola dan pantau perkembangan siswa
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import Excel Button */}
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
            setIsImportDialogOpen(open);
            if (!open) setImportStep("upload");
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-green" />
                  Import Siswa dari Excel
                </DialogTitle>
                <DialogDescription>
                  {importStep === "upload" 
                    ? "Upload file Excel (.xlsx) dengan data siswa"
                    : "Review data sebelum disimpan"
                  }
                </DialogDescription>
              </DialogHeader>

              {importStep === "upload" ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImportFile(file);
                          setImportStep("preview");
                        }
                      }}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label
                      htmlFor="excel-upload"
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer block"
                    >
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium mb-1">Klik atau drag file Excel ke sini</p>
                      <p className="text-sm text-muted-foreground">
                        Format: .xlsx dengan kolom: NIS, Nama, Email (optional), Phone (optional), Class, Password (optional)
                      </p>
                    </label>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm font-medium mb-2">Format Template:</p>
                    <div className="text-xs text-muted-foreground">
                      <p>• Kolom A: Nama Lengkap</p>
                      <p>• Kolom B: Email</p>
                      <p>• Kolom C: No. Telepon</p>
                      <p>• Kolom D: Kelas (XII IPA 1, XII IPA 2, XII IPS 1)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border overflow-hidden max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Status</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telepon</TableHead>
                          <TableHead>Kelas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreview.length > 0 ? (
                          importPreview.map((item, index) => (
                            <TableRow key={index} className={!item.valid ? "bg-destructive/5" : ""}>
                              <TableCell>
                                {item.valid ? (
                                  <CheckCircle className="w-4 h-4 text-green" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{item.name || "-"}</TableCell>
                              <TableCell className={!item.valid ? "text-destructive" : ""}>{item.email || "-"}</TableCell>
                              <TableCell>{item.phone || "-"}</TableCell>
                              <TableCell>{item.class || "-"}</TableCell>
                              {item.error && (
                                <TableCell className="text-destructive text-xs">{item.error}</TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                              Upload file Excel untuk melihat preview
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {importPreview.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl text-sm">
                      <div className="flex items-center gap-1 text-green">
                        <CheckCircle className="w-4 h-4" />
                        <span>{importPreview.filter(i => i.valid).length} Valid</span>
                      </div>
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{importPreview.filter(i => !i.valid).length} Error</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  if (importStep === "preview") setImportStep("upload");
                  else setIsImportDialogOpen(false);
                }}>
                  {importStep === "preview" ? "Kembali" : "Batal"}
                </Button>
                {importStep === "preview" && importFile && (
                  <Button variant="gradient" onClick={handleConfirmImport}>
                    Import Siswa
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Student Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Tambah Siswa Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data siswa baru
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input 
                    placeholder="Masukkan nama lengkap" 
                    className="rounded-xl" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    placeholder="email@mail.com" 
                    className="rounded-xl" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. Telepon (Opsional)</Label>
                  <Input 
                    placeholder="08xxxxxxxxxx" 
                    className="rounded-xl" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIS</Label>
                  <Input 
                    placeholder="Masukkan NIS" 
                    className="rounded-xl" 
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password"
                    placeholder="Masukkan password" 
                    className="rounded-xl" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {allClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1">
                    Tambah Siswa
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Class Filter */}
            <Tabs value={selectedClass} onValueChange={setSelectedClass} className="w-full md:w-auto">
              <TabsList className="h-10 rounded-xl bg-muted/50">
                {availableClasses.map((cls) => (
                  <TabsTrigger
                    key={cls}
                    value={cls}
                    className="rounded-lg whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {cls}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Student Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl">
              <Users className="w-4 h-4" />
              <span>{filteredStudents.length} Siswa</span>
            </div>
          </div>

          {canManageStudents && !loading && filteredStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-4 mt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={toggleSelectAllOnCurrentPage}
                  disabled={paginatedStudents.length === 0}
                >
                  {allOnPageSelected ? "Batal pilih halaman ini" : "Pilih semua di halaman ini"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={clearStudentSelection}
                  disabled={selectedStudentIds.size === 0}
                >
                  Hapus pilihan
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {selectedStudentIds.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedStudentIds.size} siswa dipilih
                    </span>
                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      className="rounded-xl gap-1"
                      onClick={openBulkEditDialog}
                    >
                      <ListChecks className="w-4 h-4" />
                      Edit massal
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Grid */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Memuat data siswa...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedStudents.map((student) => (
          <Card key={student.id} className="card-playful group">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                {canManageStudents ? (
                  <div className="pt-1 shrink-0">
                    <Checkbox
                      checked={selectedStudentIds.has(student.id)}
                      onCheckedChange={() => toggleStudentSelect(student.id)}
                      aria-label={`Pilih ${student.name || "siswa"}`}
                    />
                  </div>
                ) : null}
                <Avatar className="w-14 h-14 avatar-ring shrink-0">
                  <AvatarImage src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {student.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">
                {student.name}
              </h3>
              <p className="text-sm text-muted-foreground">{student.className || "-"}</p>
              <p className="text-xs text-muted-foreground mt-1">{student.email || student.nis}</p>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  {studentStats[student.id]?.count ?? 0} karya
                </span>
                {studentStats[student.id]?.avgGrade !== null && studentStats[student.id]?.avgGrade !== undefined ? (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${getScoreColor(studentStats[student.id].avgGrade!)}`}>
                    <Star className="w-3.5 h-3.5" />
                    {studentStats[student.id].avgGrade}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" /> -
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(student)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => openDeleteDialog(student)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} dari {filteredStudents.length} siswa
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Sebelumnya
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "gradient" : "outline"}
                size="sm"
                className="rounded-xl w-9"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Berikutnya →
            </Button>
          </div>
        </div>
      )}

      {/* Bulk edit dialog */}
      <Dialog
        open={isBulkEditOpen}
        onOpenChange={(open) => {
          if (isBulkSaving) return;
          setIsBulkEditOpen(open);
          if (!open) setBulkSaveErrors({});
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col gap-0 p-6">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              Edit massal data siswa
            </DialogTitle>
            <DialogDescription>
              Ubah NIS, nama, telepon, atau kelas untuk siswa yang dipilih. Perubahan disimpan per akun; baris yang gagal
              ditandai agar bisa diperbaiki lalu disimpan lagi.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 max-h-[55vh] -mx-2 px-2">
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[120px]">NIS</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="w-[130px]">Telepon</TableHead>
                    <TableHead className="min-w-[160px] hidden md:table-cell">Email</TableHead>
                    <TableHead className="min-w-[160px]">Kelas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={bulkSaveErrors[row.id] ? "bg-destructive/5" : undefined}
                    >
                      <TableCell className="align-top py-3">
                        <Input
                          className="rounded-lg h-9 text-sm"
                          value={row.nis}
                          onChange={(e) => updateBulkRow(row.id, { nis: e.target.value })}
                          disabled={isBulkSaving}
                          autoComplete="off"
                        />
                        {bulkSaveErrors[row.id] ? (
                          <p className="text-xs text-destructive mt-1 leading-snug">{bulkSaveErrors[row.id]}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top py-3">
                        <Input
                          className="rounded-lg h-9 text-sm"
                          value={row.name}
                          onChange={(e) => updateBulkRow(row.id, { name: e.target.value })}
                          disabled={isBulkSaving}
                        />
                      </TableCell>
                      <TableCell className="align-top py-3">
                        <Input
                          className="rounded-lg h-9 text-sm"
                          value={row.phone}
                          onChange={(e) => updateBulkRow(row.id, { phone: e.target.value })}
                          disabled={isBulkSaving}
                          placeholder="Opsional"
                        />
                      </TableCell>
                      <TableCell className="align-top py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground break-all">{row.email || "—"}</span>
                      </TableCell>
                      <TableCell className="align-top py-3">
                        <Select
                          value={row.classId}
                          onValueChange={(value) => updateBulkRow(row.id, { classId: value })}
                          disabled={isBulkSaving}
                        >
                          <SelectTrigger className="rounded-lg h-9 text-sm">
                            <SelectValue placeholder="Pilih kelas" />
                          </SelectTrigger>
                          <SelectContent>
                            {allClasses.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isBulkSaving}
              onClick={() => setIsBulkEditOpen(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              variant="gradient"
              className="rounded-xl gap-2"
              disabled={isBulkSaving || bulkRows.length === 0}
              onClick={() => void handleBulkSave()}
            >
              {isBulkSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Simpan semua
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Data Siswa</DialogTitle>
            <DialogDescription>
              Perbarui informasi siswa
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input 
                placeholder="Masukkan nama lengkap" 
                className="rounded-xl" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="email@mail.com" 
                className="rounded-xl" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input 
                placeholder="08xxxxxxxxxx" 
                className="rounded-xl" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>NIS</Label>
              <Input
                placeholder="Nomor Induk Siswa"
                className="rounded-xl"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                    <SelectContent>
                      {allClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="gradient" className="flex-1">
                Simpan
              </Button>
            </div>
          </form>

          {/* Separator */}
          <div className="border-t border-border mt-4 pt-4">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              onClick={() => setShowResetPassword(!showResetPassword)}
            >
              <KeyRound className="w-4 h-4" />
              <span>Reset Password Siswa</span>
              <span className="ml-auto text-xs">{showResetPassword ? "▲ Sembunyikan" : "▼ Tampilkan"}</span>
            </button>

            {showResetPassword && (
              <form onSubmit={handleResetStudentPassword} className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label className="text-sm">Password Baru</Label>
                  <div className="relative">
                    <Input
                      type={showResetPassword ? "text" : "password"}
                      value={resetPasswordData.newPassword}
                      onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                      className="rounded-xl pr-10"
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      disabled={isResettingPassword}
                    />
                    <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Konfirmasi Password Baru</Label>
                  <Input
                    type="password"
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                    className={`rounded-xl ${
                      resetPasswordData.confirmPassword && resetPasswordData.newPassword !== resetPasswordData.confirmPassword
                        ? "border-destructive"
                        : ""
                    }`}
                    placeholder="Ulangi password baru"
                    required
                    disabled={isResettingPassword}
                  />
                  {resetPasswordData.confirmPassword && resetPasswordData.newPassword !== resetPasswordData.confirmPassword && (
                    <p className="text-xs text-destructive">Password tidak cocok</p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={isResettingPassword || !resetPasswordData.newPassword || resetPasswordData.newPassword !== resetPasswordData.confirmPassword}
                >
                  {isResettingPassword ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mereset...</>
                  ) : (
                    <><KeyRound className="w-4 h-4 mr-2" /> Reset Password</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Hapus Siswa</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedStudent?.name}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteStudent}>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-muted flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">Siswa Tidak Ditemukan</h3>
          <p className="text-muted-foreground mb-4">
            Coba ubah kata kunci atau filter pencarian
          </p>
          <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa Baru
          </Button>
        </div>
      )}
    </div>
  );
};

export default Students;
