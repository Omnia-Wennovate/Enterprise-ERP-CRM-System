import { Plane, Check } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In - Omnia Travel CRM',
  description: 'Sign in to your Omnia Travel account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#F0F7FA]">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0B2A3D] flex-col justify-between p-8 relative overflow-hidden">
        {/* Wave decoration */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A8FA8" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
            <path
              d="M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z"
              fill="url(#waveGradient)"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-[#0A8FA8] p-2 rounded-lg">
              <Plane className="text-white" size={28} />
            </div>
            <h1 className="text-white font-bold text-2xl">Omnia Travel</h1>
          </div>

          <p className="text-[#38BDF8] text-lg font-semibold mb-8">
            The Operating System for Your Travel Business
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-[#0A8FA8] rounded-full p-1 mt-1 flex-shrink-0">
                <Check className="text-white" size={16} />
              </div>
              <div>
                <p className="text-white font-medium">Manage leads and customers</p>
                <p className="text-[#94A3B8] text-sm">Track every interaction and conversion</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-[#0A8FA8] rounded-full p-1 mt-1 flex-shrink-0">
                <Check className="text-white" size={16} />
              </div>
              <div>
                <p className="text-white font-medium">Automate invoices and payments</p>
                <p className="text-[#94A3B8] text-sm">Streamline your financial workflows</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-[#0A8FA8] rounded-full p-1 mt-1 flex-shrink-0">
                <Check className="text-white" size={16} />
              </div>
              <div>
                <p className="text-white font-medium">Real-time team collaboration</p>
                <p className="text-[#94A3B8] text-sm">Keep everyone in sync across departments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="relative z-10">
          <p className="text-[#94A3B8] text-xs">© 2024 Omnia Travel. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-7/12 bg-[#F0F7FA] flex items-center justify-center p-6">
        <div className="w-full">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-[#0A8FA8] p-2 rounded-lg">
                <Plane className="text-white" size={24} />
              </div>
              <h1 className="text-[#0B1F33] font-bold text-2xl">Omnia Travel</h1>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
