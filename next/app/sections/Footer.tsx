"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Daily Raid", href: "/raid" },
        { label: "Pricing", href: "/pricing" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className="bg-[var(--color-bg-primary)] border-t border-[var(--color-border-light)]">
      <div className="container mx-auto px-4 md:px-[81px] py-8 md:py-[54px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-[54px]">
          {/* Brand Column */}
          <div className="col-span-1">
            <Link href="/" className="block mb-[16px]">
              <h6 className="heading-6">Tide Raider</h6>
            </Link>
            <p className="text-main text-[var(--color-text-secondary)] max-w-[36ch]">
              Get daily surf spot recommendations and wave insights, based on
              surf data and local knowledge.
            </p>
          </div>

          {/* Links Columns */}
          {footerLinks.map((section) => (
            <div key={section.title} className="col-span-1">
              <h6 className="heading-6 mb-[16px]">{section.title}</h6>
              <ul className="space-y-[8px]">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-main text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Column */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <h6 className="heading-6 mb-[16px]">Stay Updated</h6>
            <p className="text-main text-[var(--color-text-secondary)] max-w-[36ch] mb-[16px]">
              Subscribe to our newsletter for surf insights and updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-[8px]">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-[16px] py-[8px] border border-[var(--color-border-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent max-w-[360.375px]"
                suppressHydrationWarning
              />
              <button
                type="submit"
                className="bg-[var(--color-bg-tertiary)] text-white px-[16px] py-[8px] rounded-md hover:bg-[var(--color-bg-tertiary)]/90 transition-colors duration-300 whitespace-nowrap max-w-[273.375px]"
                suppressHydrationWarning
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 md:mt-[54px] pt-[32px] border-t border-[var(--color-border-light)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-main text-[var(--color-text-secondary)] text-center md:text-left pb-4">
            © {currentYear} Tide Raider. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
