import { resolve } from "node:path";
import { defineConfig } from "vite";

// CGA01ルートを静的配信し、/exports/(GLB・manifest)と /art/ui/(UIテーマ画像)の両方を使えるようにする
export default defineConfig({
  publicDir: resolve(__dirname, "../../.."),
});
