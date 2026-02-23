---
title: "译：我今天尝试了 React Compiler，你猜怎么着......"
date: 2024-06-06
url: https://sorrycc.com/i-tried-react-compiler
---

发布于 2024年6月6日

# 译：我今天尝试了 React Compiler，你猜怎么着......

> 原文：[https://www.developerway.com/posts/i-tried-react-compiler](https://www.developerway.com/posts/i-tried-react-compiler)  
> 作者：Nadia Makarevich  
> 译者：ChatGPT 4 Turbo

**编者注：React Compiler 似乎没想象中美好，他对于简单场景非常有效，但对于真实场景，10 个里只能解 1-2 个。所以，还不能不学 useMemo、memo 和 useCallback。甚至，你为了让 React Compiler 能正确使用，反而可能还需要比现在更熟悉这些东西。。**

### 目录

1.  [什么是 React 编译器](#part1)
2.  [尝试使用编译器](#part2)
3.  [研究编译器的记忆化结果](#part3)
4.  [通过手动记忆化进行研究](#part4)
5.  [那么，结论是什么？](#part5)

探索现在 React 编译器已开源，我们是否可以忘掉在 React 中的记忆化。

![](https://www.developerway.com/_next/image?url=%2Fassets%2Fi-tried-react-compiler%2Fwelcome.png&w=2048&q=75)

这可能是我想出的最能吸引点击的标题，但我觉得一篇关于这些天 React 社区中最被炒作的话题的文章应该值得。

在过去的两年半中，每当我发布提到与重渲染和记忆化相关的模式的内容时，来自未来的访客就会降临到评论区，并友好地告诉我，由于 React Forget（目前称为 React 编译器），我刚说的所有内容都已不再相关。

现在我们的时间线终于赶上了他们，React 编译器作为实验功能正式向公众发布，是时候调查这些来自未来的访客是否正确，以及从现在开始我们是否可以在 React 中忘记记忆化了。

## [什么是 React 编译器](#part1)

但首先，非常非常简短地，什么是这个编译器，它解决了什么问题，以及如何开始使用它？

**问题**：React 中的重渲染是级联的。每次你在 React 组件中更改状态时，你都会触发该组件的重渲染、其中的每个组件、这些组件内的组件等等，直到到达组件树的末端。

![re-renders-example-20220802-132550.png](https://www.developerway.com/assets/i-tried-react-compiler/1-re-renders-example.png)

如果这些下游重渲染影响到一些重组件或发生得太频繁，这可能会给我们的应用程序带来性能问题。

解决性能问题的一种方式是阻止那些连锁重新渲染的发生，一种实现方法就是通过使用记忆化帮助：`React.memo`、`useMemo` 和 `useCallback`。通常，我们会用 `React.memo` 包装一个组件，用 `useMemo` 和 `useCallback` 包装它的所有 props，下次当父组件重新渲染时，被 `memo` 包装（即“记忆化”）的组件就不会重新渲染了。

但是正确使用这些工具非常困难，_**非常**_ 困难。如果你想测试你对它的理解，我写过一些文章并做了一些视频讲解这个主题（[如何使用 useMemo 和 useCallback：你可以移除它们中的大部分](https://www.developerway.com/posts/how-to-use-memo-use-callback)，[在 React 中掌握记忆化 - 高级 React 课程，第 5 集](https://youtu.be/huBxeruVnAM)）。

这就是 React 编译器的用武之地。编译器是 React 核心团队开发的工具。它接入我们的构建系统，获取原始组件的代码，并尝试将其转换为默认情况下对组件、它们的 props 和钩子依赖进行记忆化的代码。最终结果类似于将一切都包装在 `memo`、`useMemo` 或 `useCallback` 中。

当然，这只是一个开始理解它的近似方法。实际上，它进行了更复杂的转换。Jack Herrington 在他最近的视频中对此进行了很好的概述（[React 编译器：超越 React Conf 2024 的深入了解](https://www.youtube.com/watch?v=PYHBHK37xlE)），如果你想知道实际的细节。或者，如果你想完全打破你的思维并真正理解这个复杂性，观看 [“React 编译器深入探究”](https://www.youtube.com/watch?v=0ckOUBiuxVY&t=9309s&ab_channel=ReactConf) 讲座，其中 Sathya Gunasekaran 解释了编译器，然后 Mofei Zhang 在 20 分钟内现场编码。

如果你想自己尝试编译器，只需按照文档操作：[https://react.dev/learn/react-compiler](https://react.dev/learn/react-compiler)。文档已经足够好了，包含了所有要求和操作步骤。只是记住：这还是一个非常实验性的东西，依赖于安装 React 的金丝雀版本，所以要小心。

准备工作就到这里。让我们看看它能做什么以及它在实际中的表现如何。

## [尝试编译器](#part2)

对我而言，撰写这篇文章的主要目的是调查我们对编译器的期望是否符合现实。当前的承诺是什么？

*   编译器是即插即用的：你安装好后，它就能正常工作；无需重写现有代码。
*   安装后，我们将再也不需要考虑 `React.memo`、`useMemo` 和 `useCallback`：不会再有任何需要。

为了测试这些假设，我实现了一些简单的示例以隔离测试编译器，然后在我有的三个不同应用程序上运行它。

### [简单示例：隔离测试编译器](#part2.1)

所有简单示例的完整代码可在此处查看：[https://github.com/developerway/react-compiler-test](https://github.com/developerway/react-compiler-test)

从头开始使用编译器的最简单方法是安装 Next.js 的 canary 版本。基本上，这将给你你所需要的一切：

```ts
npm install next@canary babel-plugin-react-compiler
```

然后我们可以在 `next.config.js` 中启用编译器：

```ts
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};

module.exports = nextConfig;
```

瞧！我们会立即在 React 开发工具中看到自动记忆化的组件。

![memo-in-dev-tools-20240605-060936.png](https://www.developerway.com/assets/i-tried-react-compiler/2-memo-in-dev-tools.png)

到现在为止，第一个假设是正确的：安装它非常简单，并且它能够正常工作。

让我们开始编写代码，看看编译器如何处理它。

#### 第一个示例：简单的状态更改。

```ts
const SimpleCase1 = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        toggle dialog
      </button>
      {isOpen && <Dialog />}
      <VerySlowComponent />
    </div>
  );
};
```

我们有一个 `isOpen` 状态变量，用于控制模态对话框是否打开，以及在同一个组件中渲染的 `VerySlowComponent`。正常的 React 行为将是每次 `isOpen` 状态更改时都会重新渲染 `VerySlowComponent`，导致对话框弹出时有延迟。

通常情况下，如果我们想要通过备忘录化（memoization）解决这个问题（当然还有其他方法），我们会用 `React.memo` 包装 `VerySlowComponent`：

```ts
const VerySlowComponentMemo = React.memo(VerySlowComponent);

const SimpleCase1 = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      ...
      <VerySlowComponentMemo />
    </>
  );
};
```

有了编译器，这就像魔法一样：我们可以抛弃 `React.memo`，并且在开发者工具中还能看到 `VerySlowComponent` 被备忘录化了，延迟消失了，如果我们在 `VerySlowComponent` 内部放置 `console.log`，我们会看到的确，状态改变时它不再重新渲染了。

这些例子的完整代码[在这里可以找到。](https://github.com/developerway/react-compiler-test/blob/main/src/components/simple-cases.tsx)

#### 第二个例子：慢组件上的 props。

到目前为止一切都好，但之前的例子是最简单的。让我们使问题稍微复杂一点，引入 props 到等式中。

假设我们的 `VerySlowComponent` 有一个期望函数的 `onSubmit` 属性和一个接受数组的 `data` 属性：

```ts
const SimpleCase2 = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onSubmit = () => {};
  const data = [{ id: 'bla' }];

  return (
    <>
      ...
      <VerySlowComponent onSubmit={onSubmit} data={data} />
    </>
  );
};
```

现在，在手动备忘录化的情况下，除了用 `React.memo` 包装 `VerySlowComponent`，我们还需要用 `useMemo` 包装数组（假设我们由于某些原因不能只是将其移到外部）和用 `useCallback` 包装 `onSubmit`：

```ts
const VerySlowComponentMemo = React.memo(VerySlowComponent);

export const SimpleCase2Memo = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 这里是备忘录化
  const onSubmit = useCallback(() => {}, []);

  // 这里是备忘录化
  const data = useMemo(() => [{ id: 'bla' }], []);

  return (
    <div>
      ...
      <VerySlowComponentMemo
        onSubmit={onSubmit}
        data={data}
      />
    </div>
  );
};
```

但有了编译器，我们仍然不需要这样做！`VerySlowComponent` 在 React 调试工具中仍然显示为已记忆化，其中的 “control” console.log 也不会被触发。

你可以从这个仓库本地运行这些示例 [from this repo](https://github.com/developerway/react-compiler-test/blob/main/src/components/simple-cases.tsx)。

#### 第三个例子：元素作为子元素。

好的，第三个例子，在测试一个真实的应用之前。如果我们的慢组件接受子元素的情况怎么办？

```ts
export const SimpleCase3 = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      ...
      <VerySlowComponent>
        <SomeOtherComponent />
      </VerySlowComponent>
    </>
  );
};
```

你能凭借记忆说出在这里如何正确地记忆化 `VerySlowComponent` 吗？

大多数人可能会认为我们需要将 `VerySlowComponent` 和 `SomeOtherComponent` 都用 `React.memo` 包裹起来。这是不正确的。我们需要将我们的 `<SomeOtherComponent />` 元素用 `useMemo` 包裹起来，像这样：

```ts
const VerySlowComponentMemo = React.memo(VerySlowComponent);

export const SimpleCase3 = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 通过 useMemo 记忆化子元素，而不是 React.memo
  const child = useMemo(() => <SomeOtherComponent />, []);

  return (
    <>
      ...
      <VerySlowComponentMemo>{child}</VerySlowComponentMemo>
    </>
  );
};
```

如果你不确定为什么会这样，你可以观看这个视频，它详细解释了记忆化，包括这个模式：[Mastering memoization in React - Advanced React course, Episode 5](https://youtu.be/huBxeruVnAM)。这篇文章也可能会有帮助：[The mystery of React Element, children, parents and re-renders](https://www.developerway.com/posts/react-elements-children-parents)

幸运的是，React 编译器仍在这里施展其魔法 ✨！一切都被记忆化了，非常慢的组件不会重新渲染。

到目前为止三次尝试三次成功，这很令人印象深刻！但这些示例都非常简单。现实生活中何时这么简单呢？现在让我们尝试一个真正的挑战。

### [在真实代码上测试编译器](#part2.2)

为了真正地挑战编译器，我在三个我能使用的代码库上进行了运行：

*   **应用一**：几年前的且相当大的应用，基于 React、React Router 和 Webpack，由多人编写。
*   **应用二**：稍微新一些但仍然相当大的 React 和 Next.js 应用，由多人编写。
*   **应用三**：我的个人项目：非常新，最新的 Nextjs，非常小 - 几个屏幕带有 CRUD 操作。

对于每个应用，我都做了：

*   [初始健康检查](https://react.dev/learn/react-compiler#checking-compatibility) 以确定应用对编译器的准备情况。
*   启用了编译器的 eslint 规则，并在整个代码库上运行它们。
*   将 React 版本更新到 19 canary。
*   安装了编译器。
*   在打开编译器之前，识别了一些不必要重渲染的明显案例。
*   打开编译器并检查那些不必要的重渲染是否已经修复。

### [在应用一上测试编译器：结果](#part2.3)

这个应用是最大的，大概有 150k 行代码是 React 部分。我为这个应用识别了 **10** 个易于发现的不必要重渲染案例。一些相当小，比如在里面点击一个按钮时重新渲染整个头部组件。有些更大，比如在输入字段中输入时重新渲染整个页面。

*   **初始健康检查：** 97.7% 的组件可以被编译！没有不兼容的库。
*   **Eslint 检查**：只有 20 个规则违规
*   **React 19 更新**：几件小事出了问题，但注释掉后，应用似乎工作得很好。
*   **安装编译器**：这个步骤产生了一些 F-bombs，并且自我上次接触任何有关 Webpack 或 Babel 的东西以来已经有一段时间了，因此需要一些来自 ChatGPT 的帮助。但最终，它也起作用了。
*   **测试应用**：在 10 个不必要的重渲染案例中…只有 2 个被编译器修复了

2 出 10 是一个相当令人失望的结果。但这个应用有一些我还没有修复的 eslint 违规，也许是这个原因？让我们看看下一个应用。

### [在 App Two 上测试编译器：结果](#part2.4)

这个应用程序要小得多，大约有 30k 行的 React 代码。这里我也发现了 **10** 次不必要的重新渲染。

*   **初始健康检查：** 结果相同，97.7% 的组件可以被编译。
*   **Eslint 检查：** 只有 1 条规则违规！完美候选。
*   **React 19 更新** & **安装编译器：** 对此，我不得不将 Next.js 更新到 canary 版本，它负责了剩下的部分。安装后就能正常工作，比更新基于 Webpack 的应用程序要容易得多。
*   **测试应用程序：** 在 10 个不必要的重新渲染案例中……只有 2 个再次被编译器修复了

再次是 2/10！在一个完美的候选者上……再次，有点令人失望。这就是现实生活与合成的“计数器”示例给你的对比。在尝试调试发生了什么之前，我们来看看第三个应用程序。

### [在 App Three 上测试编辑器：结果](#part2.5)

这是所有应用程序中最小的，用了一个或两个周末就写完了。只有几个页面，带有一个数据表，以及在表中添加/编辑/删除实体的能力。整个应用程序非常小且简单，以至于我只能发现其中 8 次不必要的重新渲染。那里的每一个交互都会导致一切重新渲染，我没有以任何方式优化它。

对于 React 编译器来说，这是一个完美的对象，以彻底改善重新渲染的情况！

*   **初始健康检查：** 100% 的组件可以被编译
*   **Eslint 检查：** 没有违规
*   **React 19 更新** & **安装编译器：** 出人意料地比前一个差。我使用的一些库尚未兼容 React 19。我不得不强制安装依赖项以消除警告。但实际应用程序及所有库仍然工作正常，所以我猜没有损害。
*   **测试应用程序：** 在 8 个不必要的重新渲染案例中，React 编译器设法修复了……接着是鼓滚声……一个。**只有一个**！此刻，我几乎要哭了；我对这次测试寄予了如此厚望。

这是我老旧的临床天性所预料到的，但绝对不是我天真的内心孩子所期望的。也许我只是写 React 代码的方式不对？我能调查一下编译器的记忆化出了什么问题，以及它能否被修复吗？

## [调查编译器的 memoization 结果](#part3)

为了以一种有用的方式调试这些问题，我从第三个应用中提取了一个页面到它自己的仓库里。如果你想跟随我的思路并进行代码实操练习，可以在这里查看：([https://github.com/developerway/react-compiler-test/](https://github.com/developerway/react-compiler-test/) )。它几乎和我在第三个应用中的一个页面完全一样，只是用假数据代替了一些内容，并移除了一些东西（如 SSR），以简化调试体验。

UI 非常简单：一个表格，里面列出了一系列国家，每行有一个“删除”按钮，表格下方有一个输入组件，可以在其中添加新的国家到列表中。

![third-app-ui-screenshot-20240605-063231.png](https://www.developerway.com/assets/i-tried-react-compiler/3-third-app-ui-screenshot.png)

从代码角度看，它只是一个包含一个状态、查询和变更的组件。这里是[完整代码](https://github.com/developerway/react-compiler-test/blob/main/src/components/countries-broken.tsx)。为了调查，仅包含必要信息的简化版本看起来是这样的：

```tsx
export const Countries = () => {
  // 在这里存储我们在输入框中输入的内容
  const [value, setValue] = useState("");

  // 使用 react-query 获取完整的国家列表
  const { data: countries } = useQuery(...);

  // 使用 react-query 来删除一个国家的变更
  const deleteCountryMutation = useMutation(...);

  // 使用 react-query 来添加一个国家的变更
  const addCountryMutation = useMutation(...);

  // 传递给“删除”按钮的回调
  const onDelete = (name: string) => deleteCountryMutation.mutate(name);

  // 传递给“添加”按钮的回调
  const onAddCountry = () => {
    addCountryMutation.mutate(value);
    setValue("");
  };

  return (
    ...
      {countries?.map(({ name }, index) => (
        <TableRow key={`${name.toLowerCase()}`}>
          ...
          <TableCell className="text-right">
            <!-- onDelete is here -->
            <Button onClick={() => onDelete(name)} variant="outline">
              Delete
            </Button>
          </TableCell>
        </TableRow>
      ))}
    ...
    <Input
      type="text"
      placeholder="Add new country"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <button onClick={onAddCountry}>Add</button>
  );
};
```

由于它只是一个包含多个状态（本地 + 查询 / 更新操作）的组件，每次交互都会导致所有内容重新渲染。如果你启动应用程序，你会遇到这些不必要的重新渲染情况：

*   在 “添加新国家” 输入框中输入文字会导致所有内容重新渲染。
*   点击 “删除” 会导致所有内容重新渲染。
*   点击 “添加” 会导致所有内容重新渲染。

对于这样一个简单的组件，我希望编译器能够修复所有这些问题。特别是考虑到在 React Dev Tools 中，一切似乎都被记忆了：

![4-everything-memoized-20240605-092740.png](https://www.developerway.com/assets/i-tried-react-compiler/4-everything-memoized.png)

然而，尝试启用 “组件渲染时高亮显示更新” 设置，享受灯光秀吧。

![5-everything-re-renders-20240605-093649.gif](https://www.developerway.com/assets/i-tried-react-compiler/5-everything-re-renders.gif)

在表格内的每个组件中添加 `console.log` 给了我们确切的列表：除了标题组件外，其他所有组件在每次状态更新时仍然会重新渲染。

然而，如何调查原因呢？

React Dev Tools 没有提供任何额外的信息。我 _可以_ 将那个组件复制粘贴到 [编译器游乐场](https://playground.react.dev/#N4Igzg9grgTgxgUxALhAMygOzgFwJYSYAEAYjHgpgCYAyeYOAFMEWuZVWEQL4CURwADrEicQgyKEANnkwIAwtEw4iAXiJQwCMhWoB5TDLmKsTXgG5hRInjRFGbXZwB0UygHMcACzWr1ABn4hEWsYBBxYYgAeADkIHQ4uAHoAPksRbisiMIiYYkYs6yiqPAA3FMLrIiiwAAcAQ0wU4GlZBSUcbklDNqikusaKkKrgR0TnAFt62sYHdmp+VRT7SqrqhOo6Bnl6mCoiAGsEAE9VUfmqZzwqLrHqM7ubolTVol5eTOGigFkEMDB6u4EAAhKA4HCEZ5DNZ9ErlLIWYTcEDcIA) 看看会发生什么…… 但看看输出！那感觉像是朝错误的方向迈出的一步，坦率地说，这是我永远不想做的最后一件事。

唯一能想到的是逐步对那个表格进行记忆化处理，看看是否有些问题出现在组件或依赖项上。

## [通过手动记忆化调查](#part4)

这部分是为那些完全理解所有手动记忆化技术如何工作的人准备的。如果你对 `React.memo`、`useMemo` 或 `useCallback` 感到不安，我推荐先观看[这个视频](https://youtu.be/huBxeruVnAM)。

另外，我建议在本地打开代码（[https://github.com/developerway/react-compiler-test](https://github.com/developerway/react-compiler-test)）并进行代码实操练习；这样会让下面的思路跟踪变得更加容易。

#### 调查在输入框中输入引发的重新渲染

我们再次查看那个表格，这次是全部内容：

```tsx
<Table>
  <TableCaption>支持的国家列表。</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[400px]">名称</TableHead>
      <TableHead className="text-right">操作</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {countries?.map(({ name }, index) => (
      <TableRow key={`${name.toLowerCase()}`}>
        <TableCell className="font-medium">
          <Link href={`/country/${name.toLowerCase()}`}>
            {name}
          </Link>
        </TableCell>
        <TableCell className="text-right">
          <Button
            onClick={() => onDelete(name)}
            variant="outline"
          >
            删除
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

头部组件被记忆化的事实提示我们编译器做了什么：它可能用 `React.memo` 的等价物包裹了所有组件，而 `TableBody` 内部的部分使用了 `useMemo` 的等价物进行记忆化。并且，`useMemo` 的等价物的依赖项中有某些内容在每次重新渲染时都会更新，这反过来会导致 `TableBody` 内的所有内容，包括 `TableBody` 本身，都会重新渲染。至少这是一个值得测试的好工作理论。

如果我复现那部分内容的记忆化，它可能会给我们一些线索：

```tsx
// 记忆化整个 TableBody 的内容
const body = useMemo(
  () =>
    countries?.map(({ name }, index) => (
      <TableRow key={`${name.toLowerCase()}`}>
        <TableCell className="font-medium">
          <Link href={`/country/${name.toLowerCase()}`}>
            {name}
          </Link>
        </TableCell>
        <TableCell className="text-right">
          <Button
            onClick={() => onDelete(name)}
            variant="outline"
          >
            删除
          </Button>
        </TableCell>
      </TableRow>
    )),
  // 这些是代码中使用的依赖项
  // 谢谢 eslint！
  [countries, onDelete],
);
```

现在很明显，整个部分依赖于 `countries` 数据数组和 `onDelete` 回调函数。`countries` 数组是来自一个查询的，所以它不可能在每次重新渲染时都被重新创建——缓存这一点是库的主要职责之一。

`onDelete` 回调函数看起来像这样：

```ts
const onDelete = (name: string) => {
  deleteCountryMutation.mutate(name);
};
```

为了将其加入依赖项，它也应该被 memoized：

```ts
const onDelete = useCallback(
  (name: string) => {
    deleteCountryMutation.mutate(name);
  },
  [deleteCountryMutation],
);
```

而 `deleteCountryMutation` 是 react-query 中的一个变更，所以它可能是没问题的：

```ts
const deleteCountryMutation = useMutation({...});
```

最后一步是对 `TableBody` 进行 memoize 并渲染 memoized 的子元素。如果一切都正确 memoized，那么当在输入框中输入时，行和单元格的重新渲染应该会停止。

```ts
const TableBodyMemo = React.memo(TableBody);

// 在 Countries 中渲染
<TableBodyMemo>{body}</TableBodyMemo>;
```

然后，并没有奏效。现在我们接近真相了——我在依赖项上弄错了什么，编译器可能也做了相同的错误。但是是什么呢？除了 `countries`，我只有一个依赖项——`deleteCountryMutation`。我假设它是安全的，但真的是吗？实际上里面有什么呢？幸运的是，[源代码是可用的](https://github.com/TanStack/query/blob/main/packages/react-query/src/useMutation.ts#L15)。`useMutation` 是一个执行了很多操作并返回如下内容的 hook：

```ts
const mutate = React.useCallback(...)

return { ...result, mutate, mutateAsync: result.mutate }
```

在返回中它是一个非 memoized 对象！！我认为我可以将其作为一个依赖项，这个假设是错误的。

然而，`mutate` 本身是被 memoized 的。因此，理论上，我只需要将它作为依赖项传递即可：

```ts
// 从返回的对象中提取 mutate
const { mutate: deleteCountry } = useMutation(...);

// 作为一个依赖项传递
const onDelete = useCallback(
  (name: string) => {
    // 直接在这里使用
    deleteCountry(name);
  },
  // 你好，memoized 依赖项
  [deleteCountry],
);
```

在这一步之后，我们的手动备忘录化终于起作用了。

现在，理论上，如果我移除所有手动备忘录化的操作，只保留 `mutate` 修复，React 编译器应该能够自动处理。

确实如此！当我输入内容时，表格的行和单元格不再重新渲染了

![6-no-more-re-renders-20240605-095209.gif](https://www.developerway.com/assets/i-tried-react-compiler/6-no-more-re-renders.gif)

然而，添加和删除一个国家时的重新渲染仍然存在。让我们也解决这个问题。

#### 调查“添加”和“删除”操作的重新渲染问题

让我们再次查看 `TableBody` 的代码。

```tsx
<TableBody>
  {countries?.map(({ name }, index) => (
    <TableRow key={index}>
      <TableCell className="font-medium">
        <Link href={`/country/${name.toLowerCase()}`}>
          {name}
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <Button
          onClick={() => onDelete(name)}
          variant="outline"
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
```

当我添加或从列表中移除一个国家时，这整块内容都会重新渲染。让我们再次应用相同的策略：如果我想手动备忘录化这些组件，我会怎么做？

鉴于它是一个动态列表，我需要：

**首先**，确保 “key” 属性与国家匹配，而不是数组中的位置。`index` 不行 - 如果我从列表开始处移除一个国家，下面每一行的索引都会改变，这将导致即使有了备忘录化也会强制重新渲染。在现实中，我得为每个国家引入某种形式的 `id`。对我们简化的案例来说，我们就直接使用 `name`，并确保我们不添加重复的名称 - 键应该是唯一的。

```tsx
{
  countries?.map(({ name }) => (
    <TableRow key={name}>...</TableRow>
  ));
}
```

**其次**，将 `TableRow` 包裹在 `React.memo` 中。简单。

```tsx
const TableRowMemo = React.memo(TableRow);
```

**第三**，使用 `useMemo` 对 `TableRow` 的 `children` 进行备忘录化：

```tsx
{
  countries?.map(({ name }) => (
    <TableRow key={name}>
      ... // 这里的所有内容都需要通过 useMemo 来记忆
      使用 useMemo
    </TableRow>
  ));
}
```

这是不可能的，因为我们在渲染中，而且是在数组中：钩子只能在组件外部的顶部使用，而不能在渲染函数中使用。

为了实现这一点，我们需要将整个 `TableRow` 及其内容提取到一个组件中：

```tsx
const CountryRow = ({ name, onDelete }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/country/${name.toLowerCase()}`}>
          {name}
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <Button
          onClick={() => onDelete(name)}
          variant="outline"
        >
          删除
        </Button>
      </TableCell>
    </TableRow>
  );
};
```

通过 props 传递数据：

```tsx
<TableBody>
  {countries?.map(({ name }) => (
    <CountryRow
      name={name}
      onDelete={onDelete}
      key={name}
    />
  ))}
</TableBody>
```

并且改为用 `React.memo` 包裹 `CountryRow`。 `onDelete` 已经正确地被记忆化了 - 我们已经修复了它。

我甚至不需要实施那种手动记忆化。一旦我将这些行提取到一个组件中，编译器立即捕捉到了它们，重渲染就停止了。在人类对抗机器的战斗中，这是 2 : 0 的成绩。

有趣的是，尽管编译器能够捕捉到 `CountryRow` 组件内的所有内容，却不能捕捉到组件本身。如果我去除手动记忆化但保持 `key` 和 `CountryRow` 变化，单元格和行在添加/删除时将停止重新渲染，但是 `CountryRow` 组件本身仍然会重新渲染。

此时，对于如何用编译器修复它，我已经没有思路了，这已经足够写一篇文章了，所以我就让它重新渲染好了。里面的所有东西都被记忆化了，所以这并不是什么大问题。

## [那么，结论是什么？](#part5)

对于简单情况和简单组件，编译器的表现令人惊叹。三次尝试三次成功！然而，现实生活要复杂得多。

在我尝试的三个应用中使用编译器时，它只能修复我发现的 8-10 个明显不必要的重新渲染中的 1-2 个。

然而，通过一些演绎思考和猜测，看起来通过少量代码更改可以改善这一结果。然而，研究这些改动非常不简单，需要大量的创造性思维，以及对 React 算法和现有记忆技术的掌握。

为了让编译器表现正常，我不得不在现有代码中进行的更改：

*   从 `useMutation` 钩子的返回值中提取 `mutate` 并直接在代码中使用它。
*   将 `TableRow` 及其内部所有内容提取为一个独立的组件。
*   将“key”从 `index` 改为 `name`。

你可以查看[更改前](https://github.com/developerway/react-compiler-test/blob/main/src/components/countries-broken.tsx)和[更改后](https://github.com/developerway/react-compiler-test/blob/main/src/components/countries-fixed.tsx)的代码，并且自己尝试该应用。

关于我在调查的假设：

**它是否“直接有效”？** 从技术上讲，是的。你可以直接启用它，似乎没有什么会坏掉。尽管在 React Dev Tools 中显示为记忆化的，但它不会正确记忆化一切。

**在安装编译器后，我们可以忘记** `memo`、`useMemo,` 和 `useCallback` 吗？绝对不可以！至少在它当前的状态下不行。事实上，你需要比现在更好地了解它们，并且为编写针对编译器优化的组件而开发出第六感。或者只是用它们来调试你想要修复的重新渲染。

当然，这是假设我们想要修复它们。我怀疑会发生这样的情况：我们都会在编译器准备就绪时启用它。Dev Tools 中的所有这些“memo ✨”会给我们一种安全感，所以每个人都会放松对重新渲染的担忧，专注于编写功能。既然大多数重新渲染对性能的影响无论如何都微不足道，所以没有人会注意到还有一半的重新渲染。

对于那些实际上会对性能产生影响的重渲染情况，通过组合技巧来解决它们会更加容易，比如[向下移动状态](https://www.developerway.com/posts/react-re-renders-guide#part3.2)、[通过子元素或 props 传递元素](https://www.developerway.com/posts/react-re-renders-guide#part3.3)，或者将数据提取到[具有分裂提供者的 Context](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context) 或任何允许备忘选择器的外部状态管理工具中。偶尔，还需要手动使用 `React.memo` 和 `useCallback`。

对于那些来自未来的访客，我现在相当确信他们是来自平行宇宙。一个奇妙的地方，在那里 React 竟然用比臭名昭著的灵活的 JavaScript 更结构化的东西编写，而且由于这个原因，编译器实际上可以解决 100% 的案例。

© Developer Way
