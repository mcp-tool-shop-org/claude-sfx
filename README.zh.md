<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-sfx/readme.jpg" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/claude-sfx"><img src="https://img.shields.io/npm/v/claude-sfx" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

对于 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)，我们提供了程序化的音频反馈。 每次工具调用、文件编辑、搜索、git推送以及代理任务都会产生不同的声音，这些声音是通过数学算法合成的，而不是音频文件。

## 快速开始

```bash
npm install -g claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

就此完成了。现在，Claude Code 在工作时会发出声音。

## 为什么使用音频反馈？

当 AI 代理代表您读取、编写、搜索和部署时，您会失去可见性。 您只是盯着屏幕上滚动的文本。 音频反馈可以恢复您的意识：

- **可访问性**：无需观看终端，即可听到状态变化、错误和完成情况。
- **流畅性**：无需切换上下文，即可知道测试是否通过或推送是否成功。
- **沉浸感**：代理感觉更像是一个协作者，而不是一个黑盒子。

## 7 种动词

Claude Code 的每个操作都对应于 7 种核心动词中的一种。 修饰符（状态、范围、方向）会改变声音，但不会破坏其连贯性。

| 动词 | 触发器 | 声音 |
| --- | --- | --- |
| **intake** | `Read`, `WebFetch`, `WebSearch` | 逐渐上升的正弦波——表示即将到来 |
| **transform** | `Edit` | FM 调制脉冲——表示重塑 |
| **commit** | `Write`, `NotebookEdit`, `git commit` | 清晰的敲击声——表示已完成 |
| **navigate** | `Grep`, `Glob` | 声纳回声——表示扫描 |
| **execute** | `Bash`, `npm test`, `tsc` | 噪声爆发 + 声音——表示机械动作 |
| **move** | `mv`、`cp`、子代理启动 | 气流声——表示空气移动 |
| **sync** | `git push`, `git pull` | 戏剧性的气流声 + 音调锚 |

### 修饰符

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### 智能 Bash 检测

处理程序会检查 Bash 命令，以选择正确的声音：

| Bash 命令 | 动词 | 状态 |
| --- | --- | --- |
| `git push` | sync (向上) | 来自退出码 |
| `git pull` | sync (向下) | 来自退出码 |
| `npm test`, `pytest` | execute (执行) | 来自退出码 |
| `tsc`, `npm run build` | execute (执行) | 来自退出码 |
| `mv`, `cp` | move (移动) | — |
| `rm` | move (移动) | warn (警告) |
| 其他所有情况 | execute (执行) | 来自退出码 |

## 配置文件

这些配置文件会改变整个声音，只需一个标志即可。

| 配置文件 | 声音风格 |
| --- | --- |
| **minimal** (default) | 正弦波声音——微妙、专业、日常使用 |
| **retro** | 方波 8 位声音——有趣但可控 |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### 自定义配置文件

复制 `profiles/minimal.json`，编辑合成参数，然后加载它：

```bash
claude-sfx play navigate --profile ./my-profile.json
```

JSON 中的每个数字都直接映射到合成引擎，包括波形、频率、持续时间、包络（ADSR）、FM 深度、带宽和增益。

## 防厌烦

区分产品和玩具的关键。

| 功能 | 行为 |
| --- | --- |
| **Debounce** | 相同动词在 200 毫秒内出现 → 产生一个声音 |
| **Rate limit** | 每 10 秒最多 8 个声音 |
| **Quiet hours** | 在配置的时间段内，所有声音都会被抑制 |
| **Mute** | 即时切换，重启会话后仍然有效 |
| **Volume** | 0–100 增益控制 |
| **Per-verb disable** | 可以关闭您不想听到的特定动词的声音 |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## 环境声音（长时间运行的操作）

对于需要一段时间才能完成的命令（构建、部署、大型测试套件）：

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## 会话声音

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## 所有命令

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

## 工作原理

没有音频文件。 每次声音都是在运行时通过数学算法合成的：

- **振荡器** — 正弦波、方波、锯齿波、三角波、白噪声
- **ADSR 包络线** — 攻击 (attack)、衰减 (decay)、维持 (sustain)、释放 (release)
- **FM 综合** — 用于产生纹理的频率调制
- **状态变量滤波器** — 用于产生“嗖嗖”声的带通滤波噪声
- **频率扫描** — 用于产生运动效果的线性插值
- **响度限制器** — 软压缩、硬限位

整个软件包包含约 2800 行 TypeScript 代码，且没有任何生产依赖。声音以 PCM 缓冲区生成，在内存中编码为 WAV 格式，并通过操作系统自带的音频播放器播放（Windows 上的 PowerShell，macOS 上的 afplay，Linux 上的 aplay）。

## 需求

- Node.js 18+
- Claude Code
- 系统音频输出（扬声器或耳机）

## 许可证

[MIT](LICENSE)
