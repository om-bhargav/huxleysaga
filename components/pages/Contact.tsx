import ContactChannels from "../contact/ContactChannels";
import ContactFollow from "../contact/ContactFollow";
import ContactIntro from "../contact/ContactIntro";

export default function Contact() {
  return (
    <div className="relative z-10 grid gap-5 bg-background">
      <ContactIntro />
      <ContactChannels />
      <ContactFollow />
    </div>
  )
}
