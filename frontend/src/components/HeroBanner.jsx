import background from '../assets/images/background.png';

export default function HeroBanner() {
    return (
        <div
            className="flex flex-col justify-center h-[180px] p-[30px] bg-cover bg-center bg-no-repeat text-white rounded-lg"
            style={{ backgroundImage: `url(${background})` }}
        >
            <p className="ml-[30px] text-[30px] font-bold drop-shadow">Playlist nổi bật</p>
            <button className="mt-2.5 ml-[30px] rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors py-[5px] px-[10px] w-[100px] cursor-pointer font-medium">
                Nghe ngay
            </button>
        </div>
    );
}
