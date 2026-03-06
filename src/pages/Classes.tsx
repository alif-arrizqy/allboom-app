import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Pencil, Trash2, Users, BookOpen, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { classService } from "@/services/class.service";
import { FrontendUser } from "@/layouts/DashboardLayout";
import type { Class } from "@/types/api";

interface ClassStudent {
  id: string;
  name: string;
  nis: string | null;
  avatar: string | null;
}

interface ClassTeacher {
  teacher: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface ClassWithDetails extends Class {
  teachers?: ClassTeacher[];
  students?: ClassStudent[];
  _count?: { students: number };
}

const Classes = () => {
  const { user } = useOutletContext<{ user: FrontendUser }>();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const [formData, setFormData] = useState({ name: "", description: "" });

  const isTeacher = user.role === "teacher" || user.role === "TEACHER";

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await classService.getClasses({ limit: 100 });
      if (res.success && res.data) {
        const data = Array.isArray(res.data) ? res.data : (res.data as { data?: ClassWithDetails[] }).data || [];
        setClasses(data as ClassWithDetails[]);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({ title: "Error", description: "Gagal memuat data kelas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => setFormData({ name: "", description: "" });

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Nama kelas wajib diisi", variant: "destructive" });
      return;
    }
    try {
      const res = await classService.createClass({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      if (res.success) {
        toast({ title: "Kelas Ditambahkan!", description: `Kelas ${formData.name} berhasil dibuat` });
        setIsAddDialogOpen(false);
        resetForm();
        fetchClasses();
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menambahkan kelas";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      const res = await classService.updateClass(selectedClass.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      if (res.success) {
        toast({ title: "Kelas Diperbarui!", description: `Kelas ${formData.name} berhasil diperbarui` });
        setIsEditDialogOpen(false);
        setSelectedClass(null);
        resetForm();
        fetchClasses();
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal memperbarui kelas";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      const res = await classService.deleteClass(selectedClass.id);
      if (res.success) {
        toast({ title: "Kelas Dihapus", description: `Kelas ${selectedClass.name} berhasil dihapus` });
        setIsDeleteDialogOpen(false);
        setSelectedClass(null);
        fetchClasses();
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menghapus kelas";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const openEditDialog = (cls: ClassWithDetails) => {
    setSelectedClass(cls);
    setFormData({ name: cls.name, description: cls.description || "" });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cls: ClassWithDetails) => {
    setSelectedClass(cls);
    setIsDeleteDialogOpen(true);
  };

  const openStudentsDialog = (cls: ClassWithDetails) => {
    setSelectedClass(cls);
    setStudentSearch("");
    setIsStudentsDialogOpen(true);
  };

  const filteredStudents = selectedClass?.students?.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.nis?.toLowerCase().includes(studentSearch.toLowerCase())
  ) ?? [];

  if (!isTeacher) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Halaman ini hanya untuk guru.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Manajemen <span className="text-gradient">Kelas</span>
          </h2>
          <p className="text-muted-foreground mt-1">Tambah, edit, atau hapus kelas</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Tambah Kelas Baru</DialogTitle>
              <DialogDescription>Masukkan nama dan deskripsi kelas</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Kelas</Label>
                <Input
                  placeholder="Contoh: 10A, 10B, 11 IPA 1"
                  className="rounded-xl"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi (Opsional)</Label>
                <Textarea
                  placeholder="Deskripsi kelas..."
                  className="rounded-xl resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gradient" className="flex-1">
                  Tambah Kelas
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:w-96">
        <Card className="card-playful">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{classes.length}</p>
              <p className="text-xs text-muted-foreground">Total Kelas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-playful">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">
                {classes.reduce((sum, cls) => sum + (cls._count?.students ?? cls.students?.length ?? 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Siswa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-playful">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Memuat data kelas...</p>
        </div>
      ) : (
        <Card className="card-playful overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Nama Kelas</TableHead>
                <TableHead className="font-semibold">Guru Pengajar</TableHead>
                <TableHead className="font-semibold text-center">Siswa</TableHead>
                <TableHead className="font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => (
                <TableRow key={cls.id} className="hover:bg-muted/20 transition-colors">
                  {/* Nama Kelas */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-display font-bold">{cls.name}</p>
                        {cls.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{cls.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Guru */}
                  <TableCell>
                    {cls.teachers && cls.teachers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {cls.teachers.map(({ teacher }) => (
                          <div key={teacher.id} className="flex items-center gap-1.5 bg-muted/60 rounded-full px-2.5 py-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={teacher.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${teacher.name}`} />
                              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                {teacher.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{teacher.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Belum ada guru</span>
                    )}
                  </TableCell>

                  {/* Jumlah Siswa + tombol lihat */}
                  <TableCell className="text-center">
                    <button
                      onClick={() => openStudentsDialog(cls)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold hover:bg-secondary/20 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {cls._count?.students ?? cls.students?.length ?? 0}
                    </button>
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openEditDialog(cls)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(cls)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClasses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "Kelas tidak ditemukan" : "Belum ada kelas"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog Daftar Siswa */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Siswa Kelas {selectedClass?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.students?.length ?? 0} siswa terdaftar
            </DialogDescription>
          </DialogHeader>

          {/* Search siswa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau NIS..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* List siswa */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">{idx + 1}</span>
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.nis || "NIS tidak ada"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {studentSearch ? "Siswa tidak ditemukan" : "Belum ada siswa di kelas ini"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Kelas</DialogTitle>
            <DialogDescription>Perbarui informasi kelas</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditClass} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kelas</Label>
              <Input
                placeholder="Contoh: 10A"
                className="rounded-xl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (Opsional)</Label>
              <Textarea
                placeholder="Deskripsi kelas..."
                className="rounded-xl resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Hapus Kelas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kelas <strong>{selectedClass?.name}</strong>?
              {(selectedClass?.students?.length ?? 0) > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Perhatian: Kelas ini masih memiliki {selectedClass?.students?.length} siswa. Pastikan siswa sudah dipindahkan terlebih dahulu.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteClass}>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;
