import type { Component } from 'solid-js'

/** 立ち絵を小さな枠に切り抜いて出す（focusX / focusY で顔が残る位置に寄せる） */
const Portrait: Component<{ src: string; alt: string; focusX?: string | null; focusY?: string | null; class?: string }> = (props) => (
  <img
    class={`v21-portrait ${props.class ?? ''}`}
    src={props.src}
    alt={props.alt}
    loading="lazy"
    style={{ 'object-position': `${props.focusX ?? '50%'} ${props.focusY ?? '15%'}` }}
  />
)

export default Portrait
