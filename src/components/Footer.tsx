import { Link } from 'react-router-dom';
import { MailIcon, ShieldCheckIcon } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy?: () => void; // Optional for compatibility
}

export function Footer({ }: FooterProps) {
  return (
    <footer className="mt-16 pt-8 border-t border-gray-200 pb-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-4 text-sm text-gray-600">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <MailIcon className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Technical issues? Contact:</span>
          </div>
          <a href="mailto:techcustomerreach@outlook.com?subject=SRT%20Merger%20—%20Technical%20Issue" className="text-blue-600 hover:text-blue-700 font-medium transition-colors break-all sm:break-normal">
            techcustomerreach@outlook.com
          </a>
        </div>

        <Link
          to="/privacy"
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ShieldCheckIcon className="w-4 h-4" />
          Privacy Policy
        </Link>

        <div className="text-xs text-gray-400 mt-2">
          © {new Date().getFullYear()} SRT Merger. All rights reserved.
        </div>
      </div>
    </footer>
  );
}