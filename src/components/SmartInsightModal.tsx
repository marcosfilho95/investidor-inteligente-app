import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { SmartAlertCandidate } from "@/lib/smartAlerts";

interface SmartInsightModalProps {
  open: boolean;
  alert: SmartAlertCandidate | null;
  onOpenChange: (open: boolean) => void;
  onPrimaryAction: () => void;
  onHighlightAction?: (action: { label: string; route: string; focus: string }) => void;
}

export function SmartInsightModal({
  open,
  alert,
  onOpenChange,
  onPrimaryAction,
  onHighlightAction,
}: SmartInsightModalProps) {
  if (!alert) return null;
  const emojiMatch = alert.title.match(/^([\p{Extended_Pictographic}])\s*/u);
  const titleEmoji = emojiMatch?.[1] ?? null;
  const titleText = titleEmoji ? alert.title.replace(/^([\p{Extended_Pictographic}])\s*/u, "") : alert.title;
  const selectedEntity = alert.entityType !== "portfolio" ? alert.entityId : "";

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlightPatternParts = [
    selectedEntity ? escapeRegExp(selectedEntity) : "",
    "[A-Z]{4}\\d{1,2}",
    "[+-]?\\d+(?:[.,]\\d+)?%",
  ].filter(Boolean);

  const highlightRegex =
    highlightPatternParts.length > 0 ? new RegExp(`(${highlightPatternParts.join("|")})`, "g") : null;
  const topHighlights = (alert.highlights || []).filter(Boolean).slice(0, 2);
  const topHighlightActions = (alert.highlightActions || []).slice(0, 2);

  const renderHighlightedMessage = (message: string) => {
    if (!highlightRegex) return message;
    const parts = message.split(highlightRegex);

    return parts.map((part, index) => {
      if (!part) return null;
      const isHighlight = highlightRegex.test(part);
      highlightRegex.lastIndex = 0;
      if (!isHighlight) return part;

      return (
        <span key={`${part}-${index}`} className="font-semibold text-emerald-300">
          {part}
        </span>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-1rem)] max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(17,74,61,0.35),rgba(6,9,18,0.95)_42%),linear-gradient(135deg,rgba(9,16,26,0.96),rgba(7,10,18,0.92))] p-0 text-slate-50 shadow-[0_26px_90px_rgba(0,0,0,0.58)] sm:rounded-3xl [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="relative p-4 sm:p-6 md:p-7">
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/35 bg-[linear-gradient(120deg,rgba(16,185,129,0.2),rgba(16,185,129,0.08))] py-1 pl-1.5 pr-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:mb-5 sm:text-[11px]">
              <img
                src="/images/hodl-avatar-dark.png"
                alt="Hodl"
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-emerald-300/55 shadow-[0_0_14px_rgba(16,185,129,0.35)]"
              />
              <span>Dica do HODL</span>
            </div>

            <div className="mt-1 flex items-start gap-2.5 sm:items-center sm:gap-3">
              {titleEmoji && (
                <span className="inline-flex shrink-0 items-center justify-center text-[1.55rem] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] sm:text-[1.85rem]">
                  {titleEmoji}
                </span>
              )}
              <DialogTitle className="text-[1.1rem] font-bold leading-tight tracking-tight text-slate-50 sm:whitespace-nowrap sm:text-[1.05rem] md:text-[1.05rem]">
                {titleText}
              </DialogTitle>
            </div>

            <DialogDescription className="mt-3 whitespace-pre-line text-[0.84rem] leading-snug text-slate-400 sm:text-[0.86rem]">
              {renderHighlightedMessage(alert.message)}
            </DialogDescription>
            {topHighlights.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {topHighlights.map((item, idx) => {
                  const action = topHighlightActions.find((candidate) => candidate.label === item);
                  if (action && onHighlightAction) {
                    return (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        onClick={() => onHighlightAction(action)}
                        className="inline-flex min-h-8 items-center rounded-full border border-emerald-300/35 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] leading-tight font-medium text-emerald-100 transition-colors hover:bg-emerald-400/20"
                      >
                        {item}
                      </button>
                    );
                  }
                  return (
                    <span
                      key={`${item}-${idx}`}
                      className="inline-flex min-h-8 items-center rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] leading-tight font-medium text-emerald-100"
                    >
                      {item}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="w-full border-0 text-slate-300 shadow-none outline-none ring-0 hover:bg-white/10 hover:text-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Agora não
              </Button>
              <Button
                type="button"
                className="w-full rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-300 sm:w-auto"
                onClick={onPrimaryAction}
              >
                {alert.ctaLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
