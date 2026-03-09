const DISPLAY_SYMBOL_ALIASES: Record<string, string> = {
  NTCO3: "NATU3",
};

const CANONICAL_SYMBOL_ALIASES: Record<string, string> = Object.entries(DISPLAY_SYMBOL_ALIASES).reduce(
  (acc, [canonical, display]) => {
    acc[display] = canonical;
    return acc;
  },
  {} as Record<string, string>
);

export function getDisplaySymbol(symbol: string): string {
  const normalized = symbol.toUpperCase();
  return DISPLAY_SYMBOL_ALIASES[normalized] ?? normalized;
}

export function getCanonicalSymbol(symbol: string): string {
  const normalized = symbol.toUpperCase();
  return CANONICAL_SYMBOL_ALIASES[normalized] ?? normalized;
}

export function getAssetRouteSymbol(symbol: string): string {
  return getDisplaySymbol(symbol);
}
