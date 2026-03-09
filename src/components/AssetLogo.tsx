// Asset logo mapping — uses local images first, favicon service as fallback

// Local logos in /public/logos/ (uploaded by user)
const LOCAL_LOGOS: Record<string, string> = {
  RDOR3: "/logos/rdor3.avif",
  TOTS3: "/logos/totvs.png",
  ABEV3: "/logos/abev3.png",
  TUPY3: "/logos/tupy.jpg",
  EMBJ3: "/logos/embr3.png",
  GGBR4: "/logos/gerdau.png",
  AXIA6: "/logos/axia.jpg",
  CPFE3: "/logos/cpfe3.png",
  ISAE4: "/logos/isa.png",
  BBAS3: "/logos/bb.png",
  SAPR11: "/logos/sanepar.png",
  BBSE3: "/logos/BBSE.jpg",
  NTCO3: "/logos/natura.png",
  B3SA3: "/logos/b3.png",
  VIVT3: "/logos/vivo.png",
};

// External favicon fallback for assets without local logo.
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
  EMBJ3: "embraer.com",
  RDOR3: "rededorsaoluiz.com.br",
  ABEV3: "ambev.com.br",
  TUPY3: "tupy.com.br",
  GGBR4: "gerdau.com",
  AXIA6: "eletrobras.com",
  TOTS3: "totvs.com",
  BBSE3: "bbseguridaderi.com.br",
  SUZB3: "suzano.com.br",
  KLBN11: "klabin.com.br",
  RENT3: "localiza.com",
  NTCO3: "naturaeco.com",
  RADL3: "ri.rdsaude.com.br",
};

const WHITE_BG_LOGOS = new Set(["VIVT3", "TOTS3"]);

interface AssetLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function AssetLogo({ symbol, size = 28, className = "" }: AssetLogoProps) {
  const localSrc = LOCAL_LOGOS[symbol];
  const domain = LOGO_DOMAINS[symbol];
  const src = localSrc || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null);
  const whiteBgClass = WHITE_BG_LOGOS.has(symbol) ? "bg-white p-1" : "";

  if (src) {
    return (
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        className={`rounded-lg object-cover ${whiteBgClass} ${className}`}
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
  const whiteBgClass = WHITE_BG_LOGOS.has(symbol) ? "bg-white p-1" : "";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {src && (
        <img
          src={src}
          alt={symbol}
          width={size}
          height={size}
          className={`rounded-lg object-cover ${whiteBgClass} ${className}`}
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
