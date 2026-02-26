// Asset logo mapping — uses local images first, favicon service as fallback

// Local logos in /public/logos/ (uploaded by user)
const LOCAL_LOGOS: Record<string, string> = {
  RDOR3: "/logos/rdor3.avif",
  TOTS3: "/logos/tots3.gif",
  JBSS3: "/logos/jbss3.jpg",
  ABEV3: "/logos/abev3.png",
  TUPY3: "/logos/tupy3.jpg",
  EMBR3: "/logos/embr3.png",
  GGBR4: "/logos/ggbr4.jpg",
  AXIA6: "/logos/axia6.jpeg",
  CPFE3: "/logos/cpfe3.png",
};

// Fallback favicon domains for assets without local logos
const LOGO_DOMAINS: Record<string, string> = {
  ITUB4: "itau.com.br",
  BBAS3: "bb.com.br",
  BBDC4: "bradesco.com.br",
  B3SA3: "b3.com.br",
  ISAE4: "isacteep.com.br",
  SAPR11: "sanepar.com.br",
  PETR4: "petrobras.com.br",
  VALE3: "vale.com",
  WEGE3: "weg.net",
  LREN3: "lojasrenner.com.br",
  MGLU3: "magazineluiza.com.br",
  MRVE3: "mrv.com.br",
  VIVT3: "vivo.com.br",
  TIMS3: "tim.com.br",
  HAPV3: "hapvida.com.br",
  FLRY3: "fleury.com.br",
};

interface AssetLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function AssetLogo({ symbol, size = 28, className = "" }: AssetLogoProps) {
  const localSrc = LOCAL_LOGOS[symbol];
  const domain = LOGO_DOMAINS[symbol];
  const src = localSrc || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null);

  if (src) {
    return (
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        className={`rounded-lg object-cover ${className}`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary ${className}`}
      style={{ width: size, height: size }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

export function AssetLogoWithFallback({ symbol, size = 28, className = "" }: AssetLogoProps) {
  const localSrc = LOCAL_LOGOS[symbol];
  const domain = LOGO_DOMAINS[symbol];
  const src = localSrc || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {src && (
        <img
          src={src}
          alt={symbol}
          width={size}
          height={size}
          className={`rounded-lg object-cover ${className}`}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      )}
      <div
        className={`rounded-lg bg-primary/10 items-center justify-center text-[10px] font-bold text-primary ${className}`}
        style={{ width: size, height: size, display: src ? "none" : "flex" }}
      >
        {symbol.slice(0, 2)}
      </div>
    </div>
  );
}
