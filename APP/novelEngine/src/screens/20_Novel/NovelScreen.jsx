import DialogueBox from "../../components/DialogueBox";
import { gameStore } from "../../stores/gameStore";
import library from "../../data/library/dev_library.default.json";

function getLocation(sceneId) {
  return library.locations?.find((location) => location.id === sceneId || sceneId?.includes(location.id.replace("bg_", "")));
}

function getCharacter(speaker) {
  if (speaker === "騎士") return library.characters?.find((character) => character.id === "char_knight");
  if (speaker === "少女" || speaker === "ヒロイン") return library.characters?.find((character) => character.id === "char_girl");
  return null;
}

function getCharacterAsset(character, talk) {
  if (!character) return "";
  const tags = talk.tags ?? [];
  if (character.id === "char_knight") {
    if (tags.includes("face_knight_angry")) return character.standingAssets?.angry_battle;
    if (tags.includes("face_knight_serious")) return character.standingAssets?.serious;
    if (tags.includes("face_knight_smile")) return character.standingAssets?.gentle_smile;
  }
  if (character.id === "char_girl") {
    if (tags.includes("face_girl_worried")) return character.standingAssets?.worried;
    if (tags.includes("face_girl_serious")) return character.standingAssets?.mysterious_serious;
    if (tags.includes("face_girl_smile")) return character.standingAssets?.gentle_smile;
  }
  return character.assetPath;
}

export default function NovelScreen() {
  const scene = () => gameStore.currentScene();
  const talk = () => gameStore.currentTalk();
  const location = () => getLocation(scene()?.id) ?? library.locations?.[0];
  const character = () => getCharacter(talk().speaker);
  const characterAsset = () => getCharacterAsset(character(), talk());

  function handleAdvance(event) {
    if (event.target.closest("button")) return;
    gameStore.nextTalk();
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
        <code>
          {gameStore.sceneIndex() + 1}/{gameStore.scenario.scenes.length} scene
        </code>
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
    </section>
  );
}
