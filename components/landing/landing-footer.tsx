import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-card border-t border-border py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo-final.svg"
                alt="VaxEvidence Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-foreground">
                VaxEvidence
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The Real-World Evidence platform built for vaccine scientists.
            </p>
          </div>

          <nav aria-label="Product links">
            <h4 className="font-semibold mb-4 text-sm text-foreground">
              Product
            </h4>
            <ul className="space-y-2.5 text-muted-foreground text-sm">
              <li>
                <a
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <Link
                  href="/auth"
                  className="hover:text-foreground transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/app/templates"
                  className="hover:text-foreground transition-colors"
                >
                  Templates
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h4 className="font-semibold mb-4 text-sm text-foreground">
              Company
            </h4>
            <ul className="space-y-2.5 text-muted-foreground text-sm">
              <li>
                <a
                  href="#about"
                  className="hover:text-foreground transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Research
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@vaxevidence.com"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h4 className="font-semibold mb-4 text-sm text-foreground">
              Legal
            </h4>
            <ul className="space-y-2.5 text-muted-foreground text-sm">
              <li>
                <span className="cursor-default">Privacy</span>
              </li>
              <li>
                <span className="cursor-default">Terms</span>
              </li>
              <li>
                <span className="cursor-default">Security</span>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-border mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} VaxEvidence. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
