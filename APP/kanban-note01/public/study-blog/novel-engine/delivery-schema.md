# NovelEngine 納品スキーマ

Note、Scenario Chat、AllAssetHub、GameLabからNovelEngineへ渡すものを、ひとつのManifestにまとめるための学習用schema。

## 目的

- Scenario本文だけでなく、画像、音、Sceneとの対応、受入チェックを一緒に渡す。
- NovelEngine側はこのManifestを見て、何を採用し、何が未完了か判断する。
- 外部Agentはこの形を目標に納品できる。

## 最小構造

```json
{
  "meta": {
    "format": "novelengine_delivery_package",
    "version": "0.1",
    "packageId": "pkg_future_blacksmith_ep01",
    "title": "未来を打ち直す鍛冶屋 ep01",
    "sourceApp": "Note_Story",
    "targetEngine": "novelEngine"
  },
  "scenario": {
    "format": "scenario_oneshot",
    "path": "scenario/scenario_oneshot.json",
    "adoptTo": "src/data/scenario/scenario_main.json"
  },
  "assets": {
    "images": [],
    "audio": []
  },
  "mapping": [],
  "acceptance": {
    "status": "draft",
    "checks": []
  }
}
```

## 学習用schema

本番用の詳細schemaは`novelEngine/docs`側にある。Studyでは、まずAgentが迷わない最小版を読む。

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://local.note-story/study/novelengine_delivery_package.study.schema.json",
  "title": "NovelEngine Delivery Package Study Schema",
  "type": "object",
  "required": ["meta", "scenario", "assets", "mapping", "acceptance"],
  "additionalProperties": false,
  "properties": {
    "meta": {
      "type": "object",
      "required": ["format", "version", "packageId", "title", "sourceApp", "targetEngine"],
      "properties": {
        "format": { "const": "novelengine_delivery_package" },
        "version": { "const": "0.1" },
        "packageId": { "type": "string", "pattern": "^pkg_[a-zA-Z0-9_]+$" },
        "title": { "type": "string", "minLength": 1 },
        "sourceApp": { "type": "string" },
        "targetEngine": { "const": "novelEngine" }
      }
    },
    "scenario": {
      "type": "object",
      "required": ["format", "path", "adoptTo"],
      "properties": {
        "format": { "enum": ["conversation_log_v0_1", "scenario_oneshot", "scenario_main"] },
        "path": { "type": "string" },
        "adoptTo": { "type": "string" }
      }
    },
    "assets": {
      "type": "object",
      "required": ["images", "audio"],
      "properties": {
        "images": { "type": "array", "items": { "$ref": "#/$defs/asset" } },
        "audio": { "type": "array", "items": { "$ref": "#/$defs/asset" } }
      }
    },
    "mapping": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["sceneId"],
        "properties": {
          "sceneId": { "type": "string" },
          "backgroundId": { "type": ["string", "null"] },
          "characterIds": { "type": "array", "items": { "type": "string" } },
          "bgmId": { "type": ["string", "null"] }
        }
      }
    },
    "acceptance": {
      "type": "object",
      "required": ["status", "checks"],
      "properties": {
        "status": { "enum": ["draft", "checking", "accepted", "needs_fix", "rejected"] },
        "checks": { "type": "array", "items": { "type": "string" } },
        "notes": { "type": "string" }
      }
    }
  },
  "$defs": {
    "asset": {
      "type": "object",
      "required": ["id", "kind", "path", "status"],
      "properties": {
        "id": { "type": "string" },
        "kind": { "type": "string" },
        "path": { "type": "string" },
        "status": { "enum": ["draft", "generated", "runtime_ready", "accepted", "needs_fix"] },
        "tags": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## 納品チェック

- `scenario.path` が存在する。
- `mapping.sceneId` がscenario内のSceneと一致する。
- 画像と音の`path`がruntimeから読める。
- `acceptance.checks`に、確認済み項目を残す。

