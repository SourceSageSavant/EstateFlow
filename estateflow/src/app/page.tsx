'use client';

import Link from 'next/link';
import {
  Building2,
  Shield,
  Key,
  CreditCard,
  Wrench,
  Users,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Zap,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EstateFlow
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm mb-6">
            <Zap size={16} />
            Modern Property Management
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Manage Properties.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Simplify Access.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            The all-in-one platform for landlords, tenants, and security guards.
            Streamline rent collection, visitor management, and maintenance requests.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-semibold text-lg shadow-lg shadow-indigo-500/25"
            >
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">500+</p>
              <p className="text-slate-400 mt-1">Properties</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">5,000+</p>
              <p className="text-slate-400 mt-1">Tenants</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">50,000+</p>
              <p className="text-slate-400 mt-1">Passes Generated</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">99.9%</p>
              <p className="text-slate-400 mt-1">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A complete solution for modern property management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Key className="text-indigo-400" size={24} />}
              title="Visitor Gate Passes"
              description="Generate unique access codes for visitors. Guards verify instantly with our mobile-friendly interface."
            />
            <FeatureCard
              icon={<CreditCard className="text-green-400" size={24} />}
              title="Rent Collection"
              description="Accept payments via M-Pesa and card. Automatic reminders and real-time tracking."
            />
            <FeatureCard
              icon={<Shield className="text-purple-400" size={24} />}
              title="Security Dashboard"
              description="Dedicated interface for guards. Verify codes, track entries, and manage banned visitors."
            />
            <FeatureCard
              icon={<Wrench className="text-amber-400" size={24} />}
              title="Maintenance Requests"
              description="Tenants submit issues with photos. Track status from submission to completion."
            />
            <FeatureCard
              icon={<Users className="text-blue-400" size={24} />}
              title="Tenant Portal"
              description="Self-service portal for tenants to manage passes, view payments, and contact landlord."
            />
            <FeatureCard
              icon={<Building2 className="text-pink-400" size={24} />}
              title="Multi-Property Support"
              description="Manage multiple properties from a single dashboard. Assign guards across locations."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400">Three simple steps to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Add Your Properties"
              description="Set up your properties with units, rent amounts, and due dates"
            />
            <StepCard
              number="2"
              title="Invite Tenants & Guards"
              description="Add team members and tenants get instant access to their portals"
            />
            <StepCard
              number="3"
              title="Start Managing"
              description="Collect rent, approve passes, and handle maintenance - all in one place"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Streamline Your Property Management?
            </h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              Join hundreds of landlords who've simplified their operations with EstateFlow.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={16} />
              </div>
              <span className="font-semibold text-white">EstateFlow</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 EstateFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 hover:border-slate-600 transition-all">
      <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
