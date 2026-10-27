import { Nfc, QrCode, Star, MessageCircle, Instagram, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Nfc className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">SmartCard</span>
          </div>
          <Link
            href="/admin"
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
          >
            Admin Panel
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700">
            <Zap className="h-4 w-4" />
            NFC + QR Powered Smart Cards
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Boost Your Business with{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              Smart Review Cards
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
            One tap or scan — customers leave 5-star Google reviews, connect on WhatsApp,
            and follow your Instagram. All from a single smart card.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/admin" className="btn-primary text-base">
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/c/CARD1001" className="btn-secondary text-base">
              See Demo Card <QrCode className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
              <Star className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">AI-Powered Reviews</h3>
            <p className="text-sm text-slate-500">
              Generate natural 5-star reviews with AI. Customers just tap, copy, and paste on Google.
            </p>
          </div>
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Instant WhatsApp</h3>
            <p className="text-sm text-slate-500">
              One-tap WhatsApp button lets customers reach you instantly. No typing numbers.
            </p>
          </div>
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <Instagram className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Instagram Growth</h3>
            <p className="text-sm text-slate-500">
              Drive followers to your Instagram page. Every card scan is a potential new follower.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">1</div>
              <h3 className="mb-2 font-bold text-slate-900">Get Your Card</h3>
              <p className="text-sm text-slate-500">We provide NFC + QR cards pre-programmed with your unique URL.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">2</div>
              <h3 className="mb-2 font-bold text-slate-900">Setup Your Profile</h3>
              <p className="text-sm text-slate-500">Scan once to add your Google Review link, WhatsApp, and Instagram.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">3</div>
              <h3 className="mb-2 font-bold text-slate-900">Let Customers Engage</h3>
              <p className="text-sm text-slate-500">Customers tap or scan to leave reviews, chat on WhatsApp, or follow on Instagram.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: Nfc, label: 'NFC + QR', value: 'Dual Mode' },
            { icon: Star, label: 'AI Reviews', value: '4 Options' },
            { icon: Shield, label: 'Security', value: 'Rate Limited' },
            { icon: BarChart3, label: 'Analytics', value: 'Real-time' },
          ].map((stat, i) => (
            <div key={i} className="card text-center">
              <stat.icon className="mx-auto mb-2 h-6 w-6 text-brand-500" />
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} SmartCard. NFC & QR Powered Business Reviews.
        </div>
      </footer>
    </div>
  );
}
