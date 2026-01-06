import { useOutletContext } from "react-router-dom";
import { FrontendUser } from "@/layouts/DashboardLayout";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

const Dashboard = () => {
  const { user } = useOutletContext<{ user: FrontendUser }>();

  return user.role === "teacher" ? <TeacherDashboard user={user} /> : <StudentDashboard user={user} />;
};

export default Dashboard;
