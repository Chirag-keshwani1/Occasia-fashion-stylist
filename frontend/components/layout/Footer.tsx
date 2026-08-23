import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-tight">OCCASIA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elevate your style with AI-powered fashion recommendations. Discover, create, and own your perfect look.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link href="/products/new-arrivals" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link href="/products/sale" className="hover:text-foreground transition-colors">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">AI Stylist</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/outfits/generate" className="hover:text-foreground transition-colors">Generate Outfit</Link></li>
              <li><Link href="/style-quiz" className="hover:text-foreground transition-colors">Style Quiz</Link></li>
              <li><Link href="/virtual-try-on" className="hover:text-foreground transition-colors">Virtual Try-On</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-foreground transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Occasia AI. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
