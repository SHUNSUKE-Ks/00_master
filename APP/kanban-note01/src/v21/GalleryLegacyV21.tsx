import { type Component, Show } from 'solid-js'
import GalleryHeader from '../pages/gallery/GalleryHeader'
import GallerySidebar from '../pages/gallery/GallerySidebar'
import GalleryGrid from '../pages/gallery/GalleryGrid'
import GalleryDetail from '../pages/gallery/GalleryDetail'
import GalleryLightbox from '../pages/gallery/GalleryLightbox'
import GalleryTagSheet from '../pages/gallery/GalleryTagSheet'
import { galleryState, selectGalleryItem } from '../pages/gallery/store'

// 前のギャラリー（ピンタレスト風）。V2.1 の新しいギャラリー（GalleryV21.tsx）から「前のギャラリー」で開く。そのまま残す（2026-09-28 利用者）
const GalleryLegacyV21: Component<{ onBack: () => void }> = (props) => (
  <div class="v21-gallery h-full flex flex-col bg-gray-50">
    <GalleryHeader onBack={() => props.onBack()} />
    <div class="flex flex-1 overflow-hidden">
      <Show when={galleryState.view !== 'pinterest'}>
        <GallerySidebar />
      </Show>
      <div class="relative flex flex-1 overflow-hidden">
        <GalleryGrid />
        <Show when={galleryState.detailOpen && galleryState.selectedId !== null && galleryState.view !== 'pinterest'}>
          <GalleryDetail />
        </Show>
      </div>
    </div>
    <Show when={galleryState.detailOpen && galleryState.selectedId !== null && galleryState.view === 'pinterest'}>
      <div class="gallery-detail-overlay-backdrop" onClick={() => selectGalleryItem(null)} />
      <GalleryDetail overlay />
    </Show>
    <GalleryLightbox />
    <GalleryTagSheet />
  </div>
)

export default GalleryLegacyV21
