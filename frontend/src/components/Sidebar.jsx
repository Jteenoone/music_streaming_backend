import { IoIosAdd } from "react-icons/io";
import { CiSearch } from "react-icons/ci";
import { useEffect, useRef, useState } from "react";
import jack from '../assets/images/j97.jpg';

function LibraryItem({ srcImg, name, type }) {
  return (
    <div className="flex gap-2.5 my-2.5 items-center cursor-pointer hover:bg-white/5 rounded-lg px-1 py-0.5 transition-colors">
      {srcImg
        ? <img src={srcImg} alt="avatar" className="w-[46px] h-[46px] aspect-square object-cover rounded-full shrink-0"/>
        : <div className="w-[46px] h-[46px] rounded-full bg-[#2e3450] shrink-0 flex items-center justify-center text-[#6b7280] text-lg">♪</div>
      }
      <div className="min-w-0">
        <p className="text-sm text-white m-0 truncate">{name}</p>
        <p className="text-xs text-[#9ca3af] m-0">{type}</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [showSearch, setShowSearch] = useState(false);
  const focusInput = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        focusInput.current?.value === ""
      ) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch) focusInput.current?.focus();
  }, [showSearch]);

  const libraryItems = [
    { id: 1, src: jack, name: 'Jack', type: 'Nghệ sĩ' },
    { id: 2, src: '', name: 'Playlist của tôi', type: 'Playlist' },
    { id: 3, src: '', name: 'Nhạc yêu thích', type: 'Playlist' },
    { id: 4, src: '', name: 'Sơn Tùng M-TP', type: 'Nghệ sĩ' },
  ];

  return (
    <div className="flex h-full flex-col text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca3af]">Thư viện</h3>
        <button className="flex items-center gap-1 border border-[#333] rounded-lg px-2 py-0.5 bg-[#1E2237] hover:bg-white/10 transition-colors text-xs">
          <IoIosAdd size={16}/>Tạo mới
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-3">
        <button className="text-xs border border-[#333] rounded-full px-3 py-1 bg-[#1E2237] hover:bg-white/10 transition-colors">Playlist</button>
        <button className="text-xs border border-[#333] rounded-full px-3 py-1 bg-[#1E2237] hover:bg-white/10 transition-colors">Nghệ sĩ</button>
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative flex items-center h-8 mb-3">
        {showSearch && (
          <input
            type="text"
            placeholder="Tìm trong thư viện..."
            ref={focusInput}
            className="w-full h-8 pl-8 pr-2 bg-[#2e3450] text-sm text-white rounded-lg border border-[#333] outline-none focus:border-[#7c83f5] transition-colors"
          />
        )}
        <button
          onClick={() => setShowSearch(true)}
          className={`bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-white transition-colors ${showSearch ? 'absolute left-2 top-1/2 -translate-y-1/2' : ''}`}
        >
          <CiSearch size={18}/>
        </button>
      </div>

      {/* Library list */}
      <div className="flex-1 overflow-y-auto">
        {libraryItems.map(item => (
          <LibraryItem key={item.id} srcImg={item.src} name={item.name} type={item.type}/>
        ))}
      </div>
    </div>
  );
}
