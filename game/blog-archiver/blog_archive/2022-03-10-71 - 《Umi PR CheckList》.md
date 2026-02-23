---
title: "71 - 《Umi PR CheckList》"
date: 2022-03-10
url: https://sorrycc.com/umi-pr-checklist
---

发布于 2022年3月10日

# 71 - 《Umi PR CheckList》

为了提升 PR Review 效率，拍脑袋想了一些 umi 仓库 PR 的垂类要求。

1、确保 prettier + husky + lint-staged 正常工作，提交代码时会对修改代码做 prettier 处理，确保大家风格的一致性  
2、确保本地测试通过，用 pnpm test 验证  
3、确保 tsc 校验通过，用 pnpm tsc:check 验证  
4、已加入 Umi Group 的优先在 umijs group 的仓库下创建分支提 PR，因为可以有 Github CI  
5、一个 PR 只做一件事，不要把多个改动合到一个 PR 里提交  
6、复杂逻辑需要写用例  
7、复杂正则需要写注释并给示例  
8、新增加的依赖要锁定版本  
9、新增加的依赖可以预打包的走预打包  
10、功能、配置的新增、删除和修改需同时提交文档的改动

> 2024.1.31 注：哪记得住那么多，规则应该工程化，然后让开发者在提交前做一键检测，或者 CI 时自动检测。

参考：  
[https://ant.design/docs/react/contributing-cn](https://ant.design/docs/react/contributing-cn)
