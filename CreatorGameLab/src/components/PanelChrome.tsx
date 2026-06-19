import type { JSX } from "solid-js";

type PanelChromeProps = {
  title: string;
  subtitle?: string;
  actions?: JSX.Element;
  children: JSX.Element;
};

export function PanelChrome(props: PanelChromeProps) {
  return (
    <section class="tile-window">
      <header class="tile-header">
        <div>
          <h2>{props.title}</h2>
          {props.subtitle && <p>{props.subtitle}</p>}
        </div>
        {props.actions && <div class="tile-actions">{props.actions}</div>}
      </header>
      {props.children}
    </section>
  );
}
