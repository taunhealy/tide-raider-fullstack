export function SpritesLoader() {
  return (
    <div className="loading-container">
      <div className="soot-sprite" />
      <div className="soot-sprite" />
      <div className="soot-sprite" />

      <style jsx>{`
        .loading-container {
          position: relative;
          text-align: center;
        }

        .soot-sprite {
          width: 12px;
          height: 12px;
          background-color: var(--color-tertiary);
          border-radius: 50%;
          display: inline-block;
          margin: 0 6px;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .soot-sprite:nth-child(2) {
          animation-delay: 0.2s;
        }

        .soot-sprite:nth-child(3) {
          animation-delay: 0.4s;
        }

        .text {
          margin-top: 20px;
          font-size: 18px;
          color: #333;
          animation: fade 2s infinite;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fade {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
