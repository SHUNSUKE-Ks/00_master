import { type Component, Show } from 'solid-js'
import PcV31 from './PcV31'
import MobileV31 from './MobileV31'
import { useMobile } from './shared'
import '../v21/v21.css'
import './v31.css'
import './v31-mobile.css'

// Bakeru Note（V3.1）の入口。PC用とスマホ（Android）用の画面を分ける（2026-10-02 利用者）。
// どちらも同じデータ（store.ts）と同じ本文の編集面（NoteEditor）を使う。切り替えは「使い方」の中の「画面」。
const AppV31: Component = () => {
  const mobile = useMobile()
  return (
    <Show when={mobile()} fallback={<PcV31 />}>
      <MobileV31 />
    </Show>
  )
}

export default AppV31
