import { createMemo, createSignal, For, Show } from "solid-js";
import {
  SRPG_ASSET_MANIFEST,
  SRPG_GALLERY_SECTIONS,
  SRPG_REFERENCE_IMAGES,
  SRPG_RUNTIME_MANIFEST,
  SRPG_SCREEN_LAYOUTS,
  SRPG_STUDIO_PROJECT,
  SRPG_STYLE_PROMPT,
  SRPG_WORKFLOW_STEPS
} from "./srpgStudioData";
import "../DevStudio/DevStudio.css";

const SRPG_FIX_COMMENTS_KEY = "title_game_studio_2d_srpg_fix_comments";
const SRPG_FIX_LOG_KEY = "title_game_studio_2d_srpg_fix_log";

function readJson(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function copyText(text) {
  const value = String(text ?? "");
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the textarea copy path for browsers that block Clipboard API.
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function CopyButton(props) {
  const [status, setStatus] = createSignal("idle");
  const label = createMemo(() => {
    if (status() === "copied") return "Copied";
    if (status() === "failed") return "Copy failed";
    return props.label ?? "Copy";
  });

  async function handleCopy() {
    const ok = await copyText(typeof props.text === "function" ? props.text() : props.text);
    setStatus(ok ? "copied" : "failed");
    window.setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <button
      type="button"
      classList={{ copied: status() === "copied", failed: status() === "failed" }}
      onClick={handleCopy}
    >
      {label()}
    </button>
  );
}

export default function SRPGStudio() {
  const imageById = createMemo(() =>
    Object.fromEntries(SRPG_REFERENCE_IMAGES.map((image) => [image.id, image]))
  );
  const flatGallery = createMemo(() =>
    SRPG_GALLERY_SECTIONS.flatMap((section) =>
      section.imageIds
        .map((imageId) => imageById()[imageId])
        .filter(Boolean)
        .map((image) => ({ ...image, screen: section.title, screenId: section.id }))
    )
  );
  const [selectedImageId, setSelectedImageId] = createSignal(null);
  const [comments, setComments] = createSignal(readJson(SRPG_FIX_COMMENTS_KEY, {}));
  const [fixLog, setFixLog] = createSignal(readJson(SRPG_FIX_LOG_KEY, []));

  const selectedIndex = createMemo(() =>
    flatGallery().findIndex((image) => image.id === selectedImageId())
  );
  const selectedImage = createMemo(() => flatGallery()[selectedIndex()] ?? null);

  const selectedAssetPrompt = (asset) =>
    `${SRPG_STYLE_PROMPT}\n\nAsset ID: ${asset.id}\nGroup: ${asset.group}\nTarget screen: ${asset.screen}\nPrimary request: ${asset.prompt}\nOutput target: ${asset.output}`;

  const manifestJson = () =>
    JSON.stringify(
      {
        project: SRPG_STUDIO_PROJECT,
        studioRole: "TitleGameStudio before engine binding",
        engineCandidates: ["novel", "battle", "collection"],
        stylePrompt: SRPG_STYLE_PROMPT,
        screens: SRPG_SCREEN_LAYOUTS,
        assets: SRPG_ASSET_MANIFEST
      },
      null,
      2
    );

  const runtimeManifestJson = () => JSON.stringify(SRPG_RUNTIME_MANIFEST, null, 2);

  const fixRequestMd = () => {
    const lines = [
      "# 2D_SRPGStudio 修正依頼ログ",
      "",
      `date: ${new Date().toISOString()}`,
      `target: ${SRPG_STUDIO_PROJECT.name}`,
      "studio_role: TitleGameStudio before engine binding",
      "",
      "## 修正ログ",
      ""
    ];

    if (!fixLog().length) {
      lines.push("- まだ修正ログはありません。");
    } else {
      fixLog().forEach((item, index) => {
        lines.push(`### ${index + 1}. ${item.title}`);
        lines.push("");
        lines.push(`- screen: ${item.screen}`);
        lines.push(`- image_id: ${item.imageId}`);
        lines.push(`- file: ${item.src}`);
        lines.push(`- kind: ${item.kind}`);
        lines.push(`- created_at: ${item.createdAt}`);
        lines.push("");
        lines.push("```text");
        lines.push(item.comment);
        lines.push("```");
        lines.push("");
      });
    }

    lines.push("## 現在の画像別コメント");
    lines.push("");
    Object.entries(comments()).forEach(([imageId, comment]) => {
      if (!comment?.trim()) return;
      const image = imageById()[imageId];
      lines.push(`### ${image?.title ?? imageId}`);
      lines.push("");
      lines.push(`- image_id: ${imageId}`);
      lines.push(`- file: ${image?.src ?? "unknown"}`);
      lines.push("");
      lines.push("```text");
      lines.push(comment);
      lines.push("```");
      lines.push("");
    });

    return lines.join("\n");
  };

  function openGalleryImage(imageId) {
    setSelectedImageId(imageId);
  }

  function closeGalleryImage() {
    setSelectedImageId(null);
  }

  function moveGallery(step) {
    const images = flatGallery();
    if (!images.length) return;
    const current = selectedIndex();
    const next = current < 0 ? 0 : (current + step + images.length) % images.length;
    setSelectedImageId(images[next].id);
  }

  function updateImageComment(imageId, value) {
    const next = { ...comments(), [imageId]: value };
    setComments(next);
    writeJson(SRPG_FIX_COMMENTS_KEY, next);
  }

  function addFixLog(image) {
    const comment = comments()[image.id]?.trim();
    if (!comment) return;
    const entry = {
      id: `srpg_fix_${Date.now()}`,
      createdAt: new Date().toISOString(),
      imageId: image.id,
      title: image.title,
      screen: image.screen,
      src: image.src,
      kind: image.kind,
      comment
    };
    const next = [entry, ...fixLog()];
    setFixLog(next);
    writeJson(SRPG_FIX_LOG_KEY, next);
  }

  function clearFixLog() {
    setFixLog([]);
    writeJson(SRPG_FIX_LOG_KEY, []);
  }

  return (
    <main class="devstudio title-game-studio">
      <section class="srpg-layout">
        <article class="panel srpg-hero">
          <div>
            <p class="ds-kicker">TITLE GAME STUDIO / BEFORE ENGINE BINDING</p>
            <h2>{SRPG_STUDIO_PROJECT.name}</h2>
            <p>
              新しいゲームは先にTitleGameStudioでレイアウト、仕様、素材、Stateを決め、
              その後に novel / battle / collection Engine を当てます。
            </p>
            <code>{SRPG_STUDIO_PROJECT.source}</code>
          </div>
          <div class="srpg-actions">
            <CopyButton label="Copy Style" text={SRPG_STYLE_PROMPT} />
            <CopyButton label="Copy Manifest" text={manifestJson} />
            <CopyButton label="Copy Runtime" text={runtimeManifestJson} />
            <CopyButton label="Copy Fix MD" text={fixRequestMd} />
          </div>
        </article>

        <article class="panel srpg-workflow">
          <h2>Studio Flow</h2>
          <ol>
            <li>TitleGameStudioを先に作る</li>
            <li>画面Layout / View State / 必要素材を決める</li>
            <li>画像Galleryで確認し、Fix Logを残す</li>
            <li>Runtime Manifestを固める</li>
            <li>Engine候補を選び、必要なAdapterを作る</li>
            <For each={SRPG_WORKFLOW_STEPS}>{(step) => <li>{step}</li>}</For>
          </ol>
        </article>

        <article class="panel srpg-reference-panel">
          <div class="code-head">
            <div>
              <h2>Screen Gallery</h2>
              <span>画像クリックで確認 / コメント / 修正ログ化</span>
            </div>
            <CopyButton label="Copy Fix MD" text={fixRequestMd} />
          </div>
          <div class="srpg-gallery-sections">
            <For each={SRPG_GALLERY_SECTIONS}>
              {(section) => (
                <section class="srpg-gallery-section">
                  <div class="srpg-gallery-head">
                    <h3>{section.title}</h3>
                    <code>{section.stateHint}</code>
                  </div>
                  <div class="srpg-reference-grid">
                    <For each={section.imageIds.map((id) => imageById()[id]).filter(Boolean)}>
                      {(image) => (
                        <button
                          type="button"
                          class="srpg-reference-card srpg-gallery-card"
                          onClick={() => openGalleryImage(image.id)}
                        >
                          <img src={image.src} alt={image.title} loading="lazy" />
                          <span>{image.kind}</span>
                          <strong>{image.title}</strong>
                          <p>{comments()[image.id] ? "comment saved" : image.note}</p>
                        </button>
                      )}
                    </For>
                  </div>
                </section>
              )}
            </For>
          </div>
        </article>

        <article class="panel srpg-fix-log-panel">
          <div class="code-head">
            <div>
              <h2>Fix Request Log</h2>
              <span>{fixLog().length} items / localStorage</span>
            </div>
            <div class="srpg-inline-actions">
              <CopyButton label="Copy MD" text={fixRequestMd} />
              <button type="button" onClick={clearFixLog}>Clear Log</button>
            </div>
          </div>
          <Show when={fixLog().length} fallback={<p>画像ポップアップからコメントを追加すると、ここに修正依頼ログが溜まります。</p>}>
            <div class="srpg-fix-log-list">
              <For each={fixLog()}>
                {(item) => (
                  <section>
                    <span>{item.screen}</span>
                    <strong>{item.title}</strong>
                    <p>{item.comment}</p>
                  </section>
                )}
              </For>
            </div>
          </Show>
        </article>

        <article class="panel srpg-screen-panel">
          <h2>Screen Layout / Layer</h2>
          <div class="srpg-screen-grid">
            <For each={SRPG_SCREEN_LAYOUTS}>
              {(screen) => (
                <section class="srpg-screen-card">
                  <div class="srpg-screen-head">
                    <span>{screen.phase}</span>
                    <h3>{screen.title}</h3>
                  </div>
                  <p>{screen.description}</p>
                  <div class="srpg-layer-row">
                    <For each={screen.layers}>{(layer) => <code>{layer}</code>}</For>
                  </div>
                  <h4>Assets</h4>
                  <ul>
                    <For each={screen.assets}>{(asset) => <li>{asset}</li>}</For>
                  </ul>
                </section>
              )}
            </For>
          </div>
        </article>

        <article class="panel srpg-runtime-panel">
          <div class="code-head">
            <div>
              <h2>Runtime Manifest</h2>
              <span>SRPG Engineへ渡す前のlayer / frame draft</span>
            </div>
            <CopyButton label="Copy Runtime JSON" text={runtimeManifestJson} />
          </div>
          <div class="srpg-runtime-grid">
            <For each={Object.entries(SRPG_RUNTIME_MANIFEST.screens)}>
              {([screenId, screen]) => (
                <section class="srpg-runtime-card">
                  <span>{screen.phase}</span>
                  <h3>{screenId}</h3>
                  <div class="srpg-layer-row">
                    <For each={screen.states}>{(state) => <code>{state}</code>}</For>
                  </div>
                  <ul>
                    <For each={screen.layers}>
                      {(layer) => (
                        <li>
                          z{layer.z}: {layer.id} / {layer.asset}
                        </li>
                      )}
                    </For>
                  </ul>
                </section>
              )}
            </For>
          </div>
        </article>

        <article class="panel srpg-manifest-panel">
          <div class="code-head">
            <div>
              <h2>Asset Manifest</h2>
              <span>{SRPG_ASSET_MANIFEST.length} assets / title studio draft</span>
            </div>
            <CopyButton label="Copy JSON" text={manifestJson} />
          </div>
          <div class="srpg-asset-table">
            <For each={SRPG_ASSET_MANIFEST}>
              {(asset) => (
                <section class="srpg-asset-row">
                  <div>
                    <span class="asset-group">{asset.group}</span>
                    <strong>{asset.id}</strong>
                    <p>{asset.output}</p>
                  </div>
                  <span class="status-pill">{asset.status}</span>
                  <CopyButton label="Copy Prompt" text={() => selectedAssetPrompt(asset)} />
                </section>
              )}
            </For>
          </div>
        </article>

        <Show when={selectedImage()}>
          {(image) => (
            <div class="srpg-lightbox" role="dialog" aria-modal="true">
              <div class="srpg-lightbox-inner">
                <div class="srpg-lightbox-media">
                  <button type="button" class="srpg-lightbox-nav prev" onClick={() => moveGallery(-1)}>
                    ←
                  </button>
                  <img src={image().src} alt={image().title} />
                  <button type="button" class="srpg-lightbox-nav next" onClick={() => moveGallery(1)}>
                    →
                  </button>
                </div>
                <aside class="srpg-lightbox-side">
                  <button type="button" class="modal-close" onClick={closeGalleryImage}>
                    Close
                  </button>
                  <span>{image().screen}</span>
                  <h2>{image().title}</h2>
                  <code>{image().src}</code>
                  <p>{image().note}</p>
                  <label>
                    Comment / Fix Request
                    <textarea
                      value={comments()[image().id] ?? ""}
                      onInput={(event) => updateImageComment(image().id, event.currentTarget.value)}
                      placeholder="例: 左HPバーは良いが、portrait枠を少し小さく。Battle画面では青の発光を弱める。"
                    />
                  </label>
                  <div class="srpg-lightbox-actions">
                    <button type="button" onClick={() => addFixLog(image())}>
                      Add Fix Log
                    </button>
                    <CopyButton label="Copy Fix MD" text={fixRequestMd} />
                  </div>
                </aside>
              </div>
            </div>
          )}
        </Show>
      </section>
    </main>
  );
}
