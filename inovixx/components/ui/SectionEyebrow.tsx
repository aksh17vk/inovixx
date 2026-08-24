export function SectionEyebrow({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-fg-faint">
      <span className="font-mono-label text-xs">{index}</span>
      <span className="h-px w-8 bg-line" />
      <span className="font-mono-label text-xs">{label}</span>
    </div>
  );
}
