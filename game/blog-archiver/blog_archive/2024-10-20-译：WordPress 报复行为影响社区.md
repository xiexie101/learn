---
title: "译：WordPress 报复行为影响社区"
date: 2024-10-20
url: https://sorrycc.com/wordpress-retaliatory
---

发布于 2024年10月20日

# 译：WordPress 报复行为影响社区

> 原文：[https://lwn.net/SubscriberLink/993895/c0438e0ee9382c5f/](https://lwn.net/SubscriberLink/993895/c0438e0ee9382c5f/)  
> 作者：Joe Brockmeier  
> 译者：ChatGPT 4 Turbo

现在说 [Automattic](https://automattic.com/) 和 [WP Engine](https://wpengine.com/) 之间[持续的斗争](https://lwn.net/Articles/991906/)将会有什么结果还为时尚早，但整个 [WordPress](https://wordpress.org) 社区已经成为了输家。Automattic 创始人兼 CEO Matt Mullenweg 正在利用他对项目的控制权和 [WordPress.org](http://WordPress.org) 的基础设施来惩罚 WP Engine，并且将一些持不同意见的贡献者从讨论频道中移除。最近，Mullenweg 管理了一个对 WP Engine 插件的恶意 Fork，该 Fork 插件通过 WordPress 更新正在替换原始插件。

在 Automattic 和 WP Engine 之间的争执开始时，许多人希望两家公司能够降低敌意——或者至少留给律师来解决问题，同时不牵扯到更广泛的社区。这些希望已经破灭了。

WP Engine 的确尝试只走法律程序。在 [WordPress.org 禁令](https://wordpress.org/news/2024/09/wp-engine-banned/) 结束后的第二天，10 月 2 日，WP Engine 对 Automattic 和 Mullenweg 个人提交了一份 [62 页的诉状](https://wpengine.com/wp-content/uploads/2024/10/Complaint-WP-Engine-v-Automattic-et-al.pdf)，并要求进行陪审团审判。诉讼的指控包括合同干扰、计算机欺诈（因阻止其访问 [WordPress.org](http://WordPress.org)）、企图敲诈、诽谤和中伤。此外，该诉讼还要求作出宣判，认为 WP Engine 没有侵犯或稀释 Automattic 在其[停止并终止信函](https://automattic.com/2024/wp-engine-cease-and-desist.pdf)中提到的 WordPress、WooCommerce 以及其他商标。

这当然是一步不太可能重建 Automattic 和 WP Engine 之间烧毁的桥梁的举动。预料之中的是，[WordPress.org](http://WordPress.org) 的禁令会保持不变，Automattic 会回应这个诉讼，甚至可能反诉 WP Engine。然而，到目前为止，尚未有关于反诉或对 WP Engine 诉讼的回应的迹象。相反，Mullenweg 正在使用其他手段给 WP Engine 制造问题——而这些策略以令人不安的方式波及到了更广泛的 WordPress 社区。

#### 复选框

如果不登录网站，想要参与 WordPress 的开发就不太可能实现。对于那些想要[贡献和更新插件](https://wordpress.org/plugins/developers/)、[访问 WordPress Trac（错误跟踪）实例](https://core.trac.wordpress.org/)等人来说，使用 [WordPress.org](http://WordPress.org) 是强制的。10 月 9 日，[WordPress.org](http://WordPress.org) 的账户登录表单中[新增了一个复选框](https://wptavern.com/wordpress-org-login-gets-mandatory-affiliation-checkbox-following-wp-engine-dispute)，内容为“我没有以任何财务或其他方式与 WP Engine 有关联。”如果未勾选该框，用户将收到提示，要求勾选该框以继续进行。

自然地，许多贡献者对这个新复选框提出了疑问，因为其措辞模糊，任何可能的后果都不明确。很明显，这会适用于 WP Engine 的雇员，但“财务和其他方式”到底能扩展多远？例如，这是否适用于在 WP Engine 上托管客户网站的许多公司的员工？订阅了 WP Engine 服务之一的客户？一些贡献者在 WordPress 的 Slack 中寻求有关这项政策的答案，但结果令人失望。少数人报告说，在这些对话之后，他们被禁止使用 Slack 实例，原因是他们追问答案或质疑 Mullenweg 的领导。

Javier Casares [分享](https://twitter.com/JavierCasares/status/1843963052183433331)说，在他在由 Colin Stewart 发起的[一个 Slack 线程](https://wordpress.slack.com/archives/C02QB8GMM/p1728463928352389)中提出了一系列问题后，他的账户被停用了。（注意，需要有一个 [WordPress.org](http://WordPress.org) 账户，并登录后，才能申请 WordPress Slack 的账户。）在该线程中，Mullenweg 说复选框的值不会被存储，但拒绝澄清什么算作与 WP Engine 的关联。他建议那些有疑问的人“咨询律师”。

Casares 表示，大多数人同意 WP Engine 应该为 WordPress 做出更多贡献，但使用 [WordPress.org](http://WordPress.org) 作为战斗的一部分是适得其反的。他在 Slack 上请求将措辞改为指出用户不是为 WP Engine _工作_，但这个建议没有被采纳。

#### 选择立场

另一位参与者，Terence Eden，在 [Slack 上提问](https://wordpress.slack.com/archives/C02QB8GMM/p1728557220371169?thread_ts=1728463928.352389&cid=C02QB8GMM)，如果他与 WP Engine 有关联，他是否可以通过 GitHub 发送拉取请求。在与 Mullenweg 的一番不那么有帮助的交流后，Eden 回复说：

> 我从未见过有人对自己的项目散播如此多的 FUD。起初，我对你们反对 WP Engine 的事业持同情态度。但你的行为把我 - 还有许多其他好人 - 驱逐了。

他后来在 [Mastodon 上报告](https://mastodon.social/@Edent/113287622359524228)，他的账户被停用了。Andrew Hutchings，一个贡献者，他通过与 [MariaDB Foundation](https://mariadb.org/) 的工作参与 WordPress，也参与了这次对话。他在 Slack 上[提出疑问](https://wordpress.slack.com/archives/C02QB8GMM/p1728468126620539?thread_ts=1728463928.352389&cid=C02QB8GMM)，有多少个人贡献者能负担得起一个律师来就复选框提出建议，并补充道：“我为另一个基金会工作，一个绝对负担不起让我贡献的律师费用的基金会。”他在博客上[写道](https://linuxjedi.co.uk/my-wordpress-slack-ban/)，他被禁止了，说他只是希望能在项目上工作：

> 我认为我代表了 WordPress 社区 / 生态系统中的许多人，当我说，我们不想在这场斗争中采取立场。我们不希望被复选框迫使选择立场。我们只是想完成工作，为每个人改善 WordPress。

这可能不是一个选项。在 #meta Slack 频道里的复选框讨论期间，Alex Sirota [说](https://wordpress.slack.com/archives/C02QB8GMM/p1728466624103039?thread_ts=1728463928.352389&cid=C02QB8GMM)：“你们不明白这里发生了什么吗？在我看来，这非常简单：你必须选择一个立场。”Stewart [说](https://wordpress.slack.com/archives/C02QB8GMM/p1728466840305579?thread_ts=1728463928.352389&cid=C02QB8GMM)，如果那是意图，那么 Mullenweg 可以亲自这么说。不久后，Mullenweg [说](https://wordpress.slack.com/archives/C02QB8GMM/p1728466945131879?thread_ts=1728463928.352389&cid=C02QB8GMM)，“我希望你们全都被告知和参与。不要只是站在一边。”Sirota 的账户现在也被停用了，尽管不清楚他是被禁止了还是自己停用了账户。

Mullenweg 在禁止 WP Engine 进入 [WordPress.org](http://WordPress.org) 后不久，也要求 Automattic 的员工做出选择。他在 10 月 3 日[写道](https://ma.tt/2024/10/alignment/)，Automattic 向其员工提供了一个“一致性提议”。该公司向那些因不同意 Mullenweg 的行动而希望离开的员工提供了一个离职套餐，套餐包括 30,000 美元或六个月的薪水（以较高者为准）。接受买断的员工将立即被解雇，并且不符合重新雇用的资格。根据帖子，159 人——公司的 8.4%——接受了这个提议。

#### 高级自定义字段

WordPress 的流行在很大程度上归功于其插件和主题。一个标准的 WordPress 安装缺少许多人可能想要或需要运行网站的功能：备份、商务功能、统计、联系表单、搜索引擎优化（SEO）、管理 URL 重定向，或向 WordPress 添加额外的内容类型。

围绕 WordPress 形成了一个大型生态系统，通过这些插件提供服务，提供带有额外功能的插件的付费版本，以及提供付费主题以简化网站设计。反过来，这有助于巩固 WordPress 作为网络上最受欢迎的内容管理系统（CMS）的地位。

WP Engine 生产了一个叫做[高级自定义字段](https://www.advancedcustomfields.com/)（ACF）的流行插件，通过 [WordPress.org](http://WordPress.org) 安装量超过两百万。它允许开发者向 WordPress 的编辑屏幕添加[额外的内容字段](https://www.advancedcustomfields.com/resources/getting-started-with-acf/#creating-fields)（称为自定义字段）。例如，这可能用于添加[日期选择器](https://www.advancedcustomfields.com/resources/date-picker/)或[创建图片画廊的界面](https://www.advancedcustomfields.com/resources/gallery/)给一个网站。反过来，ACF 又被[许多其他](https://wordpress.org/plugins/search/Advanced+Custom+Fields/) WordPress 插件使用或与之共同使用，如[针对 ACF 的高级表单](https://wordpress.org/plugins/advanced-forms/)和[用于翻译 WordPress 网站的 WPML](https://wpml.org/documentation/related-projects/translate-sites-built-with-acf/)。

ACF 插件的基础版本是免费的，但它也有一个[付费版本](https://www.advancedcustomfields.com/pro/#pricing-table)（“ACF Pro”），该版本采用年费订阅制。两个版本都可在 GPLv2 下获得，但用户必须为 Pro 版本的更新付费，这些更新直接来自 WP Engine。

9 月 28 日，Mullenweg [在 Slack 上询问](https://wordpress.slack.com/archives/C02RQBWTW/p1727501240087269) 是否应该将 ACF Pro 包括在 [WordPress 核心](https://solidwp.com/blog/wordpress-core/)中，即 WordPress 默认安装中包含的组件和功能。这在频道中引起了不同反响。一些用户指出，添加自定义字段的能力早就应该实现了，但其他人对于出于“怨恨”接管 ACF Pro 表达了[疑虑](https://wordpress.slack.com/archives/C02RQBWTW/p1727505491855069?thread_ts=1727501240.087269&cid=C02RQBWTW)。Richard Korthuis [询问](https://wordpress.slack.com/archives/C02RQBWTW/p1727505533162479?thread_ts=1727501240.087269&cid=C02RQBWTW)，这会向其他开发付费插件的开发者传达什么信息：“无论你对 WP Engine 和整个争议怎么看，这\[发出的\]信息给开发者是错误的，而且会阻碍未来对新插件的投资”。

在 10 月 5 日，一个星期六，Automattic 在一则[现已删除的推特](https://i.imgur.com/iN3MQkN.png)中宣布，它已“负责任地披露了 ACF 在 WP Engine 中的一个漏洞”。该公司没有提供更多细节。WordPress 核心安全团队负责人 John Blackbourn [表示](https://twitter.com/johnbillion/status/1842627564453454049)，Automattic 通过“不负责任地公开”漏洞，违反了 [Intigriti 行为守则](https://kb.intigriti.com/en/articles/6054585-intigriti-code-of-conduct)。Intigriti 是一家为公司运行漏洞赏金计划的公司，[包括 WP Engine](https://app.intigriti.com/programs/wpengine/wpengine/detail)。

10 月 7 日，WP Engine [宣布](https://www.advancedcustomfields.com/blog/acf-6-3-8-security-release/)了插件的一次安全发布。根据发布说明，漏洞本身似乎是次要的。这不是一个可以远程利用的漏洞，它只影响到“不太可能的情景”，即具有管理权限的用户尝试攻击其他具有管理权限的用户，或尝试在 WordPress 的多站点安装中获得超级管理员权限。迄今为止，关于漏洞的其他细节很少。这并非另一个 [XZ 后门](https://lwn.net/Articles/967192/)。

因为其开发者现在已经被 [WordPress.org](http://WordPress.org) 封禁，WP Engine 不得不将其修复方案[提交给 WordPress 安全团队](https://x.com/wp_acf/status/1843376378210857441)，以便上传至插件目录。同时也有关于如何[手动更新插件](https://www.advancedcustomfields.com/blog/installing-and-upgrading-to-the-latest-version-of-acf/)以直接从 WP Engine 接收更新的指导。

#### ACF 分支

Mullenweg 于 10 月 12 日，又是一个星期六，代表 [WordPress 安全团队](https://wordpress.org/about/security/)发表了一个[公告](https://wordpress.org/news/2024/10/secure-custom-fields/)，宣布 ACF 将根据[插件目录准则](https://github.com/WordPress/wporg-plugin-guidelines/tree/trunk?tab=readme-ov-file#table-of-contents)的[第 18 点](https://github.com/wordpress/wporg-plugin-guidelines/blob/trunk/guideline-18.md)被分支为 [Secure Custom Fields](https://wordpress.org/plugins/advanced-custom-fields/)（SCF）。该准则部分内容指出，[WordPress.org](http://WordPress.org) 可以“在新的、活跃的开发者代替下移除开发者对插件的访问权限”，并且“在公共安全的利益下，不经开发者同意更改插件”。根据这篇文章，此举是“由 WP Engine 的法律攻击引起的罕见且不寻常的情况”。

Automattic 并不仅仅是将 ACF 的代码分支并在新名称下提供，以与 WP Engine 竞争。这可能会让一些人感到惊讶，但大多数观察者可能会认为这是公平的竞争。

相反，它分支了代码，并接管了插件在 [WordPress.org](http://WordPress.org) 目录中的条目，包括其所有的评论。新插件正代替 ACF 被安装在所有之前安装过它的用户处。根据 [WordPress.org](http://WordPress.org) 上的公告，支持插件自动更新的网站将自动收到 SCF 插件。一些网站所有者可能不知道插件已经悄无声息地被替换。根据 Mullenweg 于 10 月 14 日在 Hacker News 上发表的[评论](https://news.ycombinator.com/item?id=41833808)，新插件已经有 225k 的下载量，他估计“至少有 60% 使用 .org 进行更新且开启自动升级的网站”已经转移到了这个分支。

这并不是第一次有公司通过中心仓库控制了一个程序包的分发，尽管这种情况很少见。例如，2016年的 [left-pad 事件](https://lwn.net/Articles/681410/) 中，[npm, Inc.](https://www.npmjs.com/) 在开发者 Azer Koçulu 移除 left-pad 后，将其恢复到了 Node.js 包仓库。然而，这一举措旨在减少对 Node.js 生态系统的干扰：包的移除导致包含该包的数千个项目构建失败，而且 Koçulu 实际上已经放弃了它。

另一方面，将 ACF 从 WordPress 目录中接管的行动，是 Automattic 对另一家企业的惩罚性举措，这不仅超出了 [WordPress.org](http://WordPress.org) 的基础设施范围，而且影响到了数以百万计的 WordPress 安装。网页开发者 Charles Fulton [写道](https://blog.goodbyeplease.com/2024/10/12/The-call-is-coming-from-inside-the-house/) 关于这一事件，并表示这是 “WordPress 插件生态系统极其不稳定的行动”；他想知道是否需要担心核心 WordPress 的更新可能会干扰 ACF Pro。

#### WPGraphQL 被纳入麾下

依赖于 [WPGraphQL](https://www.wpgraphql.com/) 和 [WPGraphQL for Advanced Custom Fields](https://acf.wpgraphql.com/) 插件的 ACF Pro 用户，可能真的有理由担心 Automattic 会寻求破坏对 ACF 的兼容性。WPGraphQL 为 WordPress 网站提供了一个 [GraphQL](https://graphql.org/) 架构和 API，并且是与 ACF 结合使用的流行插件。插件的维护者 Jason Bahl [宣布](https://www.wpgraphql.com/2024/10/07/wpgraphql-becomes-a-canonical-plugin-my-move-to-automattic) 在 10 月 7 日他将离开 WP Engine 加入 Automattic。此外，他说 WPGraphQL 正在成为 WordPress 的一个“典型插件”。

典型插件的概念定义得很宽泛，但 Mullenweg 在 2022 [描述它们](https://make.wordpress.org/core/2022/09/11/canonical-plugins-revisited/) 为官方插件，它们是某类功能的首选，但对于核心分发来说太小众。随着 WPGraphQL 的开发在 Automattic 的带领下，似乎不太可能优先考虑与 ACF 的兼容性。

Scott Kingsley Clark，一位参与将字段 API 导入 WordPress 核心的项目成员，在 10 月 13 日[宣布](https://make.wordpress.org/core/2024/10/13/fields-api-team-seeking-new-leadership/)他将停止向 WordPress 核心做出贡献。他在 GitHub 上的[字段 API 项目](https://github.com/sc0ttkclark/wordpress-fields-api)被存档，附带一则告别通知，表明他很痛苦地停下来，但他“对 Matt 的行为不再找借口，并且不会再与核心有任何关联”。他在 Mastodon.social 上[补充](https://scottodon.com/@skc/113297201274378086)说，他将继续是 WordPress 社区的一部分，并继续在 [Pods](https://wordpress.org/plugins/pods/) 插件上工作。

#### 接下来会发生什么？

接下来会发生什么，马伦维格（Mullenweg）接下来会\_做\_什么，这是任何人都无法预测的。Mullenweg 对 WP Engine 的怨恨已经以一种难以忽视或避免的方式波及到社区。他对项目的领导权一再受到贡献者、用户和外部观察者的质疑。如果还没有发生，这将波及到更广泛的商业生态系统，并对那些投入了大量资源到 WordPress 的插件创造者、创意机构和托管提供商造成严重后果。

更多的贡献者可能会离开，无论是公开地，还是悄悄地离开并找其他事情做。相当多的社交网络用户已经评论说，他们不会再推荐 WordPress，并正在寻找替代品。除了 [ClassicPress](https://lwn.net/Articles/992219/)，几乎不可避免地还会有一个分叉出现。

有一个合法的讨论需要进行或继续进行，关于开源项目被那些几乎不为开源软件的持续提供支持却获得其利益并从那些\_确实\_投入工作的公司中抽取收入的公司所商业化。这场讨论完全被 Mullenweg 惩罚 WP Engine 的行动所掩盖。

#### Mullenweg 这位“疯狂的国王”

Armin Ronacher，Python 的 [Flask](https://flask.palletsprojects.com/en/3.0.x/) 网页框架的创建者，以及发起 [开源誓约](https://lwn.net/Articles/993073/) 的参与者，针对正在进行的 WordPress 危机，对于将金钱和开源混合的主题，表达了一些[有趣的看法](https://lucumr.pocoo.org/2024/10/14/mixing-oss-and-money/)：

> 将开源和金钱混合是一个明智的\[想法\]吗？也许不是。然而，我也相信这是一个我们需要导航的现实。如今有些项目太小而无法获得任何资金（xz），也有一些项目足够大，能够通过引入资金来维持自身（Rails、WordPress）。

他观察到，他见证了太多在开源工作中“以这样或那样的方式”挣扎的人，无论是直接或间接的结果。他说 Mullenweg，像其他开源项目的创作者一样，看到其他人从他的项目中获得财务成功却感到不公，尽管 WordPress 在“影响、成功和为其创作者带来的财务回报方面”非常成功。Ronacher 说，Mullenweg 的行为“已经疏远了许多本来会支持他的人。他正在变成一个‘疯狂的国王’”。

这是非常不幸的，因为关于开源项目的可持续性，以及谁从中获利与谁生产它们的问题，都需要解决。Mullenweg 没有进行\_那个\_讨论，而是将治理、集中软件分发和软件供应链等问题放在了前台。

在几十年作为开源精神的模范之后，WordPress 正在成为公司拥有的项目模式危险的案例研究。WordPress 开始被视为风险选择，而不是安全选择——这种看法可能会影响到整个开源界。
