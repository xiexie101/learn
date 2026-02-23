---
title: "译：React 中的 Clean 架构"
date: 2024-02-23
url: https://sorrycc.com/react-clean-architecture
---

发布于 2024年2月23日

# 译：React 中的 Clean 架构

> 原文：[https://alexkondov.com/full-stack-tao-clean-architecture-react/](https://alexkondov.com/full-stack-tao-clean-architecture-react/)  
> 作者：Alex Kondov  
> 译者：ChatGPT 4 Turbo

**编者注：作者通过一个例子，告诉你如何写 Clean 的 React 代码，同时能应对各种变化。这应该是写 React 代码应有的样子。**

**我的一些摘录：**

**面向业务设计接口，RESTful 虽优雅但可能导致 UX 变差**  
**保持 ui 层的纯粹性，纯函数**  
**数据获取用 react-query 简化**  
**逻辑提到 hooks，深层模块优先**  
**数据格式化放 hooks**  
**请求提到 client/service，要轻**  
**数据校验放 client，用 zod 做接口校验**  
**每个嵌套的条件语句都应考虑拆组件**  
**硬编码值提变量赋予含义，避免低级错误**  
**应对变化时也要战略性编程，不要破坏层次结构**

* * *

我们在构建软件产品时，前期拥有的信息越多，最终产品就会越好。但我只听说过传说中的日子，那时工程师们会得到一份详尽描述项目的详细文档，而且之后不会有任何跟进的变更。

正确地构建你的代码并不容易，尤其是当基础不稳定时。

现代应用程序从未一成不变。它们从小而简单开始，然后逐渐发展成为一个复杂的系统，拥有越来越多很少符合我们最初模型的功能。在这一演变过程中，我们积累了小的设计错误和技术债务，侵蚀了项目的状态。

这就是为什么我不会向你展示如何构建一个停滞不前的应用程序。

我们将从小处着手，构建一个非常简单的功能，设想一个初创公司想要验证一个想法。然后，在接下来的几章中，我们将为产品添加越来越多的功能，扩展它，并应对现实生活中抛给我们的曲球。

构建这个功能对于有一点经验的开发者来说不是挑战，但即使是经验丰富的工程师也很难正确地构建它。我们需要知道何时专注于设计，何时有意避免它。

我们将确立构建应用程序时将遵循的基本代码级原则。我们将看到当我们在未来的文章中开始改变事物时，它们将如何支持我们，然后我们将扩展到项目级原则，甚至用于构建复杂系统的模式。

但一次只做一件事。

## 一个快速的插曲

这不仅仅是一个充满代码示例的文章，它是我即将出版的书《The Full-Stack Tao》中的一章，我正在公开写作这本书。

以下是迄今为止发布的所有章节：

*   [1\. 从域开始](https://alexkondov.com/full-stack-tao-start-with-the-domain/)
*   [2\. 选择技术栈](https://alexkondov.com/full-stack-tao-picking-tech-stack/)
*   [3\. 设置项目](https://alexkondov.com/full-stack-tao-setting-up-the-project/)
*   [4\. React 中的 Clean 架构](https://alexkondov.com/full-stack-tao-clean-architecture-react/)

## 需求

我们有以下要求：

**“我们需要构建一个页面，让用户能够在写作应用中阅读当前活跃的提示，并对其进行回答。他们应该能够看到其他用户的回答，但只有在他们提交自己的回答之后。在此之前，他们应该只能看到提示和提交回答的输入字段。**

足够简单，对吧？

我们可以戴上耳机开始构建。但如果我们不提问题就这么做，当我们已经对应用程序做出了一些假设时，我们会遇到所有未知的未知。

我们将如何访问数据？既然我们有认证用户，那么匿名用户应该看到什么？我们将如何认证用户？搜索引擎优化的重要性如何？用户提交后是否有机制编辑或删除他们的回应？页面上会有动画吗？我们将在哪里托管我们将要展示的图片？

## 不要基于假设来构建

假设是许多工程问题的根本原因，我们希望尽可能少做假设。我们不可能完全不做假设，因为我们无法获得关于未来的完美信息，但我们问的问题越多，剩下的假设就越少。

有时候业务团队的人会有答案，有时候他们没有。但通过深入挖掘，我们减少了关键设计错误的可能性。

通过一次又一次地提问，我们从“最佳猜测”工程的范式转变为基于信息决策的范式。

## 初稿

一旦我们对产品有了更深入的了解，尽快在屏幕上展示出来是很重要的。无论你是在初创公司还是大企业工作，我们都需要先让应用程序运行起来，然后再考虑任何改进、模式和结构。

把它想象成文本的初稿。我们不纠结于语法、逗号和重复的词汇。我们只想让它起作用。

在 React 中，这意味着创建一个组件，将所有功能放入其中，并确保它符合我们的期望。

```tsx
export default function App() {
  return (
    <div>
      <header>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>...</main>
    </div>
  )
}
```

我在这里故意省略了样式细节，因为我们将在后续章节中重点讨论它们。

我们需要决定页面上要渲染什么内容。我们的决定将基于用户是否已经回答了当前的提示，而我们有多种方法来获取这一信息。

既然我们现在还没有实现认证功能，而且我们只是在原型化界面，我们需要在这里考虑抽象的概念。

## 讨论数据获取

我们可以发起一个请求来获取页面的提示和答案，再发起另一个请求来检查用户是否已经作答。在浏览器中过滤答案是不可能的——对于此类内容，很可能会使用分页机制。我们不应该过度获取不会在屏幕上显示的数据，同时在浏览器中保留我们不希望用户看到的数据也是不安全的。

由于我们无法从响应中一致地获取那些信息，并且我们需要将其与其他数据一起使用，我们唯一的选择就是让服务器为我们完成这项工作。

API 可以通过将 `null` 作为 `answers` 属性的值来给我们这个信息，表示我们不应该显示它们。但我们不想通过类型来通信并依赖约定。这将意味着前端需要进行大量可空类型的额外检查，后端也必须进行文档记录。

换句话说，通过使用 `null` 进行通信，我们冒着将自己置于切斯特顿栅栏情境的风险。将来有人可能会将其更改为一个空数组，而不知道我们依赖空类型，结果我们的产品就会出现故障。

我们将使用 `null` 作为一个标志，通过让 API 直接发送一个名为 `answered` 的布尔标志作为单独的属性，我们可以做得更好。在原型设计阶段以及等待服务器提供数据的过程中，我们可以使用以下结构。

```ts
const prompt = {
  title: "What is the meaning of life?",
  answers: [],
  answered: false,
};
```

那么我们可以基于那个标志在组件中进行检查。

```tsx
export default function App() {
  // ...

  return (
    // ...
    <main>
      {prompt.answered ? (
        prompt.answers.map((answer) => <div>...</div>)
      ) : (
        <form>
          <textarea></textarea>
          <button>Submit</button>
        </form>
      )}
    </main>
    //...
  )
}
```

接下来，我们需要考虑答案的结构。

```ts
const prompt = {
  title: "What is the meaning of life?",
  answers: [
    { text: "42", author: { name: "John Doe" }}
  ],
  answered: true,
};
```

唯一重要的细节是作者的信息如何与答案一起传递。这必须与实现后端的团队 / 人员沟通，就像我们之前考虑的布尔 `answered` 标志一样。

在这种情况下，我宁愿为作者设置一个嵌套属性，而不是将他们的数据与其他答案数据保持在同一层级。

```tsx
export default function App() {
  // ...
  return (
    // ...
    <main>
      {prompt.answered ? (
        prompt.answers.map((answer) => (
          <div>
            <p>{answer.text}</p>
            <div>— {answer.author.name}</div>
          </div>
        ))
      ) : (
        <form>
          <textarea></textarea>
          <button>Submit</button>
        </form>
      )}
    </main>
  )
}
```

目前，我们将跳过样式和表单，因为我们想专注于架构。我开始每个实现都是用硬编码数据，因为这让我能立即专注于业务逻辑，而不是网络工作。

但一旦我有了如何使用这些数据的想法，就是将其整合到应用流程中的时候了。

## 首先设计界面

我在职业生涯中有一段时间积极地使用了像 DynamoDB 这样的 NoSQL 数据库。

我们会在书的后面深入讨论数据库的细节问题，但在那段时间里，我有了一个顿悟。

与这种类型的存储打交道，让我们不得不非常仔细地考虑应用程序中将要有的访问模式，因为只有当我们能够利用它们的索引时，从中检索数据才会高效。

所以每个产品的设计都是基于其访问模式。有时这是用户界面（UI），其他时候是一个 API 端点，但在开发过程中以用户为中心的关注使得系统更易于理解，围绕领域特定构建。作为一个副作用，一切都是为了支持我们所拥有的确切用例而构建的。

所以我认真地采纳了这个做法，并开始将其应用于我从零开始构建的所有产品，不管它们需要使用什么底层数据库 - 我首先设计了面向用户的部分。

## 为领域构建

每个产品都需要针对其领域构建，而不是基于通用原则。技术架构并非脱离上下文而存在。为了决定我们如何访问数据，我们需要遵循我们的访问模式。

如果我们在实现这个功能时侧重于技术约定而不是业务逻辑，我们最终会得到以下 REST API 。

```text
/prompts
/prompts/:id
/prompts/:id/answers
```

我们需要一种方法在 UI 中检索当前提示 ID，例如通过向 `/prompts?active=true` 发送请求。然后我们会从其特定 URL 获取关于提示的所有数据，如果用户已经回答了，我们会从最后一个端点获取答案。

这遵循了 RESTful 约定，并且单独考虑时是一个技术上合理的实现。 REST API 在实体之间以及它们如何被检索上有一个清晰的界限。但是当你将产品作为一个整体来看时，这种纯粹主义会导致用户的整体体验变差，并且产生很多不必要的复杂性。

用户至少需要等待两个后续请求才能获取页面的完整内容，尽管这本可以通过一个请求来检索。

如果你不从产品面向用户的部分开始，它将不得不弥补其无法有效获取数据的能力。这就是你最终使用 GraphQL 层来解决过度获取问题，并在旁边产生大量可避免的复杂性的原因。

我们想向 `/prompt` 发送一个带有用户标识符的请求，并让后端负责检索用户、检查他们是否已经回答，并返回相应的数据。

## 泄露逻辑

然而，这里有一个额外的因素 —— 前端成为业务逻辑的驱动者。通过保持 API 纯净和通用，我们只是决定决策必须在其他地方进行。

这个有缺陷的设计将使责任完全落在客户端身上——它将不得不决定何时以及获取什么数据，而且它将了解 RESTful API 的所有功能。

后端应该决定返回什么数据，而前端应该根据它拥有的数据来决定如何渲染。这是最纯粹的单一职责原则。

这就是当你与负责后端的同事沟通需求，或者即使你是项目上的独立开发者时，你需要经历的思考过程。提前用你所掌握的信息思考，否则你将从一开始就积累技术债务。

## 添加数据源

既然我们知道了我们想要获取数据的方式，我们可以用 HTTP 调用替换掉硬编码的数据，并添加一个默认占位符，这样我们暂时就不用考虑空状态了。

```tsx
const emptyPrompt = {
  title: '',
  answers: [],
  answered: false,
}

export default function App() {
  const [prompt, setPrompt] = useState(emptyPrompt)

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/prompts')
      .then((res) => res.json())
      .then((data) => setPrompt(data))
  }, [])

  // ...
}
```

有了这个，我们就有了一个工作组件所需的一切。

如果你只是在验证一个想法、原型设计一个新界面或探索一项新技术，那么到这里为止就可以了。如果你在一家时间紧迫的初创公司工作，在演示前紧张工作以确保下一轮融资，那么这样做就足够好了。我们可以在上面加一个集成测试，然后就此收工。

但在所有其他情况下，一个工作组件只是构建功能的第一步。我们有了第一版，现在需要对其进行编辑。

## 整理

我不喜欢“重构”这个术语，因为它在现代软件开发中变得相当有争议。它已经成了暂停产品工作一周（充其量）以便你可以思考你的实现设计，上下移动逻辑，提取函数，以及建立模块的同义词。

但这是一个难以推销的想法。

软件设计不应该是在项目进行六个月后，当人们开始抱怨并且我们找不到借口忽略它时才考虑的事情。书的后面部分，我们会讨论如果我们继承了一个设计是事后考虑的应用程序该怎么办，但如果你边做边编辑和设计，你就永远不会到达那个无法回头的地步。

这是我们到目前为止的组件。

```tsx
export default function App() {
  const [prompt, setPrompt] = useState(emptyPrompt)

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/prompts')
      .then((res) => res.json())
      .then((data) => setPrompt(data))
  })

  return (
    <div>
      <header>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <h1>{prompt.title}</h1>
        {prompt.answered ? (
          prompt.answers.map((answer) => (
            <div>
              <p>{answer.text}</p>
              <div>— {answer.author.name}</div>
            </div>
          ))
        ) : (
          <form>
            <textarea></textarea>
            <button>Submit</button>
          </form>
        )}
      </main>
    </div>
  )
}
```

我们首先注意到的是它的职责过多——它了解页面的整体结构、导航和内容。它负责决定渲染什么，管理状态，并进行数据获取。

每次我们需要对这个组件进行更改时，我们都得熟悉它的所有职责，而且按照这样的构建方式，随着时间的推移，这些职责只会增加。

## 布局

当我们开始向这个应用程序添加更多页面时，我们会迅速注意到每个页面的结构都会被复制。页面还需要元标签、标题、上下文提供者以及其他配置。

通常，我从不急于提取可复用组件。但在这种情况下，我们知道我们需要某种方式来避免所有这些重复，所以最好尽快制作一个布局组件。

```tsx
export default function Layout({ children }) {
  return (
    <div>
      <header>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

这更好，但如果我们需要在导航中添加一些逻辑，例如检查用户是否已认证，我们需要在布局中实现这一点。再次，这意味着我们的布局承担的责任超出了提供页面框架。

所以我们需要提取另一个组件。

```tsx
export default function Layout({ children }) {
  return (
    <div>
      <header>
        <Navigation />
      </header>
      <main>{children}</main>
    </div>
  )
}
```

这样更好。也许你在想为什么 `<header>` 元素没有直接添加到导航中。这是因为决定在哪里渲染导航是布局的责任。在不同的布局中，导航可能在侧边。

应用程序不需要一个单一的布局组件覆盖其所有页面。你可以根据设计需求拥有尽可能多的布局组件。

一个电子商务应用程序有一个用于筛选的侧边栏和一个主要部分，可以有一个 `MainWithAsideLayout` 。然后它可以有一个 `OneColumnLayout` ，用于它的更简单的结账流程。并且它可以有一个管理面板，导航位于侧边。

目前，我们只需要一个。不必过多地猜测未来。

## 页面

在提取布局并为我们的组件起了一个更好的名字之后，我们的页面看起来是这样的。

```tsx
export default function PromptPage() {
  // ...

  return (
    <Layout>
      <h1>{prompt.title}</h1>
      {prompt.answered ? (
        prompt.answers.map((answer) => (
          <div>
            <p>{answer.text}</p>
            <div>— {answer.author.name}</div>
          </div>
        ))
      ) : (
        <form>
          <textarea></textarea>
          <button>Submit</button>
        </form>
      )}
    </Layout>
  )
}
```

组件只是函数，因此，它们遵循我们用来构造函数的相同设计原则。在常规函数中，如果你有冗长的条件语句，你会提取它们以减少认知负担。

同样，每次我在 JSX 中看到条件语句时，我都会考虑是否可以移除或简化它，以减少组件中的杂音。

这里我们有一个非常简单的检查，所以我们不需要考虑对它进行抽象。

相反，我们应该将标记移动到两个独立的组件中，因为它们都会增长。每个答案都需要进行样式设计，将这些逻辑保留在与之无关的组件内是没有意义的。另一方面，表单也需要处理、验证和样式设计 - 将所有这些状态和额外逻辑保留在页面组件中会增加更多不必要的责任。

```tsx
export default function PromptPage() {
  const [prompt, setPrompt] = useState(emptyPrompt)

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/prompts')
      .then((res) => res.json())
      .then((data) => setPrompt(data))
  })

  return (
    <Layout>
      <h1>{prompt.title}</h1>
      {prompt.answered ? (
        <AnswersList answers={prompt.answers} />
      ) : (
        <AnswerForm />
      )}
    </Layout>
  )
}
```

我觉得这足够清晰，可以继续往前看。

## 获取数据

我注意到，前端的大部分架构工作都集中在围绕 HTTP 层创建抽象上。开发者直观地理解边界和职责，并知道这些逻辑不应与可视化逻辑混为一谈。

我们接下来会这么做。

组件不应该知道我们是使用 `fetch` 、 `axios` 还是其他 HTTP 客户端来检索数据。它不应该知道数据是通过 HTTP、gRPC 获取的，还是来自 web socket 或任何其他类型的源。它只应该负责渲染那些数据。而且，对这个组件进行更改的开发者不需要阅读我们所有的 HTTP 逻辑，就可以对标记进行工作。

所以我们会将数据获取移至一个单独的文件中，并将其作为一个带有方法的对象导出。

```ts
// prompt-client.ts

const getActivePrompt = () => {
  return fetch('http://localhost:3000/api/v1/prompts').then((res) =>
    res.json()
  )
}

export default {
  getActivePrompt,
}
```

如果我们的服务器还没有准备好提供数据，我们可以在这里硬编码，而不是在组件中，这样不会破坏工作的自然流程。对于应用程序的其他部分来说，数据将由客户端返回 - 这不会影响它们的设计。然后，更改只需在这里完成。

一旦我们完成了那个操作，我们将在 `useEffect` 调用那个函数。

```tsx
export default function PromptPage() {
  const [prompt, setPrompt] = useState(emptyPrompt)

  useEffect(() => {
    promptClient.getActivePrompt().then((data) => setPrompt(data))
  })

  return (
    <Layout>
      <h1>{prompt.title}</h1>
      {prompt.answered ? (
        <AnswersList answers={prompt.answers} />
      ) : (
        <AnswerForm />
      )}
    </Layout>
  )
}
```

我们隐藏了传输层，移除了组件体中的请求细节和客户端。

数据获取隐含地增加了更多的复杂性。我们不知道检索数据需要多长时间，也不知道数据是否能够成功返回。在我们目前的状态下，如果服务器因某种原因失败了，我们除了一个空白页面之外，没有办法将这一情况通知给用户。

```tsx
export default function PromptPage() {
  const [prompt, setPrompt] = useState(emptyPrompt)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    setIsLoading(true)

    promptClient
      .getActivePrompt()
      .then((data) => setPrompt(data))
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }, [])

  // ...
}
```

如果我们简要地瞥一眼未来，我们将发现更多与通信相关的逻辑需要处理。当用户提交 `AnswerForm` 时，他们需要看到答案，但由于这些答案不在我们最初的请求中，我们将不得不重新获取它们。我们还需要传达加载和错误状态，以便在提交的表单仍在传输过程中时，用户界面不会看起来冻结。

```tsx
export default function PromptPage() {
  const [prompt, setPrompt] = useState(emptyPrompt)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const getPrompt = () => {
    setIsLoading(true)

    promptClient
      .getActivePrompt()
      .then((data) => setPrompt(data))
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    getPrompt()
  }, [])

  return (
    //  ...
    <AnswerForm
      onSubmit={(answer) => {
        promptClient.createAnswer(answer).then(() => getPrompt())
      }}
    />
    //  ...
  )
}
```

现代界面是动态的，根据用户操作需要与一个或多个 API 进行不断的通信。直到今天，这仍然是最大的复杂性来源之一，如果你回顾现代前端开发初期的任何应用程序，你会看到大量的代码都在处理请求状态。

令人惊讶的是，UI 的状态管理逻辑有多少与数据获取有关。

如今有一些实用的数据获取抽象层，它们极大地简化了这些逻辑，隐藏了我们应用程序中的许多细节，并为我们提供了一个方便的 API 来使用。我很少提倡在任何项目的早期就使用库，但是有一些东西能够在传输层和组件生命周期之间架起一座桥梁真是一种福音——它从代码库中移除了许多冗长的内容。

```tsx
export default function PromptPage() {
  const queryClient = useQueryClient()

  // Fetching prompt data
  const {
    data: prompt,
    isLoading,
    isError,
  } = useQuery({
    queryKey: 'prompt',
    queryFn: promptClient.getActivePrompt,
    initialData: emptyPrompt,
  })

  // Handling answer submission
  const mutation = useMutation({
    mutationFn: promptClient.createAnswer,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries('prompt')
    },
  })

  const handleSubmit = (answer) => {
    mutation.mutate(answer)
  }

  return (
    //  ...
    <AnswerForm onSubmit={handleSubmit} />
    //  ...
  )
}
```

库 API 的细节不是我们关注的重点，因为它们可能会发生变化。重要的是我们的组件本身不保持任何状态，并且我们已经移除了效果。我们用更具描述性的 API 代替了命令式 API。

但仍然存在的一个设计问题是，任何需要处理该组件的人都必须理解数据获取逻辑。组件仍然需要知道提示在哪里，何时重新获取，以及如何存储答案。在理想状态下，组件应该只接收数据并返回标记 - 它应该表现为一个纯函数。可视化代码是我们与浏览器的接口。我们需要何时、如何以及什么数据是我们领域逻辑的一部分。

他们不应该在一起，所以我们需要想办法把他们中的一个挪开。

在 React 的上下文中，自定义钩子是一种很有用的机制。它们是库的惯用特性，因此在代码中看起来很自然，同时它们为我们提供了必要的抽象。

```tsx
export default function PromptPage() {
  const { prompt, handleSubmit } = usePrompt()

  return (
    <Layout>
      <h1>{prompt.title}</h1>
      {prompt.answered ? (
        <AnswersList answers={prompt.answers} />
      ) : (
        <AnswerForm handleSubmit={handleSubmit} />
      )}
    </Layout>
  )
}
```

即使我不喜欢 “Clean” 这个词因为它的主观性——我会称这是一个干净的组件。它有一个单一职责——根据接收到的数据在屏幕上渲染内容。注意我们的自定义钩子隐藏了多少细节不让组件知道。它不知道数据是来自 HTTP 调用，是硬编码的，还是从文件中读取的。

在另一方面，我们的业务逻辑整齐地位于一个地方，不再遍布于组件之中。

```ts
export default function usePrompt() {
  const queryClient = useQueryClient()

  // Fetching prompt data
  const prompt = useQuery({
    queryKey: 'prompt',
    queryFn: promptClient.getActivePrompt,
    initialData: emptyPrompt,
  })

  // Handling answer submission
  const mutation = useMutation({
    mutationFn: promptClient.createAnswer,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries('prompt')
    },
  })

  const handleSubmit = (answer) => {
    mutation.mutate(answer)
  }

  return {
    prompt,
    handleSubmit,
  }
}
```

这展示了组件内部的逻辑在标记中实际使用了多少，以及有多少可以被认为是实现细节。尽管我们的组件只需要其中的一小部分，但它已经意识到了所有这些。

## 浅层和深层模块

`usePrompt` 钩子是深层模块的一个很好例子。想象它就像一座冰山 - 它有一个小的可见表面，即返回的对象，以及大量隐藏的代码。深层模块让我们能够通过一个小的 API 控制许多功能，这使得抽象变得有用。

另一方面，浅层模块暴露了太多内部实现，并且具有较大的表面积，它隐藏的细节很少。我们是否使用浅层模块并不重要，因为将功能内联起来在复杂性上会相似。当你注意到某处有一个浅层抽象时，考虑内联其功能以简化你的代码。

一个好问题是为什么提交处理程序也必须被抽象出来。毕竟，它与可视化逻辑有关，难道不应该在组件内部吗？

```ts
const { prompt, handleSubmit } = usePrompt();
```

实际上属于 UI 的是发生了某些事件——按钮被点击、表单被提交、元素被悬停。组件需要处理这些事件。由于这个事件引发的结果属于业务逻辑，因此我们只在组件内部留下一个必须调用的函数的引用，其余的逻辑与浏览器无关。

## HTTP 层详情

在这并不特定于前端，但我想强调我们的 HTTP 层面对 `promptsClient` 时的结构。实现客户端没有明确的方法，所以我们可以自由地用一个对象、一个类或者一组函数来做，这些函数可以一起导出在一个文件中。

通常，我会选择后者。

```ts
// prompts-client.ts
export function getActivePrompt() {
  return axios.get('https://example.com/api/v1/prompts')
}

export function createAnswer(answer) {
  return axios.post('https://example.com/api/v1/prompts', { answer })
}
```

使用更复杂的结构几乎没有价值，因为我们没有需要隐藏或复用的数据或行为。一个类只会给本来非常简单的实现增加额外的复杂性。文件本身已经足够紧凑，不使用对象或类意味着我们可以将缩进级别保持在最低。

另一个值得注意的细节是，大多数 HTTP 客户端允许你创建一个预配置的实例，当你需要在同一个 API 上访问多个路由时，可以更便捷地使用。具体的语法并不重要，但它看起来会是这样的：

```ts
// prompts-client.ts

const api = axios.createInstance('https://example.com/api/v1')

export function getActivePrompt() {
  return api.get('/prompts')
}

export function createAnswer(answer) {
  return api.post('/prompts', { answer })
}

```

这使得不同函数的主体部分略微减小，为你节省屏幕空间，并且保护你免受复杂的复制粘贴错误的困扰，这些错误可能会让你花费两个小时去追踪 bug，然后你发现自己忘记在 URL 中添加 `/v1` 。

我们将在接下来的章节之一中处理用户令牌和认证，并且重新审视这个文件。

## 硬编码值

任何时候我们在代码中硬编码字符串时，都应该考虑是否将其提取到变量中会使我们的代码更易于阅读和维护。描述性变量比特定领域的文本更能赋予实现以意义。但更重要的是，硬编码的字符串通常用于检查，或者它们需要与我们应用程序的边界之外的某些内容匹配。

在我们的 HTTP 层上下文中，这些字符串值代表 API 的基础 URL 和端点，将它们保留在客户端中代表了一个错误的机会（例如，忘记了前导斜杠）。我的方法是将这些值提取到一个单独的对象中，在一个与使用这些值的地方紧密相关的文件中。

```ts
// prompts-client.ts

const api = axios.createInstance(endpoints.baseURL)

export function getActivePrompt() {
  return api.get(endpoints.activePrompt)
}

export function createAnswer(answer) {
  return api.post(endpoints.createAnswer, { answer })
}

// endpoints.ts

export default {
  baseURL: 'https://example.com/api/v1',
  activePrompt: '/prompts',
  createAnswer: '/prompts',
}
```

这看起来好多了。

我们不应该因为这个对象内有重复的值而感到困扰，因为它们都被放在一起，而属性名为它们赋予了不同的含义。重要的是，我们通过它们现在所属的对象为它们赋予意义。

但如果我们查看我们的代码，我们会注意到在我们使用的数据获取钩子中还有其他硬编码的值。

```ts
// usePrompt.ts

const prompt = useQuery({
  queryKey: 'prompt',
  queryFn: promptClient.getActivePrompt,
  initialData: emptyPrompt,
})

const mutation = useMutation({
  mutationFn: promptClient.createAnswer,
  onSuccess: () => {
    queryClient.invalidateQueries('prompt')
  },
})
```

每个查询都有一个与之关联的唯一键。它用于在内存缓存中识别值，并在我们希望重新获取时使其无效。当硬编码的值彼此靠近，在同一个文件中时，跟踪它们更容易，但我们可能在不同的文件中有需要相同数据的查询。

那么，依赖硬编码字符串将使我们面临上述提到的问题。

```ts
// usePrompt.ts

const prompt = useQuery({
  queryKey: queryKeys.prompt,
  queryFn: promptClient.getActivePrompt,
  initialData: emptyPrompt,
})

const mutation = useMutation({
  mutationFn: promptClient.createAnswer,
  onSuccess: () => {
    queryClient.invalidateQueries(queryKeys.prompt)
  },
})

// query-keys.ts

export default {
  prompt: 'prompt',
}
```

通过这样做，我认为我们已经很好地清理了我们的组件。

## 遵循常青模式

到目前为止，我们已经在 React 应用程序的上下文中利用了一些常青的编程建议。

我们实现了分层，类似于六边形架构中的做法。我们将单个大组件拆分成了更小的组件，这与常规函数的处理方式类似。我们专注于确保每个部分都有单一职责，遵循同名原则。

最重要的是，我们没有严格遵循复杂的设计模式。我们从行业内经久不衰、被证明有效的原则中汲取灵感，并找到了一种在我们产品的背景下实施它们的方法。

这一切旨在说明，我们所使用的技术只是在我们作为一个行业长期面临的相同问题上增添了一些风味。此外，前端开发并不是一个需要以独特方式管理复杂性的领域。我们已经拥有了知识，只需找到最佳的实施方式。

## 软件设计必须务实

当我们考虑软件设计时，我们专注于让事物看起来更好。我们对新近重构的实现感到惊叹，享受现在我们整理过后一切变得多么可读和整洁。但重要的是要理解，我们并不是仅仅为了满足我们整理代码库的欲望而付出所有这些努力。

一个好的结构具有实用的好处。

我们添加多层架构是因为不同种类的逻辑变化速度不同，它们不应该相互影响。读者不必了解整个应用程序的工作原理，就可以进行只影响其中一层的修改。

我们的 HTTP 层将是应用程序中变动最小的部分。一旦所有的处理程序都就位后，你主要的工作将是可视化和处理它们检索的数据。而且，JSX 中的变化将比支撑它们的领域逻辑中的变化更为常见。

代码看起来不错，这是我们确保其可维护性的一个副作用。

## 应对变化

每个实现如果一成不变，那么都可以设计得很结构化。让我们看看如何用这个设计来处理后续的需求。假设我们现在需要在每个答案中添加一个时间戳，显示它是在多久之前添加的。

```tsx
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function AnswersList({ answers }) {
  return (
    <div>
      {answers.map((answer) => (
        <div>
          <p>{answer.text}</p>
          <div>— {answer.author.name}</div>
          <div>{dayjs(answer.createdAt).fromNow(true)}</div>
        </div>
      ))}
    </div>
  )
}
```

有了这个，我们就可以在屏幕上显示相对时间。但请记住，第一版只是证明我们想要创造的东西是可能的。

我们找到了一个处理日期很有用的轻量级库，找到了合适的插件和方法，并且已经将其放置在正确的位置。我们还可以随意修改样式，以确保不会破坏我们的布局。

但我们不能发出我们的初稿。

这种实现破坏了我们的层次结构，将领域逻辑放入了表现逻辑中。组件应该只指定渲染什么以及在哪里渲染，它不应该负责构建数据结构，更不用说意识到我们使用的库了。

我们希望我们的组件看起来像这样。

```tsx
export default function AnswersList({ answers }) {
  return (
    <div>
      {answers.map((answer) => (
        <div>
          <p>{answer.text}</p>
          <div>— {answer.author.name}</div>
          <div>{answer.createdAt}</div>
        </div>
      ))}
    </div>
  )
}
```

在哪里抽象这段逻辑最合适？一种选择是在我们获取数据后的 `promptsClient` 中进行，但实际上并不是传输层的责任来构造数据。这是一个业务需求，因此应该在我们处理其他领域特定逻辑的地方处理 —— 在自定义钩子中。

```ts
export default function usePrompt() {
  // ...

  return {
    prompt: {
      ...prompt,
      answers: prompt.answers.map((answer) => ({
        ...answer,
        createdAt: dayjs(answer.createdAt).fromNow(true),
      })),
    },
    handleSubmit,
  }
}
```

这是一种处理方法，如果需要的话我们可以添加 `React.useMemo` 。但是使用扩展 `…` 操作符进行这类数据操作可能会变得相当混乱，使得代码的其他部分难以阅读。

我们可以将格式化操作移到一个单独的函数中，使得 `return` 语句更加简洁。

```ts
export default function usePrompt() {
  // ...

  return {
    prompt: formatPrompt(prompt),
    handleSubmit,
  }
}
```

我们传入整个对象，否则我们仍然需要在这里构造一个对象。

虽然这样的抽象已经足够，而且保持了我们的组件和钩子的简单性，但我们可以做得更好，看看我们使用的库是否提供了可以改进我们设计的 API。

```ts
// usePrompt.ts
const prompt = useQuery({
  queryKey: queryKeys.prompt,
  queryFn: promptClient.getActivePrompt,
  initialData: emptyPrompt,
  select: (prompt) => formatPrompt(prompt),
})
```

或者更简单。

```ts
// usePrompt.ts
const prompt = useQuery({
  queryKey: queryKeys.prompt,
  queryFn: promptClient.getActivePrompt,
  initialData: emptyPrompt,
  select: formatPrompt,
})

// ...

return {
  prompt,
  handleSubmit,
}
```

整个更改不过是自定义钩子里的一行代码，以及一个简单的格式化函数。

## 更多变化

我们的代码之所以常常处于糟糕的状态，是因为我们无法以合理的方式整合它所受到的所有变化。这些变化是由于业务需求的变动或在实现新功能时缺乏清晰度所导致的。我们讨论了这个问题可以通过不断提问来在一定程度上缓解。

但另一个变化的来源是我们这些工程师，忽视了可能在未来引起问题的某些事情，迫使我们不得不处理后果。

我们的应用程序就有这样一个缺陷。

我们依赖后端返回一个具有特定结构的响应，但假设我们的 REST API 出现了问题，它发送给我们一个有缺陷的对象。我们没有错误处理，这自然会导致 UI 出现问题。现在，处理一个异常并不是最难的技术挑战，但决定在哪里处理它是我们需要有意识做出的设计决策。

我们可以在显示数据的组件中添加检查：

```tsx
export default function AnswersList({ answers }) {
  if (!Array.isArray(answers)) {
    return null
  }

  return (
    // ...
  )
}
```

但是我们的应用程序越复杂，我们就需要在组件中添加越多的这些检查。它们中的每一个都需要处理验证其数据，可能会重复很多验证逻辑。我们希望将这些检查提升到更高的层次。

```tsx
export default function PromptPage() {
  const { prompt, handleSubmit } = usePrompt()

  return (
    <Layout>
      <h1>{prompt.title}</h1>
      {prompt.answered && Array.isArray(prompt.answers) ? (
        <AnswersList answers={prompt.answers} />
      ) : (
        <AnswerForm handleSubmit={handleSubmit} />
      )}
    </Layout>
  )
}
```

将其提升一个层级意味着子组件不再需要担心数据的有效性，但我们确实增加了父组件中的复杂性，使我们不得不使用嵌套的三元运算符来表达我们的逻辑。

但正如我们所提到的，一个组件内部包含许多条件语句是糟糕设计的征兆，就像一个普通函数一样。

让我们回到基本设计原则。

你总会寻找方法拆分一个有太多条件语句的函数。这会使代码过于复杂、难以阅读，而且职责混杂意味着它也难以维护。

我们需要将这些检查提升到更高的层次，并在它们的源头进行处理。在我们的情况下，这个源头是传输层。

```ts
export function getActivePrompt() {
  const { data } = api.get(endpoints.activePrompt)

  if (!Array.isArray(data.answers)) {
    // ...
  }

  return data
}
```

我们可以添加一个检查来验证失败的特定值，但我们无法保证将来不会遇到其他值的问题。因此，检查所有值并验证它们是否与我们应用程序中使用的类型相对应是有意义的。但对于一个大型响应对象或深层嵌套的对象，手动进行这样的检查将是繁重的。正确处理边界情况也会使这种实现容易出错。

相反，我们应该使用一个模式验证库。

```ts
// schemas.ts
export const promptSchema = z.object({
  title: z.string(),
  answers: z.array({
    text: z.string(),
    author: z.object({
      name: z.string(),
    }),
    createdAt: z.string().date(),
  }),
})

// prompts-client.ts
export function getActivePrompt() {
  const { data } = api.get(endpoints.activePrompt)
  return promptSchema.parse(data)
}
```

我们不必编写命令式逻辑，而是依赖于我们所期望的数据的描述性模型。

在信任边界验证数据是我们应该做的事情，无论是在前端还是后端。每当我们接受来自外部源的数据时，我们都需要确保它符合我们的预期，否则我们就是在基于假设进行构建。在后面的章节中，我们在接受 API 请求、读取消息代理中的消息或读取文件时会这样做。

不要满足于虚假的安全感。

我看过很多 TypeScript 项目在传输层没有进行验证，只是依赖于将返回值强制转换为一个类型。但如果没有对那个值进行任何运行时检查，你就会陷入我们刚才所处的困境。如果 API 返回了一个错误的响应，不管你的类型如何，你的应用程序都无法处理。

## 空状态

在我们讨论错误处理的时候，有一个细节到目前为止我们忽略了。当我们在应用程序中引入网络时，我们就隐式地增加了大量不可避免的复杂性。目前我们通过设置一个默认的空提示状态来避免这个问题，但让我们想象一下，如果我们的产品团队决定在页面内容加载时显示一条励志写作名言。

我们将移除初始数据，在加载提示前，值将是 `undefined` 。

在使用硬编码数据时，我们可以依赖它始终可用——对象就在内存中。但网络增加了一个我们不能忽视的不确定性层面。我们已经处理了错误，但还有空状态需要考虑。在等待数据到来时，我们在屏幕上显示什么？

有各种加载指示器，如消息、旋转器、骨架加载器，以及在我们的情况下是一句引语——这主要是产品决策。但空状态会增加代码库的复杂性。

我们之前有直接的模板化，现在我们需要另外一个检查。

```tsx
export default function PromptPage() {
  // ...

  return (
    <main>
      {prompt ? (
        prompt.answered ? (
          <AnswersList answers={prompt.answers} />
        ) : (
          <AnswerForm />
        )
      ) : (
        <RandomInspirationalQuote />
      )}
    </main>
  )
}
```

但是当我们发现在组件的标记中嵌套了条件语句（这适用于任何框架，不仅仅是 React），这意味着组件的拆分不够细致。嵌套条件是提取子组件的一个机会。

```tsx
// PromptPage.tsx
export default function PromptPage() {
  // ...

  return (
    <main>
      {prompt ? (
        <PromptContent prompt={prompt} />
      ) : (
        <RandomInspirationalQuote />
      )}
    </main>
  )
}

// PromptContent.tsx
export default function PromptContent({ prompt }) {
  return prompt.answered ? (
    <AnswersList answers={prompt.answers} />
  ) : (
    <AnswerForm />
  )
}
```

但我们不想仅仅把复杂性掩盖起来，我们想要减少它。三元运算本质上是一个简写的 `if-else` 语句，一个好的设计方法是尽量避免编写 `else` 语句。

```tsx
// PromptContent.tsx
export default function PromptContent({ prompt }) {
  if (!prompt.answered) {
    return <AnswerForm />
  }

  return <AnswersList answers={prompt.answers} />
}
```

通过反转条件并将其提升，我们检查故障状态并保持黄金路径在基本缩进级别上。这个条件语句“守护”了其余逻辑不受错误影响，被称为“守卫子句”。

守卫子句是我们用来在细粒度级别上抗击复杂性的最有用工具之一，它们已经成为我简化实现的最喜欢的技术。

而现在，我们终于准备好了。暂时的。

## 摘要

我们在本章中详细讨论了一些重要概念。我们知道从整体上审视产品并根据其面向用户的部分的需求来构建产品的重要性。我们知道如何开始构建，以及在哪里模拟数据。

最重要的一点是，流行的编程原则在前端同样适用，就像它们在技术栈的其他地方一样。因此，当你编写代码时，无论是否使用 React，都要始终根据这些原则来思考——通过分离职责来降低复杂性，抽象领域逻辑，从源头上解决错误，不要让 API 的细节泄露到应用程序中。

一旦你知道了一个与你所使用的技术相匹配的结构，你就可以边走边应用，从而拥有一个结构良好的应用程序。
