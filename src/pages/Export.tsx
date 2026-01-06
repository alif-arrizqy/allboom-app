import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Eye, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportService } from "@/services/export.service";
import { submissionService } from "@/services/submission.service";
import { classService } from "@/services/class.service";
import { assignmentService } from "@/services/assignment.service";
import type { Submission, Class, Assignment } from "@/types/api";

const Export = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("excel");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);

  // Fetch data with pagination
  const fetchData = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const [submissionsRes, classesRes, assignmentsRes] = await Promise.all([
        submissionService.getSubmissions({ 
          page, 
          limit: pageSize,
          assignmentId: selectedAssignment !== "all" ? selectedAssignment : undefined,
          status: selectedStatus !== "all" ? (selectedStatus as 'NOT_SUBMITTED' | 'PENDING' | 'REVISION' | 'GRADED') : 'GRADED',
          search: searchQuery || undefined,
        }),
        classService.getClasses(),
        assignmentService.getAssignments({ page: 1, limit: 100 }),
      ]);

      if (submissionsRes.success && submissionsRes.data) {
        const responseData = submissionsRes.data;
        let data: Submission[] = [];
        
        if (Array.isArray(responseData)) {
          data = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          data = responseData.data;
          if (responseData.pagination) {
            setTotalPages(responseData.pagination.totalPages || 1);
            setTotalItems(responseData.pagination.total || data.length);
          }
        } else {
          // Fallback: treat as array
          data = [];
        }
        
        setSubmissions(data);
      }

      if (classesRes.success && classesRes.data) {
        const data = Array.isArray(classesRes.data) 
          ? classesRes.data 
          : classesRes.data.data || [];
        setClasses(data);
      }

      if (assignmentsRes.success && assignmentsRes.data) {
        const data = Array.isArray(assignmentsRes.data) 
          ? assignmentsRes.data 
          : assignmentsRes.data.data || [];
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching export data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAssignment, selectedStatus, searchQuery, pageSize, toast]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const filteredData = submissions.filter((submission) => {
    const matchesSearch = !searchQuery || 
      submission.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      submission.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GRADED":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green/10 text-green rounded-lg text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Disetujui
          </span>
        );
      case "PENDING":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Menunggu Review
          </span>
        );
      case "REVISION":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-lg text-xs font-semibold">
            <AlertCircle className="w-3 h-3" />
            Perlu Revisi
          </span>
        );
      case "NOT_SUBMITTED":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-semibold">
            <AlertCircle className="w-3 h-3" />
            Belum Dikumpulkan
          </span>
        );
      default:
        return null;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredData.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const exportData = {
        classIds: selectedClass !== "all" ? [selectedClass] : undefined,
        assignmentIds: selectedAssignment !== "all" ? [selectedAssignment] : undefined,
        studentIds: selectedRows.length > 0 ? selectedRows : undefined,
        statuses: selectedStatus !== "all" ? [selectedStatus] : undefined,
      };

      let blob: Blob;
      if (exportFormat === "excel") {
        blob = await exportService.exportGradesExcel(exportData);
      } else {
        blob = await exportService.exportGradesPDF(exportData);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `export-nilai-${new Date().toISOString().split('T')[0]}.${exportFormat === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsPreviewOpen(false);
      toast({
        title: `Export ${exportFormat.toUpperCase()} Berhasil! 📊`,
        description: `${selectedRows.length > 0 ? selectedRows.length : filteredData.length} data berhasil di-export`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengexport data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const dataToExport = selectedRows.length > 0 
    ? filteredData.filter(item => selectedRows.includes(item.id))
    : filteredData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-bold">
          Export <span className="text-gradient">Nilai & Tugas</span>
        </h2>
        <p className="text-muted-foreground mt-1">
          Export data nilai dan tugas siswa ke PDF atau Excel
        </p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-playful cursor-pointer group" onClick={() => setExportFormat("excel")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${exportFormat === "excel" ? "bg-green/20" : "bg-muted"}`}>
                <FileSpreadsheet className={`w-7 h-7 ${exportFormat === "excel" ? "text-green" : "text-muted-foreground"}`} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Export Excel</h3>
                <p className="text-sm text-muted-foreground">Format .xlsx untuk analisis data</p>
              </div>
              {exportFormat === "excel" && (
                <CheckCircle className="w-6 h-6 text-green ml-auto" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-playful cursor-pointer group" onClick={() => setExportFormat("pdf")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${exportFormat === "pdf" ? "bg-primary/20" : "bg-muted"}`}>
                <FileText className={`w-7 h-7 ${exportFormat === "pdf" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Export PDF</h3>
                <p className="text-sm text-muted-foreground">Format .pdf untuk laporan resmi</p>
              </div>
              {exportFormat === "pdf" && (
                <CheckCircle className="w-6 h-6 text-primary ml-auto" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-playful">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-display">Filter Data</CardTitle>
          <CardDescription>Pilih data yang ingin di-export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Cari Siswa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nama siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Tugas</Label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tugas</SelectItem>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>{assignment.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="NOT_SUBMITTED">Belum Dikumpulkan</SelectItem>
                  <SelectItem value="PENDING">Menunggu Review</SelectItem>
                  <SelectItem value="REVISION">Perlu Revisi</SelectItem>
                  <SelectItem value="GRADED">Disetujui</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      <Card className="card-playful">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display">Preview Data</CardTitle>
              <CardDescription>{filteredData.length} data ditemukan</CardDescription>
            </div>
            <Button 
              variant="gradient" 
              className="gap-2"
              onClick={() => setIsPreviewOpen(true)}
              disabled={filteredData.length === 0 || loading}
            >
              <Eye className="w-4 h-4" />
              Review & Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Tugas</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRows.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectRow(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.student?.name || "Siswa"}</TableCell>
                        <TableCell>{item.student?.className || "-"}</TableCell>
                        <TableCell>{item.assignment?.title || "-"}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${item.grade !== null && item.grade >= 80 ? "text-green" : item.grade !== null ? "text-secondary" : "text-muted-foreground"}`}>
                            {item.grade !== null ? item.grade : "-"}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("id-ID") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Tidak ada data yang sesuai filter</p>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} data
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview & Export Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {exportFormat === "excel" ? (
                <FileSpreadsheet className="w-5 h-5 text-green" />
              ) : (
                <FileText className="w-5 h-5 text-primary" />
              )}
              Preview Export {exportFormat.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Review data sebelum di-export ({dataToExport.length} data)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>No</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Judul Tugas</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Review/Feedback</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataToExport.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.student?.name || "Siswa"}</TableCell>
                      <TableCell>{item.student?.className || "-"}</TableCell>
                      <TableCell>{item.assignment?.title || "-"}</TableCell>
                      <TableCell className="font-bold">{item.grade !== null ? item.grade : "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.feedback || "-"}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} disabled={exporting}>
              Batal
            </Button>
            <Button variant="gradient" className="gap-2" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengexport...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Export;
