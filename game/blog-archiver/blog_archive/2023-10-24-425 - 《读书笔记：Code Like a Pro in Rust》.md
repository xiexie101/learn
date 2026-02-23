---
title: "425 - 《读书笔记：Code Like a Pro in Rust》"
date: 2023-10-24
url: https://sorrycc.com/book-code-like-a-pro-in-rust
---

发布于 2024年3月25日

# 425 - 《读书笔记：Code Like a Pro in Rust》

> 周末翻完的，适合有一定 Rust 基础的同学，可以对 Rust 知识进行查漏补缺。纯笔记，未整理。

附：中英双语版，基于 ChatGPT 4 Turbo 翻译，Token 量还真不少。见 [https://drive.google.com/file/d/1mOn1q7OLCKO3hpMP-MFogqzh5NCy7c3w/view?usp=drive\_link](https://drive.google.com/file/d/1mOn1q7OLCKO3hpMP-MFogqzh5NCy7c3w/view?usp=drive_link) 。

## Chapter 02

1、channel。开发有时会需要在不同的 channel 之间切换。

```bash
# Runs tests with stable channel:
$ cargo +stable test
...
# Runs tests with nightly channel:
$ cargo +nightly test
```

为项目指定 channel，可以通过 override 命令实现。此时，其配置在 `~/.rustup/settings.toml` 中可以找到。

```bash
# Only applies to the current directory and its children
$ rustup override set nightly
```

也可以在项目里用 `rust-toolchain.toml` 配（个人更推荐）。

```toml
[toolchain]
profile = "default"
channel = "nightly-2023-10-24"
```

2、Feature flags。

1）可以配置可选依赖  
2）feature 会向下传递

3、给依赖打补丁。

如果上游不合，可以指定 git 仓库的 rev。

```toml
[dependencies]
num_cpus = { git = "https://github.com/brndnmtthws/num_cpus",
  rev = "b423db0a698b035914ae1fd6b7ce5d2a4e727b46" }
```

遇到间接依赖，可以通过 `patch.crates-io` 替换所有依赖。

```toml
[patch.crates-io]
libc = { git = "https://github.com/rust-lang/libc", tag = "0.2.88" }
```

4、利用 CI&CD 自动发布 crate。

。

5、链接到 C 库。

6、二进制分发。

交叉编译。

```bash
rustup target list
rustup target add aarch64-apple-darwin
cargo build --target aarch64-apple-darwin
```

7、文档。

生成文档。

```bash
rust doc
```

*   `//!`，crate 或 module 级的文档，在头部
*   `///`，对 module、function、trait 或 type 进行注解
*   `[func]` 链接到函数、模块或其他类型

文档中的示例代码会被作为集成测试执行。

```rust
//! # Example
//!
//! -----
//! use rustdoc_example::mult;
//! assert_eq!(mult(10, 10), 100);
//! -----
```

8、工作区。

以下内容是共享的。

*   Cargo.lock
*   target/ 输出目录
*   顶层 `Cargo.toml` 里的 `[patch]`、`[replace]` 和 `[profile.*]`

9、自定义构建脚本

。

```
cargo new aaa --lib
```

参考：  
[https://commonmark.org/help/](https://commonmark.org/help/)  
[https://doc.rust-lang.org/stable/rustdoc/](https://doc.rust-lang.org/stable/rustdoc/)

## Chapter 03

1、Rust 工具链。

*   cargo，项目管理
*   rust analyzer，提供 Rust LSP 支持
*   rustfmt，Fotmat
*   clippy，Lint
*   sccache，编译器缓存工具

IntelliJ Rust 不使用 rust analyzer，但与 rust analyzer 共享了一些代码，特别是它的[宏支持部分](https://plugins.jetbrains.com/plugin/8182--deprecated-rust/docs/rust-faq.html#use-rls-racer-rustanalyzer)。

rust analyzer 的 Magic Comments 有，

*   [expr.xxx](http://expr.xxx)
    *   if + match + while
    *   let + lete + letm
    *   println + format + logL
*   pd 和 ppd
*   tfn 和 tmod

Rust 1.58.0 已经支持字符串插值了，比如 `foo{foo}`，所以没必要用 `format!` 了。

参考：  
[https://rust-analyzer.github.io/manual.html](https://rust-analyzer.github.io/manual.html)

2、rustfmt

```bash
rustup component add rustfmt
cargo fmt
cargo fmt --check -v
cargo fmt --all --check --verbose --package
```

`rustfmt.toml` 的推荐配置。

```toml
group_imports = "StdExternalCrate"
imports_granularity = "Module"
unstable_features = true
wrap_comments = true
format_code_in_doc_comments = true
version = "Two"
tab_spaces = 2
```

参考：  
[https://rust-lang.github.io/rustfmt/?version=v2.0.0-rc.2&search=](https://rust-lang.github.io/rustfmt/?version=v2.0.0-rc.2&search=)

3、clippy

clippy 有 450+ 项检查。

```bash
rustup component add clippy
cargo clippy
# 修复问题，含 unstable 的
cargo clippy --fix -Z unstable-options
# 出现警告时失败
cargo clippy -- -D warnings
cargo clippy --all-targets --all-features -- -D warnings
```

clippy 类型包括 correctness, restriction, style, deprecated, pedantic, complexity, perf, cargo, and nursery 。

在代码中通过属性禁用规则。

```rust
#[allow(clippy::too_many_arguments)]
```

参考：  
[https://rust-lang.github.io/rust-clippy/stable/index.html](https://rust-lang.github.io/rust-clippy/stable/index.html)

4、sccache

```bash
cargo install sccache
export RUSTC_WRAPPER=`which sccache`
cargo build
```

sccache 相比 ccache 的优点是，支持网络存储。

```bash
export SCCACHE_REDIS=redis://10.10.10.10/sccache
```

参考：  
[https://github.com/mozilla/sccache](https://github.com/mozilla/sccache)

5、配置 VSCode。

```bash
rustup component add rust-src
code --install-extension matklad.rust-analyzer
```

6、cargo-update

用于更新 cargo install 的包，和 `cargo update` 不同。

```bash
cargo install cargo-update
cargo help install-update
cargo install-update -a
```

7、cargo-expand

展开宏以查看结果代码。

```bash
cargo install cargo-expand
cargo help expand
cargo expand outermod::innermod
```

8、fuzz

与 libFuzzer 集成进行模糊测试。fuzz test（模糊测试？）是一种发现意外错误的策略。

```bash
cargo install cargo-fuzz
cargo help fuzz
cargo fuzz new myfuzztest
cargo fuzz run myfuzztest
```

参考：  
[https://llvm.org/docs/LibFuzzer.html](https://llvm.org/docs/LibFuzzer.html)

9、cargo-watch

在代码更改时自动重新运行 Cargo 命令。

```bash
cargo install cargo-watch
cargo help watch
# 持续运行 cargo check
cargo watch
# 有变更时重建文档
cargo watch -x doc
```

10、cargo-tree

可视化项目依赖树。

```
cargo install cargo-tree
cargo help tree
cargo tree
```

## Chapter 4 数据结构

1、String、str、&str 和 &'static str

*   str，栈（stack）分配的 UTF-8 字符串，可以被借用但不能移动或改变
*   String，堆（heap）分配的 UTF-8 字符串，可以被借用和修改
*   &str，指向 str 或 String 及其长度的指针
*   &'static str，指向 str 及其长度的指针，进程整个生命周期内都有效

2、Array 和 Slice

数组是一个固定长度的值序列，这些值在编译时已知。  
切片是指向连续内存区域的指针，包括长度，代表任意长度的值序列。  
切片和数组都可以被递归地解构为不重叠的子切片。

你可以多次借用同一个切片或数组，因为切片不会重叠。

```rust
let wordlist = "one,two,three,four";
for word in wordlist.split(‘,’) {
    println!("word={}", word);
}
```

3、Vectors

String 基于 Vec，String 类型是一个 `Vec<u8>`，见 [https://doc.rust-lang.org/src/alloc/string.rs.html#365-367](https://doc.rust-lang.org/src/alloc/string.rs.html#365-367) 。  
Vec 是在 Rust 中分配堆内存的方法之一（另一种是智能指针，例如 Box）。  
Vec 是一种特殊的类型，它同时是 Vec 和切片。

在你担心分配过大的连续内存区域或者关心内存的位置时，你可以通过简单地将 Box 填充到 Vec 中（即使用 `Vec<Box<T>>` ）来轻松解决这个问题。

VecDeque，双端队列  
LinkedList，双向链表  
HashMap  
BTreeMap  
HashSet  
BTreeSet  
BinaryHeap，使用二叉堆实现的优先队列，内部使用 Vec

参考：  
[https://doc.rust-lang.org/std/collections/index.html](https://doc.rust-lang.org/std/collections/index.html)

4、HashMap

HashMap 使用 Siphash-1-3 函数进行哈希处理，也可以为 HashMap 提供自己的哈希函数。

自定义哈希函数。

```rust
use metrohash::MetroBuildHasher;
use std::collection::HashMap;
let mut map = HashMap::<String, String, MetroBuildHasher>::default();
```

创建 hashable 类型。

HashMap 可以用于任意键和值，但键必须实现 std::cmp::Eq 和 std::hash::Hash 特性。许多特性，如 Eq 和 Hash ，可以使用 `#[derive]` 属性自动派生。注意需要 derive PartialEq，因为 Eq 依赖 PartialEq。

```rust
#[derive(Hash, Eq, PartialEq, Debug)]
struct CompoundKey {
    name: String,
    value: i32,
}
```

参考：  
[https://www.jandrewrogers.com/2015/05/27/metrohash/](https://www.jandrewrogers.com/2015/05/27/metrohash/)

5、基本类型。

size 是平台依赖的尺寸，通常在 32 位和 64 位系统中分别为 32 位或 64 位长度。比如 usize 和 isize。

元组最常见的用途是从函数返回多个值。

```rust
fn swap<A, B>(a: A, b: B) -> (B, A) {
    (b, a)
}
```

结构体有两个变种，1）空结构体，2）元组结构体。

```rust
struct Foo;
struct Foo(String);

let foo = Foo("foo".into());
println("{foo.0}");
```

枚举可被认为是一种特殊的结构体，包含了枚举的互斥变体。枚举在给定时间只能是其变体之一。由于枚举类型是有序的，所以可以转换为 u32，而 u32 转 Enum 需要用 From trait。

```rust
enum Foo {
  Bar,
  Hoo,
}
impl From<u32> for Foo {
  fn from(other: u32) -> Self {
    Foo.Hoo
  }
}
println("{:?}", Foo.Hoo as u32);
```

定义一个别名并不会创建一个新类型。

```rust
type Foo = HashMap<String, Bar>;
```

6、用 From 和 Into Trait 转换类型。

通常来说，你只需要实现 From 特质，几乎永远不需要实现 Into 。 Into 特质是 From 的互逆，并且将由编译器自动派生。

```rust
impl From<std::io::Error> for Error {
  fn from(other: std::io::Error) -> Self {
    Self(other.to_string())
  }
}
```

遇到可能失败的转换过程，可以用 TryFrom 或 TryInto Trait。

```rust
impl TryFrom<&str> for i32 {
    type Error = std::num::ParseIntError;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        value.parse::<i32>()
    }
}
```

7、处理 FFI 与 Rust 类型的兼容性。

Rust 团队提供了一个名为 rust-bindgen 的工具。通过 rust-bindgen ，你可以从 C 头文件自动生成绑定到 C 库的绑定。大多数情况下，你应该使用 rust-bindgen 来生成绑定。

参考：  
[https://rust-lang.github.io/rust-bindgen/introduction.html](https://rust-lang.github.io/rust-bindgen/introduction.html)

## Chapter 05

1、堆（Heap）和栈（Stack）

堆是用于动态分配的内存区域。通过使用任何堆分配的数据结构来实现堆上分配，例如 Vec 或 Box。注：String 也是 Vec，所以也是堆。

```rust
let heap_integer = Box::new(1);
let heap_integer_vec = vec![0; 100];
let heap_string = String::from("heap string");
```

栈是绑定到函数作用域的线程局部内存空间。栈使用后进先出（LIFO）顺序分配。当进入一个函数时，内存被分配并压入栈中。当退出一个函数时，内存被释放并从栈中弹出。对于栈分配的数据，其大小需要在编译时已知。在栈上分配内存通常比使用堆快得多。在支持的操作系统上，每个执行线程有一个栈。

只有基本类型、复合类型（例如，元组和结构体）、 str 以及容器类型本身（但不一定是它们的内容）可以在栈上分配。

2、所有权：复制、借用、引用和移动。

所有权是 Rust 编译器如何知道内存何时在作用域内、正在被共享、已经超出作用域或者被误用的方式。每个值都有一个所有者；一次只能有一个所有者；当所有者超出作用域时，该值会被丢弃。

当你将一个变量的值赋给另一个变量时（即 let a = b; ），这被称为移动，这是所有权的转移（并且一个值只能有一个所有者）。

引用不是指针，Rust 里除非与 C 代码交互，否则不太会遇到指针。

借用即引用，可以是不可变的或可变的。你可以同时不可变地借用数据（即，拥有对同一数据的多个引用），但你不能一次性可变地借用数据多于一次。借用通常用 `&` 或 `&mut`；还会有 `as_ref()` 或 `as_mut()`，来自 AsRef 和 AsMut Trait，是容器类型用来提供对内部数据的访问。

一个示例。

```rust
let mut foo = vec!["a", "b"];
let foo_mut = &mut foo;
foo_mut.push("c");
let foo_ref = &foo;
println("{:#?}", foo_ref);
let foo_moved = foo;
println("{:#?}", foo_moved);
```

3、深拷贝。

数据结构的复制可以是浅复制（复制指针或创建引用）或深复制（递归复制或克隆结构内的所有值）。Rust 中不存在浅复制的概念，取而代之的是借用和引用。

当派生 Clone 特性时，它会递归地操作。因此，对任何顶级数据结构（例如 Vec ）调用 clone() 就足以创建 Vec 内容的深层副本。

有些 String 函数，比如 replace() 和 to\_lower\_case() 都会做 copy。所以，当你不确定函数是复制、原地操作还是仅传递所有权时，你应该检查文档和源代码。在有严重性能问题时，你应该仔细检查底层算法。

4、智能指针。

Box 是一种智能指针。

Box 不能为空，所以如果可能没数据，需要在外面包一个 Option。

如果你怀疑 Box 分配内存可能失败，`Box` 提供了 `try_new()` 方法，它会返回一个 `Result`。

单向链表示例。

```rust
struct ListItem<T> {
  data: Box<T>,
  next: Option<Box<ListItem<T>>>,
}
impl<T> ListItem<T> {
  fn new(data: T) -> Self {
    Self {
      data: Box::new(data),
      next: None,
    }
  }
  fn next(&self) -> Option<&Self> {
    if let Some(next) = &self.next {
      Some(next.as_ref())
    } else {
      None
    }
  }
  fn mut_tail(&mut self) -> &mut Self {
    if self.next.is_some() {
      self.next.as_mut().unwrap().mut_tail()
    } {
      self
    }
  }
  fn data(&self) -> &T {
    self.data.as_ref()
  }
}
struct SinglyLinkedList<T> {
  head: ListItem<T>,
}
impl<T> SinglyLinkedList<T> {
  fn new(data: T) -> Self {
    SinglyLinkedList {
      head: ListItem::new(data),
    }
  }
  fn append(&mut self, data: T) {
    let mut tail = self.head.mut_tail();
    tail.next = Some(Box::new(ListItem::new(data)));
  }
  fn head(&self) -> &ListItem<T> {
    &self.head
  }
}
```

注意：Box 不能被共享。也就是说，在 Rust 程序中，你不能有两个不同的盒子指向同一份数据； Box 拥有其数据，并且一次不允许多于一个借用。

什么时候用 Box？

1）大型数据，数据量大放栈上可能导致栈溢出，使用 Box 放堆上可避免此问题  
2）递归类型，比如链表或树结构，成员可能是同一类型的其他实例，编译器无法确定其大小  
3）Trait 对象的动态分发，比如 `Box<dyn FooTrait>`  
4）转移所有权，  
…

5、引用计数。

引用计数是一种常见的内存管理技术，用于避免跟踪指针的副本数量，当没有更多副本时，内存就会被释放。

Rust 提供了两种不同的引用计数指针：RC 和 ARC。RC 单线程，ARC 多线程。对象是否可以在线程之间移动或同步，取决于他是否实现了 Send 和 Sync 特征。ARC 实现了这个。

内部可变性。需要借助两种特殊类型：Cell 和 RefCell，RefCell 允许我们借用引用，而 Cell 则是将值移入和移出自身。你不应该经常需要 RefCell 或 Cell ；如果你发现自己试图用这些方法来绕过借用检查器，你可能需要重新考虑你的做法。Cell 和 RefCell 的一个限制是它们只适用于单线程应用程序。在需要跨执行线程的安全性的情况下，你可以使用 Mutex 或 RwLock ，它们提供相同的功能以实现内部可变性，但可以跨线程使用。这些通常会与 Arc 配对使用。

```rust
struct DoubleLinkedList<T> {
  head: ItemRef<T>,
}
struct ListItem<T> {
  data: Box<T>,
  prev: Option<ItemRef<T>>,
  next: Option<ItemRef<T>>,
}
type ItemRef<T> = Rc<RefCell<ListItem<T>>>;
impl<T> ListItem<T> {
  fn new(data: T): Self {
    ListItem {
      data: Box::new(data),
      prev: None,
      next: None,
    }
  }
  fn data(&self) -> &T {
    self.data.as_ref()
  }
}
impl <T> DoubleLinkedList<T> {
  fn new(data: T) -> Self {
    DoubleLinkedList {
      head: Rc::new(RefCell::new(ItemRef::new(data))),
    }
  }
  fn append(&mut self, data: T) {
    let tail = Self::find_tail(self.head.clone());
    let new_item = Rc::new(RefCell::new(ItemRef::new(data)));
    new_item.borrow_mut().prev = Some(tail.clone());
    tail.borrow_mut().next = Some(new_item);
  }
  fn find_tail(item: ItemRef<T>): ItemRef<T> {
    if let Some(next) = &item.borrow().next() {
      Self::find_tail(next.clone())
    } else {
      item.clone()
    }
  }
}
```

6、写时克隆。

写时复制是一种设计模式。JavaScript 库，Immutable.js，完全基于这种模式，所有数据结构的变更都会导致数据的新副本。

Clone 和 Copy 的区别是，Copy 是通过赋值隐式发生，比如 `let x = y;`，而 Clone 是显式调用的，比如 `let x = y.clone()`。

Rust 有 3 个智能指针可实现写时克隆，Cow、Rc 和 Arc。前一个是基于 Enum 的智能指针；后两个通过 `make_mut()` 实现。

```rust
pub enum Cow<'a, B> where
    B: 'a + ToOwned + ?Sized,  {
    Borrowed(&'a B),
    Owned(<B as ToOwned>::Owned),
```

Cow 是一个枚举，可以包含借用变体或拥有变体。

TODO：Cow 没太搞清楚。

7、自定义分配器。

Rust Allocator Trait 定义见 [https://doc.rust-lang.org/std/alloc/trait.Allocator.html](https://doc.rust-lang.org/std/alloc/trait.Allocator.html) 。要实现一个分配器，我们只需要提供两种方法：`allocate()` 和 `deallocate()`。

参考：  
[http://jemalloc.net/](http://jemalloc.net/)  
[https://github.com/google/tcmalloc](https://github.com/google/tcmalloc)

## Chapter 06 单元测试

1、Rust 单测。

打破 Rust 安全性通常有两种，1）使用 `unsaft` 关键词，2）把编译时错误转换为运行时错误，比如 `unwrap()`。

单测最佳实践：

*   函数尽可能无状态
*   函数在必须保持状态时必须是幂等的
*   函数应尽可能确定，相同的输入需给出相同的输出
*   可能失败的函数应返回 Result
*   可能不返回值的函数应该返回 Option

如果你想在出现意外结果时触发 panic ，请使用 expect() 函数。 expect() 接受一个作为参数的消息，解释程序为什么会 panic 。expect() 是比 unwrap() 更安全的替代品，可以被认为是类似于 assert() 的行为。

按照惯例，Rust 单元测试存储在与被测试代码相同的源文件中。

Rust 提供了断言宏，例如 `assert!()` 和 `assert_eq!()`。注意：他们不仅可用于测试。

测试里为了便利，可以用 `use super::*;`。

2、测试框架。

参数化测试：  
[https://crates.io/crates/parameterized](https://crates.io/crates/parameterized)  
[https://crates.io/crates/test-case](https://crates.io/crates/test-case)  
[https://crates.io/crates/rstest](https://crates.io/crates/rstest)  
[https://crates.io/crates/assert2](https://crates.io/crates/assert2)

属性测试：  
[https://lib.rs/crates/proptest](https://lib.rs/crates/proptest)

比如。

```rust
use proptest::prelude::*;
proptest! {
  #[test]
  fn test_foo(n in 1i32...10000) {
    assert_eq!(foo(n), better_foo(n));
  }
}
```

4、并行测试和全局状态。

全局静态变量用 [https://crates.io/crates/lazy\_static](https://crates.io/crates/lazy_static) 。lazy\_static 可以创建一个静态引用，并在第一次访问时更新该引用。lazy\_static 基于 std::sync::Once，所以不需要 Arc 来保证线程安全。

```rust
lazy_static! {
  static ref COUNT: AtomicI32 = AtomicI32::new(0);
}

COUNT.fetch_add(1, Ordering::SeqCst);
```

如果需要在多个测试之间保证顺序，需要用 Mutex 加锁。

```rust
lazy_static! {
  static ref MUTEX: Mutex<i32> = Mutex::new(0);
}
// 然后在测试里加锁
MUTEX.lock().unwrap()
```

5、重构。

rust-analyzer 支持结构替换，比如 `$m.lock() => Mutex::lock(&$m)` 可以替换 `MUTEX.lock()` 为 `Mutex::lock(&MUTEX)`。参考 [https://rust-analyzer.github.io/manual.html#structural-search-and-replace](https://rust-analyzer.github.io/manual.html#structural-search-and-replace) 。

6、测试覆盖率。

实现 100% 覆盖率不应是你的最终目标。

```bash
cargo tarpaulin --out Html
```

参考：  
[https://crates.io/crates/cargo-tarpaulin](https://crates.io/crates/cargo-tarpaulin)  
[https://about.codecov.io/](https://about.codecov.io/)  
[https://coveralls.io/](https://coveralls.io/)

## Chapter 07 集成测试

1、集成测试。

集成测试是对单个模块或组从它们的公共接口进行的测试。这与单元测试形成对比，单元测试是对软件中最小可测试组件的测试，有时包括私有接口。

集成测试位于源代码树的顶层 tests 目录中。

2、工具和库。

使用 [https://crates.io/crates/assert\_cmd](https://crates.io/crates/assert_cmd) 测试 CLI 应用程序。

```rust
use assert_cmd::Command;
let mut cmd = Command::cargo_bin("quicksort-cli")?;
cmd
  .args(&["14", "52", "1", "-195", "1582"])
  .assert().success().stdout("[]\n");
```

其他集成测试工具：  
[https://crates.io/crates/rexpect](https://crates.io/crates/rexpect) ，自动化测试交互式 CLI 应用程序  
[https://crates.io/crates/assert\_fs](https://crates.io/crates/assert_fs) ，为需要处理或生成文件的应用程序提供文件系统

3、模糊测试（Fuzz testing）。

模糊测试与属性测试类似。两者之间的区别在于，模糊测试时，你使用的是随机生成的数据对代码进行测试，这些数据不一定是有效的。当我们进行属性测试时，我们通常将输入集限制在我们认为有效的值上。

```bash
cargo install cargo-fuzz
cargo fuzz init
cargo fuzz run fuzz_target_1
```

参考：  
[https://llvm.org/docs/LibFuzzer.html](https://llvm.org/docs/LibFuzzer.html)  
[https://rust-fuzz.github.io/book/](https://rust-fuzz.github.io/book/)  
[https://crates.io/crates/arbitrary](https://crates.io/crates/arbitrary)

## Chapter 8 异步 Rust

1、并发。

并发是计算机最大的力量倍增器之一。

![](https://img.alicdn.com/imgextra/i3/O1CN01FI7Cfr21tI2Gi15ST_!!6000000007042-2-tps-1194-770.png)

并发不应与并行混淆（我在这里将其定义为同时执行多个任务的能力）。并发与并行的不同之处在于，任务可以并发执行，而不必一定是并行执行。要类比地思考这个问题，想想人类是如何有意识地操作的：我们不能并行地做大多数任务，但我们可以同时做很多事情。例如，尝试同时与两个或更多的人交谈——这比听起来要困难得多。同时与许多人交谈是可能的，但你必须在他们之间进行上下文切换，并在从一个人切换到另一个人时暂停。人类在并发处理上做得相当好，但我们在并行处理上不行。

2、Runtime。

Rust 语言本身并不提供或规定异步运行时的实现。Rust 仅提供 Future 特性， async 关键字，以及 .await 语句；实现细节在很大程度上留给了第三方库。

三方库有：tokio、async-std、soml。

3、Futures，处理异步任务结果。

Futures 是一种处理将来会返回结果的任务的设计模式。任何异步任务的结果都是一个 future。

虽然你可以在异步代码中调用 sleep() ，但你永远不应该这样做。异步编程的一个重要原则是永远不要阻塞主线程。这是一种反模式。

```rust
#[tokio::main]
async fn main() {}
```

4、async 和 .await 关键词。

async 和 .await 关键字在 Rust 中相当新。虽然可以直接使用 futures 而不用这些关键字，但如果可能的话，最好还是使用 async 和 .await ，因为它们能处理很多样板代码而不牺牲功能。标记为 async 的函数或代码块将返回一个 future，而 .await 告诉运行时我们想要等待结果。

async 块在被轮询之前不会执行，你可以用 .await 来轮询。在底层，使用 .await 在一个 future 上会使用运行时来调用 Future 特征中的 poll() 方法，并等待 future 的结果。

```rust
tokio::task::spawn(async {})
```

`tokio::task::spawn()` 函数还有另一个重要特性：它允许我们在异步上下文之外启动异步运行时上的异步任务。它还返回一个 future（具体来说是 tokio::task::JoinHandle ），我们可以像处理其他对象一样传递它。Tokio 的 join 句柄还允许我们在需要时中止任务。

`tokio::task::spawn_blocking()` 可以启动一个阻塞任务。

`tokio::runtime::Handle::block_on()` 可用于阻塞 await Future 的结果。所以要想在非 async 上下文里做异步阻塞，可以把 Handle 传过去，然后用 block\_on 方法执行异步逻辑。

5、使用 async 实现并发和并行。

引入并发的三种方式：

1）`tokio::task::spawn()` 生成任务  
2）用 `tokio::join!(…)` 或 `futures::future::join_all()` 合并多个 future  
3）用 `tokio::select! { … }` 宏，它允许我们等待多个并发代码分支

引入并行：

1）用 `tokio::task::spawn()` 生成任务

```rust
tokio::join!(
  tokio::spawn(sleep_1s_blocking("Task 5")),
  tokio::spawn(sleep_1s_blocking("Task 6"))
);
```

6、实现异步 Observer

Rust 的异步支持有一个很大的限制：我们不能在异步方法中使用 Trait。async 和 .await 特性只是操作 future 的便捷语法。当我们声明一个 async 函数或代码块时，编译器会为我们将该代码包装在一个 future 中。

```rust
trait Foo {
  async fn bar();
}
```

略。

7、混用同步和异步。

在异步上下文中调用同步代码，首选的方法是使用 `tokio::task::spawn_blocking()` 函数，它接受一个函数并返回一个 future。它实际上是在 Tokio 管理的单独阻塞线程上执行的。

```rust
let result = tokio::task::spawn_blocking(|| read_file(filename)).await??;
```

在同步代码中使用异步代码，可以使用运行时句柄与 `block_on()`。参考 [https://tokio.rs/tokio/topics/bridging](https://tokio.rs/tokio/topics/bridging)

事后添加异步比从一开始就构建支持异步的软件要困难，因此请仔细考虑您的用例是否需要异步。

8、跟踪和调试异步代码。

用 [https://crates.io/crates/tracing](https://crates.io/crates/tracing) ，他支持 [https://opentelemetry.io/](https://opentelemetry.io/) 标准。然后用 [https://github.com/tokio-rs/console](https://github.com/tokio-rs/console) 实时分析基于 Tokio 的异步 Rust 代码。

## Chapter 11 优化

1、Vec。

Vec 分配内存的方式，它是如何确定容量大小的。默认情况下，一个空的 Vec 容量为 0，因此，不会分配内存。只有在添加数据时才会发生内存分配。当达到容量限制时， Vec 会将容量翻倍（即容量呈指数增长）。所以，对于大型向量，容量将是数组中元素数量的两倍。

有两种方法可以遍历 Vec ：使用 `iter()` 或 `into_iter()`。前者通过引用来迭代，后者会消耗 self 原始 Vec。为啥 `for i in big_vec {}` 相比 `big_vec.iter().for_each(|i| {` 慢了近 1 倍？因为前者使用 `into_iter` 来获取迭代器。

所以，我们可以，1）通过使用 `Vec::with_capacity()` 预分配内存来减少所需的内存分配量，2）通过直接使用迭代器而不是 for 循环表达式来避免混乱的性能问题。

使用 `Vec::copy_from_slice()` 可以让我们在将数据直接从一个向量复制到另一个向量时加速大约 8 倍。这种优化也适用于切片（ `&mut [T]` ）和数组（ `mut [T]` ）类型。

2、SIMD。

全称是 single instruction multiple data，单指令多数据。

通过使用 SIMD，我们的速度提升了近 40 倍。此外，SIMD 代码提供了一致的计时，这对于那些依赖时序的应用程序来说非常重要，比如密码学。

参考：  
[https://doc.rust-lang.org/std/simd/struct.Simd.html](https://doc.rust-lang.org/std/simd/struct.Simd.html)

3、用 Rayon 做并行。

如果你的任务数量少，或者任务的计算强度不高，引入并行化可能实际上会降低性能。

![](https://img.alicdn.com/imgextra/i4/O1CN01Nu2pC31Fja5As9RSa_!!6000000000523-2-tps-1064-740.png)

参考：  
[https://docs.rs/rayon/latest/rayon/index.html](https://docs.rs/rayon/latest/rayon/index.html)

4、用 Rust 加速其他语言

Python：  
[https://pyo3.rs](https://pyo3.rs)  
[https://github.com/getsentry/milksnake](https://github.com/getsentry/milksnake)  
JavaScript：  
[https://neon-bindings.com](https://neon-bindings.com)  
Rust：  
[https://github.com/rust-lang/rust-bindgen](https://github.com/rust-lang/rust-bindgen)
