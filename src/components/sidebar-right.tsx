import { Button } from "@/components/ui/button";
import { createSignal, For, Show, type JSX } from "solid-js";
import { useCanvas } from "@/context/canvas";
import { NumericSlider } from "@/components/ui/numeric-slider";
import { Icon } from "@/components/ui/icon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { AnimationSlot } from "@/types";


// Color slots are RGBA 0..1; <input type="color"> works in #rrggbb hex, so we
// convert at the boundary and carry the slot's alpha through untouched.
function rgbToHex([r, g, b]: [number, number, number, number]): string {
  const h = (n: number) =>
    Math.round(Math.max(0, Math.min(1, n)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

export function SidebarRight() {
  const { slots, zoom, controls, setScalarSlot, setColorSlot, setVec2Slot, setTextSlot, zoomByCentered, resetCamera } = useCanvas();
  const [edits, setEdits] = createSignal<Record<string, AnimationSlot["value"]>>({});

  const set = (id: string, value: AnimationSlot["value"]) =>
    setEdits((v) => ({ ...v, [id]: value }));

  const valueOf = (s: AnimationSlot) => edits()[s.id] ?? s.value;

  const handleExport = async () => {
    const res = await fetch('/lottie.json');
    if (!res.ok) {
      throw new Error(`Failed to load /lottie.json (HTTP ${res.status})`);
    }

    const values = Object.fromEntries(slots().map((s) => [s.id, valueOf(s)]));
    downloadConfiguredLottie(await res.text(), slots(), values);
  };

  return (
    <div class="absolute right-4 top-4 flex flex-col w-[236px] max-h-full rounded-2xl gap-0 bg-background border border-border">
      <div class="flex items-center justify-between h-12 px-3 pl-4">
        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center text-muted-foreground hover:text-foreground">
            <span class="text-xxs">
              {Math.round(zoom() * 100)}%
            </span>
            <Icon name="chevron-down" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => zoomByCentered(1.2)}>
              Zoom in
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => zoomByCentered(1 / 1.2)}>
              Zoom out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => zoomByCentered(1 / zoom())}>
              Zoom to 100%
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => resetCamera()}>
              Zoom to fit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleExport}>
          Export
        </Button>
      </div>

      <Show when={slots().length > 0}>
        <Group title="Properties">
          <For each={slots()}>
            {(slot) => {
              const m = controls()?.[slot.id];
              const label = m?.label ?? slot.id;

              if (slot.type === "scalar") {

                return (
                  <Slot label={label}>

                    <NumericSlider
                      value={valueOf(slot) as number}
                      minValue={m?.min ?? 0}
                      maxValue={m?.max ?? 100}
                      step={m?.step ?? (((m?.max ?? 100) - (m?.min ?? 0)) / 100 || 1)}
                      onChange={(v) => {
                        set(slot.id, v);
                        setScalarSlot(slot.id, v);
                      }}
                    />
                  </Slot>
                );
              }

              if (slot.type === "color") {
                const value = valueOf(slot) as [number, number, number, number];
                const hex = rgbToHex(value);
                // Label column on the left (plain text), then a field holding the
                // swatch and its hex. The native picker is overlaid transparently
                // so the whole field opens it.
                return (
                  <Slot label={label}>
                    <label class="relative flex h-7 flex-1 cursor-pointer select-none items-center gap-2 overflow-hidden rounded-md bg-input p-1 focus-ring">
                      <span
                        class="size-5 shrink-0 rounded-sm"
                        style={{ "background-color": hex }}
                      />
                      <span class="text-xxs uppercase text-foreground">
                        {hex.replace("#", "")}
                      </span>
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => {
                          const [r, g, b] = hexToRgb(e.target.value);
                          const rgba: [number, number, number, number] = [r, g, b, value[3]];
                          set(slot.id, rgba);
                          setColorSlot(slot.id, rgba);
                        }}
                        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={label}
                      />
                    </label>
                  </Slot>
                );
              }

              if (slot.type === "vec2") {
                const value = valueOf(slot) as [number, number];
                const update = (i: 0 | 1, n: number) => {
                  const next: [number, number] = i === 0 ? [n, value[1]] : [value[0], n];
                  set(slot.id, next);
                  setVec2Slot(slot.id, next);
                };
                return (
                  <Slot label={label}>
                    <div class="flex flex-1 gap-2">
                      {([0, 1] as const).map((i) => (
                        <input
                          type="number"
                          step={m?.step ?? 1}
                          value={value[i]}
                          onChange={(e) => update(i, Number(e.target.value))}
                          class="rounded-md bg-input font-sans text-foreground outline-none w-0 flex-1 text-xxs h-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none px-2 focus-ring"
                        />
                      ))}
                    </div>
                  </Slot>
                );
              }

              // text
              const value = valueOf(slot) as string;
              return (
                <Slot label={label}>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      set(slot.id, e.target.value);
                      setTextSlot(slot.id, e.target.value);
                    }}
                    class="rounded-md bg-input font-sans text-foreground outline-none w-0 flex-1 text-xxs h-7 px-2 focus-ring"
                    aria-label={label}
                  />
                </Slot>
              );
            }}
          </For>
        </Group>
        <div class="h-1 w-full" />
      </Show>
    </div>
  );
}

function downloadConfiguredLottie(
  lottieJson: string,
  slots: AnimationSlot[],
  values: Record<string, AnimationSlot["value"]>
) {
  const doc = JSON.parse(lottieJson) as {
    slots?: Record<string, { p?: { k?: unknown; p?: { t?: string } } }>;
  };

  for (const slot of slots) {
    const def = doc.slots?.[slot.id]?.p;
    if (!def) continue;
    const value = values[slot.id] ?? slot.value;
    if (slot.type === "text") {
      if (def.p) def.p.t = value as string;
    } else {
      def.k = value;
    }
  }

  const blob = new Blob([JSON.stringify(doc)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lottie.json";
  a.click();
  URL.revokeObjectURL(url);
}

type SlotProps = {
  label?: string;
  children: JSX.Element;
}

function Slot(props: SlotProps) {
  return (
    <div class="flex items-center gap-1 min-h-7">
      <span class="w-20 shrink-0 truncate text-xxs text-muted-foreground">{props.label}</span>
      {props.children}
    </div>
  )
}

type GroupProps = {
  title?: string;
  children: JSX.Element;
}

function Group(props: GroupProps) {
  return (
    <div class="flex flex-col border-t border-border px-4">
      <div class="h-11 flex items-center">
        <span class="text-xxs text-foreground">{props.title}</span>
      </div>
      <div class="flex flex-col gap-2 pb-3">
        {props.children}
      </div>
    </div>
  )
}