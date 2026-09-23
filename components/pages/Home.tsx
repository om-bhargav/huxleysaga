import Eight from "../home/Eight";
import Eleven from "../home/Eleven";
import Fifth from "../home/Fifth";
import Forth from "../home/Forth";
import Hero from "../home/Hero";
import Ninth from "../home/Ninth";
import Second from "../home/Second";
import Seventh from "../home/Seventh";
import Sixth from "../home/Sixth";
import Tenth from "../home/Tenth";
import Third from "../home/Third";

export default function Home() {
  return (
    <div className="grid gap-5">
      <Hero /> {/* ✅ */}
      <div className="relative z-10 grid gap-5 bg-background">
        <Second />
        <Third />{/* ✅ */}
        <Forth />
        <Fifth />
        <Sixth />
        <Seventh />{/* ✅ */}
        <Eight />{/* ✅ */}
        <Ninth />{/* ✅ */}
        <Tenth />{/* ✅ */}
        <Eleven />{/* ✅ */}
      </div>
    </div>
  )
}
