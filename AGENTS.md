# 注意事项

- 每次改动完成后，都必须创建一个对应的 git commit，以便后续追踪和回滚；提交后立即 push 到 GitHub 远端 `origin`。
- 每次改动后，都必须编写或更新相关测试，并在交付给用户前，确保所有测试和验证全部通过：`node tests/validate-site.js`。
- 本机 git 不在 PATH 中，需使用完整路径调用：`"F:\Program Files\Git\cmd\git.exe"`。
- 日常开发在 `main` 分支（GitHub 默认分支，Pages 只从 main 发布）；`master` 仅保留历史，不再提交。
- 站点结构：单文件 `index.html`（内联 CSS/JS，含中/英/马来三语）加 `image/` 静态资源；`api/` 下是两个 PHP 接口，由 cPanel 部署（见 `.cpanel.yml`）；GitHub Pages 只发布 `index.html` 与 `image/`。
