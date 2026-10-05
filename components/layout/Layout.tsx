import { ChildrenProps } from "@/types/children";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SmoothScroll from "@/components/providers/SmoothScroll";

export default function Layout({ children }: ChildrenProps) {
  return (
    <div className="relative">
      <Navbar />

      <main
        className="
          relative
          z-5
          bg-background
          mb-120
          md:mb-90
          shadow-[0_10px_20px_rgba(0,0,0,0.1)]
          "
      >
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </main>

      <Footer />
    </div>
  );
}