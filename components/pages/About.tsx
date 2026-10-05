import AboutEvents from "../about/AboutEvents";
import AboutHero from "../about/AboutHero";
import AboutHistory from "../about/AboutHistory";
import AboutPartners from "../about/AboutPartners";
import AboutPress from "../about/AboutPress";
import AboutQuote from "../about/AboutQuote";
import AboutStats from "../about/AboutStats";
import AboutTimeline from "../about/AboutTimeline";

export default function About() {
  return (
    <div className="relative z-10 grid gap-8 md:gap-20 bg-background">
      <AboutHero />
      <AboutHistory />
      <AboutTimeline />
      <AboutQuote />
      <AboutPartners />
      <AboutPress />
      <AboutStats />
      <AboutEvents />
    </div>
  ) 
}
