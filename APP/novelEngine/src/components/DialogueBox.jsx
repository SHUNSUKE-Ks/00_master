export default function DialogueBox(props) {
  return (
    <article class="dialogue-box">
      <div class="speaker-name">{props.speaker || "Narration"}</div>
      <p>{props.text}</p>
      <button type="button" onClick={props.onNext}>
        次へ
      </button>
    </article>
  );
}
