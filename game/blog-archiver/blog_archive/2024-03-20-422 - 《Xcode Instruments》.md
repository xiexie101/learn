---
title: "422 - 《Xcode Instruments》"
date: 2024-03-20
url: https://sorrycc.com/xcode-instruments
---

发布于 2024年3月20日

# 422 - 《Xcode Instruments》

Xcode Instruments 是 Rust 下排查性能问题的利器，下午听同事分享后，做下笔记。目前我们用他找到了一些性能痛点，让 Mako 减少不必要的线程，以及速度提升 30%。

## 安装

Xcode

1、仅安装「Xcode Command Line Tools」还不够，需要安装 Xcode  
2、如果找不到「xctrace」，执行 `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` 手动选择 Xcode 的位置  
3、执行 `xcrun xctrace list` 不报错即为安装成功

cargo-instruments

```bash
$ cargo install cargo-instruments
```

然后就可以通过 `cargo instruments` 做分析了。

## 使用

1、cargo instruments 提供了 24 个模版，其中常用的是 Allocations（堆内存分配）、File Activity（文件 I/O）、System Trace（线程状态、耗时数据、系统调用等） 和 Time Profiler（耗时分析）。

```bash
$ cargo instruments --list-templates
```

2、为了让 Instruments 里能看到具体的函数和符号，需要在 Cargo.toml 里把 `debug=true` 打开，但为了不影响正常的 release 流程，通常会加一个 `release-debug` 的 profile 。

```toml
[profile.release]
debug = false

# Use the `--profile release-debug` flag to show symbols in release mode.
# e.g. `cargo build --profile release-debug`
[profile.release-debug]
inherits = "release"
debug = true
```

然后执行 `cargo instruments …` 做分析，以 mako 为例，以下是分析用 mako 跑 examples/with-antd，用 `sys` 模版，指定 `release-debug` profile 显示 debug 信息。

```bash
$ cargo instruments -t sys --profile release-debug --package mako --bin mako examples/with-antd --mode production
```

3、执行完成后，会自动弹出 Instruments App。

![](https://img.alicdn.com/imgextra/i3/O1CN01iVLflU1zsiIuhBhf1_!!6000000006770-2-tps-3030-2066.png)

在这里你可以知道很多信息，包括，

*   系统消耗，比如文件 IO 的耗时
*   线程情况，比如用了多少线程，哪些线程 Block，哪些线程重复利用等
*   函数消耗，比如哪些函数是卡点
*   …

![](https://img.alicdn.com/imgextra/i4/O1CN01Qvijly1jD0NkkTtvw_!!6000000004513-2-tps-3876-2168.png)

4、通常通过 `-t sys` 看完整理后，可以切换到 `-t time`、`-t io` 和 `-t alloc` 分别看耗时、IO 和内存分配。下图是同事切换内存分配器为 mimalloc 后的效果。

![](https://img.alicdn.com/imgextra/i2/O1CN0147tnk71pmcsjcdN1b_!!6000000005403-2-tps-1484-754.png)

## 实际场景

### 发现设计上的并发问题

![](https://img.alicdn.com/imgextra/i1/O1CN01Nf0hiE1gwrBd2ilpV_!!6000000004207-2-tps-3794-1930.png)

现在的方案是先并行处理非 entry chunk 的，然后处理 entry chunk。经讨论，entry chunk 也可以和其他 chunk 一起做并行，在这个场景下，M2 Pro Max 下，构建阶段理论上可以提升 2s 左右。

参考：  
[https://help.apple.com/instruments/mac/current/#/devc75b9dd9](https://help.apple.com/instruments/mac/current/#/devc75b9dd9)  
[https://yuque.antfin.com/mako/vz2gn4/dz0yhr5x228er5b7](https://yuque.antfin.com/mako/vz2gn4/dz0yhr5x228er5b7)  
[77 - 《火焰图与 Umi Cli 性能 5 倍提升》](https://sorrycc.com/flame-graph-and-umi-cli)  
[301 - 《Node 性能优化》](https://sorrycc.com/node-performance-optimization)
