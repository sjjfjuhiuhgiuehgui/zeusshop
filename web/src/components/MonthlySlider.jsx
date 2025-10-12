import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

// 你把月活動圖放到 public/images/monthly/ 下方這些檔名就會顯示
const slides = [
  { id: 1, img: "/images/monthly/01.jpg", text: "十月滿額活動" },
  { id: 2, img: "/images/monthly/02.jpg", text: "3C 週年慶" },
  { id: 3, img: "/images/monthly/03.jpg", text: "新會員 9 折" },
  { id: 3, img: "/images/monthly/04.jpg", text: "新會員 9 折" },
];

export default function MonthlySlider() {
  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      slidesPerView={1}
      loop
      autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
      pagination={{ clickable: true }}
      className="rounded-2xl shadow-sm overflow-hidden"
    >
      {slides.map(s => (
        <SwiperSlide key={s.id}>
          <div className="relative">
            <img src={s.img} alt={s.text} className="w-full h-56 md:h-72 object-cover" />
            <div className="absolute inset-0 bg-black/35 grid place-items-center">
              <p className="text-white text-base md:text-xl font-medium">{s.text}</p>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
