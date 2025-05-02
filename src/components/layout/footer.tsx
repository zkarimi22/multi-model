import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background z-10">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {currentYear} Multi-Model Chat. All rights reserved.
          </p>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-6">
          <Link 
            href="/chat" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Chat
          </Link>
          <Link 
            href="/open-mode" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Open Mode
          </Link>
          <Link 
            href="/pricing" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Pricing
          </Link>
          <Link 
            href="/profile" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Profile
          </Link>
        </nav>
      </div>
    </footer>
  );
} 