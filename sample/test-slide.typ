#import "@preview/touying:0.6.1": *
#import themes.metropolis: *
#import "@preview/fontawesome:0.6.0": *
#import "@preview/sicons:16.0.0": *

#show: metropolis-theme.with(
  aspect-ratio: "16-9",
  config-common(
    pdfpc: true,
    show-notes-on-second-screen: bottom,
  ),
)

#set text(
  font: "Yu Gothic",
  lang: "ja",
)

#show strong: set text(size: 1em + 2pt)
#show heading.where(level: 3): set text(size: 30pt)
#show heading.where(level: 4): set text(size: 28pt)
#let speaker-note = it => { speaker-note(text(size: 16pt, it)) }

// タイトルスライド
#title-slide()

// ==========================================
// 導入
// ==========================================

= 導入 <touying:skip>

=== テスト用スライド

- テスト用です
- 自動テストを実装したいです

#speaker-note[
今回の発表では、\
説明します。
]
