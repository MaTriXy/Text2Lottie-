import { SidebarLeft } from '@/components/sidebar-left';
import { PlaybackControls } from '@/components/playback-controls';
import { ScenesContainer } from '@/components/scenes-container';
import { SidebarRight } from '@/components/sidebar-right';

export function App() {
  return (
    <>
      <SidebarLeft />
      <div class="absolute inset-x-0 bottom-4 flex flex-col items-center gap-4 px-4">
        <PlaybackControls />
        <ScenesContainer />
      </div>
      <SidebarRight />
    </>
  );
};
