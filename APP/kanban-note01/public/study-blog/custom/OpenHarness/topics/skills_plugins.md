# skills_plugins: スキル読込とプラグイン機構

対象ファイル（実読）:
- `src/openharness/skills/loader.py`（229行）
- `src/openharness/plugins/loader.py`（先頭70行、730行中）
- `.claude/skills/harness-eval/SKILL.md`, `.claude/skills/pr-merge/SKILL.md`（このリポジトリ自身が使っているskill、パスのみ確認）
- `src/openharness/skills/bundled/content/{commit,debug,diagnose,plan,review,simplify,skill-creator,test}.md`（バンドルskill、パスのみ確認）

## Skillsはオンデマンド知識

READMEの定義通り「必要になったときだけ読み込まれる知識」。`SkillDefinition`として保持し、`SkillRegistry`に登録する。

### 読み込み優先順位（`load_skill_registry`の処理順、loader.py:42-75実読）

1. **bundled** — `get_bundled_skills()`（同梱skill、commit/review/debug/plan/test/simplify等）
2. **user** — `load_user_skills()` → 以下のディレクトリを走査
   - `~/.openharness/skills/<skill>/SKILL.md`（本来の置き場）
   - `~/.claude/skills/<skill>/SKILL.md`（Claude Code互換）
   - `~/.agents/skills/<skill>/SKILL.md`（汎用agents互換）
3. **extra_skill_dirs**（呼び出し側指定の追加ディレクトリ）
4. **project** — `allow_project_skills`設定が真の場合のみ。cwdからgit rootまで遡って`.openharness/skills`, `.agents/skills`, `.claude/skills`を探索（`discover_project_skill_dirs`）。**未信頼リポジトリでは`oh config set allow_project_skills false`で無効化可能**（セキュリティ上の配慮）。
5. **plugin** — 有効化されたpluginが持つskillを追加登録

後勝ち（同名なら後から`registry.register()`した方が有効）なので、project skillはuser skillを上書きできる設計。

### ディレクトリ探索の安全策（discover_project_skill_dirs実読）

- `_valid_project_skill_dirs`が相対パスの絶対パス化・`..`混入を拒否（`rel.is_absolute() or ".." in rel.parts` はログ警告のうえ無視）。
- git root判定は`.git`ディレクトリの存在で遡って探す。git repoでなければ`Path.home()`まで遡る。

### SKILL.mdのfrontmatter

`_parse_skill_metadata`が読み取るフィールド: `name`, `description`, `user-invocable`（既定true）, `disable-model-invocation`（既定false）, `model`, `argument-hint`。**Claude Codeの`user-invocable`/`disable-model-invocation`と同じ語彙**であり、`anthropics/skills`の`SKILL.md`ディレクトリレイアウトとそのまま互換とREADMEに明記されている。

## Plugin機構

`plugins/loader.py`（先頭のみ実読）:
- plugin.jsonの探索場所は2箇所: `<plugin_dir>/plugin.json` または `<plugin_dir>/.claude-plugin/plugin.json`（Claude Code pluginレイアウトとの互換のため後者を用意）
- 探索ルートは `get_user_plugins_dir()`（`~/.openharness/plugins`）と `get_project_plugins_dir(cwd)`（`<cwd>/.openharness/plugins`）＋呼び出し側の`extra_roots`
- Pluginはcommands/hooks/agents/MCPサーバー定義を持てる（README「Add a Plugin」参照）

README掲載の互換確認済みplugin（`anthropics/claude-code`公式12種のうち代表6件）:

| Plugin | Type | 内容 |
|---|---|---|
| commit-commands | Commands | git commit/push/PRワークフロー |
| security-guidance | Hooks | ファイル編集時のセキュリティ警告 |
| hookify | Commands+Agents | カスタム挙動hookの作成 |
| feature-dev | Commands | 機能開発ワークフロー |
| code-review | Agents | マルチエージェントPRレビュー |
| pr-review-toolkit | Agents | 専門PRレビューagent群 |

## CreatorHubへの示唆

- CreatorHubの`.claude/agents/*.md`や`01_Harness/runbooks/*.md`は、OpenHarnessの「project skill」相当（cwd起点でgit rootまで探索されるプロジェクト固有知識）に近い設計思想。project skillのon/off切替（`allow_project_skills`）のような「信頼できないリポジトリでは自動読込を止める」フラグは、CreatorHubのagent実行判断（app-builder/app-designer等がどこまで自動で外部リポジトリの指示に従うか）を設計する際に参照価値がある。
