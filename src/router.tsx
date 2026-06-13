import { Navigate, Route, Router } from "@solidjs/router";
import { Show, type JSX } from "solid-js";
import { CenteredContainer } from "@/components/ui/container";
import { App } from "./app";
import { CanvasProvider } from "./context/canvas";
import { ScenesProvider, useScenes } from "./context/scenes";

function Providers(props: { children?: JSX.Element }) {
  return (
    <ScenesProvider>
      <CanvasProvider>
        {props.children}
      </CanvasProvider>
    </ScenesProvider>
  );
}

function RedirectToDefault() {
  const { defaultScene, ready } = useScenes();
  return (
    <Show when={ready()} fallback={<CenteredContainer>Loading scenes…</CenteredContainer>}>
      <Show when={defaultScene()} fallback={<CenteredContainer>No projects found in public/projects.</CenteredContainer>}>
        {(target) => <Navigate href={`/${target().project.slug}/${target().scene.slug}`} />}
      </Show>
    </Show>
  );
}

export function Root() {
  return (
    <Router root={Providers}>
      <Route path="/" component={RedirectToDefault} />
      <Route path="/:project/:scene" component={App} />
      <Route path="*" component={() => <CenteredContainer>Scene not found.</CenteredContainer>} />
    </Router>
  );
}
