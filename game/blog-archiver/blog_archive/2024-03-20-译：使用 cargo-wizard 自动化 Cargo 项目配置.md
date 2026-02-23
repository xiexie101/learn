---
title: "译：使用 cargo-wizard 自动化 Cargo 项目配置"
date: 2024-03-20
url: https://sorrycc.com/rust-cargo-wizard
---

发布于 2024年3月20日

# 译：使用 cargo-wizard 自动化 Cargo 项目配置

> 原文：[https://kobzol.github.io/rust/cargo/2024/03/10/rust-cargo-wizard.html](https://kobzol.github.io/rust/cargo/2024/03/10/rust-cargo-wizard.html)  
> 作者：Kobzol  
> 译者：ChatGPT 4 Turbo

**TL;DR**：我创建了一个名为 [`cargo-wizard`](https://github.com/kobzol/cargo-wizard) 的 Cargo 子命令，它简化了 Cargo 项目配置过程，可实现最大运行时性能、最快编译时间或最小二进制大小。

作为 [编译器性能工作组](https://www.rust-lang.org/governance/teams/compiler#Compiler%20performance%20working%20group) 的成员，以及一个非常关心性能的人，我总是对 Rust 的 [编译时间](https://nnethercote.github.io/2024/03/06/how-to-speed-up-the-rust-compiler-in-march-2024.html)、运行时性能和 [二进制大小](https://kobzol.github.io/rust/cargo/2024/01/23/making-rust-binaries-smaller-by-default.html) 的持续改进感到非常兴奋。这些改进很多时候会默默地提升你的 Rust 程序或编译器的性能，你可能甚至没注意到，只是觉得某些东西变得稍快或稍小了。

然而，由于各种原因，并非所有的优化默认都被应用，你可能需要使用[多个](https://doc.rust-lang.org/cargo/reference/profiles.html) [可用的](https://doc.rust-lang.org/cargo/reference/config.html)配置选项正确配置你的 Cargo 项目以启用它们。这意味着，许多 Rust 用户没有利用这些优化，简单地因为他们不知道这些优化存在，或者不知道如何启用它们。

一个常见的笑话是，解决 Rust 程序“性能慢”的最常见方法是使用 `--release` 编译。但这只是众多可配置项中的一项。有多少人使用了 [LTO](https://doc.rust-lang.org/cargo/reference/profiles.html#lto)、收集了 [PGO](https://github.com/Kobzol/cargo-pgo) 配置文件或配置了 [CGU](https://doc.rust-lang.org/cargo/reference/profiles.html#codegen-units) 的数量？有多少人尝试过新的 [parallel frontend](https://blog.rust-lang.org/2023/11/09/parallel-rustc.html) 或切换了他们使用的 [linker](https://nnethercote.github.io/perf-book/build-configuration.html#linking)？

尽管对于有经验的系统程序员来说，这些概念可能并不新鲜，但是来自例如 Web 开发或脚本语言背景的人可能对它们不太了解。Rust 和 Cargo 的美妙之处在于，你甚至不需要知道这些事情是如何工作的，你只需在 TOML 文件中配置几行代码，然后就可以享受它们带来的好处。但是配置步骤仍然是至关重要的。

我认为在这个领域我们可以改进的有两个问题：

*   **可发现性** - 我如何能轻松找到最重要的 Cargo 配置选项，以帮助我提高 Rust 程序的性能，和/或开发速度？虽然 Cargo 有 [相当](https://doc.rust-lang.org/cargo/reference/profiles.html) [不错](https://doc.rust-lang.org/cargo/reference/config.html#configuration-format) 的文档，有用的信息经常分散在多个地方。我必须对 Nicholas Nethercote 的 [Rust 性能手册](https://nnethercote.github.io/perf-book/build-configuration.html) 表示感谢，它在一个地方就提供了这些信息，这真的太棒了。
*   **自动化** - 即使我知道所有可用的选项，如何轻松地将它们应用到我的现有 Cargo 项目或我创建的每个新项目中呢？这看似微不足道，但我实际上认为使其变得更容易是非常重要的。尽管我关注 `rustc` 的开发，并且对所有进行中的改进都很了解，但我意识到我几乎从不为我自己的项目使用它们。就在最近，我为我在日常工作中参与的一个 [项目](https://github.com/It4innovations/hyperqueue) 切换到了 `lld` 链接器，它将其增量重建时间减少了一半[1](#fn:mold)！这主要是因为我懒得一直查找和配置这些选项。

简而言之，我看到了一个自动化的机会，所以我创建了一个叫做 [`cargo-wizard`](https://github.com/kobzol/cargo-wizard) 的 YACS（又一个 Cargo 子命令）。它可以用一个命令将三个预定义模板（快速编译时间、快速运行时和最小二进制大小）应用到你的 Cargo 工作区，这主要解决了 _自动化_ 问题。它还允许你自定义模板，并向你展示可以用来优化项目的可用配置选项。这希望能帮助解决 _可发现性_ 问题。

与大多数其他 Cargo 子命令一样，你可以使用以下命令轻松安装它：

```bash
$ cargo install cargo-wizard
```

`cargo-wizard` 可以使用 `cargo wizard apply` 命令非交互式地使用，但那样有什么乐趣呢，所以这里是它交互式 TUI 对话界面的一个示例[2](#fn:inquire)：

![](https://img.alicdn.com/imgextra/i3/O1CN01mRbrjn1XnqrD07bKY_!!6000000002969-1-tps-1373-812.gif)

`cargo-wizard` 的想法是，你不必记住所有有用的配置选项并手动将它们应用到你的项目中，你只需运行 `cargo wizard`，让它在几秒钟内为你完成，无论你在哪个 Cargo 项目上工作。

> 有些事情是 `cargo-wizard` 无法解决的，例如更复杂的编译工作流，比如 PGO。但不用担心，你可以使用我的另一个 Cargo 子命令，[cargo-pgo](https://github.com/kobzol/cargo-pgo) 来解决这个问题 :)

目前，`cargo-wizard` 主要关注于性能配置选项，但理论上没有什么阻止它成为一个用于 Cargo 项目交互式配置的通用工具。而且，谁知道呢，或许有一天它甚至可以成为 Cargo 自身的一部分 :)

# 结论

我希望你会发现 `cargo-wizard` 很有用，它能帮助你快速配置你的 Cargo 项目，使你免于记住所有有用的选项。如果你发现了 bug 或想要建议新功能，请在 [问题跟踪](https://github.com/kobzol/cargo-wizard/issues) 中告诉我。当然，PR 也是欢迎的 :)

如果你对这篇博文或 `cargo-wizard` 有任何评论或问题，你也可以在 [Reddit](https://www.reddit.com/r/rust/comments/1bbcdzs/cargowizard_configure_your_cargo_project_for_max/) 上告诉我。

1.  是的，我也尝试了 [`mold`](https://github.com/rui314/mold)，但对这个特定项目似乎没什么帮助。 [↩](#fnref:mold)
2.  使用酷炫的 [inquire](https://github.com/mikaelmello/inquire) crate 创建。 [↩](#fnref:inquire)
