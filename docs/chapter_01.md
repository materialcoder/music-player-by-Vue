# 环境搭建及目录结构

#### **环境搭建**

本项目采用 `vue-cli` 脚手架进行环境搭建。首先全局安装 `vue-cli`:

> npm install -g vue-cli

项目初始化（本项目基于 `vue + webpack` ）：

> vue init webpack music-player-by-vue

该过程会要求输入项目名称、项目描述、作者、选择打包方式等信息，具体如下：

```
? Project name (music-player-by-vue) ------------项目名称
? Project name music-player-by-vue
? Project description (A Vue.js project) -----------项目描述
? Project description A Vue.js project
? Author (xxx) ----------- 项目创建者
? Author xxx
? Vue build (Use arrow keys) ---------- 选择打包方式，提供两种runtime+complier（默认推荐）和runtime-only
? Vue build standalone  
? Install vue-router? (Y/n) y ----------- 是否安装Vue路由，也就是以后是spa（此处我们是需要的）
? Install vue-router? Yes
? Use ESLint to lint your code? (Y/n) y ----------是否启用eslint检测规则
? Use ESLint to lint your code? Yes
? Setup unit tests with Karma + Mocha? (Y/n) n --------- 是否安装单元测试（此处不需要）
? Setup unit tests with Karma + Mocha? No
? Setup e2e tests with Nightwatch? (Y/n) n --------- 是否安装e2e测试（此处不需要）
? Setup e2e tests with Nightwatch? No

vue-cli · Generated "music-player-by-vue".

To get started: ------------ 这里说明如何接下来该如何启动这个服务

cd music-player-by-vue
npm install
npm run dev
```

依据上面的提示，我们接下来依次执行：

> cd music-player-by-vue
> npm install
> npm run dev

至此基于vue-cli的项目环境就基本搭建完成了。在浏览器中输入 `localhost:8080` 就可以看到如下的'欢迎页面' 了：

![欢迎页面](http://img.blog.csdn.net/20171116100440153?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

此项目中的样式文件采用 `stylus` 语法进行编写，因此还需要安装 `stylus` 和 `stylus-loader` 两个依赖：

> npm install --save-dev stylus stylus-loader

本项目中的 `js` 文件均采用 `ES6` 语法，为了完美转译 `ES6` 和实现浏览器兼容，安装了 `bable-runtime` 和 `babel-polyfill`:

> npm install --save babel-runtime
> npm install --save-dev babel-polyfill

由于本项目是开发移动端 `webApp`，因此安装了 `fastclick` 插件用于解决移动端 `300ms` 延迟的问题:

> npm install --save fastclick

因为该插件是用于全部组件中，因此需要在入口文件中引入并调用：

```
import fastclick from 'fastclick'

fastclick.attach(document.body)
```

#### **目录结构**

初始化后的目录结构如下图所示：

![目录结构](http://img.blog.csdn.net/20171116100024945?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

我们自己编写的文件将主要位于 `src` 目录下。首先我们删除 `src` 目录下的所有文件夹，在这里重新布置我们的目录结构。如下图：

![src目录结构](http://img.blog.csdn.net/20171115220006196?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

`src/common/stylus` 目录下定义了页面样式组件，具体如下图：

![样式文件目录](http://img.blog.csdn.net/20171116101956259?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

具体内容：
`variable.styl`
```
// 颜色定义规范
$color-background = #222
$color-background-d = rgba(0, 0, 0, 0.3)
$color-highlight-background = #333
$color-dialog-background = #666
$color-theme = #ffcd32
$color-theme-d = rgba(255, 205, 49, 0.5)
$color-sub-theme = #d93f30
$color-text = #fff
$color-text-d = rgba(255, 255, 255, 0.3)
$color-text-l = rgba(255, 255, 255, 0.5)
$color-text-ll = rgba(255, 255, 255, 0.8)

//字体定义规范
$font-size-small-s = 10px
$font-size-small = 12px
$font-size-medium = 14px
$font-size-medium-x = 16px
$font-size-large = 18px
$font-size-large-x = 22px
```

`mixin.styl`
```
// 背景图片
bg-image($url)
  background-image: url($url + "@2x.png")
  @media (-webkit-min-device-pixel-ratio: 3),(min-device-pixel-ratio: 3)
    background-image: url($url + "@3x.png")

// 不换行
no-wrap()
  text-overflow: ellipsis
  overflow: hidden
  white-space: nowrap

// 扩展点击区域
extend-click()
  position: relative
  &:before
    content: ''
    position: absolute
    top: -10px
    left: -10px
    right: -10px
    bottom: -10px
```

`base.styl`:
```
@import "variable.styl"

body, html
  line-height: 1
  font-family: 'PingFang SC', 'STHeitiSC-Light', 'Helvetica-Light', arial, sans-serif, 'Droid Sans Fallback'
  user-select: none
  -webkit-tap-highlight-color: transparent
  background: $color-background
  color: $color-text
```

`index.styl`
```
@import "./reset.styl"
@import "./base.styl"
@import "./icon.styl"
```