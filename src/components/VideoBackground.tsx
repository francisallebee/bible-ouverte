export default function VideoBackground() {
  return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%231a2d48' width='100%25' height='100%25'/%3E%3C/svg%3E"
      >
        <source
          src="/videos/bible.mp4"
          type="video/mp4"
        />
      </video>
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
    </>
  )
}
