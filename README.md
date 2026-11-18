# vanilla-chan.cn 主页

静态主页，入口为 `vanilla-chan.cn.html`，资源在 `sources/`。线上位于 Mako 的 `/var/www/vanilla-chan.cn`；Nginx 将它作为默认首页。博客使用独立域名和仓库。

## 访问统计

- `sources/goatcounter.js` 仅在 `https://vanilla-chan.cn` 的首页或直接 HTML 入口启用，两者都记录为 `/`；查询参数和锚点不参与计数。本地预览、其他域名和其他应用路径不发送统计。
- 页面加载完成后才加载 `https://cnt.vanilla-chan.cn/count.js`，超时或失败不影响内容。后台是 [cnt.vanilla-chan.cn](https://cnt.vanilla-chan.cn/)，对应 Mako GoatCounter 的主页 Site 3；博客仍独立使用 `blog-cnt.vanilla-chan.cn`。
- Umami 的脚本与网站 ID 保持原样。前端不包含 GoatCounter 管理员或 API 凭据。
- 采用 GoatCounter 默认会话去重；刷新同一页面不一定增加计数。后续 Hanami 通过本侧只读 API 获取主页统计。

## 发布与恢复

推送 `main` 后，GitHub Actions 通过专用 SSH 密钥连接 Mako。该密钥仅允许执行 `/usr/local/sbin/deploy-vanilla-home` 的主页发布命令，不允许终端、转发或任意命令。服务器检查仓库干净、提交等于远端 main 后只做 fast-forward 更新，再检查主页返回 200。

仓库 Secrets：`SERVER_HOST`、`SERVER_USER`、`SSH_PRIVATE_KEY`、`SSH_KNOWN_HOSTS`。私钥与固定主机公钥由 Secrets 注入，不写进仓库。每次发布前保存当前 Git 源码归档；接入时的恢复副本位于 Mako `/var/backups/home-counter/20261118T012716Z/`。

回滚使用新的 Git revert 提交并重新发布，不强推历史；保留 GoatCounter 数据库，关闭前端统计不删除已有数据。
