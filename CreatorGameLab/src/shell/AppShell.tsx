import type { JSX } from "solid-js";
import { Sidebar } from "./Sidebar";
import type { LabState } from "../state/labState";

type AppShellProps = {
  lab: LabState;
  children: JSX.Element;
};

export function AppShell(props: AppShellProps) {
  return (
    <div class="lab-shell">
      <Sidebar lab={props.lab} />
      <main class="lab-main">
        {props.children}
      </main>
    </div>
  );
}
