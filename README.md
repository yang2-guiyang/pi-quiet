# pi-quiet

让 pi 的思考块退到背景，不再和最终回答混在一起。

## 问题

pi 的可见思考块只有「斜体 + 略暗」这一个视觉通道，而且没有标题、没有前缀、没有边框。
思考内容又紧贴在答案上方，扫读时很难分清哪段是推理、哪段是结论。

## 方案

分两层，各司其职：

| 层 | 手段 | 文件 |
|---|---|---|
| 形状 | 把思考块包成引用块，pi 会画出 `│ ` 左栏，每行重复 → 思考区成为一条封闭竖条 | `extensions/think-quote.ts` |
| 标签 | 顶部加一行 `▸ 思考`，用 `muted` 色 + 正体，充当小标题 | 同上 |
| 颜色 | 思考正文 `thinkingText` 压到 4.68:1 对比度（仍高于 WCAG 正文 4.5:1） | `themes/quiet.json` |
| 颜色 | 思考等级边框 `thinkingOff…thinkingMax` 改为同色相灰阶，不再随等级跳色 | 同上 |

关键点：**区分靠形状，不靠颜色**。纯颜色方案在色觉差异和低对比度显示器上都会失效。

### 为什么不用 `▍`

`▍` 是 U+258D「左半块」，本身就是一条竖线，和 pi 画的 `│ ` 轨道叠成双竖线，视觉上很脏。
所以图标用几何形符号，且刻意避开竖线条感。

## 安装

```bash
pi install git:github.com/yang2-guiyang/pi-quiet
```

或本地试用：

```bash
pi install /path/to/pi-quiet
```

装完后在 `/settings` 里把 **Theme** 选成 `quiet`（或直接编辑 `~/.pi/agent/settings.json` 的 `"theme"` 字段）。
扩展会自动加载，无需额外配置。

## 用法

```
/think-quote                    # 循环切换样式：label → rail → off
/think-quote label              # 左栏 + 标签（默认）
/think-quote rail               # 只保留左栏，不要标签
/think-quote off                # 完全关闭改写，回到 pi 原生渲染
/think-quote math               # 只换图标
```

### 图标

| 名称 | 字形 | 感觉 |
|---|---|---|
| `chevron` | `▸` | 指向下文，最中性（默认） |
| `diamond` | `◇` | 空心菱形，偏几何 |
| `spark` | `✻` | 火花，暗示「生成中」 |
| `angle` | `⟨⟩` | 尖括号，像标签包裹 |
| `math` | `∴` | 推理符号，语义最贴「思考」 |
| `star` | `✦` | 实心星 |
| `none` | 无 | 只留「思考」二字 |

示例：`/think-quote label math` → `∴ 思考`

## 渲染效果

```
 │ ▸ 思考
 │
 │ The file is elsewhere. Let us find where
 │ cat-dog-motorcycle lives.

 Found it: ~/projects/cat-dog-motorcycle/src/index.ts
```

## 配套选项

- `ctrl+t` — 折叠/展开单条思考块（pi 内置）
- `hideThinkingBlock: true`（`~/.pi/agent/settings.json`）— 默认不显示思考块
- 主题里只改 `vars.thinking` 一处，正文和左栏会跟着变

## 兼容性

- 需要 pi ≥ 1.4.0（`registerMarkdownTransformer` + `messageType === "assistant-thinking"`）
- 扩展依赖两个 pi 内部实现细节：transformer 的 `messageType` 字符串，以及 `> ` 被渲染成带左栏的 blockquote。
  这不是公开 API，pi 大版本升级可能失效。失效时删掉扩展即可，主题部分不受影响。

## 许可

MIT
