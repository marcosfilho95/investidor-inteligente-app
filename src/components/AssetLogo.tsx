// Asset logo mapping — uses favicon service for real company logos
const LOGO_DOMAINS: Record<string, string> = {
  ITUB4: "itau.com.br",
  BBAS3: "bb.com.br",
  BBDC4: "bradesco.com.br",
  B3SA3: "b3.com.br",
  AXIA6: "eletrobras.com",
  CPFE3: "cpfl.com.br",
  ISAE4: "isacteep.com.br",
  SAPR11: "sanepar.com.br",
  PETR4: "petrobras.com.br",
  VALE3: "vale.com",
  GGBR4: "gerdau.com",
  WEGE3: "weg.net",
  EMBR3: "embraer.com",
  TUPY3: "tupy.com.br",
  LREN3: "lojasrenner.com.br",
  MGLU3: "magazineluiza.com.br",
  MRVE3: "mrv.com.br",
  ABEV3: "ambev.com.br",
  JBSS3: "jbs.com.br",
  VIVT3: "vivo.com.br",
  TIMS3: "tim.com.br",
  TOTS3: "totvs.com",
  RDOR3: "rfrededorsaoluiz.com.br",
  HAPV3: "hapvida.com.br",
  FLRY3: "fleury.com.br",
};

interface AssetLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function AssetLogo({ symbol, size = 28, className = "" }: AssetLogoProps) {
  const domain = LOGO_DOMAINS[symbol];

  if (domain) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={symbol}
        width={size}
        height={size}
        className={`rounded-lg object-contain ${className}`}
        onError={(e) => {
          // Fallback to text initials
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
  const domain = LOGO_DOMAINS[symbol];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {domain && (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt={symbol}
          width={size}
          height={size}
          className={`rounded-lg object-contain ${className}`}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      )}
      <div
        className={`rounded-lg bg-primary/10 items-center justify-center text-[10px] font-bold text-primary ${className}`}
        style={{ width: size, height: size, display: domain ? "none" : "flex" }}
      >
        {symbol.slice(0, 2)}
      </div>
    </div>
  );
}
