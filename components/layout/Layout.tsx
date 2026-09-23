import { ChildrenProps } from "@/types/children";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }: ChildrenProps) {
  return (
    <div className="relative">
      <Navbar />

      <main
        className="
      relative
      z-5
      bg-background
      mb-[400px]
      shadow-[0_10px_20px_rgba(0,0,0,0.1)]
    "
      >
        {children}
      </main>

        <Footer />
    </div>
  )
}
