export function Divider() {
  return (
    <div className="relative h-px bg-foreground/20" aria-hidden="true">
      <span className="absolute left-0 top-0 h-px w-2 bg-foreground" />
      <span className="absolute right-0 top-0 h-px w-2 bg-foreground" />
    </div>
  );
}