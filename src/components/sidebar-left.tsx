import { For, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Icon } from "@/components/ui/icon";
import { useScenes } from "@/context/scenes";
import { Button } from "./ui/button";

export function SidebarLeft() {
  const params = useParams();
  const navigate = useNavigate();
  const { projects } = useScenes();

  return (
    <div class="absolute left-4 top-4 flex flex-col w-[236px] max-h-full rounded-2xl gap-0 bg-background border border-border text-muted-foreground">
      <div class="flex items-center justify-between h-12 px-3">
        <div class="flex items-center justify-center gap-1">
          <Icon name="diffusion-logo" class="size-6" />
          <span class="text-xxs font-strong">Diffusion Studio</span>
        </div>
        <Button size="icon" variant="ghost">
          <Icon name="sidebar" />
        </Button>
      </div>
      <div class="px-4 py-3 border-t border-border flex flex-col">
        <div class="flex items-center justify-between h-8">
          <span class="text-xxs text-muted-foreground px-1">Projects</span>
          <Button size="icon" variant="ghost" class="text-muted-foreground">
            <Icon name="plus-add" />
          </Button>
        </div>
        <For each={projects()}>
          {(project) => {
            const active = () => project.slug === params.project;
            return (
              <button
                type="button"
                onClick={() => navigate(`/${project.slug}/${project.scenes[0]?.slug ?? ""}`)}
                class="flex items-center h-7 rounded-md px-0.5 gap-1.5 my-0.5 flex-1"
                classList={{
                  "bg-muted text-foreground": active(),
                  "text-muted-foreground": !active(),
                }}
              >
                <Icon name="folder" />
                <span class="text-xxs">{project.label}</span>
                <Show when={active()}>
                  <Icon name="confirm-check" class="ml-auto" />
                </Show>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  )
}
