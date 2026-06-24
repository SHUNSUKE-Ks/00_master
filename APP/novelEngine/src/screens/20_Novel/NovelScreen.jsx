import DialogueBox from "../../components/DialogueBox";
import { gameStore } from "../../stores/gameStore";
import library from "../../data/library/dev_library.default.json";
import { resolveAssetPath, resolveStandingAsset } from "../../utils/assets";
import { createSignal } from "solid-js";

function getLocation(scene) {
  const bgTag = scene?.tags?.find((tag) => tag.startsWith("bg_"));
  return (
    library.locations?.find((location) => location.id === bgTag) ??
    library.locations?.find((location) => bgTag?.includes(location.id.replace("bg_", ""))) ??
    library.locations?.[0]
  );
}

function getCharacter(speaker, talk) {
  const tags = talk?.tags ?? [];
  if (tags.includes("char_blacksmith_boy")) return library.characters?.find((character) => character.id === "char_knight");
  if (tags.includes("char_mia")) return library.characters?.find((character) => character.id === "char_girl");
  if (speaker === "騎士") return library.characters?.find((character) => character.id === "char_knight");
  if (speaker === "少女" || speaker === "ヒロイン" || speaker === "ミア") return library.characters?.find((character) => character.id === "char_girl");
  if (speaker === "主人公") return library.characters?.find((character) => character.id === "char_knight");
  return null;
}

function getCharacterAsset(character, talk) {
  if (!character) return "";
  const tags = talk.tags ?? [];
  if (character.id === "char_knight") {
    if (tags.includes("face_knight_angry") || tags.includes("face_angry")) return resolveStandingAsset(character, "angry_battle");
    if (tags.includes("face_knight_serious") || tags.includes("face_serious") || tags.includes("face_determined")) return resolveStandingAsset(character, "serious");
    if (tags.includes("face_knight_smile") || tags.includes("face_happy")) return resolveStandingAsset(character, "gentle_smile");
  }
  if (character.id === "char_girl") {
    if (tags.includes("face_girl_worried") || tags.includes("face_worried")) return resolveStandingAsset(character, "worried");
    if (tags.includes("face_girl_serious") || tags.includes("face_serious") || tags.includes("face_surprised")) return resolveStandingAsset(character, "mysterious_serious");
    if (tags.includes("face_girl_smile") || tags.includes("face_happy")) return resolveStandingAsset(character, "gentle_smile");
  }
  return resolveAssetPath(character);
}

export default function NovelScreen() {
  const [autoMode, setAutoMode] = createSignal(false);
  const scene = () => gameStore.currentScene();
  const talk = () => gameStore.currentTalk();
  const choice = () => gameStore.currentChoice();
  const location = () => getLocation(scene());
  const character = () => getCharacter(talk().speaker, talk());
  const characterAsset = () => getCharacterAsset(character(), talk());

  function handleAdvance(event) {
    if (event.target.closest("button")) return;
    gameStore.nextTalk();
  }

  function openLog() {
    console.info("[NovelUI Log]", {
      scene: scene()?.id,
      talkIndex: gameStore.talkIndex(),
      talks: scene()?.talk ?? []
    });
  }

  function toggleAuto() {
    setAutoMode((value) => !value);
    console.info("[NovelUI Auto]", { enabled: !autoMode() });
  }

  function skipScene() {
    const current = scene();
    const talks = current?.talk ?? [];
    if (current?.choice) {
      console.info("[NovelUI Skip]", "choice scene cannot auto-skip");
      return;
    }
    for (let index = gameStore.talkIndex(); index < talks.length; index += 1) {
      gameStore.nextTalk();
    }
  }

  return (
    <section
      class="screen novel-screen"
      style={{ "--novel-bg": `url("${location()?.assetPath}")` }}
      onClick={handleAdvance}
    >
      <div class="novel-shade" />
      <div class="novel-topbar">
        <span>{scene()?.scene ?? "No Scene"}</span>
        <div class="novel-actions" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={openLog}>Log</button>
          <button type="button" classList={{ active: autoMode() }} onClick={toggleAuto}>Auto</button>
          <button type="button" onClick={skipScene}>Skip</button>
        </div>
      </div>
      <div class="stage-layer" aria-hidden="true">
        <img
          class="character-sprite main-character"
          src={characterAsset()}
          alt=""
        />
      </div>
      <DialogueBox
        speaker={talk().speaker}
        text={talk().text}
        onNext={gameStore.nextTalk}
      />
      {choice() && (
        <div class="choice-panel" onClick={(event) => event.stopPropagation()}>
          <p>{choice().text}</p>
          <div class="choice-options">
            {choice().options.map((option) => (
              <button type="button" onClick={() => gameStore.chooseOption(option)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
