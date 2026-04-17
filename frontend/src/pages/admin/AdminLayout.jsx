import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { MdDashboard, MdMusicNote, MdAlbum, MdPeople } from "react-icons/md";
import { FaMusic, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/admin",          label: "Dashboard",    icon: <MdDashboard size={18}/>,  end: true },
  { to: "/admin/songs",    label: "Bài hát",      icon: <MdMusicNote size={18}/> },
  { to: "/admin/albums",   label: "Album",        icon: <MdAlbum size={18}/> },
  { to: "/admin/users",    label: "Người dùng",   icon: <MdPeople size={18}/> },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0f1120] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[#1a1f35] border-r border-[#2e3450] flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#2e3450]">
          <FaMusic size={20} color="#7c83f5"/>
          <div>
            <p className="text-sm font-bold text-white m-0">Sound Wave</p>
            <p className="text-[10px] text-[#7c83f5] m-0 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? "bg-[#7c83f5]/20 text-[#7c83f5]"
                    : "text-[#9ca3af] hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="px-3 py-4 border-t border-[#2e3450] flex flex-col gap-1">
          <p className="text-xs text-[#6b7280] px-3 mb-1 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#f87171] hover:text-white hover:bg-[#f87171]/10 transition-colors rounded-lg border-none bg-transparent cursor-pointer w-full"
          >
            <FaSignOutAlt size={13}/> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-[60px] bg-[#1a1f35] border-b border-[#2e3450] flex items-center px-6 shrink-0">
          <h1 className="text-sm font-semibold text-[#9ca3af] m-0">Quản trị hệ thống</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
