import BackersSection from "../home/BackersSection";
import Eight from "../home/Eight";
import Hero from "../home/Hero";
import LiveCampaigns from "../home/LiveCampaigns";
import SagaIntro from "../home/SagaIntro";
import Second from "../home/Second";
import Third from "../home/Third";
import FinalCta from "../shared/FinalCTA";
{/* <MeetTheUniverse/> */ }
{/* <Fifth />✅ */ }
{/* <Sixth />✅ */ }
{/* <Seventh />✅ */ }
{/* <Ninth />✅ */ }
{/* <Tenth />✅ */ }
{/* <Eleven />✅ */ }

export default function Home() {
  return (
    <div className="grid gap-5">
      <Hero videos={["/assets/hero.mp4", "/assets/hero-2.mp4"]}/> {/* ✅ */}
      <div className="relative z-10 grid gap-5 bg-background">
        <LiveCampaigns />
        <SagaIntro />
        <Second />
        <Third />
        <Eight />
        <BackersSection />
        <FinalCta images={[
          "/characters/agent-scarlett/1.png",
          "/characters/vipress/1.png",
          "/characters/kat/4.png",
          "/characters/Dracona/1.png",
        ]} />
      </div>
    </div>
  )
}
