import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="home-content">
        <h1>Chào mừng đến LoveConnect ❤️</h1>
        <p>Đây là trang Home — nơi bạn sẽ bắt đầu hành trình kết nối!</p>
      </main>
      <Footer />
    </>
  );
}
