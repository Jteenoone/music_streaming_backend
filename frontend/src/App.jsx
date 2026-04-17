import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// User-facing pages
import Layout from "./pages/Layout";
import NotFound from './pages/NotFound';
import HomePage from "./components/HomePage";
import AlbumDetail from "./components/AlbumDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SongManager from "./pages/admin/SongManager";
import AlbumManager from "./pages/admin/AlbumManager";
import UserManager from "./pages/admin/UserManager";

// Redirect admin away from user layout
function UserRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/admin" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* User routes — admin bị redirect sang /admin */}
      <Route path="/" element={<UserRoute><Layout/></UserRoute>}>
        <Route index element={<HomePage/>}/>
        <Route path="album/:id" element={<AlbumDetail/>}/>
      </Route>
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout/>}>
        <Route index element={<AdminDashboard/>}/>
        <Route path="songs" element={<SongManager/>}/>
        <Route path="albums" element={<AlbumManager/>}/>
        <Route path="users" element={<UserManager/>}/>
      </Route>

      <Route path="*" element={<NotFound/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <BrowserRouter>
          <AppRoutes/>
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  );
}
