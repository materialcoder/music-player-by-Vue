# 歌手详情页

先上一个最终效果图：

![](http://img.blog.csdn.net/20171124154459658?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

### **子路由配置**
在 `router/index.js` 中导入 `SingerDetail` 组件，并在 `Singer` 路由下配置属于它的子路由。每个路由下都有一个 `children` 属性，用来配置它的子路由：

```
{
  path: '/singer',
  component: Singer,
  children: [
    {
      path: ':id',
      component: SingerDetail
    }
  ]
},
```

然后在 `Singer` 组件中添加 `router-view` 来挂载子路由

然后我们还需要在 `lisetview` 组件中对每一个列表项绑定点击事件，由于这是一个基础组件，在点击的时候我们向外部派发一个 `select` 事件：

```
<li @click="selectItem(item)" v-for="item in group.items" class="list-group-item">
	<img class="avatar" v-lazy="item.avatar">
	<span class="name">{{item.name}}</span>
</li>
```

```
selectItem(item) {
	this.$emit('select', item)
},
```

> $emit 的两个参数的含义是：第一个是传递给父组件的事件名称，第二个是传递给监听器(父组件上)回调的参数

最后在 `singer` 组件中来监听 `select` 事件，实现路由跳转。

```
<list-view @select="selectSinger" :data="singers"></list-view>
```

```
methods: {
	selectSinger(singer) {
		this.$router.push({
			path: `/singer/${singer.id}`
		})
	}
}
```

> 这里的 `singer` 参数就是上面事件派发时传过来的 `item`

添加动画：

给需要添加动画的地方包裹上一层 `transition` 标签，通过相应的 `css` 样式即可：

```
<transition name="slide">
	<div class="singer-detail"></div>
</transition>
```

```
//stylus

.slide-enter-active,.slide-leave-active
	transition all 0.3s
.slide-enter,.slide-leave-to
	transform translate3d(100%,0,0)
```


### **Vuex初始化**
https://vuex.vuejs.org/zh-cn/

![vuex](https://vuex.vuejs.org/zh-cn/images/vuex.png)

安装vuex:

> npm install --save vuex

vuex通常放在 `src/store` 目录下。主要包括以下文件：

`index.js` 组装模块并导出store
`state.js` 对状态进行管理
`mutations.js` 更改状态，都是同步事务
`mutation-types.js` 与mutation相关的一些名词常量
`actions.js` 异步修改，或者对mutation进行一些封装（对mutation进行提交）
`getters.js` 获取state

```
// index.js
import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
import state from './state'
import mutations from './mutations'
import createLogger from 'vuex/dist/logger' //打印修改记录

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
  strict: debug,  // 开发模式下开启严格模式
  plugins: debug ? [createLogger()] : []
})
```

最后要在主入口文件 `main.js` 中引入 `vuex`:

```
import store from './store'
```

```
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
```

### **歌手数据配置**

首先我们需要在 `singer` 组件中的 `methods` 中利用 `vuex` 的 `mapMutations` 辅助函数来提交 `SET_SINGER` 这个 `mutation` ：

```
// singer.vue
import {mapMutations} from 'vuex'
```

```
methods: {
	...mapMutations({
		setSinger: 'SET_SINGER' //将this.setSinger()映射为 this.$store.commit('SET_SINGER') 将singer保存到了state.singer中
	})
}
```

```
// 点击的时候提交singer数据
selectSinger(singer) {
	this.$router.push({
		path: `/singer/${singer.id}`
	})
	this.setSinger(singer) //提交数据
},
```

此时的 `singer` 数据就保存到 `state` 中了。我们在 `singer-detail` 组件中可以来获取到 `singer` 的数据。
使用 `mapGetters` 辅助函数可以将 `store` 中的 `getter` (这里是singer)映射到局部计算属性中：

```
//singer-detail.vue
computed: {
	...mapGetters([
		'singer' //等于state.singer，并映射给this.singer
	])
},
created() {
	console.log(this.singer) //调用数据
}
```

### **歌手详情数据抓取**

```
// api/singer.js
export function getSingerDetail(singerId) {
  const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg'

  const data = Object.assign({}, commonParams, {
    hostUin: 0,
    needNewCode: 0,
    platform: 'yqq',
    order: 'listen',
    begin: 0,
    num: 100,
    songstatus: 1,
    singermid: singerId,
    g_tk: 1664029744
  })

  return jsonp(url, data, options)
}
```

在 `singer-detail` 组件中调用该方法即可获得歌手详情数据。

最后我们还需要对获得的数据进行整理。

与前面的 `Singer` 类一样，这里我们要构建一个 `Song` 的类

同时为了避免为此都要去实例化 `Song` ,我们还定义了一个工厂模式的 `createSong`，返回实例化后的 `Song`

最后在 `singer-detail` 组件中调用该方法即可获得需要的歌手详情数据

### **music-list组件开发**

在 `singer-detail` 组件中进行抽象出了`music-list` 组件（`componnets/music-list/music-list.vue`），它在后面的很多场合中也会进行复用

在 `music-list` 组件中我们又抽象出来 `song-list` 组件，它是作为一个基础组件(`base/song-list/song-list`)来使用，相对来说比较简单。

`music-list` 组件相对来说稍微复杂一些。它里面会涉及到点击按钮返回，歌曲列表滚动以及滚动时与图片的一些动画效果（显示、隐藏、放大等）

歌单向上滚动时背景图片会隐藏，这是通过监听歌曲列表滚动时的高度，来控制 `bg-layer` 的位置来实现的。下拉到顶部再往下拉时图片会有一个放大的效果：

```
watch: {
  scrollY(newY) {
    let translateY = Math.max(this.minTranslateY, newY)
    let zIndex = 0
    let scale = 1
    let blur = 0

    this.$refs.bgLayer.style[transform] = `translate3d(0,${translateY}px,0)`

    const percent = Math.abs(newY/this.imageHeight) //保证背景图片缩放时无缝滚动
    
    //缩放和高斯模糊效果
    if(newY > 0) {
      scale = 1 + percent
      zIndex = 10
    } else {
      blur = Math.min(20*percent, 20)
    }

    this.$refs.filter.style[backdrop] = `blur(${blur}px)` //向上滚动时，图片添加一个高斯模糊效果

    if(newY < this.minTranslateY) {
      zIndex = 10
      this.$refs.bgImage.style.paddingTop = 0
      this.$refs.bgImage.style.height = `${RESERVED_HEIGHT}px`
      this.$refs.playBtn.style.display = 'none'
    } else {
      this.$refs.bgImage.style.paddingTop = '70%'
      this.$refs.bgImage.style.height = 0
      this.$refs.playBtn.style.display = 'block'
    }

    this.$refs.bgImage.style.zIndex = zIndex
    this.$refs.bgImage.style[transform] = `scale(${scale})`
  }
}
```

对于浏览器 `CSS` 兼容的问题，为了减少代码量，我们在 `common/js/dom.js` 中定义了一个 `prefixStyle` 方法用来自动给需要添加前缀的 `CSS` 属性添加前缀。

最后与前面一样加入了 `Loading` 组件对页面呈现效果进行了优化。