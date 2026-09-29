import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import StudentDashboard from "./pages/student/Dashboard.tsx";
import StudentRooms from "./pages/student/Rooms.tsx";
import StudentRequest from "./pages/student/MyRequest.tsx";
import StudentComplaints from "./pages/student/Complaints.tsx";
import Profile from "./pages/Profile.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import AdminRooms from "./pages/admin/Rooms.tsx";
import AdminRequests from "./pages/admin/Requests.tsx";
import AdminStudents from "./pages/admin/Students.tsx";
import AdminComplaints from "./pages/admin/Complaints.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student */}
            <Route path="/dashboard" element={<ProtectedRoute requireRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute requireRole="student"><StudentRooms /></ProtectedRoute>} />
            <Route path="/my-request" element={<ProtectedRoute requireRole="student"><StudentRequest /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute requireRole="student"><StudentComplaints /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/rooms" element={<ProtectedRoute requireRole="admin"><AdminRooms /></ProtectedRoute>} />
            <Route path="/admin/requests" element={<ProtectedRoute requireRole="admin"><AdminRequests /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute requireRole="admin"><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute requireRole="admin"><AdminComplaints /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
