---
title: "译：Async Rust Isn't Bad，You Are"
date: 2024-06-07
url: https://sorrycc.com/async-rust-isnt-bad-you-are
---

发布于 2024年6月7日

# 译：Async Rust Isn't Bad，You Are

> 原文：[https://n8s.site/async-rust-isnt-bad-you-are](https://n8s.site/async-rust-isnt-bad-you-are)

过去一年左右的时间里，出现了不少关于使用 Rust 以及在代码库中引入 `async` 关键字的缺点的文章：

*   [为什么异步 Rust 行不通](https://eta.st/2021/03/08/async-rust-2.html)
*   [混合使用同步和异步 Rust](https://raindev.io/blog/mixing-sync-and-async-rust/)
*   [异步 Rust 是一门糟糕的语言](https://bitbashing.io/async-rust.html)
*   [不惜一切代价避免使用异步 Rust](https://web.archive.org/web/20240205152633/https://blog.hugpoint.tech/avoid_async_rust.html)
*   ……懒得继续搜索了，但你明白了

归纳起来主要是两点：

*   `async` 是侵入性的。最小阻力的道路是让你的整个代码库都 `async` 化，而不仅仅是需要 `async` 的部分。
*   这种所谓的 [“函数着色”](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) 与标准库函数不兼容，导致几乎每件事都需要第三方 crate。

当涉及到 crate 时问题开始升级：[crates.io](http://crates.io) 的生态系统是一场灾难。要么使用 [Boost：Rust 版](https://tokio.rs/)，要么冒险尝试 [smol](https://github.com/smol-rs)，几周后你发现有一个你想用的库，但它和其他几个一样，泄漏出 tokio 类型，现在你遇到了新 Rust 难题：在另一个运行时重写它？

## 我们是怎么到这的？

我敢打赌，永无止境的下一个大热潮心态从 `npm install app` 的世界传入了 Rust 和 cargo，加上程序员的胡说八道宣传。

[我们已经 Web 了吗？](https://www.arewewebyet.org/):

> 有一些令人敬畏的 Rust 和 WebAssembly 项目在那里。例如，Yew 和 Seed 让你用 Rust 创建前端 web 应用，感觉几乎像是 React.js。

呃，为什么？这真的是阻止你制作网站的原因吗？你真的很想这么做，但因为内心的极速™ 纯粹主义者会感到内心崩溃，所以无法在编辑器中输入 `<html>` 吗？

当 Rust 1.0 最终发布时，似乎每隔一周就有一篇 Hacker News 上的帖子抱怨没有 `async`，并且这正是阻碍它前进的原因。Rust 需要进入 web 领域，而要在 web 领域立足：你必须是 `async` 的。当然，所有这些评论和压力都来自于那些永远不会真正用它构建超过 12 个用户的东西，或者任何比填满一篇 Medium 博客文章所需的闪亮代码片段和 Blazingly Fast™ 营销宣传更实质内容的群体。

现在我们到了这一步，拥有一个在你的仓库上贴着 `async` 字样的亮丽徽章，比它本应具有的含义：一个警告，问题如此复杂或硬件太受限，以至于使用 `async` 是唯一的出路，显得更加重要。相反，如果你四处查看 Rust 的 GitHub 仓库，很快就会发现，让你的程序使用 `async` 比真正重要的东西更重要：资源使用情况如何？这需要多少 CPU（是的，我知道硬件已经足够好，Electron 让人们忽略了 RAM，但这些才是 _真正_ 重要的事情）？我可以期待我的机器支持多少并发用户？我可以期待多少写操作/秒？而不是你的东西是不是 `async`。

## 你不需要它

Rust 没有随附 `async`，它当时对于异步编程已经足够好了。当然，那时你必须导入 `libc`，获取文件描述符，将其标记为 `O_NONBLOCK`，但这种情况在 Rust 在 v1.9.0 版本中给 `TcpStream` 添加了 [`set_nonblocking`](https://doc.rust-lang.org/std/net/struct.TcpStream.html#method.set_nonblocking) 后就结束了。你还想知道什么东西没有随附 `async` 吗？所有你的那些无聊的 `async` websocket 服务器运行在上面的东西：Linux。上次我查看时，Linux 和整个 POSIX 世界似乎在没有它的情况下，运行着整个互联网还好得很。`signal`、`timerfd`、`epoll`、`kqueue` 都存在。猜猜怎么着？这就是所有 tokio 和这些运行时在做的事情。它们不能魔法般地让某些东西睡眠。当你的 `read` 没有做任何事时，不是 tokio 在阻止你的 CPU 停下来，而是内核。还有什么不是 `async` 的？我不知道，也许是大部分互联网在 Linux 之上使用的东西：Java 8。震惊，我知道。[有时现实是残酷的](https://www.youtube.com/watch?v=YouCsxnnMLY)。只记得，如果 `async` 真的是服务器端的答案，Node.js 早就已经赢了。上次我查看时，如果你在后端使用 Node.js：你实际上并没有做任何规模的事情，或者 Blazingly Fast™。

经过几年的发展，Rust 发布了 [`async`](https://blog.rust-lang.org/2019/11/07/Rust-1.39.0.html) 函数。等待终于结束了。刚开始的时候，大家都很困惑，似乎没人真正理解它们实际上在尝试什么。这是什么？我不能只是在我的函数上加上 `async` 然后它就变快了吗？我需要一个执行器？那是什么？怎么编写一个执行器——哦等一下：tokio！就在那时，[Rust 标准库：异步版](https://crates.io/crates/async-std)诞生了。从那以后，[crates.io](http://crates.io) 的生态系统分裂了，任何与网络 i/o 相关的东西都是 `async`。想知道 tokio 实际上在更广泛的 Rust 生态系统中的传播有多严重吗？当然你会想——[crates.io](http://crates.io) 提供了一个反向依赖搜索功能，你可以查看一个 crate，然后查看所有依赖它的其他 crate。超级棒的功能，[试试 tokio](https://crates.io/crates/tokio/reverse_dependencies)。在写这篇文章的时候，[crates.io](http://crates.io) 报出了 500 错误。我猜是因为 OOM？超时？关键是：tokio 对更广泛的 Rust 生态系统的入侵确实太荒谬了。

如果你在用 `async` 开始你的项目却没有编写你自己的执行器：停下来。你不需要它。如果你在想你的应用是否需要 `async`：你不需要。那些需要 async 的人已经知道他们为什么需要它，以及他们将如何为自己的需求构建自己的特定执行器。真正的秘密是，这类应用的大多数应该在没有线程的系统上，那些微小的嵌入式世界。这才是真正需要它的人。不是你，在一个无限核心的虚拟机上，甚至都不知道你的代码如何到达 CPU 执行，可能还得依靠 docker 和一些第三方服务来部署它。

[框架是一个系统，尼奥](https://www.youtube.com/watch?v=JsPFlmewq54)。那些框架是你的敌人。

## 证明就在布丁里

我已经说了很多废话，现在我应该拿出点东西来支持我的观点，否则我只会变成一个对着云和那些蓝发年轻人喊叫的老头。让我们用典型的 Webscale™ 设置来做一些异步网络编程：一个 websocket 服务器。

我们有两个程序，它们做同样的事情：

*   TLS 握手
*   Websocket 握手
*   客户端连接后每 1 秒发送 10Kb 的 JSON。
*   服务器读取数据，将 JSON 反序列化为其结构表示。

所有实验都在树莓派 4 上进行。服务器 A 使用标准库，没有使用 `async` 关键字。服务器 B 使用 tokio + `async` 关键字。

### 结论

*   [`webscale`](https://git.sr.ht/~nathansizemore/webscale)
*   [`webscale-tokio`](https://git.sr.ht/~nathansizemore/webscale-tokio)

客户端基准测试示例在 webscale 项目中。也包括证书生成脚本。

```ts
| 项目             | Webscale | Webscale Tokio |
|-----------------|----------|----------------|
| 编译时间         | 5m 43s   | 6m 31s         |
| 二进制大小       | 13Mb     | 14Mb           |
| 运行时内存*      | 4Mb      | 5.2Mb          |
| 最大客户端数**   | ~25k     | ~25k           |
```

没有实际差异。它们是相同的。除了意识到您可以在没有 `async` 关键字的情况下获得相同的“性能”外，我们能花一分钟时间赞扬一下硬件世界和 Linux 吗？这个由 USB 充电器供电的小小的 40 美元计算机，能够处理比您在 lambda-docker-serverless-cloud-edge-compute 应用上看到的更多的并发用户。

*   我放弃了继续使 rpi 在约 25k 并发连接后不杀死程序的工作。如果有人想搞清楚，欢迎发送 PR。
*   运行时内存是 heaptracker，100 个客户端发送 10kb 持续 5 分钟。

## 开始表现良好：Linux + epoll

了解你的系统。停止成为一个框架开发者。从现在开始不久，Rust 将走向 JS 世界的道路：现在招聘：Tokio 开发者。Tokio 和 Node.js 都是围绕事件循环构建的。使用 tokio，它由 [mio](https://crates.io/crates/mio) 提供支持。使用 Node，它是由 [libuv](https://libuv.org/) 提供支持。他们所做的就是封装系统为事件循环提供的功能：`epoll`。当然，BSDs 有 `kqueue`，Windows 也有它的东西，但说实话：你真的会去在运行 `macOS` 的服务器上部署某些东西吗？

将此事件循环骨架根据您的需求进行修改。也许您有巨大的写操作而不是主要的读操作，并且您需要监听写缓冲区可用的时候？相同的 `epoll`，不同的标志。

```rust
fn event_loop(epoll_fd: RawFd) {
    fn contains_close_event(e: epoll::Events) -> bool {
        (e & (epoll::Events::EPOLLERR
            | epoll::Events::EPOLLHUP
            | epoll::Events::EPOLLRDHUP))
            .bits()
            > 0
    }

    fn contains_read_event(e: epoll::Events) -> bool {
        (e & epoll::Events::EPOLLIN).bits() > 0
    }

    let pool = threadpool::ThreadPool::new(10);
    let mut scratch: [epoll::Event; 10] = unsafe { mem::zeroed() };
    loop {
        let nevents = match epoll::wait(epoll_fd, -1, &mut scratch) {
            Ok(amt) => amt,
            Err(e) => {
                error!("epoll 等待: {e}");
                return;
            }
        };

        let mut process = Vec::<(
            Arc<Mutex<tungstenite::WebSocket<Connection>>>,
            Vec<tungstenite::Message>,
        )>::new();

        for event in &scratch[0..nevents] {
            let flags = epoll::Events::from_bits_retain(event.events);
            let conn =
                event.data as *const Mutex<tungstenite::WebSocket<Connection>>;
            let conn = unsafe { Arc::from_raw(conn) };
            if contains_close_event(flags) {
                close_connection(conn);
                continue;
            } else if contains_read_event(flags) {
                let mut buf = Vec::<tungstenite::Message>::new();
                let mut error = false;
                loop {
                    let result = { conn.lock().read() };
                    match result {
                        Ok(msg) => buf.push(msg),
                        Err(e) => match e {
                            tungstenite::Error::Io(e) => {
                                if e.kind() == io::ErrorKind::WouldBlock {
                                    break;
                                }

                                error!("接收: {e}");
                                error = true;
                                break;
                            }
                            e => {
                                error!("接收: {e}");
                                error = true;
                                break;
                            }
                        },
                    }
                }

                if error {
                    close_connection(conn);
                    continue;
                }

                process.push((conn.clone(), buf));
                let _forget = Arc::into_raw(conn);
            }
        }

        for (conn, msgs) in process {
            pool.execute(move || process_msgs(conn, msgs));
        }
    }
}

fn close_connection(conn: Arc<Mutex<tungstenite::WebSocket<Connection>>>) {
    let mut ws = conn.lock();
    let _ = ws.get_mut().shutdown();
}

fn process_msgs(
    conn: Arc<Mutex<tungstenite::WebSocket<Connection>>>,
    msgs: Vec<tungstenite::Message>,
) {
    for msg in msgs {
        todo!("看嘛，这里没有 async 关键字")
    }
}
```

当你开始使用 Rust 并且真正使用系统时（毕竟 Rust 是一种系统语言），你也会增长你的编程知识库。你得做一些 `unsafe` 的事情。不过要警惕，也不要沦为零 Unsafe Rust™ 骗子徽章的受害者。Rust 之所以有 `unsafe`，是有原因的，不要害怕使用它。相反，要学习为什么以及如何使用它，这样你就知道何时值得使用，何时又不是。一切都是权衡。编程就是权衡，一路到底。

一旦你理解了如何在操作系统级别做这些事情，你就可以将这些知识应用到以后的任何语言或框架中。这才是真正重要的知识。成为一名工程师。当你是一个框架开发者时，你只能解决框架为你解决的问题。一旦你知道系统是如何工作的，你就可以为自己设计解决方案。
