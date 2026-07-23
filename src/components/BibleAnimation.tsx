export default function BibleAnimation() {
  return (
    <div className="bible-scene">
      <div className="bible">
        <div className="bible-cover bible-cover-front">
          <div className="bible-title">BIBLE</div>
          <div className="bible-subtitle">OUVERTE</div>
        </div>
        <div className="bible-cover bible-cover-back" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`bible-page bible-page-${i + 1}`} />
        ))}
      </div>
      <style>{`
        .bible-scene {
          display: flex;
          justify-content: center;
          align-items: center;
          perspective: 900px;
          margin-bottom: 2rem;
        }
        .bible {
          position: relative;
          width: 140px;
          height: 190px;
          transform-style: preserve-3d;
          animation: bible-float 4s ease-in-out infinite;
        }
        @keyframes bible-float {
          0%, 100% { transform: translateY(0) rotateX(2deg); }
          50% { transform: translateY(-8px) rotateX(-2deg); }
        }
        .bible-cover {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 4px 12px 12px 4px;
          backface-visibility: hidden;
        }
        .bible-cover-front {
          background: linear-gradient(135deg, #1e3a5f 0%, #2a4f7a 50%, #1e3a5f 100%);
          border: 2px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          box-shadow:
            3px 3px 15px rgba(0,0,0,0.3),
            inset 0 0 30px rgba(0,0,0,0.2);
        }
        .bible-cover-front::before {
          content: '';
          position: absolute;
          top: 12px; left: 12px; right: 12px; bottom: 12px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 2px 8px 8px 2px;
        }
        .bible-title {
          font-size: 22px;
          font-weight: 800;
          color: #d4af37;
          letter-spacing: 6px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          margin-bottom: 4px;
        }
        .bible-subtitle {
          font-size: 11px;
          font-weight: 600;
          color: rgba(212, 175, 55, 0.7);
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        .bible-cover-back {
          background: #1a2d48;
          border-radius: 12px 4px 4px 12px;
          transform: translateZ(-30px);
        }
        .bible-page {
          position: absolute;
          top: 2px;
          left: 2px;
          width: calc(100% - 4px);
          height: calc(100% - 4px);
          background: linear-gradient(to bottom, #fffdf5, #f5f0e0);
          border-radius: 2px 10px 10px 2px;
          transform-origin: left center;
          transform-style: preserve-3d;
          box-shadow: 1px 1px 3px rgba(0,0,0,0.05);
          backface-visibility: hidden;
        }
        .bible-page::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 20px;
          background: linear-gradient(to left, rgba(0,0,0,0.03), transparent);
          border-radius: 0 10px 10px 0;
        }
        .bible-page-1 { animation: page-flip-1 8s ease-in-out infinite; z-index: 9; }
        .bible-page-2 { animation: page-flip-2 8s ease-in-out infinite; z-index: 8; }
        .bible-page-3 { animation: page-flip-3 8s ease-in-out infinite; z-index: 7; }
        .bible-page-4 { animation: page-flip-4 8s ease-in-out infinite; z-index: 6; }
        .bible-page-5 { animation: page-flip-5 8s ease-in-out infinite; z-index: 5; }
        .bible-page-6 { animation: page-flip-6 8s ease-in-out infinite; z-index: 4; }
        @keyframes page-flip-1 {
          0%, 10% { transform: rotateY(0deg); }
          25%, 35% { transform: rotateY(-140deg); }
          50%, 100% { transform: rotateY(0deg); }
        }
        @keyframes page-flip-2 {
          0%, 20% { transform: rotateY(0deg); }
          35%, 45% { transform: rotateY(-140deg); }
          60%, 100% { transform: rotateY(0deg); }
        }
        @keyframes page-flip-3 {
          0%, 30% { transform: rotateY(0deg); }
          45%, 55% { transform: rotateY(-140deg); }
          70%, 100% { transform: rotateY(0deg); }
        }
        @keyframes page-flip-4 {
          0%, 40% { transform: rotateY(0deg); }
          55%, 65% { transform: rotateY(-140deg); }
          80%, 100% { transform: rotateY(0deg); }
        }
        @keyframes page-flip-5 {
          0%, 50% { transform: rotateY(0deg); }
          65%, 75% { transform: rotateY(-140deg); }
          90%, 100% { transform: rotateY(0deg); }
        }
        @keyframes page-flip-6 {
          0%, 60% { transform: rotateY(0deg); }
          75%, 85% { transform: rotateY(-140deg); }
          100% { transform: rotateY(0deg); }
        }
      `}</style>
    </div>
  )
}
