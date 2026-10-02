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
import PageClaudeNote from './pages/PageClaudeNote'
import PageTalkLog from './pages/PageTalkLog'
import InboxComposer from './features/inbox/InboxComposer'
import SettingsPanel from './components/SettingsPanel'
import GalleryPanel from './components/GalleryPanel'
import GalleryPage from './pages/gallery'
import AppV21 from './v21/AppV21'
import AppV31 from './v31/AppV31'
import { appVersion } from './v21/nav'

setFontSize(state.fontSize)

const App: Component = () => {
  onMount(() => {
    if (firebaseEnabled) initFirestore()
  })
  // V2.1 が既定。Vol1.1（ここから下の旧画面）は凍結して残し、メニュー上部の2タブで切り替える
  if (appVersion === 'v21') return <AppV21 />
  // V3.1 化けるNote（2026-10-02）。迷わず書けるシンプルなメモ帳。データは V2.1 と別に持つ
  if (appVersion === 'v31') return <AppV31 />
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
      <Show when={state.page !== 'notebook' && state.page !== 'talklog'}>
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
        <Show when={state.page === 'claudenote'}>
          <PageClaudeNote />
        </Show>
        <Show when={state.page === 'talklog'}>
          <PageTalkLog />
        </Show>
      </main>
      <SettingsPanel />
      <GalleryPanel />
      <InboxComposer />
    </div>
  </div>
)

export default App
