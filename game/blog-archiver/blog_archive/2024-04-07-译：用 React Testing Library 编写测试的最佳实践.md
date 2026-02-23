---
title: "译：用 React Testing Library 编写测试的最佳实践"
date: 2024-04-07
url: https://sorrycc.com/improving-react-testing-library-tests
---

发布于 2024年4月7日

# 译：用 React Testing Library 编写测试的最佳实践

> 原文：[https://claritydev.net/blog/improving-react-testing-library-tests](https://claritydev.net/blog/improving-react-testing-library-tests)  
> 作者：Alex  
> 译者：ChatGPT 4 Turbo

![](https://img.alicdn.com/imgextra/i2/O1CN014GLxOP24rPFaOs0fR_!!6000000007444-2-tps-640-427.png)

[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) 已经成为了测试 React 组件的事实标准。从用户的角度出发测试，以及在测试中避免实现细节，是其成功的一些主要原因。

正确编写的测试不仅有助于防止回归和错误代码，而且在 React Testing Library 的情况下，它们还改善了[组件的可访问性](https://claritydev.net/blog/creating-accessible-form-components-with-react)和整体用户体验。在使用 React 组件时，使用正确的测试技巧来避免与 React Testing Library 相关的常见错误是很重要的。

这篇文章将覆盖在使用 React Testing Library 时所犯的一些最常见错误，以及像使用特定查询来提高测试覆盖率、`*ByRole` 查询的重要性、使用 `userEvent` 方法而不是 `fireEvent` 来模拟用户互动，以及如何使用 `findBy*` 查询和 `waitForElementToBeRemoved` 进行异步测试的主题。阅读完这篇文章后，你将具备编写更好的 React Testing Library 测试、避免常见错误、提高你的 React 应用整体质量的知识。

## 默认使用 `*ByRole` 查询

React Testing Library 的一个强大优势是，通过正确的查询，我们不仅能确保组件按预期工作，而且还能确保它们是[可访问的](https://claritydev.net/blog/creating-accessible-form-components-with-react)。那么我们如何确定哪个查询是最好的呢？规则非常简单 - 默认使用 `*ByRole` 查询。这些查询对许多元素都有效，甚至对[复杂的选择组件](https://claritydev.net/blog/testing-select-components-react-testing-library)也是如此。

像大多数规则一样，它也有例外，因为并非所有 HTML 元素都有默认角色。HTML 元素的默认角色列表可在 [w3.org](https://www.w3.org/TR/html-aria/#docconformance) 上找到。

### 测试表单组件

让我们考虑下面的表单组件，改编自[之前的教程](https://claritydev.net/blog/typescript-typing-form-events-in-react)：

```jsx
export const Form = ({ saveData }) => {
  const [state, setState] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    conditionsAccepted: false,
  });

  const onFieldChange = (event) => {
    let value = event.target.value;
    if (event.target.type === "checkbox") {
      value = event.target.checked;
    }

    setState({ ...state, [event.target.id]: value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    saveData(state);
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field">
        <label>姓名</label>
        <input
          id="name"
          onChange={onFieldChange}
          placeholder="输入你的姓名"
        />
      </div>
      <div className="field">
        <label>邮箱</label>
        <input
          type="email"
          id="email"
          onChange={onFieldChange}
          placeholder="输入你的邮箱地址"
        />
      </div>
      <div className="field">
        <label>密码</label>
        <input
          type="password"
          id="password"
          onChange={onFieldChange}
          placeholder="密码至少应为 8 个字符"
        />
      </div>
      <div className="field">
        <label>确认密码</label>
        <input
          type="password"
          id="confirmPassword"
          onChange={onFieldChange}
          placeholder="再次输入密码"
        />
      </div>
      <div className="field checkbox">
        <input type="checkbox" id="conditions" onChange={onFieldChange} />
        <label>我同意条款和条件</label>
      </div>
      <button type="submit">注册</button>
    </form>
  );
};
```

```jsx
export const Form = ({ saveData }) => {
  const [state, setState] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    conditionsAccepted: false,
  });

  const onFieldChange = (event) => {
    let value = event.target.value;
    if (event.target.type === "checkbox") {
      value = event.target.checked;
    }

    setState({ ...state, [event.target.id]: value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    saveData(state);
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field">
        <label>姓名</label>
        <input
          id="name"
          onChange={onFieldChange}
          placeholder="输入你的姓名"
        />
      </div>
      <div className="field">
        <label>邮箱</label>
        <input
          type="email"
          id="email"
          onChange={onFieldChange}
          placeholder="输入你的邮箱地址"
        />
      </div>
      <div className="field">
        <label>密码</label>
        <input
          type="password"
          id="password"
          onChange={onFieldChange}
          placeholder="密码至少应为 8 个字符"
        />
      </div>
      <div className="field">
        <label>确认密码</label>
        <input
          type="password"
          id="confirmPassword"
          onChange={onFieldChange}
          placeholder="再次输入密码"
        />
      </div>
      <div className="field checkbox">
        <input type="checkbox" id="conditions" onChange={onFieldChange} />
        <label>我同意条款和条件</label>
      </div>
      <button type="submit">注册</button>
    </form>
  );
};
```

我们可以通过模拟表单元素的数据输入、提交表单等操作来测试这一点，然后验证 `saveData` 属性是否接收到了我们输入的数据。我们可以将其分解为 3 个步骤：

1.  输入我们想要测试的字段文本（或点击复选框）
2.  点击 `Sign up` 按钮
3.  验证 `saveData` 是否被调用，并且传入了我们输入的数据。

这个工作流程非常接近用户与我们表单互动的方式（尽管他们可能不会以相同的方式检查保存的数据）。

### 按占位符文本查询

让我们首先在第一个输入字段中输入一个名称。我们注意到它有一个 **Enter your name** 占位符，那么为什么不使用它来查询输入呢？

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";

const defaultData = {
  conditionsAccepted: false,
  confirmPassword: "",
  email: "",
  name: "",
  password: "",
};

describe("Form", () => {
  it("应该提交正确的表单数据", async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();
    render(<Form saveData={mockSave} />);

    await user.type(screen.getByPlaceholderText("Enter your name"), "Test");
    await user.click(screen.getByText("Sign up"));

    expect(mockSave).toHaveBeenLastCalledWith({ ...defaultData, name: "Test" });
  });
});
```

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";

const defaultData = {
  conditionsAccepted: false,
  confirmPassword: "",
  email: "",
  name: "",
  password: "",
};

describe("Form", () => {
  it("应该提交正确的表单数据", async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();
    render(<Form saveData={mockSave} />);

    await user.type(screen.getByPlaceholderText("Enter your name"), "Test");
    await user.click(screen.getByText("Sign up"));

    expect(mockSave).toHaveBeenLastCalledWith({ ...defaultData, name: "Test" });
  });
});
```

它虽然可行，但我们可以做得更好。首先，这种做法可能会促使人们将占位符文本当做标签使用，这不是占位符的本意，且被 [W3C WAI](https://www.w3.org/WAI/tutorials/forms/instructions/#placeholder-text) 所不推荐。其次，我们测试时并没有考虑到可访问性问题。

### 按角色查询特定组件

我们不妨尝试使用 `getByRole` 来替换查询。正如文档所述，我们可以通过 `textbox` 角色匹配类型为 `text` 的输入框。然而，由于表单中有多个文本框，我们需要更具体一些。幸运的是，查询接受第二个参数，这是一个选项对象，我们可以使用 `name` 属性来缩小匹配范围。

从 [文档](https://testing-library.com/docs/queries/byrole) 中我们可以看到，这里的 `name` 并不是指输入框的 `name` 属性，而是指其 [可访问名称](https://www.tpgi.com/what-is-an-accessible-name/)。因此，对于输入框，可访问名称通常是其标签的文本内容。在我们的表单中，名称输入框有一个 **名称** 标签，所以我们就用它吧。

```jsx
user.type(screen.getByRole("textbox", { name: "名称" }), "Test");
```

```jsx
user.type(screen.getByRole("textbox", { name: "名称" }), "Test");
```

当运行测试时，我们得到一个错误：

```text
TestingLibraryElementError: 无法找到具有角色 "textbox" 和名称 "名称" 的可访问元素
```

```text
TestingLibraryElementError: 无法找到具有角色 "textbox" 和名称 "名称" 的可访问元素
```

下面的帮助文本显示我们的输入框没有可访问名称：

```text
这些是可访问的角色：

  textbox:

  名称 "":
  <input
    id="name"
    placeholder="输入您的名称"
  />
```

```text
这些是可访问的角色：
  textbox:
  名称 "":
  <input
    id="name"
    placeholder="输入您的名称"
  />
```

我们确实为输入框提供了一个标签，那么为什么不起作用呢？原来标签需要与输入框 [相关联](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)。为此，标签应该有一个 `for` 属性与相关输入框的 `id` 匹配。或者，`input` 元素可以被包裹在 `label` 内。看来我们的输入框已经有了一个 `id`，所以我们只需要为它添加 `for`（在使用 React 时为 `htmlFor`）属性：

```jsx
<label htmlFor="name">姓名</label>
<input
  id="name"
  onChange={onFieldChange}
  placeholder="请输入您的姓名"
/>
```

```jsx
<label htmlFor="name">姓名</label>
<input
  id="name"
  onChange={onFieldChange}
  placeholder="请输入您的姓名"
/>
```

现在，输入框已经和它的标签正确关联，测试也通过了。这对提高可访问性来说也有极大的帮助。首先，当点击或触摸标签时，焦点将传递到关联的输入框。其次，也是最重要的，当输入框被聚焦时，屏幕阅读器会读出标签，为用户提供关于输入的额外信息。这表明，转换使用 `getByRole` 不仅增强了测试覆盖率，也为我们的表单组件提供了宝贵的辅助功能改进。

### 改善按钮测试

再次检查测试，我们看到 `getByText` 查询用于提交按钮。我认为，`*ByText` 应该是最后的手段（或者在 `*ByTestId` 之前的倒数第二个选择），因为它们最容易出错。

在我们的测试中，`screen.getByText("Sign up")` 匹配有文本节点并且文本内容是 **Sign up** 的元素。如果我们后来决定在同一页面上添加一个带有文本 “Sign up” 的段落，那么这个元素也会被匹配，并且因为存在多个匹配的元素而导致测试失败。当使用通用正则表达式进行文本匹配而不是字符串时，情况会变得更糟：`screen.getByText(/Sign up/i)`。这会匹配任何不区分大小写的 “sign up” 字符串出现的地方，即使它是更长句子中的一部分。

虽然我们可以修改正则表达式来确保它只匹配这个特定的字符串，但我们可以使用更精确的查询，并同时借助 `*ByRole` 查询验证我们的表单是否具有可访问性。在这种情况下，准确的查询将是 `screen.getByRole("button", { name: "Sign up" });`。这次的可访问名称是按钮的实际文本内容。请注意，如果我们给按钮添加一个 `aria-label`，可访问名称将是那个 `aria-label` 的文本内容。

最终，更新后的测试看起来像这样：

```jsx
describe("Form", () => {
  it("应提交正确的表单数据", async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();
    render(<Form saveData={mockSave} />);
 
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Test");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
 
    expect(mockSave).toHaveBeenLastCalledWith({ ...defaultData, name: "Test" });
  });
});
```

```jsx
describe("Form", () => {
  it("应提交正确的表单数据", async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();
    render(<Form saveData={mockSave} />);
 
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Test");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
 
    expect(mockSave).toHaveBeenLastCalledWith({ ...defaultData, name: "Test" });
  });
});
```

如果你对使用 React Testing Library 测试表单组件感兴趣，你可能会觉得这篇文章有用：[使用 React Testing Library 测试 React Hook Form](https://claritydev.net/blog/testing-react-hook-form-with-react-testing-library)。

## `*ByRole` 对比 `*ByLabelText` 用于输入元素

你可能会好奇，为什么我们对输入元素使用 `*ByRole` 查询，其目的是通过其关联的标签匹配输入。使用 `*ByLabelText` 查询是否会更简单，因为它们最终实现了相同的目标，并且语法更轻量些？虽然这两种查询之间似乎没有显著差异，但 `*ByRole` 在匹配元素时[更为健壮](https://testing-library.com/docs/queries/bylabeltext#name)，即使你比如从 `<label>` 切换到 `aria-label` 也仍然有效。

另一方面，并非所有类型的输入元素都有默认角色。例如，对于密码或电子邮件输入，我们会使用 `*ByLabelText` 查询。因此，虽然两种方法都有其优点，但考虑到特定的用例并选择最适合情况的查询是很重要的。

## 使用 `userEvent` 代替 `fireEvent`

你可能已经注意到，我们没有使用内置的 `fireEvent` 方法来模拟事件，而是默认使用 [userEvent](https://testing-library.com/docs/user-event/intro) 方法。尽管 `fireEvent` 在很多情况下都能工作，它只是一个在 `dispatchEvent` API 之上的简单封装，并不能完全模拟用户交互。另一方面，`userEvent` 以用户在浏览器中会以同样的方式操作 DOM，提供了更可靠的测试体验。其方法也更符合 React Testing Library 的理念，且语法更清晰。

从 `testing-library/user-event` 的 13 版开始，推荐在模拟事件前设置好用户事件。这在后续版本中将变为强制性的，直接从 `userEvent` 模拟事件将不再工作。

为了简化 `userEvent` 的设置，我们可以添加一个实用函数，来同时处理事件设置和组件渲染。

```jsx
// 设置 userEvent
function setup(jsx) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

describe("Form", () => {
  it("提交时应该保存正确的数据", async () => {
    const mockSave = jest.fn();
    const { user } = setup(<Form saveData={mockSave} />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Test");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(mockSave).toHaveBeenLastCalledWith({ ...defaultData, name: "Test" });
  });
});
```

```jsx
// 设置 userEvent
function setup(jsx) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

describe("Form", () => {
  it("提交时应该保存正确的数据", async () => {
    const mockSave = jest.fn();
    const { user } = setup(<Form saveData={mockSave} />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Test");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(mockSave).toHaveBeenLastCalledWith({ ...defaultData, name: "Test" });
  });
});
```

所有的 `userEvent` 方法都是异步的，因此我们需要略微调整测试也为异步的。此外，由于它是一个独立的包，需要通过 `npm i -D @testing-library/user-event` 来安装。

## 使用 `findBy*` 简化 `waitFor` 查询

经常会有这样的情况：我们试图匹配的元素在初始渲染时并不可用，例如我们首次从 API 获取项目，然后显示它们。在这些情况下，我们需要组件完成所有的渲染周期后再进行查询。作为例子，让我们修改 `ListPage` 组件，以便异步等待项目列表的加载：

```jsx
export const ListPage = () => {
  const [items, setItems] = useState([]);
 
  useEffect(() => {
    const loadItems = async () => {
      setTimeout(() => setItems(["Item 1", "Item 2"]), 100);
    };
    loadItems();
  }, []);
 
  if (!items.length) {
    return <div>Loading...</div>;
  }
 
  return (
    <div className="text-list__container">
      <h1>项目列表</h1>
      <ItemList items={items} />
    </div>
  );
};
```

```jsx
export const ListPage = () => {
  const [items, setItems] = useState([]);
 
  useEffect(() => {
    const loadItems = async () => {
      setTimeout(() => setItems(["Item 1", "Item 2"]), 100);
    };
    loadItems();
  }, []);
 
  if (!items.length) {
    return <div>Loading...</div>;
  }
 
  return (
    <div className="text-list__container">
      <h1>项目列表</h1>
      <ItemList items={items} />
    </div>
  );
};
```

现有版本的该组件的测试将不再有效，因为当 `screen.getByRole` 查询被调用时，只显示加载文本。要等待组件完成加载，我们可以使用 `waitFor` 帮助程序：

```jsx
import { waitFor } from "@testing-library/react";
 
//...
 
describe("ListPage", () => {
  it("渲染没有破坏", async () => {
    render(<ListPage />);
 
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "项目列表" }),
      ).toBeInTheDocument();
    });
  });
});
```

```jsx
import { waitFor } from "@testing-library/react";

//...

describe("ListPage", () => {
  it("渲染时不会崩溃", async () => {
    render(<ListPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "物品列表" }),
      ).toBeInTheDocument();
    });
  });
});
```

如果你对如何从 Enzyme 迁移你的测试到 React Testing Library 感到好奇，你可能会发现这篇文章有帮助：[Enzyme 与 React Testing Library：迁移指南](https://claritydev.net/blog/enzyme-vs-react-testing-library-migration-guide).

这种方法是可行的，但是有一种查询类型内置了异步行为：`findBy*` 查询。这些查询是基于 `waitFor` 的封装，让测试更具可读性：

```jsx
describe("ListPage", () => {
  it("渲染时不会崩溃", async () => {
    render(<ListPage />);
    expect(
      await screen.findByRole("heading", { name: "物品列表" }),
    ).toBeInTheDocument();
  });
});
```

```jsx
describe("ListPage", () => {
  it("渲染时不会崩溃", async () => {
    render(<ListPage />);
    expect(
      await screen.findByRole("heading", { name: "物品列表" }),
    ).toBeInTheDocument();
  });
});
```

值得注意的是，通常每个测试块只需一个 `await` 调用就足够了，因为那时所有的异步操作都已经解决。在上面的例子中，如果我们还想测试 `ItemList` 中有 4 项，我们不需要使用异步的 `findBy*` 查询；相反，我们可以使用 `getBy*`。

## 测试元素的消失

这是一个边界情况，但有时我们想测试一个先前存在的元素，在某些异步操作之后，是否已经从 DOM 中移除。React Testing Library 提供了一个方便的助手函数 - `waitForElementToBeRemoved`。例如，在 `ListItem` 组件中，我们可能想等待 `Loading…` 文本被移除，而不是等待列表头部出现：

```jsx
it("渲染时不会崩溃", async () => {
  render(<ListPage />);
  await waitForElementToBeRemoved(() => screen.queryByText("正在加载..."));
});
```

```jsx
it("渲染不会崩溃", async () => {
  render(<ListPage />);
  await waitForElementToBeRemoved(() => screen.queryByText("正在加载..."));
});
```

## 使用 React 测试库 Playground

如果你在确定某些元素的正确查询时遇到困难，[React 测试库 Playground](https://testing-playground.com/) 是一个很棒的资源。只需粘贴正在测试的组件的 HTML，它就会提供有关哪些查询对每个元素有效的实用建议。这个工具对于复杂组件尤其有价值，在这些情况下，哪个查询最好使用可能并不总是显而易见的。

## 修复 “没有在 act(…) 中包装” 警告

在某些情况下，特别是在处理包含异步逻辑的组件时，你可能会在运行测试时遇到警告：

```text
警告：在测试中对 ComponentName 的更新没有被包装在 act(...) 中。
```

```text
警告：在测试中对 ComponentName 的更新没有被包装在 act(...) 中。
```

这个警告表明你的测试可能没有准确模拟 React 更新组件的方式，可能导致你的测试结果出现假阳性或假阴性。当你的测试触发一个状态更新或者在 `act` 函数提供的范围之外的副作用时，就会发生这种情况，导致 React 异步更新组件。

通常，引起警告的原因是使用了 `getBy*` 查询而不是 `findBy*` 查询，因为所涉及的元素或组件在异步操作后更新。

然而，在某些情况下，“act” 警告是正当的，需要得到解决，以修正测试中的假阳性或假阴性。当使用 Jest 计时器时，就会出现这样的情况。在测试带有计时器的组件时，使用假计时器（例如，Jest 的 `useFakeTimers`）来控制时间流动，并防止不一致性。要运行计时器，你可以使用 `jest.runAllTimers();`，它也需要在 `act` 中被包装。

```js
jest.useFakeTimers();
// ... 设置测试
 
act(() => {
  jest.runAllTimers();
});
 
// ... 断言
 
jest.useRealTimers();
```

```js
jest.useFakeTimers();
// ... 设置测试
 
act(() => {
  jest.runAllTimers();
});
 
// ... 进行断言
 
jest.useRealTimers();
```

这个警告在 React 18 中可能会更频繁地出现，因为它引入了一些关于如何执行 `useEffect` 的[变更](https://react.dev/blog/2022/03/08/react-18-upgrade-guide#other-breaking-changes)。这将需要更多的测试被包裹在 `act` 中。

要想更全面地解决“未包裹在 act(…) 中”的警告，请参考这篇文章：[修复“未包裹在 act(…) 中”的警告](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)。

## 编写冒烟测试

有时候，我们希望有基本的健全性测试，以确保组件在渲染过程中不会崩溃。让我们考虑这样一个简单的组件：

```jsx
export const ListPage = () => {
  return (
    <div className="text-list__container">
      <h1>项目列表</h1>
      <ItemList />
    </div>
  );
};
```

```jsx
export const ListPage = () => {
  return (
    <div className="text-list__container">
      <h1>项目列表</h1>
      <ItemList />
    </div>
  );
};
```

我们可以通过像这样的测试来检查它是否没有问题地渲染：

```jsx
import { render } from "@testing-library/react";
import React from "react";
 
import { ListPage } from "./ListPage";
 
describe("ListPage", () => {
  it("渲染时不会崩溃", () => {
    expect(() => render(<ListPage />)).not.toThrow();
  });
});
```

```jsx
import { render } from "@testing-library/react";
import React from "react";
 
import { ListPage } from "./ListPage";
 
describe("ListPage", () => {
  it("渲染时不会崩溃", () => {
    expect(() => render(<ListPage />)).not.toThrow();
  });
});
```

这对我们的目的来说已经足够好了；然而，我们还没有充分利用 React Testing Library 的力量。相反，我们可以这样做：

```jsx
import { render, screen } from "@testing-library/react";
import React from "react";
 
import { ListPage } from "./ListPage";
 
describe("ListPage", () => {
  it("渲染时不会崩溃", () => {
    render(<ListPage />);
 
    expect(
      screen.getByRole("heading", { name: "项目列表" }),
    ).toBeInTheDocument();
  });
});
```

```jsx
import { render, screen } from "@testing-library/react";
import React from "react";

import { ListPage } from "./ListPage";

describe("ListPage", () => {
  it("renders without breaking", () => {
    render(<ListPage />);

    expect(
      screen.getByRole("heading", { name: "物品列表" }),
    ).toBeInTheDocument();
  });
});
```

虽然这是一个相对简化的例子，但通过这个小改动，我们不仅测试了组件是否能在渲染时不出错，还测试了它是否有一个名为 `物品列表` 的标题元素，同时这个元素能够被屏幕阅读器正确访问。

## 结论

在这篇文章中，我们探讨了一些技巧和最佳实践，以改善 React 测试库的测试，并列出了应避免的一些常见错误。通过使用 getByRole 查询，我们可以确保我们的测试不仅提供了良好的覆盖范围，还提供了宝贵的可访问性改进。我们还学习了使用 userEvent 方法而非 fireEvent 的好处，以及如何为最佳使用进行设置。最后，我们了解了如何使用 findBy\* 查询和 waitForElementToBeRemoved 来编写更健壮和可靠的测试。

通过遵循这些提示和技巧，我们可以编写更好的 React 测试，这些测试更易于阅读、维护和[调试](https://claritydev.net/blog/beyond-console-log-debugging-techniques-javascript)。记住，测试是开发过程的重要部分，投入时间编写良好的测试能够在长期带来回报。通过这些技术和最佳实践，我们可以确保我们的 React 应用程序得到了全面的测试，并且质量上乘。

## 参考文献和资源

*   [超越 Console.log：JavaScript 中的调试技巧](https://claritydev.net/blog/beyond-console-log-debugging-techniques-javascript)
*   [使用 React 创建可访问的表单组件](https://claritydev.net/blog/creating-accessible-form-components-with-react)
*   [Kent C. Dodds：解决 “not wrapped in act(…)” 警告](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)
*   [MDN：Label 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
*   [React Testing Library Playground](https://testing-playground.com/)
*   [React Testing Library 文档：ByLabelText 查询](https://testing-library.com/docs/queries/bylabeltext#name)
*   [React Testing Library 文档：ByRole 查询](https://testing-library.com/docs/queries/byrole)
*   [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
*   [React 文档：如何升级到 React 18](https://react.dev/blog/2022/03/08/react-18-upgrade-guide#other-breaking-changes)
*   [使用 React Testing Library 测试 Select 组件](https://claritydev.net/blog/testing-select-components-react-testing-library)
*   [TypeScript：在 React 中输入表单事件](https://claritydev.net/blog/typescript-typing-form-events-in-react)
*   [User Event 文档](https://testing-library.com/docs/user-event/intro)
*   [什么是可访问名称？](https://www.tpgi.com/what-is-an-accessible-name/)
*   [w3.org：HTML-ARIA](https://www.w3.org/TR/html-aria/#docconformance)
*   [w3.org：占位符文本](https://www.w3.org/WAI/tutorials/forms/instructions/#placeholder-text)
