export function ProgressBar(props: { value: number; tone?: "cyan" | "gold" | "green" }) {
  const safeValue = Math.max(0, Math.min(100, props.value));
  return (
    <div class={`progress-line ${props.tone ?? "cyan"}`} aria-label={`progress ${safeValue}%`}>
      <span style={{ width: `${safeValue}%` }} />
    </div>
  );
}
