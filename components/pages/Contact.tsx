import ContactChannels from "../contact/ContactChannels";
import ContactFollow from "../contact/ContactFollow";
import ContactHero from "../contact/ContactHero";
import ContactIntro from "../contact/ContactIntro";

export default function Contact() {
  return (
    <div className="relative z-10 grid gap-8 md:gap-20 bg-background">
      <ContactHero/>
      <ContactIntro />
      <ContactChannels />
      <ContactFollow />
    </div>
  )
}
