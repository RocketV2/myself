// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages 配置：
//   site = https://RocketV2.github.io（GitHub 用户名 RocketV2）
//   base = /myself/（项目页，尾部斜杠必需）
//   若改用用户页（仓库名 = <用户名>.github.io），删除 base 一行即可。
export default defineConfig({
  site: 'https://RocketV2.github.io',
  base: '/myself/',
  output: 'static',
});
