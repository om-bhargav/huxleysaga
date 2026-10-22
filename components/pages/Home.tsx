import BackersSection from "../home/BackersSection";
import Eight from "../home/Eight";
import Hero from "../home/Hero";
import LiveCampaigns from "../home/LiveCampaigns";
import SagaIntro from "../home/SagaIntro";
import Second from "../home/Second";
import Third from "../home/Third";
import FinalCta from "../shared/FinalCTA";

export default function Home() {
  return (
    <div className="grid gap-5">
      <Hero video="/assets/hero.mp4" image="/assets/video-poster.png" /> {/* ✅ */}
      <div className="relative z-10 grid gap-5 bg-background">
        <LiveCampaigns />
        <SagaIntro/>
        <Second />
        <Third />{/* ✅ */}
        {/* <MeetTheUniverse/> */}
        {/* <Fifth />✅ */}
        {/* <Sixth />✅ */}
        {/* <Seventh />✅ */}
        <Eight />✅
        <BackersSection/>
        {/* <Ninth />✅ */}
        {/* <Tenth />✅ */}
        {/* <Eleven />✅ */}
        <FinalCta images={["/assets/poster-1.png","/assets/poster-2.png","/assets/poster-3.png","/assets/poster-4.png"]}/>
      </div>
    </div>
  )
}
