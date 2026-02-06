/**
 * API Type Definitions
 */

// User Types
export interface User {
    id: string;
    email: string | null;
    nip: string | null;
    nis: string | null;
    name: string;
    role: "TEACHER" | "STUDENT" | "ADMIN";
    phone: string | null;
    address: string | null;
    bio: string | null;
    birthdate: string | null;
    avatar: string | null;
    className: string | null;
    classId: string | null;
    classes?: Array<{
        id: string;
        name: string;
        description: string | null;
    }>; // For TEACHER - classes they teach
    createdAt: string;
    updatedAt: string;
}

export interface Class {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MediaType {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    mediaTypeId: string;
    artworkSize?: string;
    deadline: string;
    status: "DRAFT" | "ACTIVE" | "COMPLETED";
    createdById: string;
    createdAt: string;
    updatedAt: string;
    mediaType?: MediaType;
    createdBy?: {
        id: string;
        name: string;
    };
    classes?: Array<{
        id: string;
        class: Class & {
            _count?: {
                students?: number;
            };
        };
    }>;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    title: string;
    description: string | null;
    imageUrl: string;
    imageThumbnail: string | null;
    imageMedium: string | null;
    status: "NOT_SUBMITTED" | "PENDING" | "REVISION" | "GRADED";
    grade: number | null;
    feedback: string | null;
    revisionCount: number;
    submittedAt: string | null;
    gradedAt: string | null;
    createdAt: string;
    updatedAt: string;
    assignment?: Assignment;
    student?: User;
    revisions?: SubmissionRevision[];
    imageHistory?: Array<{
        image: string;
        submittedAt: string;
        version: number;
    }>;
}

export interface SubmissionRevision {
    id: string;
    submissionId: string;
    revisionNote: string | null;
    imageUrl: string;
    version: number;
    submittedAt: string;
}

export interface Portfolio {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    imageThumbnail: string | null;
    imageMedium: string | null;
    mediaType?: MediaType | null;
    grade: number | null;
    feedback: string | null;
    student?: {
        id: string;
        name: string;
        nis: string;
        className: string;
        avatar: string | null;
    };
    assignment?: {
        id: string;
        title: string;
        description?: string;
        mediaType?: MediaType;
    };
    submittedAt: string;
    gradedAt: string | null;
}

export interface Notification {
    id: string;
    userId: string;
    type:
        | "ASSIGNMENT_CREATED"
        | "ASSIGNMENT_DEADLINE"
        | "SUBMISSION_GRADED"
        | "SUBMISSION_REVISION"
        | "ACHIEVEMENT_UNLOCKED"
        | "GENERAL";
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    unlockedAt: string;
    achievement?: Achievement;
}

// Request Types
export interface LoginRequest {
    identifier: string; // NIP untuk TEACHER, NIS untuk STUDENT
    password: string;
}

export interface RegisterRequest {
    email?: string; // Optional untuk STUDENT, required untuk TEACHER
    password: string;
    nip?: string; // Required untuk TEACHER
    nis?: string; // Required untuk STUDENT
    name: string;
    role: "STUDENT" | "TEACHER";
    phone?: string;
    classId?: string; // Required untuk STUDENT
    classIds?: string[]; // Optional untuk TEACHER (array of class IDs)
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface CreateAssignmentRequest {
    title: string;
    description: string;
    mediaTypeId: string;
    artworkSize?: string;
    deadline: string;
    classIds: string[];
    status?: "DRAFT" | "ACTIVE" | "COMPLETED";
}

export interface UpdateAssignmentRequest {
    title?: string;
    description?: string;
    mediaTypeId?: string;
    artworkSize?: string;
    deadline?: string;
    status?: "DRAFT" | "ACTIVE" | "COMPLETED";
    classIds?: string[];
}

export interface CreateSubmissionRequest {
    assignmentId: string;
    title: string;
    description?: string;
    image: File;
}

export interface UpdateSubmissionRequest {
    title?: string;
    description?: string;
    image?: File;
}

export interface GradeSubmissionRequest {
    grade: number;
    feedback?: string;
}

export interface ReturnForRevisionRequest {
    revisionNote: string;
}

export interface CreatePortfolioRequest {
    title: string;
    description?: string;
    image: File;
    mediaTypeId?: string;
    isPublic?: boolean;
}

export interface UpdatePortfolioRequest {
    title?: string;
    description?: string;
    image?: File;
    mediaTypeId?: string;
    isPublic?: boolean;
}

export interface UpdateUserRequest {
    name?: string;
    phone?: string;
    address?: string;
    bio?: string;
    birthdate?: string;
    avatar?: File;
}

// Response Types
export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Dashboard Types
export interface DashboardOverview {
    role: "TEACHER" | "STUDENT";
    statistics: {
        // Teacher stats
        totalStudents?: number;
        totalClasses?: number;
        activeAssignments?: number;
        pendingSubmissions?: number;
        gradedSubmissions?: number;
        averageScore?: number;
        // Student stats
        portfolioCount?: number;
        completedAssignments?: number;
        totalAssignments?: number;
        pendingAssignments?: number;
        highestScore?: number;
        totalSubmissions?: number;
    };
    recentSubmissions?: Array<{
        id: string;
        studentName: string;
        studentNis: string;
        assignmentTitle: string;
        grade: number | null;
        status: string;
        submittedAt: string;
    }>;
    topStudents?: Array<{
        id: string;
        name: string;
        nis: string;
        className: string;
        avgScore: number;
        portfolioCount: number;
    }>;
    upcomingDeadlines?: Array<{
        id: string;
        title: string;
        deadline: string;
        submissionCount: number;
        totalStudents: number;
    }>;
    recentWorks?: Array<{
        id: string;
        title: string;
        mediaType?: MediaType;
        grade: number | null;
        status: string;
        submittedAt: string;
        imageUrl?: string;
        imageThumbnail?: string | null;
        imageMedium?: string | null;
    }>;
    pendingAssignments?: Array<{
        id: string;
        title: string;
        description: string;
        deadline: string;
        mediaType?: MediaType;
        daysRemaining: number;
        mySubmission?: {
            id: string;
            status: string;
        };
    }>;
    achievements?: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        unlockedAt: string | null;
    }>;
}
