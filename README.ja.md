<p align="center">
  <img src="assets/logo.png" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/claude-sfx"><img src="https://img.shields.io/npm/v/claude-sfx" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) のための、プロシージャルなオーディオフィードバック機能。 ツール呼び出し、ファイル編集、検索、git push、およびエージェントの起動ごとに、異なるサウンドが生成されます。これらのサウンドは、音声ファイルではなく、数学的な計算に基づいて合成されます。

## クイックスタート

```bash
npm install -g claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

これで完了です。Claude Code は、動作中にサウンドを再生するようになります。

## なぜオーディオフィードバックが必要なのか？

AI エージェントがあなたの代わりに読み込み、書き込み、検索し、デプロイを行う場合、あなたは状況を把握しにくくなります。 画面に表示されるテキストをただ見ているだけです。 オーディオフィードバックは、状況を把握する能力を取り戻します。

- **アクセシビリティ:** ターミナルを見なくても、状態の変化、エラー、および完了を音声で確認できます。
- **スムーズな作業:** テストが成功したか、push が完了したかを、コンテキストを切り替えることなく知ることができます。
- **没入感:** エージェントが単なるブラックボックスではなく、協力者のように感じられます。

## 7つのアクション

Claude Code のすべての操作は、7つのコアアクションのいずれかに対応します。 修飾子（ステータス、範囲、方向）は、サウンドを変更しますが、一貫性を保ちます。

| Verb | トリガー | Sound |
|---|---|---|
| **入力 (intake)** | `Read`, `WebFetch`, `WebSearch` | 緩やかに上昇するサイン波 — 何かが入力される |
| **変換 (transform)** | `Edit` | FM 処理されたパルス波 — 形状の変更 |
| **コミット (commit)** | `Write`, `NotebookEdit`, `git commit` | 鋭いスタンプ音 — 確定 |
| **ナビゲーション (navigate)** | `Grep`, `Glob` | ソナーの音 — スキャン |
| **実行 (execute)** | `Bash`, `npm test`, `tsc` | ノイズの爆発 + 音 — 機械的な動作 |
| **移動 (move)** | `mv`, `cp`, サブエージェントの起動 | 風の音 — 空気の流れ |
| **同期 (sync)** | `git push`, `git pull` | 劇的な風の音 + 音のアンカー |

### 修飾子

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### スマートな Bash 検出

フックハンドラは、Bash コマンドを検査して、適切なサウンドを選択します。

| Bash コマンド | Verb | ステータス |
|---|---|---|
| `git push` | sync (成功) | 終了コードから |
| `git pull` | sync (失敗) | 終了コードから |
| `npm test`, `pytest` | execute (実行) | 終了コードから |
| `tsc`, `npm run build` | execute (実行) | 終了コードから |
| `mv`, `cp` | move | — |
| `rm` | move | warn |
| その他すべて | execute (実行) | 終了コードから |

## プロファイル

1つのフラグで、サウンド全体を変更するサウンドパレット。

| プロファイル | キャラクター |
|---|---|
| **minimal (デフォルト)** | サイン波の音 — 控えめで、プロフェッショナルで、日常的に使用できる |
| **retro (レトロ)** | 正方形の波の 8 ビットの音 — 楽しいが、コントロールされている |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### カスタムプロファイル

`profiles/minimal.json` をコピーし、合成パラメータを編集し、ロードします。

```bash
claude-sfx play navigate --profile ./my-profile.json
```

JSON 内のすべての数値は、シンセエンジンに直接対応します。波形、周波数、持続時間、エンベロープ (ADSR)、FM の深さ、帯域幅、ゲイン。

## 迷惑防止機能

製品と玩具の違いを生み出すもの。

| 機能 | 動作 |
|---|---|
| **Debounce** | 200ms 以内の同じアクション → 1つのサウンド |
| **Rate limit** | 10 秒のウィンドウあたり最大 8 つのサウンド |
| **Quiet hours** | 設定された時間帯中は、すべてのサウンドが抑制されます。 |
| **Mute** | インスタントで切り替え可能、セッションの再起動後も有効 |
| **Volume** | 0～100 のゲインコントロール |
| **Per-verb disable** | 不要な特定の機能を無効にできます。 |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## 環境音 (長時間実行中の操作)

ビルド、デプロイ、大規模なテストスイートなど、完了に時間がかかるコマンドの場合：

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## セッションサウンド

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## すべてのコマンド

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## 仕組み

音声ファイルは一切使用していません。すべてのサウンドは、実行時に数学的な計算に基づいて合成されます。

- **発振器**：サイン波、矩形波、のこぎり波、三角波、ホワイトノイズ
- **ADSRエンベロープ**：アタック、ディケイ、サスティン、リリース
- **FMシンセシス**：テクスチャを作成するための周波数変調
- **ステートバリアブルフィルター**：ウィーシュ音を作成するためのバンドパスフィルターを通したノイズ
- **周波数スイープ**：動きを表現するための線形補間
- **ラウドネスリミッター**：ソフトニー・コンプレッション、ハード・シーリング

このパッケージ全体は約2,800行のTypeScriptで記述されており、プロダクションに必要な依存関係は一切ありません。音はPCMバッファとして生成され、メモリ内でWAV形式にエンコードされ、OSネイティブのオーディオプレイヤーを通じて再生されます（WindowsではPowerShell、macOSではafplay、Linuxではaplay）。

## 必要条件

- Node.js 18以降
- Claude Code
- システムのオーディオ出力（スピーカーまたはヘッドホン）

## ライセンス

[MIT](LICENSE)
