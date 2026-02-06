import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { FrontendUser } from "@/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Users,
  Image,
  Upload,
  Eye,
  Star,
  RotateCcw,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  X,
  Edit,
  Trash2,
  XCircle,
  Tag,
  MoreVertical,
  Archive,
  Power,
  CheckSquare,
  Square,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { assignmentService } from "@/services/assignment.service";
import { submissionService } from "@/services/submission.service";
import { certificateService } from "@/services/certificate.service";
import { mediaTypeService } from "@/services/mediaType.service";
import { classService } from "@/services/class.service";
import type { Assignment, Submission, MediaType, Class, CreateAssignmentRequest, UpdateAssignmentRequest, CreateSubmissionRequest, UpdateSubmissionRequest } from "@/types/api";

// Submission status types: pending, revision, graded
// pending = waiting for teacher review
// revision = returned to student for revision
// graded = approved and graded

// Extended types for assignments with additional data
type AssignmentWithSubmissions = Assignment & {
  submissions: number;
  total: number;
  pendingCount: number;
  revisionCount: number;
  gradedCount: number;
  studentSubmissions: Submission[];
};

type StudentAssignmentView = Omit<Assignment, 'status'> & {
  status: "pending" | "revision" | "graded" | "not_submitted";
  grade: number | null;
  feedback: string | null;
  revisionNote: string | null;
  revisionCount: number;
  submittedAt: string | null;
  imageHistory?: Array<{
    image: string;
    submittedAt: string;
    version: number;
  }>;
};

type ExtendedAssignment = AssignmentWithSubmissions | StudentAssignmentView;

// Type for class with count data
type ClassWithCount = Class & {
  _count?: {
    students?: number;
  };
};

// Type for assignment class with count
type AssignmentClassWithCount = {
  id: string;
  class: ClassWithCount;
};

// Helper function to get optimized image URL with fallback
const getImageUrl = (
  submission: Submission | null,
  type: 'thumbnail' | 'medium' | 'full' = 'full'
): string => {
  if (!submission) return '';
  
  switch (type) {
    case 'thumbnail':
      return submission.imageThumbnail || submission.imageMedium || submission.imageUrl;
    case 'medium':
      return submission.imageMedium || submission.imageUrl;
    case 'full':
    default:
      return submission.imageUrl;
  }
};

// Helper function for image history items (from imageHistory array)
const getImageHistoryUrl = (
  imageUrl: string,
  type: 'thumbnail' | 'medium' | 'full' = 'full'
): string => {
  // For image history, we only have the full imageUrl stored
  // In a real scenario, you might want to derive thumbnail/medium paths
  // For now, we'll return the full imageUrl for all types
  return imageUrl;
};

const Assignments = () => {
  const { user } = useOutletContext<{ user: FrontendUser }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<StudentAssignmentView | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState<string>("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Data states
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit/Delete states for teacher
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<"delete" | "draft">("delete");
  const [editAssignmentData, setEditAssignmentData] = useState({ title: "", description: "", deadline: "", mediaTypeId: "", artworkSize: "", classIds: [] as string[], status: "ACTIVE" as "DRAFT" | "ACTIVE" | "COMPLETED" });
  
  // Edit/Cancel states for student
  const [isEditSubmissionDialogOpen, setIsEditSubmissionDialogOpen] = useState(false);
  const [isCancelSubmissionDialogOpen, setIsCancelSubmissionDialogOpen] = useState(false);
  const [submissionFormData, setSubmissionFormData] = useState({ title: "", description: "", image: null as File | null });
  const [submissionImagePreview, setSubmissionImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const navigate = useNavigate();
  const [certificateLoading, setCertificateLoading] = useState(false);
  
  // Category management
  const [selectedMediaType, setSelectedMediaType] = useState<string>("");
  const [newMediaTypeName, setNewMediaTypeName] = useState<string>("");
  const [isAddingMediaType, setIsAddingMediaType] = useState(false);
  
  // Bulk select states
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const isTeacher = user.role === "teacher" || user.role === "TEACHER";

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        limit: number;
        status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
        search?: string;
      } = {
        page: 1,
        limit: 100,
      };
      
      // For teachers, only fetch assignments they created
      if (isTeacher && user.id) {
        // Note: Backend should filter by createdById, but we'll filter on frontend as well
        // The backend endpoint might not support createdById filter yet, so we filter client-side
      }
      
      if (selectedTab !== "all") {
        if (isTeacher) {
          const statusMap: Record<string, 'DRAFT' | 'ACTIVE' | 'COMPLETED'> = {
            active: 'ACTIVE',
            completed: 'COMPLETED',
            draft: 'DRAFT',
          };
          const mappedStatus = statusMap[selectedTab];
          if (mappedStatus) {
            params.status = mappedStatus;
          }
        }
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await assignmentService.getAssignments(params);
      if (response.success && response.data) {
        let data = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        // Filter by createdById for teachers (only show assignments they created)
        if (isTeacher && user.id) {
          data = data.filter((assignment: Assignment) => assignment.createdById === user.id);
        }
        
        setAssignments(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat tugas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTab, searchQuery, isTeacher, user.id, toast]);

  // Fetch submissions for teacher (all submissions) or student (own submissions)
  const fetchSubmissions = useCallback(async () => {
    try {
      const params: {
        page: number;
        limit: number;
        studentId?: string;
      } = {
        page: 1,
        limit: 100,
      };
      
      if (!isTeacher && user.id) {
        params.studentId = user.id;
      }

      const response = await submissionService.getSubmissions(params);
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  }, [isTeacher, user.id]);

  // Fetch media types
  const fetchMediaTypes = useCallback(async () => {
    try {
      const response = await mediaTypeService.getMediaTypes({ isActive: true });
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        setMediaTypes(data);
      }
    } catch (error) {
      console.error("Error fetching media types:", error);
    }
  }, []);

  // Fetch classes (for teacher)
  const fetchClasses = useCallback(async () => {
    if (!isTeacher) return;
    try {
      const response = await classService.getClasses();
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  }, [isTeacher]);

  // Initial data fetch
  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
    fetchMediaTypes();
    fetchClasses();
  }, [fetchAssignments, fetchSubmissions, fetchMediaTypes, fetchClasses]);

  // Get submissions for a specific assignment
  const getSubmissionsForAssignment = (assignmentId: string): Submission[] => {
    return submissions.filter(s => s.assignmentId === assignmentId);
  };

  // Get student's submission for an assignment
  const getStudentSubmission = (assignmentId: string): Submission | undefined => {
    return submissions.find(s => s.assignmentId === assignmentId && s.studentId === user.id);
  };

  // Transform assignment for display (with submission info)
  const getAssignmentWithSubmissions = (assignment: Assignment): AssignmentWithSubmissions => {
    const assignmentSubmissions = getSubmissionsForAssignment(assignment.id);
    const pendingCount = assignmentSubmissions.filter(s => s.status === "PENDING").length;
    const revisionCount = assignmentSubmissions.filter(s => s.status === "REVISION").length;
    const gradedCount = assignmentSubmissions.filter(s => s.status === "GRADED").length;
    
    // Calculate total students (from classes assigned to this assignment)
    // Check if class data includes _count.students (from backend)
    const totalStudents = assignment.classes?.reduce((sum, ac) => {
      // Try to get student count from class._count.students (if available from backend)
      const classData = ac.class as ClassWithCount;
      if (classData?._count?.students) {
        return sum + classData._count.students;
      }
      // Fallback: try to get from classes state if available
      const classInfo = classes.find(c => c.id === ac.class?.id);
      // If we have class info but no count, we can't calculate accurately
      // So we'll use a better fallback: use the maximum between submissions count and a reasonable estimate
      return sum;
    }, 0) || 0;

    // If totalStudents is 0, use submissions count as minimum (at least those who submitted)
    // But ideally, backend should provide the actual total
    const finalTotal = totalStudents > 0 ? totalStudents : assignmentSubmissions.length;

    return {
      ...assignment,
      submissions: assignmentSubmissions.length,
      total: finalTotal,
      pendingCount,
      revisionCount,
      gradedCount,
      studentSubmissions: assignmentSubmissions,
    };
  };

  // Transform assignment for student view
  const getStudentAssignmentView = (assignment: Assignment): StudentAssignmentView => {
    const submission = getStudentSubmission(assignment.id);
    if (!submission) {
      return {
        ...assignment,
        status: "not_submitted" as const,
        grade: null,
        feedback: null,
        revisionNote: null,
        revisionCount: 0,
        submittedAt: null,
        imageHistory: [],
      };
    }
    
    return {
      ...assignment,
      status: submission.status.toLowerCase() as "pending" | "revision" | "graded" | "not_submitted",
      grade: submission.grade,
      feedback: submission.feedback,
      revisionNote: submission.revisions?.[submission.revisions.length - 1]?.revisionNote || null,
      revisionCount: submission.revisionCount,
      submittedAt: submission.submittedAt,
      imageHistory: submission.imageHistory || [],
    };
  };

  // Type guard to check if assignment is StudentAssignmentView
  const isStudentAssignmentView = (assignment: ExtendedAssignment): assignment is StudentAssignmentView => {
    return 'grade' in assignment && 'feedback' in assignment;
  };

  // Type guard to check if assignment is AssignmentWithSubmissions
  const isAssignmentWithSubmissions = (assignment: ExtendedAssignment): assignment is AssignmentWithSubmissions => {
    return 'submissions' in assignment && 'total' in assignment && !('grade' in assignment);
  };

  const filteredAssignments = (assignments
    .map(assignment => isTeacher ? getAssignmentWithSubmissions(assignment) : getStudentAssignmentView(assignment)) as ExtendedAssignment[])
    .filter((assignment) => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedTab === "all") return matchesSearch;
      if (isTeacher) {
        const statusMap: Record<string, 'DRAFT' | 'ACTIVE' | 'COMPLETED'> = {
          active: "ACTIVE",
          completed: "COMPLETED",
          draft: "DRAFT",
        };
        const mappedStatus = statusMap[selectedTab];
        return matchesSearch && mappedStatus && assignment.status === mappedStatus;
      } else {
        // Student tabs: all, pending (needs action), graded
        if (!isStudentAssignmentView(assignment)) return false;
        if (selectedTab === "pending") {
          return matchesSearch && (assignment.status === "pending" || assignment.status === "revision" || assignment.status === "not_submitted");
        }
        if (selectedTab === "graded") {
          return matchesSearch && assignment.status === "graded";
        }
      }
      return matchesSearch;
    });

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMediaType || editAssignmentData.classIds.length === 0) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Tipe Media dan kelas harus dipilih",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const data: CreateAssignmentRequest = {
        title: editAssignmentData.title,
        description: editAssignmentData.description,
        mediaTypeId: selectedMediaType,
        artworkSize: editAssignmentData.artworkSize || undefined,
        deadline: new Date(editAssignmentData.deadline).toISOString(),
        classIds: editAssignmentData.classIds,
        status: editAssignmentData.status, // Use selected status
      };

      const response = await assignmentService.createAssignment(data);
      if (response.success) {
        toast({
          title: "Tugas Dibuat! 📝",
          description: "Tugas baru berhasil dibuat dan dikirim ke siswa",
        });
        setIsCreateDialogOpen(false);
        setEditAssignmentData({ title: "", description: "", deadline: "", mediaTypeId: "", artworkSize: "", classIds: [], status: "ACTIVE" });
        setSelectedMediaType("");
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal membuat tugas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentAssignment || !submissionFormData.title || !submissionFormData.image) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Judul dan gambar harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const data: CreateSubmissionRequest = {
        assignmentId: selectedStudentAssignment.id,
        title: submissionFormData.title,
        description: submissionFormData.description || undefined,
        image: submissionFormData.image,
      };

      const response = await submissionService.createSubmission(data);
      if (response.success) {
        toast({
          title: "Tugas Dikumpulkan! 🎉",
          description: "Karya berhasil dikumpulkan untuk dinilai guru",
        });
        setIsSubmitDialogOpen(false);
        setSelectedStudentAssignment(null);
        setSubmissionFormData({ title: "", description: "", image: null });
        setSubmissionImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchSubmissions();
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengumpulkan tugas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAndGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !gradeValue) {
      toast({
        title: "Nilai Diperlukan",
        description: "Masukkan nilai untuk karya siswa",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const grade = parseInt(gradeValue);
      if (isNaN(grade) || grade < 0 || grade > 100) {
        toast({
          title: "Nilai Tidak Valid",
          description: "Nilai harus antara 0-100",
          variant: "destructive",
        });
        return;
      }

      const response = await submissionService.gradeSubmission(selectedSubmission.id, {
        grade,
        feedback: feedbackValue || undefined,
      });

      if (response.success) {
        toast({
          title: "Karya Disetujui! ⭐",
          description: "Nilai dan feedback berhasil disimpan",
        });
        setIsReviewDialogOpen(false);
        setSelectedSubmission(null);
        setGradeValue("");
        setFeedbackValue("");
        fetchSubmissions();
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memberikan nilai";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnForRevision = async () => {
    if (!selectedSubmission || !revisionNote.trim()) {
      toast({
        title: "Catatan Diperlukan",
        description: "Berikan catatan revisi untuk siswa",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await submissionService.returnForRevision(selectedSubmission.id, {
        revisionNote: revisionNote.trim(),
      });

      if (response.success) {
        toast({
          title: "Dikembalikan untuk Revisi 📝",
          description: "Siswa akan menerima notifikasi untuk memperbaiki karya",
        });
        setIsReviewDialogOpen(false);
        setSelectedSubmission(null);
        setRevisionNote("");
        fetchSubmissions();
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengembalikan untuk revisi";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher: Edit Assignment
  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditAssignmentData({
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline.split('T')[0], // Format for date input
      mediaTypeId: assignment.mediaTypeId,
      artworkSize: assignment.artworkSize || "",
      classIds: assignment.classes?.map(ac => ac.class.id) || [],
      status: assignment.status || "ACTIVE",
    });
    setSelectedMediaType(assignment.mediaTypeId);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      const data: UpdateAssignmentRequest = {
        title: editAssignmentData.title,
        description: editAssignmentData.description,
        mediaTypeId: editAssignmentData.mediaTypeId || undefined,
        artworkSize: editAssignmentData.artworkSize || undefined,
        deadline: new Date(editAssignmentData.deadline).toISOString(),
        classIds: editAssignmentData.classIds.length > 0 ? editAssignmentData.classIds : undefined,
        status: editAssignmentData.status,
      };

      const response = await assignmentService.updateAssignment(selectedAssignment.id, data);
      if (response.success) {
        toast({
          title: "Tugas Diperbarui! ✏️",
          description: "Perubahan tugas berhasil disimpan",
        });
        setIsEditDialogOpen(false);
        setSelectedAssignment(null);
        setEditAssignmentData({ title: "", description: "", deadline: "", mediaTypeId: "", artworkSize: "", classIds: [], status: "ACTIVE" });
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui tugas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher: Delete Assignment
  const handleDeleteAssignment = (assignment: Assignment, action: "delete" | "draft" = "delete") => {
    setSelectedAssignment(assignment);
    setDeleteAction(action);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      if (deleteAction === "delete") {
        const response = await assignmentService.deleteAssignment(selectedAssignment.id);
        if (response.success) {
          toast({
            title: "Tugas Dihapus! 🗑️",
            description: "Tugas berhasil dihapus permanen",
            variant: "destructive",
          });
        }
      } else {
        const response = await assignmentService.updateAssignment(selectedAssignment.id, { status: "DRAFT" });
        if (response.success) {
          toast({
            title: "Tugas Disimpan sebagai Draft! 📝",
            description: "Tugas berhasil disimpan sebagai draft",
          });
        }
      }
      setIsDeleteDialogOpen(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus tugas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Media Type Management
  const handleAddMediaType = async () => {
    if (!newMediaTypeName.trim()) return;

    try {
      setSubmitting(true);
      const response = await mediaTypeService.createMediaType({
        name: newMediaTypeName.trim(),
        description: "",
      });

      if (response.success && response.data) {
        toast({
          title: "Media Type Ditambahkan! ✅",
          description: `Media Type "${newMediaTypeName.trim()}" berhasil ditambahkan`,
        });
        setSelectedMediaType(response.data.mediaType.id);
        setNewMediaTypeName("");
        setIsAddingMediaType(false);
        fetchMediaTypes();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan media type";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMediaType = async (mediaTypeId: string) => {
    if (mediaTypes.length <= 1) {
      toast({
        title: "Tidak Bisa Menghapus",
        description: "Minimal harus ada 1 media type",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await mediaTypeService.deleteMediaType(mediaTypeId);
      if (response.success) {
        toast({
          title: "Media Type Dihapus! 🗑️",
          description: "Media Type berhasil dihapus",
        });
        if (selectedMediaType === mediaTypeId) {
          setSelectedMediaType("");
        }
        fetchMediaTypes();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus media type";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Actions
  const handleToggleSelect = (assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssignments.length === filteredAssignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(filteredAssignments.map((a: ExtendedAssignment) => a.id));
    }
  };

  const handleBulkDelete = async (action: "delete" | "draft") => {
    if (selectedAssignments.length === 0) return;
    
    try {
      setSubmitting(true);
      if (action === "delete") {
        const response = await assignmentService.bulkDelete({
          assignmentIds: selectedAssignments,
        });
        if (response.success) {
          toast({
            title: "Tugas Dihapus! 🗑️",
            description: `${selectedAssignments.length} tugas berhasil dihapus permanen`,
            variant: "destructive",
          });
        }
      } else {
        const response = await assignmentService.bulkUpdateStatus({
          assignmentIds: selectedAssignments,
          status: "DRAFT",
        });
        if (response.success) {
          toast({
            title: "Tugas Disimpan sebagai Draft! 📝",
            description: `${selectedAssignments.length} tugas berhasil disimpan sebagai draft`,
          });
        }
      }
      setSelectedAssignments([]);
      setIsBulkMode(false);
      fetchAssignments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal melakukan aksi bulk";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedAssignments.length === 0) return;
    
    try {
      setSubmitting(true);
      const response = await assignmentService.bulkUpdateStatus({
        assignmentIds: selectedAssignments,
        status: "ACTIVE",
      });
      if (response.success) {
        toast({
          title: "Tugas Diaktifkan! ✅",
          description: `${selectedAssignments.length} draft berhasil diaktifkan`,
        });
        setSelectedAssignments([]);
        setIsBulkMode(false);
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengaktifkan tugas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Student: Edit Submission
  const handleEditSubmission = (assignment: StudentAssignmentView) => {
    const submission = getStudentSubmission(assignment.id);
    if (!submission) return;
    
    setSelectedStudentAssignment(assignment);
    setSubmissionFormData({
      title: submission.title,
      description: submission.description || "",
      image: null,
    });
    setIsEditSubmissionDialogOpen(true);
  };

  const handleSaveEditSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    const submission = selectedStudentAssignment ? getStudentSubmission(selectedStudentAssignment.id) : null;
    if (!submission) return;

    try {
      setSubmitting(true);
      const data: UpdateSubmissionRequest = {
        title: submissionFormData.title,
        description: submissionFormData.description || undefined,
        image: submissionFormData.image || undefined,
      };

      const response = await submissionService.updateSubmission(submission.id, data);
      if (response.success) {
        toast({
          title: "Karya Diperbarui! ✏️",
          description: "Perubahan karya berhasil disimpan",
        });
        setIsEditSubmissionDialogOpen(false);
        setSelectedStudentAssignment(null);
        setSubmissionFormData({ title: "", description: "", image: null });
        fetchSubmissions();
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui karya";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Student: Cancel Submission
  const handleCancelSubmission = (assignment: StudentAssignmentView) => {
    setSelectedStudentAssignment(assignment);
    setIsCancelSubmissionDialogOpen(true);
  };

  const handleConfirmCancelSubmission = async () => {
    const submission = selectedStudentAssignment ? getStudentSubmission(selectedStudentAssignment.id) : null;
    if (!submission) return;

    try {
      setSubmitting(true);
      const response = await submissionService.deleteSubmission(submission.id);
      if (response.success) {
        toast({
          title: "Pengumpulan Dibatalkan! ❌",
          description: "Karya berhasil dibatalkan dan dapat dikumpulkan kembali",
        });
        setIsCancelSubmissionDialogOpen(false);
        setSelectedStudentAssignment(null);
        fetchSubmissions();
        fetchAssignments();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal membatalkan pengumpulan";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsReviewDialogOpen(true);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isReviewDialogOpen) {
      setGradeValue("");
      setFeedbackValue("");
      setRevisionNote("");
    }
  }, [isReviewDialogOpen]);

  // Reset zoom and position when image modal closes
  useEffect(() => {
    if (!isImageModalOpen) {
      setImageZoom(100);
      setImagePosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isImageModalOpen]);

  // Reset position when zoom changes to 100%
  useEffect(() => {
    if (imageZoom === 100) {
      setImagePosition({ x: 0, y: 0 });
    }
  }, [imageZoom]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        setImageZoom((prev) => Math.min(prev + 25, 300));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setImageZoom((prev) => Math.max(prev - 25, 50));
      } else if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen]);

  const getStatusBadge = (status: string, grade?: number | string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green/10 text-green rounded-lg text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Selesai
          </span>
        );
      case "ACTIVE":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Berlangsung
          </span>
        );
      case "DRAFT":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-semibold">
            <AlertCircle className="w-3 h-3" />
            Draft
          </span>
        );
      // Student statuses (lowercase from getStudentAssignmentView)
      case "GRADED":
      case "graded":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green/10 text-green rounded-lg text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Dinilai ({typeof grade === 'number' ? grade : grade})
          </span>
        );
      case "PENDING":
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Menunggu Review
          </span>
        );
      case "REVISION":
      case "revision":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-lg text-xs font-semibold">
            <RotateCcw className="w-3 h-3" />
            Perlu Revisi
          </span>
        );
      case "NOT_SUBMITTED":
      case "not_submitted":
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

  const getSubmissionStatusBadge = (status: string, grade?: number | string, revisionCount?: number) => {
    switch (status.toUpperCase()) {
      case "GRADED":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green/10 text-green rounded-lg text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Disetujui ({typeof grade === 'number' ? grade : grade})
          </span>
        );
      case "PENDING":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Menunggu Review {revisionCount && revisionCount > 0 ? `(Revisi ke-${revisionCount})` : ""}
          </span>
        );
      case "REVISION":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-lg text-xs font-semibold">
            <RotateCcw className="w-3 h-3" />
            Dikembalikan
          </span>
        );
      default:
        return null;
    }
  };

  // Count pending submissions for a specific assignment
  const getPendingCount = (assignment: AssignmentWithSubmissions) => {
    return assignment.studentSubmissions?.filter((s: Submission) => s.status === "PENDING").length || 0;
  };

  const getRevisionCount = (assignment: AssignmentWithSubmissions) => {
    return assignment.studentSubmissions?.filter((s: Submission) => s.status === "REVISION").length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Tugas <span className="text-gradient">Seni</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            {isTeacher ? "Kelola tugas untuk siswa" : "Daftar tugas yang harus dikerjakan"}
          </p>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            {isBulkMode ? (
              <>
                <Button variant="outline" onClick={() => { setIsBulkMode(false); setSelectedAssignments([]); }}>
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button variant="outline" onClick={handleSelectAll}>
                  {selectedAssignments.length === filteredAssignments.length ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Batal Pilih Semua
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Pilih Semua
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreVertical className="w-4 h-4 mr-2" />
                      Aksi ({selectedAssignments.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkActivate()}>
                      <Power className="w-4 h-4 mr-2" />
                      Aktifkan Draft
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkDelete("draft")}>
                      <Archive className="w-4 h-4 mr-2" />
                      Simpan sebagai Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkDelete("delete")} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Permanen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsBulkMode(true)}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Pilih
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gradient" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Buat Tugas
                    </Button>
                  </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Buat Tugas Baru</DialogTitle>
                <DialogDescription>
                  Buat tugas baru untuk siswa
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul Tugas</Label>
                  <Input 
                    placeholder="Masukkan judul tugas" 
                    className="rounded-xl" 
                    value={editAssignmentData.title}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, title: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea 
                    placeholder="Deskripsi tugas..." 
                    className="rounded-xl min-h-24" 
                    value={editAssignmentData.description}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, description: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Media</Label>
                  <div className="flex gap-2">
                    <Select value={selectedMediaType} onValueChange={setSelectedMediaType} required>
                      <SelectTrigger className="rounded-xl flex-1">
                        <SelectValue placeholder="Pilih tipe media" />
                      </SelectTrigger>
                      <SelectContent>
                        {mediaTypes.map((mt) => (
                          <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Popover open={isAddingMediaType} onOpenChange={setIsAddingMediaType}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="rounded-xl">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Tambah Tipe Media Baru</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nama tipe media"
                              value={newMediaTypeName}
                              onChange={(e) => setNewMediaTypeName(e.target.value)}
                              className="rounded-lg h-9"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddMediaType();
                                }
                              }}
                            />
                            <Button type="button" size="sm" onClick={handleAddMediaType} className="rounded-lg" disabled={submitting}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ukuran Karya (opsional)</Label>
                  <Input 
                    placeholder="cth: 30x40cm" 
                    className="rounded-xl" 
                    value={editAssignmentData.artworkSize}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, artworkSize: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Contoh: 30x40cm, A4, dll</p>
                </div>
                {isTeacher && classes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-xl">
                      {classes.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`class-${cls.id}`}
                            checked={editAssignmentData.classIds.includes(cls.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditAssignmentData({
                                  ...editAssignmentData,
                                  classIds: [...editAssignmentData.classIds, cls.id],
                                });
                              } else {
                                setEditAssignmentData({
                                  ...editAssignmentData,
                                  classIds: editAssignmentData.classIds.filter((id) => id !== cls.id),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <label htmlFor={`class-${cls.id}`} className="text-sm font-medium">
                            {cls.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input 
                    type="date" 
                    className="rounded-xl" 
                    value={editAssignmentData.deadline}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, deadline: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={editAssignmentData.status} 
                    onValueChange={(value) => setEditAssignmentData({ ...editAssignmentData, status: value as "DRAFT" | "ACTIVE" | "COMPLETED" })}
                    required
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">
                        <div className="flex flex-col">
                          <span className="font-semibold">DRAFT</span>
                          <span className="text-xs text-muted-foreground">Status draft, belum diaktifkan</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ACTIVE">
                        <div className="flex flex-col">
                          <span className="font-semibold">ACTIVE</span>
                          <span className="text-xs text-muted-foreground">Status aktif, tugas sedang berjalan</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="COMPLETED">
                        <div className="flex flex-col">
                          <span className="font-semibold">COMPLETED</span>
                          <span className="text-xs text-muted-foreground">Status selesai</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>
                    Batal
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1" disabled={!selectedMediaType || editAssignmentData.classIds.length === 0 || submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Buat Tugas
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="card-playful">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari tugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Status Filter */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full md:w-auto">
              <TabsList className="h-10 rounded-xl bg-muted/50">
                <TabsTrigger
                  value="all"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Semua
                </TabsTrigger>
                <TabsTrigger
                  value={isTeacher ? "active" : "in_progress"}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Berlangsung
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Selesai
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Assignments List */}
      {!loading && (
        <div className="space-y-4">
          {filteredAssignments.map((assignment: ExtendedAssignment) => (
            <Card key={assignment.id} className={`card-playful group ${isBulkMode && isTeacher ? 'border-2' : ''} ${selectedAssignments.includes(assignment.id) ? 'border-primary' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Bulk Select Checkbox */}
                  {isBulkMode && isTeacher && (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(assignment.id)}
                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: selectedAssignments.includes(assignment.id) ? 'hsl(var(--primary))' : 'transparent',
                          borderColor: selectedAssignments.includes(assignment.id) ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        }}
                      >
                        {selectedAssignments.includes(assignment.id) && (
                          <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-pink/20 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-7 h-7 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(
                        assignment.status, 
                        isStudentAssignmentView(assignment) ? assignment.grade : undefined
                      )}
                      {isTeacher && isAssignmentWithSubmissions(assignment) && getPendingCount(assignment) > 0 && (
                        <span className="text-xs text-accent font-semibold">
                          {getPendingCount(assignment)} belum dinilai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Deadline: {new Date(assignment.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    {isTeacher && isAssignmentWithSubmissions(assignment) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {assignment.submissions || 0}/{assignment.total || 0} dikumpulkan
                      </div>
                    )}
                    {assignment.mediaType && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Tag className="w-4 h-4" />
                        {typeof assignment.mediaType === 'string' ? assignment.mediaType : assignment.mediaType.name}
                      </div>
                    )}
                    {/* Teacher and Class Info for Students */}
                    {!isTeacher && assignment.createdBy && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        Guru: {assignment.createdBy.name}
                      </div>
                    )}
                    {!isTeacher && assignment.classes && assignment.classes.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ClipboardList className="w-4 h-4" />
                        Kelas: {assignment.classes.map((c) => c.class?.name || "").filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Status Badge for Students - Removed redundant text */}

                  {/* Progress for Teachers */}
                  {isTeacher && assignment.status === "ACTIVE" && assignment.total > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Pengumpulan</span>
                        <span className="font-semibold">{Math.round(((assignment.submissions || 0) / assignment.total) * 100)}%</span>
                      </div>
                      <Progress value={((assignment.submissions || 0) / assignment.total) * 100} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 md:flex-col">
                  {isTeacher ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          // Extract base assignment properties
                          const baseAssignment: Assignment = {
                            id: assignment.id,
                            title: assignment.title,
                            description: assignment.description,
                            mediaTypeId: assignment.mediaTypeId,
                            deadline: assignment.deadline,
                            status: isAssignmentWithSubmissions(assignment) ? assignment.status : 'ACTIVE',
                            createdById: assignment.createdById,
                            createdAt: assignment.createdAt,
                            updatedAt: assignment.updatedAt,
                            mediaType: assignment.mediaType,
                            createdBy: assignment.createdBy,
                            classes: assignment.classes,
                          };
                          setSelectedAssignment(baseAssignment);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat Detail
                      </Button>
                      {assignment.status === "ACTIVE" && getPendingCount(assignment) > 0 && (
                        <Button 
                          variant="teal" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            const pendingSubmission = assignment.studentSubmissions?.find((s: Submission) => s.status === "PENDING");
                            if (pendingSubmission) {
                              openReviewDialog(pendingSubmission);
                            }
                          }}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Review Karya
                        </Button>
                      )}
                      {(assignment.status === "ACTIVE" || assignment.status === "DRAFT") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <MoreVertical className="w-4 h-4 mr-1" />
                              Lainnya
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAssignment(assignment)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Tugas
                            </DropdownMenuItem>
                            {assignment.status === "DRAFT" && (
                              <DropdownMenuItem onClick={async () => {
                                try {
                                  setSubmitting(true);
                                  const response = await assignmentService.updateAssignment(assignment.id, { status: "ACTIVE" });
                                  if (response.success) {
                                    toast({
                                      title: "Tugas Diaktifkan! ✅",
                                      description: "Tugas berhasil diaktifkan",
                                    });
                                    fetchAssignments();
                                  }
                                } catch (error) {
                                  const errorMessage = error instanceof Error ? error.message : "Gagal mengaktifkan tugas";
                                  toast({
                                    title: "Error",
                                    description: errorMessage,
                                    variant: "destructive",
                                  });
                                } finally {
                                  setSubmitting(false);
                                }
                              }}>
                                <Power className="w-4 h-4 mr-2" />
                                Aktifkan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteAssignment(assignment, "draft")}>
                              <Archive className="w-4 h-4 mr-2" />
                              Simpan sebagai Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAssignment(assignment, "delete")}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus Permanen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Student: Not submitted yet */}
                      {isStudentAssignmentView(assignment) && assignment.status === "not_submitted" && (
                        <Button 
                          variant="gradient" 
                          size="sm"
                          onClick={() => {
                            setSelectedStudentAssignment(assignment);
                            setSubmissionFormData({ title: "", description: "", image: null });
                            setIsSubmitDialogOpen(true);
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Kumpulkan
                        </Button>
                      )}
                      {/* Student: Needs revision */}
                      {isStudentAssignmentView(assignment) && assignment.status === "revision" && (
                        <Button 
                          variant="accent" 
                          size="sm"
                          onClick={() => {
                            setSelectedStudentAssignment(assignment);
                            setSubmissionFormData({ title: "", description: "", image: null });
                            setSubmissionImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            setIsSubmitDialogOpen(true);
                          }}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Upload Revisi
                        </Button>
                      )}
                      {/* Student: Graded - view feedback */}
                      {isStudentAssignmentView(assignment) && assignment.status === "graded" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedStudentAssignment(assignment);
                            setIsFeedbackDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Lihat Feedback
                        </Button>
                      )}
                      {/* Student: Pending review */}
                      {isStudentAssignmentView(assignment) && assignment.status === "pending" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditSubmission(assignment)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit Karya
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelSubmission(assignment)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Batalkan
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog for Teachers */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (() => {
            const assignmentWithSubmissions = getAssignmentWithSubmissions(selectedAssignment);
            return (
              <div className="space-y-4">
                {/* Assignment Info */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-semibold text-sm">
                      {new Date(selectedAssignment.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">Pengumpulan</p>
                    <p className="font-semibold text-sm">{assignmentWithSubmissions.submissions || 0}/{assignmentWithSubmissions.total || 0}</p>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-xl">
                    <p className="text-xs text-muted-foreground">Menunggu Review</p>
                    <p className="font-semibold text-sm text-secondary">{assignmentWithSubmissions.pendingCount || 0}</p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <p className="text-xs text-muted-foreground">Perlu Revisi</p>
                    <p className="font-semibold text-sm text-accent">{assignmentWithSubmissions.revisionCount || 0}</p>
                  </div>
                </div>

                {/* Submissions List */}
                <div>
                  <h4 className="font-display font-bold mb-3">Daftar Pengumpulan</h4>
                  {assignmentWithSubmissions.studentSubmissions && assignmentWithSubmissions.studentSubmissions.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {assignmentWithSubmissions.studentSubmissions.map((submission) => (
                        <div key={submission.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={submission.student?.avatar || undefined} />
                            <AvatarFallback>{(submission.student?.name || "S").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{submission.student?.name || "Siswa"}</p>
                            <p className="text-xs text-muted-foreground">
                              {submission.student?.className || ""} • Dikumpulkan {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString("id-ID") : ""}
                              {submission.revisionCount > 0 && ` • Revisi ke-${submission.revisionCount}`}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(submission.status, submission.grade, submission.revisionCount)}
                          {submission.status === "PENDING" && (
                            <Button 
                              variant="teal" 
                              size="sm"
                              onClick={() => openReviewDialog(submission)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          )}
                          {submission.status === "REVISION" && (
                            <span className="text-xs text-accent">Menunggu revisi siswa</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">Belum ada siswa yang mengumpulkan</p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Review Dialog for Teachers - Approve/Grade or Return for Revision */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Review Karya Siswa</DialogTitle>
            <DialogDescription>
              Setujui dan beri nilai, atau kembalikan untuk revisi
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedSubmission.student?.avatar || undefined} />
                  <AvatarFallback>{(selectedSubmission.student?.name || "S").charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedSubmission.student?.name || "Siswa"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubmission.student?.className || ""}
                    {selectedSubmission.revisionCount > 0 && ` • Revisi ke-${selectedSubmission.revisionCount}`}
                  </p>
                </div>
              </div>

              {/* Artwork Preview - Side by Side if revision exists */}
              {selectedSubmission.revisionCount > 0 && selectedSubmission.imageHistory && selectedSubmission.imageHistory.length > 1 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Perbandingan Revisi</h4>
                    <span className="text-xs text-muted-foreground">
                      {selectedSubmission.imageHistory.length} versi
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Previous Version */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Versi Sebelumnya</span>
                        <span className="text-xs text-muted-foreground">
                          (v{selectedSubmission.imageHistory[selectedSubmission.imageHistory.length - 2]?.version || 1})
                        </span>
                      </div>
                      <div 
                        className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer group relative border-2 border-muted"
                        onClick={() => {
                          const prevImage = selectedSubmission.imageHistory?.[selectedSubmission.imageHistory.length - 2];
                          if (prevImage) {
                            setSelectedImageUrl(prevImage.image);
                            setImageZoom(100);
                            setImagePosition({ x: 0, y: 0 });
                            setIsImageModalOpen(true);
                          }
                        }}
                      >
                        <img
                          src={getImageHistoryUrl(selectedSubmission.imageHistory[selectedSubmission.imageHistory.length - 2]?.image || '', 'medium')}
                          alt="Karya sebelumnya"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <p className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                          Klik untuk zoom
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {selectedSubmission.imageHistory[selectedSubmission.imageHistory.length - 2]?.submittedAt 
                          ? new Date(selectedSubmission.imageHistory[selectedSubmission.imageHistory.length - 2].submittedAt).toLocaleDateString("id-ID")
                          : ''}
                      </p>
                    </div>
                    
                    {/* Current Version */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">Versi Baru</span>
                        <span className="text-xs text-muted-foreground">
                          (v{selectedSubmission.imageHistory?.[selectedSubmission.imageHistory.length - 1]?.version || 1})
                        </span>
                      </div>
                      <div 
                        className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer group relative border-2 border-primary"
                        onClick={() => {
                          setSelectedImageUrl(selectedSubmission.imageUrl);
                          setImageZoom(100);
                          setImagePosition({ x: 0, y: 0 });
                          setIsImageModalOpen(true);
                        }}
                      >
                        <img
                          src={getImageUrl(selectedSubmission, 'medium')}
                          alt="Karya baru"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <p className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                          Klik untuk zoom
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {new Date(selectedSubmission.submittedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  
                  {/* All Versions History */}
                  {selectedSubmission.imageHistory && selectedSubmission.imageHistory.length > 2 && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-xl">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Riwayat Semua Versi:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSubmission?.imageHistory?.map((version, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedImageUrl(version.image);
                              setImageZoom(100);
                              setImagePosition({ x: 0, y: 0 });
                              setIsImageModalOpen(true);
                            }}
                            className="text-xs px-2 py-1 bg-background rounded-lg hover:bg-muted transition-colors"
                          >
                            v{version.version} - {new Date(version.submittedAt).toLocaleDateString("id-ID")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Single Image Preview (No Revision) */
                <div 
                  className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer group relative"
                  onClick={() => {
                    setSelectedImageUrl(selectedSubmission.imageUrl);
                    setImageZoom(100);
                    setImagePosition({ x: 0, y: 0 });
                    setIsImageModalOpen(true);
                  }}
                >
                  <img
                    src={getImageUrl(selectedSubmission, 'medium')}
                    alt="Karya siswa"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                    Klik untuk melihat gambar lebih besar
                  </p>
                </div>
              )}

              {/* Tabs for Approve or Return */}
              <Tabs defaultValue="approve" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                  <TabsTrigger value="approve" className="rounded-lg">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Setujui & Nilai
                  </TabsTrigger>
                  <TabsTrigger value="revision" className="rounded-lg">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Kembalikan
                  </TabsTrigger>
                </TabsList>
                
                {/* Approve Tab Content */}
                <TabsContent value="approve" className="mt-4 space-y-4">
                  <form onSubmit={handleApproveAndGrade} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nilai (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="Masukkan nilai (0-100)"
                        className="rounded-xl"
                        value={gradeValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
                            setGradeValue(value);
                          }
                        }}
                        required
                      />
                      {gradeValue && (
                        <p className="text-xs text-muted-foreground">
                          Nilai: {gradeValue} / 100
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Feedback (opsional)</Label>
                      <Textarea 
                        placeholder="Berikan feedback untuk siswa..."
                        className="rounded-xl min-h-20"
                        value={feedbackValue}
                        onChange={(e) => setFeedbackValue(e.target.value)}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      variant="gradient" 
                      className="w-full" 
                      disabled={!gradeValue || parseInt(gradeValue) < 0 || parseInt(gradeValue) > 100}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Setujui & Simpan Nilai
                    </Button>
                  </form>
                </TabsContent>

                {/* Revision Tab Content */}
                <TabsContent value="revision" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Catatan Revisi</Label>
                    <Textarea 
                      placeholder="Jelaskan apa yang perlu diperbaiki siswa..."
                      className="rounded-xl min-h-24"
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-accent text-accent hover:bg-accent/10"
                    onClick={handleReturnForRevision}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Kembalikan untuk Revisi
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit/Revision Dialog for Students */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedStudentAssignment?.status === "revision" ? "Upload Revisi" : "Kumpulkan Tugas"}
            </DialogTitle>
            <DialogDescription>
              {selectedStudentAssignment?.status === "revision" 
                ? "Perbaiki karya sesuai catatan guru" 
                : `Upload karya untuk tugas "${selectedStudentAssignment?.title}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          {/* Show revision note if any */}
          {selectedStudentAssignment?.status === "revision" && selectedStudentAssignment?.revisionNote && (
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl">
              <p className="text-xs font-semibold text-accent mb-1">Catatan Revisi dari Guru:</p>
              <p className="text-sm">{selectedStudentAssignment.revisionNote}</p>
            </div>
          )}

          {/* Preview Previous Submission - Only for Revision */}
          {selectedStudentAssignment?.status === "revision" && selectedStudentAssignment?.imageHistory && selectedStudentAssignment.imageHistory.length > 0 && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-muted">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Karya yang Diupload Sebelumnya
                </h4>
                <span className="text-xs text-muted-foreground">
                  {selectedStudentAssignment.imageHistory.length} versi
                </span>
              </div>
              
              {/* Latest Previous Version */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Versi Terakhir yang Dikumpulkan
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (v{selectedStudentAssignment.imageHistory[selectedStudentAssignment.imageHistory.length - 1]?.version || 1})
                  </span>
                </div>
                <div 
                  className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer group relative border-2 border-border"
                  onClick={() => {
                    const latestVersion = selectedStudentAssignment.imageHistory?.[selectedStudentAssignment.imageHistory.length - 1];
                    if (latestVersion) {
                      setSelectedImageUrl(latestVersion.image);
                      setImageZoom(100);
                      setImagePosition({ x: 0, y: 0 });
                      setIsImageModalOpen(true);
                    }
                  }}
                >
                  <img
                    src={getImageHistoryUrl(selectedStudentAssignment.imageHistory[selectedStudentAssignment.imageHistory.length - 1]?.image || '', 'medium')}
                    alt="Karya sebelumnya"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                    Klik untuk melihat lebih besar
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {selectedStudentAssignment.imageHistory[selectedStudentAssignment.imageHistory.length - 1]?.submittedAt
                    ? `Dikumpulkan: ${new Date(selectedStudentAssignment.imageHistory[selectedStudentAssignment.imageHistory.length - 1].submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                    : ''}
                </p>
              </div>

              {/* All Previous Versions */}
              {selectedStudentAssignment?.imageHistory && selectedStudentAssignment.imageHistory.length > 1 && (
                <div className="mt-3 pt-3 border-t border-muted">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Riwayat Semua Versi:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudentAssignment.imageHistory.map((version, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(version.image);
                          setImageZoom(100);
                          setImagePosition({ x: 0, y: 0 });
                          setIsImageModalOpen(true);
                        }}
                        className="text-xs px-3 py-1.5 bg-background border border-border rounded-lg hover:bg-muted hover:border-primary transition-colors flex items-center gap-1"
                      >
                        <Image className="w-3 h-3" />
                        Versi {version.version}
                        <span className="text-muted-foreground">
                          ({new Date(version.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission-title">Judul Karya</Label>
              <Input 
                id="submission-title"
                placeholder="Masukkan judul karya" 
                className="rounded-xl" 
                value={submissionFormData.title}
                onChange={(e) => setSubmissionFormData({ ...submissionFormData, title: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission-description">Deskripsi gambar atau karya</Label>
              <Textarea 
                id="submission-description"
                placeholder="Deskripsi gambar atau karya yang akan diupload..." 
                className="rounded-xl"
                value={submissionFormData.description}
                onChange={(e) => setSubmissionFormData({ ...submissionFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission-image">Upload Karya</Label>
              <input
                id="submission-image"
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSubmissionFormData({ ...submissionFormData, image: file });
                    // Create preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setSubmissionImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div 
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {submissionImagePreview ? (
                  <div className="space-y-2">
                    <img src={submissionImagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <p className="text-sm text-muted-foreground">{submissionFormData.image?.name}</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubmissionFormData({ ...submissionFormData, image: null });
                        setSubmissionImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Ganti Gambar
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Klik untuk pilih file gambar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => {
                setIsSubmitDialogOpen(false);
                setSubmissionFormData({ title: "", description: "", image: null });
                setSubmissionImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}>
                Batal
              </Button>
              <Button 
                type="submit" 
                variant="gradient" 
                className="flex-1"
                disabled={submitting || !submissionFormData.image}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    {selectedStudentAssignment?.status === "revision" ? "Kirim Revisi" : "Kumpulkan"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog for Students */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Feedback Guru</DialogTitle>
            <DialogDescription>
              Hasil penilaian untuk tugas "{selectedStudentAssignment?.title}"
            </DialogDescription>
          </DialogHeader>
          {selectedStudentAssignment && selectedStudentAssignment.status === "graded" && (
            <div className="space-y-4">
              {/* Grade Display */}
              <div className="text-center p-6 bg-gradient-to-br from-green/10 to-primary/10 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-1">Nilai Kamu</p>
                <p className="text-5xl font-display font-bold text-green">{selectedStudentAssignment.grade}</p>
              </div>

              {/* Feedback */}
              {selectedStudentAssignment.feedback && (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Feedback dari Guru:</p>
                  <p className="text-sm">{selectedStudentAssignment.feedback}</p>
                </div>
              )}

              {/* Revision Count */}
              {selectedStudentAssignment.revisionCount > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Disetujui setelah {selectedStudentAssignment.revisionCount}x revisi
                </p>
              )}

              {/* Certificate Button */}
              <Button 
                variant="gradient" 
                className="w-full gap-2"
                onClick={async () => {
                  try {
                    setCertificateLoading(true);
                    const currentSubmission = submissions.find(s => 
                      s.studentId === user.id && s.assignmentId === selectedStudentAssignment.id
                    );
                    
                    if (!currentSubmission) {
                      toast({
                        title: "Error",
                        description: "Submission tidak ditemukan",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Try to create certificate (will return existing if already exists)
                    const response = await certificateService.createCertificate(currentSubmission.id);
                    
                    if (response.success && response.data?.certificate) {
                      const certToken = response.data.certificate.token;
                      toast({
                        title: "Sertifikat Siap!",
                        description: "Membuka halaman sertifikat...",
                      });
                      navigate(`/certificates/${certToken}`);
                    } else {
                      toast({
                        title: "Error",
                        description: "Gagal membuat sertifikat",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Gagal membuat sertifikat";
                    toast({
                      title: "Error",
                      description: errorMessage,
                      variant: "destructive",
                    });
                  } finally {
                    setCertificateLoading(false);
                  }
                }}
                disabled={certificateLoading}
              >
                {certificateLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Membuat Sertifikat...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Dapatkan Sertifikat
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full" onClick={() => setIsFeedbackDialogOpen(false)}>
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal with Zoom */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center min-h-[80vh]">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => {
                setIsImageModalOpen(false);
                setImageZoom(100);
                setImagePosition({ x: 0, y: 0 });
                setIsDragging(false);
              }}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setImageZoom((prev) => Math.min(prev + 25, 300))}
                disabled={imageZoom >= 300}
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setImageZoom((prev) => Math.max(prev - 25, 50))}
                disabled={imageZoom <= 50}
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                {imageZoom}%
              </div>
            </div>

            {/* Image Container */}
            <div 
              className="w-full h-full overflow-hidden flex items-center justify-center p-4 relative"
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -10 : 10;
                  setImageZoom((prev) => Math.max(50, Math.min(300, prev + delta)));
                }
              }}
              onMouseDown={(e) => {
                if (imageZoom > 100) {
                  setIsDragging(true);
                  setDragStart({
                    x: e.clientX - imagePosition.x,
                    y: e.clientY - imagePosition.y,
                  });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && imageZoom > 100) {
                  setImagePosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y,
                  });
                }
              }}
              onMouseUp={() => {
                setIsDragging(false);
              }}
              onMouseLeave={() => {
                setIsDragging(false);
              }}
              onTouchStart={(e) => {
                if (imageZoom > 100 && e.touches.length === 1) {
                  const touch = e.touches[0];
                  setIsDragging(true);
                  setDragStart({
                    x: touch.clientX - imagePosition.x,
                    y: touch.clientY - imagePosition.y,
                  });
                }
              }}
              onTouchMove={(e) => {
                if (isDragging && imageZoom > 100 && e.touches.length === 1) {
                  const touch = e.touches[0];
                  setImagePosition({
                    x: touch.clientX - dragStart.x,
                    y: touch.clientY - dragStart.y,
                  });
                }
              }}
              onTouchEnd={() => {
                setIsDragging(false);
              }}
              style={{
                cursor: imageZoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
            >
              <img
                src={selectedImageUrl}
                alt="Karya siswa - tampilan penuh"
                className={`max-w-full max-h-full select-none ${isDragging ? '' : 'transition-transform duration-200'}`}
                style={{
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageZoom / 100})`,
                  transformOrigin: 'center',
                }}
                draggable={false}
              />
            </div>

            {/* Zoom Info */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-xs text-center">
              <p>Gunakan tombol + / - untuk zoom</p>
              <p className="text-[10px] mt-1 opacity-75">
                {imageZoom > 100 ? 'Klik dan geser untuk melihat detail • ' : ''}
                Ctrl/Cmd + Scroll untuk zoom cepat
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog (Teacher) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Tugas</DialogTitle>
            <DialogDescription>
              Ubah informasi tugas
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEditAssignment} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Tugas</Label>
              <Input 
                placeholder="Masukkan judul tugas" 
                className="rounded-xl" 
                value={editAssignmentData.title}
                onChange={(e) => setEditAssignmentData({ ...editAssignmentData, title: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea 
                placeholder="Deskripsi tugas..." 
                className="rounded-xl min-h-24" 
                value={editAssignmentData.description}
                onChange={(e) => setEditAssignmentData({ ...editAssignmentData, description: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe Media</Label>
              <div className="flex gap-2">
                <Select value={selectedMediaType} onValueChange={(value) => {
                  setSelectedMediaType(value);
                  setEditAssignmentData({ ...editAssignmentData, mediaTypeId: value });
                }} required>
                  <SelectTrigger className="rounded-xl flex-1">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaTypes.map((mt) => (
                      <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover open={isAddingMediaType} onOpenChange={setIsAddingMediaType}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="rounded-xl">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Tambah Tipe Media Baru</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nama tipe media"
                          value={newMediaTypeName}
                          onChange={(e) => setNewMediaTypeName(e.target.value)}
                          className="rounded-lg h-9"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddMediaType();
                            }
                          }}
                        />
                        <Button type="button" size="sm" onClick={handleAddMediaType} className="rounded-lg">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input 
                type="date" 
                className="rounded-xl" 
                value={editAssignmentData.deadline}
                onChange={(e) => setEditAssignmentData({ ...editAssignmentData, deadline: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={editAssignmentData.status} 
                onValueChange={(value) => setEditAssignmentData({ ...editAssignmentData, status: value as "DRAFT" | "ACTIVE" | "COMPLETED" })}
                required
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">
                    <div className="flex flex-col">
                      <span className="font-semibold">DRAFT</span>
                      <span className="text-xs text-muted-foreground">Status draft, belum diaktifkan</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    <div className="flex flex-col">
                      <span className="font-semibold">ACTIVE</span>
                      <span className="text-xs text-muted-foreground">Status aktif, tugas sedang berjalan</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    <div className="flex flex-col">
                      <span className="font-semibold">COMPLETED</span>
                      <span className="text-xs text-muted-foreground">Status selesai</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="gradient" className="flex-1" disabled={!selectedMediaType}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Dialog (Teacher) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {deleteAction === "delete" ? "Hapus Tugas" : "Simpan sebagai Draft"}
            </DialogTitle>
            <DialogDescription>
              {deleteAction === "delete" 
                ? `Apakah Anda yakin ingin menghapus permanen tugas "${selectedAssignment?.title}"? Tindakan ini tidak dapat dibatalkan.`
                : `Simpan tugas "${selectedAssignment?.title}" sebagai draft? Tugas akan disembunyikan dari siswa dan dapat diaktifkan kembali nanti.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
              <Label className="text-sm font-semibold">Pilih Aksi:</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-background"
                  style={{ borderColor: deleteAction === "draft" ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                  <input
                    type="radio"
                    name="deleteAction"
                    value="draft"
                    checked={deleteAction === "draft"}
                    onChange={(e) => setDeleteAction(e.target.value as "delete" | "draft")}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-primary" />
                      <span className="font-semibold">Simpan sebagai Draft</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tugas akan disembunyikan dari siswa dan dapat diaktifkan kembali
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-background"
                  style={{ borderColor: deleteAction === "delete" ? "hsl(var(--destructive))" : "hsl(var(--border))" }}>
                  <input
                    type="radio"
                    name="deleteAction"
                    value="delete"
                    checked={deleteAction === "delete"}
                    onChange={(e) => setDeleteAction(e.target.value as "delete" | "draft")}
                    className="w-4 h-4 text-destructive"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-destructive" />
                      <span className="font-semibold text-destructive">Hapus Permanen</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tugas akan dihapus selamanya dan tidak dapat dikembalikan
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                variant={deleteAction === "delete" ? "destructive" : "default"}
                className="flex-1" 
                onClick={handleConfirmDelete}
              >
                {deleteAction === "delete" ? (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Permanen
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    Simpan sebagai Draft
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Submission Dialog (Student) */}
      <Dialog open={isEditSubmissionDialogOpen} onOpenChange={setIsEditSubmissionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Karya</DialogTitle>
            <DialogDescription>
              Ubah informasi karya untuk tugas "{selectedStudentAssignment?.title}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEditSubmission} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Karya</Label>
              <Input 
                placeholder="Masukkan judul karya" 
                className="rounded-xl" 
                value={submissionFormData.title}
                onChange={(e) => setSubmissionFormData({ ...submissionFormData, title: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi gambar atau karya</Label>
              <Textarea 
                placeholder="Deskripsi gambar atau karya yang akan diupload..." 
                className="rounded-xl"
                value={submissionFormData.description}
                onChange={(e) => setSubmissionFormData({ ...submissionFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Karya Baru (opsional)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Klik atau drag file ke sini
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditSubmissionDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="gradient" className="flex-1">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Submission Dialog (Student) */}
      <Dialog open={isCancelSubmissionDialogOpen} onOpenChange={setIsCancelSubmissionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Batalkan Pengumpulan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan pengumpulan karya untuk tugas "{selectedStudentAssignment?.title}"? 
              Karya akan dibatalkan dan Anda dapat mengumpulkan kembali.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsCancelSubmissionDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleConfirmCancelSubmission}>
              <XCircle className="w-4 h-4 mr-2" />
              Batalkan Pengumpulan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">Belum Ada Tugas</h3>
          <p className="text-muted-foreground mb-4">
            {isTeacher ? "Buat tugas pertamamu untuk siswa" : "Belum ada tugas yang perlu dikerjakan"}
          </p>
          {isTeacher && (
            <Button variant="gradient" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Tugas
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Assignments;
