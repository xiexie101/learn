---
title: "144 - 《Just JavaScript 笔记和翻译包》"
date: 2022-07-01
url: https://sorrycc.com/just-javascript
---

发布于 2022年7月1日

# 144 - 《Just JavaScript 笔记和翻译包》

[Just JavaScript](https://justjavascript.com/) 是 Dan 出品的 JavaScript 入门课程，刚出时就买了。今天翻「Might DO」清单捞回来的，看了好久，总算是看完了。作为 10 年+ JavaScript 经验的前端，也学到了不少，上午在群里提的问题，都是出自本书。同时，看的时候顺手翻译了下，中英文版见附件。

Just JavaScript 会帮你打造正确的心智模型。心智模型之所以重要，是因为他能确保你对代码的估算是正确的。在头脑中模拟一台计算机很难，心智模型是你唯一能依赖的。

比如：

```ts
function duplicateSpreadsheet(original) {  
 if (original.hasPendingChanges) {  
  throw new Error('You need to save the file before you can duplicate it.');  
 }  
 let copy = {  
  created: Date.now(),  
  author: original.author,  
  cells: original.cells,  
  metadata: original.metadata,  
 };  
 copy.metadata.title = 'Copy of ' + original.metadata.title;  
 return copy;  
}
```

比如：

```ts
if (typeof(value) === 'date') {  
 console.log('This is a date, indeed!');  
}
```

这些都是有点问题的代码，你能一眼看出吗？

Just JavaScript 讲解的内容不多，只有值、变量、equality 运算、属性、突变和原型。但却是我见过讲 JavaScript 讲地最有趣的一本书，比如 JavaScript 宇宙的设定、变量是线的比喻、表达式即提问的比喻、undefined 黑洞的比喻、福尔摩斯和约翰的故事、值的假面舞会、值的召唤和创建等，都令人印象深刻。趁我还没忘光，赶紧做些笔记。

1、值。共 9 种值，无意缺失的 Undefined、有意缺失的 Null、Booleans、Numbers、大数运算的 BigInts、Strings、Symbols、对象和函数；这些值又可分为两类，前 7 种是原始值，后 2 种是引用值；通过 typeof 可窥探值类型，但要注意有一个会说谎；Null 和 Undefined 是孤独的值，他们只有一个唯一值。

2、表达式。比如 `1+2`，比如 `typeof X`，比如 `a.b` 等都是表达式。这里有个很好的比喻，表达式是你向 JavaScript 提的问题，然后他会告诉你一个「值」。比如你问 `1+2` 是什么，他会回复你 3。

3、原始值和引用值。原始值不可变，比如 `let foo = 'bar'; foo[0]='h'; console.log(foo);` 得到的还是 `'bar'`，如果你开启了严格模式，还会直接报错；引用值是可变的，比如 `let foo = ['b']; foo[0] = 'c'; console.log(foo)` 会得到 `['c']`。作者把原始值比喻成遥远的星星；把引用值比喻成围绕在周围可操控的小行星。

4、变量。变量不是值，变量指向值。变量是线。比如 `let pet = "dog"`，等号的左边是变量，等号的右边是值或表达式，如果是表达式，会求值；变量赋值就是把变量和值通过线连起来；文章里用动图很形象地表示了线连的过程，推荐自己翻看。

5、Undefined。别被名字骗了，以为他是「未定义」，然后写 `console.log(foo); let foo` 这种代码；Undefined 就是普通的原始值；我个人觉得理解为「未赋值」更合适。

6、Null。Null 是 Undefined 的妹妹；Null 是个骗子，用 typeof 窥探他时他会假装成对象，如果你真当对象用就完蛋了；当然这背后的原因是 [JavaScript 的一个 Bug](https://2ality.com/2013/10/typeof-null.html)，让我们不得不忍受到现在。

7、布尔值。就像白天和黑夜的开关。

8、数值。为啥 `0.1 + 0.3 =<span style="background:#faf8cb"> 0.30000000000000004`？表面看是 JavaScript 的 Bug，往深了看是浮点数问题，再往深了看就能到达本质了，是精度问题；就像扫描仪，你给两个稍有不同的红色，扫描仪可能会被骗，以为是一样的，这也是精度问题；回到 JavaScript 里，由于 JavaScript 使用的数字精度有限，越接近 0，精度越高，反之越远；我们写的 0.1 和 1 一样，都不是完全精确的，而是 JavaScript 用了与 0.1 或 1 非常接近的一个数；整数也有精度问题？有！不信可以试试 `Number.MAX_SAFE_INTEGER + 1 </span>= Number.MAX_SAFE_INTEGER + 2`。

9、NaN。计算错误时获得，比如 0/0 就能得到 NaN；NaN 是数值，因为 `typeof NaN =<span style="background:#faf8cb"> "number"`；`NaN </span>= NaN` 结果是 false，作者说 NaN 是唯一不与自身相等的值，可以用 `const isNaN =<span style="background:#faf8cb"> val !</span> val` 判断得出，但这里不够严谨，下午群里有人反馈用 Proxy + get + 返回不同的值也满足这个条件；所以判断 NaN 用 `Number.isNaN(val)` 或 `Object.is(val, NaN)` 会更严谨。

10、BigInts。大数值，实现整数的任意精度，适用于精度敏感的金融计算场景；但是没有免费的午餐，BigInt 意味着更大的内存消耗。

11、字符串。这里有个好问题，比如 let foo = “bar”，这个 “bar” 是被创造的还是被召唤的？被创造意味着每次的值是不一样的；被召唤意味着所有字符串都存在了，用的时候拿过来而已，所以值是一样的。具体如何实现，其实是 JavaScript 引擎实现的，我们可以不用管它。但是 “bar” === “bar”，所以为了心智模型更简单，作者建议就按「被召唤」的理解。

12、对象和函数。他们是引用值；他们可变；用字面量的话每次都不同，比如 `1 =<span style="background:#faf8cb"> 1` 是 true，`[] </span>= []` 或 `function(){} === function(){}` 则是 false，写 `1` 或 `"hello"` 是召唤值，而写 `{}`、`[]` 或 `function() {}` 是创造值；函数是值。

13、等价判断。可以想象下假面舞会，一群穿着一模一样衣服的值在参加舞会，你可能会和两个值交谈，但没意识到其实是和一个值交谈了两次，或者你以为是和一个值交谈，确实和不同的值在交谈；有三种判断方式，三个等于号、两个等于号 和 `Object.is`，最后一种大部分教程都没有聊；[Object.is](http://Object.is) 是同值相等，只要是同值，就返回 true；`Object.is` 和 = 基本相同，但有几种特殊场景，比如 `Object.is(NaN, NaN)` 返回 true，而 `NaN </span>= NaN` 返回 false，`Object.is(0, -0)` 返回 false，而 `0 =<span style="background:#faf8cb"> -0` 返回 true；松散等价 千万别用，除非你能背出[这张表](https://dorey.github.io/JavaScript-Equality-Table/)。

14、属性。就记住了一个有趣的例子。夏洛克居住在伦敦，`let 夏洛克 = { surname: '夏洛克', address: { city: '伦敦' }`；然后他的朋友华生来了，和他一起住，`let 华生 = { surname: '华生', address: 夏洛克.address }`；夏洛克虽然是个出色的侦探，但不好相处，华生受够了，决定改名星巴克并且搬到马里布，`华生.surname = '星巴克' && 华生.address.city = '马里步'`。聪明的你，是不是已经发现问题了？

15、原型。`let pizza = {}; console.log(pizza.taste);` 然后希望得到的结果是 `"apple"`，这可能吗？答案是「可能」，因为有原型链。原型链通过神秘的 `__proto__` 属性实现；取值时会一级级往上找；赋值时不会往上找，会赋在自己身上；对象也有原型，如果要创建一个没有原型的对象，可以用 `let foo = { __proto__: null }；` 通过 `obj.hasOwnProperty('foo')` 可以判断属性是否在自己身上。

16、prototype。和原型的区别是啥？prototype 是函数的一个属性，new 一个函数时，会将返回对象的 `__proto__` 设置到函数的 prototype 属性上，通常用于实现类继承；现在有了 class 之后已经很少用，但 class 的背后其实也是 `__proto__` 在工作。
