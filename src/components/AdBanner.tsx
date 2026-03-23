import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  adUnitId: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdBanner: React.FC<AdBannerProps> = ({ adUnitId, className = "" }) => {
  const [publisherId, slotId] = adUnitId.split('/');
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        
        // Only initialize if width is greater than 0 and we haven't initialized yet
        if (width > 0 && !initializedRef.current) {
          try {
            // Check if the specific ins tag inside this component is uninitialized
            const ins = containerRef.current?.querySelector('ins.adsbygoogle:not([data-adsbygoogle-status])');
            
            if (ins) {
              initializedRef.current = true;
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            if (!errorMessage.includes("already have ads") && !errorMessage.includes("availableWidth=0")) {
              console.error("AdSense initialization failed:", e);
            }
          }
        }
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      initializedRef.current = false;
    };
  }, [adUnitId]);

  return (
    <div 
      ref={containerRef}
      className={`w-full max-w-md mx-auto mt-4 mb-2 overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800/50 flex flex-col items-center justify-center p-2 min-h-[100px] ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center rounded-lg bg-zinc-950/50 min-h-[90px]">
        <ins className="adsbygoogle"
             key={adUnitId}
             style={{ display: 'block', width: '100%', minHeight: '90px' }}
             data-ad-client={publisherId}
             data-ad-slot={slotId}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default AdBanner;
