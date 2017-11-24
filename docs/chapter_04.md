# 歌手页面

先上一个最终效果：

![](http://img.blog.csdn.net/20171124154451335?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

### **歌手数据抓取**

歌手数据仍然采用 `jsonp` 的方法从 `QQ` 音乐中抓取。在 `api` 文件夹下新建 `singer.js` 用于获取歌手数据。

### **歌手数据整理**
在歌手页面中我们是按照歌手姓名首字母来进行排序的，同时还有一个热门类。但获取到的数据是没有按照这样分的，因此我们需要对数据进行重新整理。在 `singer` 组件中定义了一个 `_normalizeSinger` 方法。将获取到的数据中的前十条作为热门歌手。歌手头像链接是根据 `id` 和字符串拼接来得到到，在热门和字母排序中都会用到，因此我们重新定义了一个 `Singer` 类（common/js/singer.js），用来整理 `id`、`name`、`avatar`，减少代码量。

为了得到有序列表，需要处理 `map`:

```
let hot = []
let ret = []
for(let key in map) {
	let val = map[key]
	if(val.title.match(/[a-zA-Z]/)) {
		ret.push(val)
	} else if(val.title === HOT_NAME) {
		hot.push(val)
	}
}

//按字母作升序 A-Z
ret.sort((a, b) => {
	return a.title.charCodeAt(0) - b.title.charCodeAt(0)
})
return hot.concat(ret)
```

### **歌手组件**

基础组件 `listview`

右侧快速入口 

滑动切换 

左右联动

scroll 组件扩展：

新增 `scrollTo`、`scrollToElement` 方法，滑动右侧定位条时让左侧滚动；
`listenScroll` 属性，用来判断是否让 `srcoll` 组件监听滚动事件，如果 `listenScroll` 为 `true`，则派发一个 `scroll`事件

better-scroll中的probeType
	1：滚动的时候会派发scroll事件，会截流。
	2：滚动的时候实时派发scroll事件，不会截流。
	3：除了实时派发scroll事件，在swipe的情况下仍然能实时派发scroll事件

滚动时固定标题

添加loading效果