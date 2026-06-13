import { For } from "solid-js";
import { Icon } from "@/components/ui/icon";

type Scene = {
  label: string;
  active?: boolean;
};

const scenes: Scene[] = [
  { label: "Scene 1" },
  { label: "Scene 2", active: true },
  { label: "Scene 3" },
  { label: "Scene 4" },
];

export function ScenesContainer() {
  return (
    <div class="flex items-start justify-center gap-4">
      <For each={scenes}>
        {(scene) => (
          <div class="flex flex-col gap-2 w-[114px] shrink-0">
            <div
              class="aspect-video w-full overflow-hidden rounded-md bg-background"
              classList={{
                "border border-border": !scene.active,
                "border-2 border-primary": scene.active,
              }}
            />
            <span class="text-center text-xxs text-muted-foreground">{scene.label}</span>
          </div>
        )}
      </For>

      <button
        type="button"
        class="flex h-16 w-[114px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background text-muted-foreground"
      >
        <Icon name="plus-add" />
      </button>
    </div>
  );
}
