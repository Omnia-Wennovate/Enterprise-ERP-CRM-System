import { OmniaLogo } from '@/components/ui/OmniaLogo'
import { LoginForm } from '@/components/auth/LoginForm'
import { LoginLeftPanel } from '@/components/auth/LoginLeftPanel'

export const metadata = {
  title: 'Sign In - Omnia Travel CRM',
  description: 'Sign in to your Omnia Travel account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#0A1221]">
      {/* Left Panel — Premium Brand Hero (Client Component with Framer Motion) */}
      <LoginLeftPanel />

      {/* Right Panel — Login Form with luxury background */}
      <div className="w-full lg:w-7/12 bg-gradient-to-br from-[#F8F6F0] via-[#F5F3ED] to-[#EDE9DF] flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Subtle luxury background pattern */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #C8A951 1px, transparent 1px), radial-gradient(circle at 75% 75%, #C8A951 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Warm corner glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#C8A951]/[0.03] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#C8A951]/[0.02] to-transparent pointer-events-none" />
        
        <div className="w-full max-w-lg relative z-10">
          <div className="lg:hidden mb-8 text-center flex flex-col items-center">
            <OmniaLogo variant="full" theme="dark" size={120} className="mb-4" />
            <div className="w-8 h-[2px] bg-gradient-to-r from-[#C8A951] to-[#E8D48B]" />
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}

