// thinking-quote: 把「思考块」渲染成带左栏的引用块，用形状（而非颜色）与最终回答区分。
//
// 原理：pi 对思考块渲染 Markdown 时会传入 messageType === "assistant-thinking"，
// 扩展的 markdown transformer 可以据此改写 markdown 源码。把每行包成 "> " 后，
// pi 会用 mdQuote/mdQuoteBorder 渲染出 "│ " 左栏；左栏会在换行后的每一行重复，
// 因此思考块在视觉上是一条带竖线的引用区，与正文段落天然分层。
//
// 图标说明：不要用 ▍(U+258D 左半块) 这类竖条形字符——它本身是一条竖线，
// 与左侧 "│ " 轨道叠加后变成双竖线，视觉上很脏。这里用几何形符号（不占竖线位）。
//
// 标签样式：标签用比正文亮一档的 muted 色并取消斜体，充当小标题。
// 颜色在 session_start 时从当前主题取，换主题自动跟随，不会与主题失配。
//
// 放置位置：~/.pi/agent/extensions/thinking-quote.ts（自动发现，/reload 热重载）

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

/** off = 完全不改写；rail = 只加左栏；label = 左栏 + 顶部标签（默认） */
type Mode = "off" | "rail" | "label";

/** 标签图标：几何形，避免与左侧轨道撞形 */
const ICONS = {
	chevron: "▸",
	diamond: "◇",
	spark: "✻",
	angle: "⟨⟩",
	math: "∴",
	star: "✦",
	none: "",
} as const;

type IconName = keyof typeof ICONS;

const LABEL_TEXT = "思考";

export default function thinkingQuote(pi: ExtensionAPI) {
	let mode: Mode = "label";
	let icon: IconName = "chevron";
	/**
	 * 只缓存 ui 引用，不缓存 theme 实例：
	 * ctx.ui.theme 是 getter，每次读取都返回当前全局主题实例，
	 * 因此切主题后标签颜色自动跟随，不会停留在旧主题的色值上。
	 */
	let uiRef: ExtensionContext["ui"] | undefined;

	pi.on("session_start", (_event, ctx: ExtensionContext) => {
		uiRef = ctx.ui;
	});

	/** 构造一行标签：图标 + 文字，亮色、不斜体 */
	const labelLine = (): string => {
		const glyph = ICONS[icon];
		const text = glyph ? `${glyph} ${LABEL_TEXT}` : LABEL_TEXT;
		let ansi = "";
		try {
			ansi = uiRef?.theme.getFgAnsi("muted") ?? "";
		} catch {
			ansi = "";
		}
		if (!ansi) return text;
		// \x1b[23m 关闭斜体（思考块整体是斜体），\x1b[0m 后 pi 会重新补上主题色。
		return `\x1b[23m${ansi}${text}\x1b[0m\x1b[3m`;
	};

	pi.registerMarkdownTransformer((markdown, ctx) => {
		if (ctx.messageType !== "assistant-thinking") return markdown;
		if (mode === "off") return markdown;

		const body = markdown
			.split("\n")
			.map((line) => (line.trim() ? `> ${line}` : ">"))
			.join("\n");

		if (mode === "rail") return body;
		return `> ${labelLine()}\n>\n${body}`;
	});

	pi.registerCommand("thinking-quote", {
		description:
			"切换思考块样式：off | rail | label（默认），可附图标 chevron|diamond|spark|angle|math|star|none",
		handler: async (args, ctx) => {
			const parts = args.trim().toLowerCase().split(/\s+/).filter(Boolean);
			let summary = `思考块样式: ${mode}`;

			for (const part of parts) {
				if (part === "off" || part === "rail" || part === "label") {
					mode = part;
					summary = `思考块样式: ${mode}`;
				} else if (part in ICONS) {
					icon = part as IconName;
					summary = `思考块图标: ${icon === "none" ? "(无)" : ICONS[icon]}`;
				} else {
					ctx.ui.notify(
						`未知参数: ${part}（样式: off|rail|label，图标: ${Object.keys(ICONS).join("|")}）`,
						"error",
					);
					return;
				}
			}

			ctx.ui.notify(`${summary}（/reload 后完全生效）`);
		},
	});
}
