"use client";
import { Divider } from "../shared/Divider";
import { StretchText } from "../shared/StrechText";

const navColumns = [
  { title: "Explore", links: ["Home", "Story", "Shop"] },
  { title: "Products", links: ["Huxley", "The Oracle"] },
  { title: "Company", links: ["About", "Contact"] },
  { title: "Social", links: ["YouTube", "Instagram", "X"] },
];

export default function Footer() {
  return (
    <footer className="px-3 pb-3 pt-4 text-[11px] uppercase tracking-wide fixed inset-x-0 bottom-0 z-4 bg-background h-[400px]">
      {/* Big wordmark */}
      <div className="relative pb-2 grid place-items-center">
        <StretchText className="font-heading text-[16vw] font-bold leading-[0.78]">
          HUXLEY
        </StretchText>
      </div>

      <Divider />

      <div className="flex flex-col gap-10 pb-6 pt-4 lg:flex-row lg:justify-between lg:gap-8 lg:pt-3">
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-[repeat(4,150px)] lg:gap-2"
        >
          {navColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 font-thin tracking-widest text-neutral-400 lg:mb-2.5">{col.title}</h4>
              <ul className="flex flex-col gap-3 font-semibold lg:gap-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href={`/${link.toLocaleLowerCase()}`} className="tracking-widest transition-opacity hover:opacity-60">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <section className="w-full lg:max-w-[460px]">
          <h4 className="mb-3 font-thin tracking-widest text-neutral-400 lg:mb-2.5">Newsletter</h4>
          <form className="flex flex-col gap-2 sm:flex-row sm:gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              aria-label="Email address"
              className="min-w-0 flex-1 border border-neutral-800 bg-black px-3 py-3 uppercase tracking-wider text-white placeholder:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white sm:py-2.5"
            />
            <button
              type="submit"
              className="w-full border border-neutral-800 bg-neutral-950 px-5 py-3 uppercase tracking-wider text-white hover:bg-neutral-900 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white sm:w-auto sm:py-2.5"
            >
              Submit
            </button>
          </form>
        </section>
      </div>

      <Divider />

      <div className="flex flex-col gap-2 pt-3 text-neutral-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <p className="sm:flex-1">© 2026 Huxley LLC. All rights reserved</p>
        <ul className="flex gap-4 sm:gap-3 lg:mr-auto lg:w-[460px]">
          <li><a href="#" className="hover:text-white">Terms</a></li>
          <li><a href="#" className="hover:text-white">Privacy</a></li>
        </ul>
        <p>Site by Om Bhargav</p>
      </div>
    </footer>
  );
}