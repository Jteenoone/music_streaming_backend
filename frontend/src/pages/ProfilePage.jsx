import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserAlt, FaPlay } from "react-icons/fa";
import { MdEdit, MdCheck, MdClose, MdLock } from "react-icons/md";
import { userAPI, normalizeSong } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";

function SongRow({ song, queue, index }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const isActive = currentSong?.id === song.id;
  return (
    <div
      onClick={() => playSong(song, queue)}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
    >
      <span className="text-xs text-[#6b7280] w-5 text-center shrink-0 group-hover:hidden">
        {isActive && isPlaying ? "▶" : index + 1}
      </span>
      <FaPlay size={10} color="#9ca3af" className="hidden group-hover:block shrink-0"/>
      {song.src_img
        ? <img src={song.src_img} alt="" className="w-9 h-9 rounded object-cover shrink-0"/>
        : <div className="w-9 h-9 bg-[#2e3450] rounded shrink-0 flex items-center justify-center text-[#6b7280] text-xs">♪</div>
      }
      <div className="flex-1 min-w-0">
        <p className={`text-sm m-0 truncate ${isActive ? "text-[#7c83f5]" : "text-white"}`}>{song.name}</p>
        <p className="text-xs text-[#9ca3af] m-0 truncate">{song.singer}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recentSongs, setRecentSongs] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit info state
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", avatar: "" });
  const [saving, setSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  // Change password state
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    Promise.all([
      userAPI.getMe(),
      userAPI.getRecentlyPlayed(),
      userAPI.getLibrary(),
    ]).then(([me, recent, lib]) => {
      const p = me.data.data;
      setProfile(p);
      setForm({ username: p.username, email: p.email, avatar: p.avatar ?? "" });
      const songs = (recent.data.data ?? []).map(r => normalizeSong(r.song)).filter(Boolean);
      setRecentSongs(songs);
      setFollowedArtists(lib.data.data?.artists ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleSaveInfo = async () => {
    setSaving(true); setInfoMsg("");
    try {
      const res = await userAPI.updateMe({ username: form.username, email: form.email, avatar: form.avatar });
      setProfile(res.data.data);
      setEditMode(false);
      setInfoMsg("Cập nhật thành công!");
    } catch (err) {
      setInfoMsg(err.response?.data?.message ?? "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg("Mật khẩu mới không khớp"); return; }
    setPwLoading(true); setPwMsg("");
    try {
      await userAPI.changePassword(pwForm.oldPassword, pwForm.newPassword);
      setPwMsg("Đổi mật khẩu thành công!");
      setPwForm({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwMsg(err.response?.data?.message ?? "Có lỗi xảy ra");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#6b7280] text-sm">Đang tải...</div>
  );

  const inputCls = "w-full bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7c83f5] transition-colors";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-white">

      {/* ── Hero avatar + info ── */}
      <div className="flex items-end gap-6 mb-8">
        <div className="relative shrink-0">
          {(editMode ? form.avatar : profile?.avatar)
            ? <img src={editMode ? form.avatar : profile.avatar} alt=""
                className="w-28 h-28 rounded-full object-cover border-2 border-[#2e3450]"/>
            : <div className="w-28 h-28 rounded-full bg-[#2e3450] flex items-center justify-center">
                <FaUserAlt size={40} color="#6b7280"/>
              </div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#9ca3af] m-0 mb-1">Trang cá nhân</p>
          {editMode ? (
            <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              className="text-3xl font-bold bg-transparent border-b border-[#7c83f5] outline-none text-white w-full pb-1 mb-1"/>
          ) : (
            <h1 className="text-3xl font-bold m-0">{profile?.username}</h1>
          )}
          <p className="text-sm text-[#9ca3af] m-0 mt-1">{profile?.email}</p>
          <p className="text-xs text-[#6b7280] m-0 mt-0.5">
            {followedArtists.length} nghệ sĩ · {recentSongs.length} bài đã nghe gần đây
          </p>
        </div>
        <button
          onClick={() => { setEditMode(v => !v); setInfoMsg(""); }}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-[#2e3450] bg-transparent text-white cursor-pointer hover:bg-white/10 transition-colors shrink-0"
        >
          <MdEdit size={14}/> {editMode ? "Hủy" : "Chỉnh sửa"}
        </button>
      </div>

      {/* ── Edit form ── */}
      {editMode && (
        <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl p-5 mb-8 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-white m-0">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Tên hiển thị</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className={inputCls}/>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Email</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls}/>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[#9ca3af] mb-1 block">URL ảnh đại diện</label>
              <input value={form.avatar} onChange={e => setForm(p => ({ ...p, avatar: e.target.value }))}
                placeholder="https://..." className={inputCls}/>
            </div>
          </div>
          {infoMsg && <p className={`text-xs m-0 ${infoMsg.includes("thành") ? "text-green-400" : "text-[#f87171]"}`}>{infoMsg}</p>}
          <div className="flex justify-end">
            <button onClick={handleSaveInfo} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#7c83f5] text-white text-sm font-semibold border-none cursor-pointer hover:bg-[#6670e8] disabled:opacity-60 transition-colors">
              <MdCheck size={16}/> {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      )}

      {/* ── Đổi mật khẩu ── */}
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl p-5 mb-8">
        <button onClick={() => setShowPw(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-transparent border-none cursor-pointer w-full text-left p-0">
          <MdLock size={16} color="#9ca3af"/>
          Đổi mật khẩu
          <span className="ml-auto text-[#6b7280] text-xs">{showPw ? "▲" : "▼"}</span>
        </button>
        {showPw && (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3 mt-4">
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Mật khẩu cũ</label>
              <input type="password" value={pwForm.oldPassword}
                onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} className={inputCls}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Mật khẩu mới</label>
                <input type="password" value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} className={inputCls}/>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Xác nhận mật khẩu</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} className={inputCls}/>
              </div>
            </div>
            {pwMsg && <p className={`text-xs m-0 ${pwMsg.includes("thành") ? "text-green-400" : "text-[#f87171]"}`}>{pwMsg}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={pwLoading}
                className="px-5 py-2 rounded-full bg-[#7c83f5] text-white text-sm font-semibold border-none cursor-pointer hover:bg-[#6670e8] disabled:opacity-60 transition-colors">
                {pwLoading ? "Đang lưu..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Bài hát nghe gần đây ── */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">Nghe gần đây</h2>
        {recentSongs.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Chưa có lịch sử nghe nhạc.</p>
        ) : (
          <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
            {recentSongs.slice(0, 10).map((song, i) => (
              <div key={`${song.id}-${i}`} className="border-b border-[#2e3450]/60 last:border-0">
                <SongRow song={song} queue={recentSongs} index={i}/>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Nghệ sĩ yêu thích ── */}
      <section>
        <h2 className="text-lg font-bold mb-3">Nghệ sĩ đang theo dõi</h2>
        {followedArtists.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Bạn chưa theo dõi nghệ sĩ nào.</p>
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(130px,1fr))]">
            {followedArtists.map(a => (
              <div key={a._id} onClick={() => navigate(`/artist/${a._id}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1a1f35] border border-[#2e3450] cursor-pointer hover:border-[#7c83f5]/40 hover:bg-white/5 transition-colors">
                {a.imageUrl
                  ? <img src={a.imageUrl} alt={a.name} className="w-16 h-16 rounded-full object-cover"/>
                  : <div className="w-16 h-16 rounded-full bg-[#2e3450] flex items-center justify-center"><FaUserAlt size={22} color="#6b7280"/></div>
                }
                <p className="text-xs font-semibold text-white m-0 text-center truncate w-full">{a.name}</p>
                <p className="text-[11px] text-[#6b7280] m-0">Nghệ sĩ</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
