import { type Component, Show, onMount } from 'solid-js'
import { state, setState, setFontSize, initFirestore } from './store'
import { firebaseEnabled } from './db/firebase'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import PageDb01 from './pages/PageDb01'
import PageDb02 from './pages/PageDb02'
import PageDb03 from './pages/PageDb03'
import PageDb10 from './pages/PageDb10'
import PageAssetTags from './pages/PageAssetTags'
import PageBlog from './pages/PageBlog'
import PageStudy from './pages/PageStudy'
import PageMemo from './pages/PageMemo'
import PageUpnote from './pages/PageUpnote'
import PageTrash from './pages/PageTrash'
import PageNotebook from './pages/PageNotebook'
import PageInbox from './pages/PageInbox'
import PageDevStudio from './pages/PageDevStudio'
import InboxComposer from './features/inbox/InboxComposer'
import SettingsPanel from './components/SettingsPanel'
import GalleryPanel from './components/GalleryPanel'
import GalleryPage from './pages/gallery'

setFontSize(state.fontSize)

const App: Component = () => {
  onMount(() => {
    if (firebaseEnabled) initFirestore()
  })
  return (
    <Show when={state.page === 'gallery'} fallback={<MainApp />}>
      <GalleryPage />
    </Show>
  )
}

const MainApp: Component = () => (
  <div class="flex flex-col h-dvh overflow-hidden">
    <Header />
    <div class="flex flex-1 overflow-hidden relative">
      <div
        id="sidebarBackdrop"
        classList={{ show: state.sidebarOpen }}
        onClick={() => setState({ sidebarOpen: false })}
      />
      <Show when={state.page !== 'notebook'}>
        <Sidebar />
      </Show>
      <main class="flex-1 overflow-hidden relative">
        <Show when={state.page === 'db01'}>
          <PageDb01 products={state.products} />
        </Show>
        <Show when={state.page === 'db02'}>
          <PageDb02 nutrients={state.nutrients} />
        </Show>
        <Show when={state.page === 'db03'}>
          <PageDb03 />
        </Show>
        <Show when={state.page === 'db10'}>
          <PageDb10 />
        </Show>
        <Show when={state.page === 'assetTags'}>
          <PageAssetTags />
        </Show>
        <Show when={state.page === 'blog'}>
          <PageBlog />
        </Show>
        <Show when={state.page === 'study'}>
          <PageStudy />
        </Show>
        <Show when={state.page === 'memo'}>
          <PageMemo />
        </Show>
        <Show when={state.page === 'upnote'}>
          <PageUpnote />
        </Show>
        <Show when={state.page === 'trash'}>
          <PageTrash />
        </Show>
        <Show when={state.page === 'notebook'}>
          <PageNotebook />
        </Show>
        <Show when={state.page === 'inbox'}>
          <PageInbox />
        </Show>
        <Show when={state.page === 'devstudio'}>
          <PageDevStudio />
        </Show>
      </main>
      <SettingsPanel />
      <GalleryPanel />
      <InboxComposer />
    </div>
  </div>
)

export default App
