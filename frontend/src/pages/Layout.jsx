
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PlayerBar from '../components/PlayerBar';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';



export default function Layout(){
  const [width, setWidth] = useState(250);
  const handleMouseDown  = (e) => {
    e.preventDefault();

    const handleMouseMove = (e) => {
      setWidth((prev) => {
        const newWidth  = prev + e.movementX;
        return Math.max(180, Math.min(450, newWidth));
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{
        gridTemplateColumns: `${width}px 4px 1fr`,
        gridTemplateRows: '70px 1fr 100px',
        "--sidebar-width": `${width}px`,
      }}
    >
      {/* Header: spans all columns */}
      <div style={{ gridColumn: '1 / -1' }}>
        <Header/>
      </div>

      {/* Sidebar */}
      <div className="min-h-0 overflow-y-auto bg-[#1E2237]" style={{ gridRow: 2 }}>
        <Sidebar/>
      </div>

      {/* Resizer */}
      <div
        className="cursor-col-resize bg-transparent relative before:content-[''] before:absolute before:left-1/2 before:top-0 before:-translate-x-1/2 before:w-[2px] before:h-full before:bg-transparent before:transition-all before:duration-200"
        style={{ gridRow: 2 }}
        onMouseDown={handleMouseDown}
      ></div>

      {/* Main content */}
      <div className="p-5 overflow-y-auto min-h-0 bg-[#323750]" style={{ gridColumn: 3, gridRow: 2 }}>
        <Outlet/>
      </div>

      {/* Player bar */}
      <div className="h-[100px]" style={{ gridColumn: '1 / -1', gridRow: 3 }}>
        <PlayerBar/>
      </div>

    </div>
  );
}
