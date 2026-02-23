---
title: "386 - 《迁移密码软件从 1Password 到 Bitwarden》"
date: 2023-12-17
url: https://sorrycc.com/bitwarden
---

发布于 2023年12月17日

# 386 - 《迁移密码软件从 1Password 到 Bitwarden》

> 晚上把密码软件从 1Password 迁移到 Bitwarden，做下记录。

1、为什么要换？因为 1Password 太贵了。我之前买的是家庭版，所以续费时一年要 50 多美元。感觉不太值，没啥意义，所以就趁着上一年的 1Password 到期前准备换掉。调研后发现，Bitwarden 的风评比较好，开源、免费、支持自部署等。

2、Bitwarden 大家通常都不用官方服务器，而是选择自建，让密码保存在自己手里。简单调研后，准备把 Bitwarden 用 Docker 部署到之前在 [353 - 《VPS、宝塔、Blog》](https://sorrycc.com/vps-baota-blog) 里介绍的 [cloudcone.com](http://cloudcone.com) 的 VPS 上。

3、过程基本上就是照着 [https://isedu.top/index.php/archives/21/](https://isedu.top/index.php/archives/21/) 操作，区别是镜像不能用 bitwardenrs/server，得用 vaultwarden/server，否则在客户端登录时会报「Cannot read properties of null (reading ‘iterations’)」的错误。流程是，获取镜像、创建容器、添加站点、指向域名、设置 HTTPS 证书、设置反向代理。10 分钟差不多就能操作完了。

4、迁移密码也比较顺利。1Password 可以导出为 1PUX 或 CSV 格式，然后在 Bitwarden 服务器上导入即可。需要注意的是，2FA 两步验证的没法自动同步，需要每个用 iOS 版的 Bitwarden 设置一遍，我设置了 npmjs 和 github，可能还有漏的。同时，我趁这个机会整理了下现有密码，花了比较多时间。

5、客户端我安装了 3 个，Mac、Chrome 插件和 iOS 客户端。登录到 self-host 的服务器上后，同步完密码库即可使用。iOS 里还需要在「设置、密码、自动填充」里选择 Bitwarden。

6、注：服务器里需要做下密码数据库的定期备份，做下容灾。

参考：  
[https://bitwarden.com/](https://bitwarden.com/)  
[https://github.com/bitwarden](https://github.com/bitwarden)  
[https://isedu.top/index.php/archives/21/](https://isedu.top/index.php/archives/21/)
