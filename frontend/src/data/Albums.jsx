import jack from '../assets/images/j97.jpg';
import sontung from '../assets/images/sontung-mtp.jpg';
import audio from '../assets/audio/dom-dom-jack.mp3';


export const albums = [
  {
    id: 1,
    name: "Đóm",
    singer: "Jack",
    image: jack,
    songs: [
      {
        stt: 1,
        image:jack,
        name: "Đom Đóm",
        singer: "Jack",
        duration: "5:11",
        url: audio
      },
      {
        stt: 2,
        image:jack,
        name: "Hoa Hải Đường",
        singer: "Jack",
        duration: "4:20",
        url: audio
      }
    ]
  },
  {
    id: 2,
    name: "Sky",
    singer: "Sơn Tùng",
    image: sontung,
    songs: [
      {
        stt: 1,
        image:sontung,
        singer: "SonTung",
        name: "Em Của Ngày Hôm Qua",
        duration: "3:15",
        url: audio
      },
      {
        stt: 2,
        image:sontung,
        singer: "SonTung",
        name: "Âm Thầm Bên Em",
        duration: "3:11",
        url: audio
      },
      {
        stt: 3,
        image:sontung,
        singer: "SonTung",
        name: "Chạy Ngay Đi",
        duration: "4:05",
        url: audio
        }
      ]
    }
  ];
