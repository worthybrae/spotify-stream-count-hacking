import { Github, Twitter } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><a href="/features" className="text-sm text-white/60 hover:text-white">Features</a></li>
              <li><a href="/pricing" className="text-sm text-white/60 hover:text-white">Pricing</a></li>
              <li><a href="/enterprise" className="text-sm text-white/60 hover:text-white">Enterprise</a></li>
              <li><a href="/changelog" className="text-sm text-white/60 hover:text-white">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="/docs" className="text-sm text-white/60 hover:text-white">Documentation</a></li>
              <li><a href="/guides" className="text-sm text-white/60 hover:text-white">Guides</a></li>
              <li><a href="/api" className="text-sm text-white/60 hover:text-white">API Reference</a></li>
              <li><a href="/support" className="text-sm text-white/60 hover:text-white">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="/about" className="text-sm text-white/60 hover:text-white">About</a></li>
              <li><a href="/blog" className="text-sm text-white/60 hover:text-white">Blog</a></li>
              <li><a href="/careers" className="text-sm text-white/60 hover:text-white">Careers</a></li>
              <li><a href="/contact" className="text-sm text-white/60 hover:text-white">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="/privacy" className="text-sm text-white/60 hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="text-sm text-white/60 hover:text-white">Terms of Service</a></li>
              <li><a href="/security" className="text-sm text-white/60 hover:text-white">Security</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm text-white/60">
              © {currentYear} StreamClout. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://twitter.com/streamclout" 
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter className="h-5 w-5 text-white/60" />
            </a>
            <a 
              href="https://github.com/streamclout" 
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5 text-white/60" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}