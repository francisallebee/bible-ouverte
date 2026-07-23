import VideoBackground from '@/components/VideoBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <VideoBackground />
      {children}
    </div>
  )
}
