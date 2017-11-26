# 播放器页面开发


整体效果图：

![](http://img.blog.csdn.net/20171126192116487?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

### **播放器Vuex数据设计**

首先要定义 `state`:

```javascript
// state.js
import {PLAY_MODE} from 'common/js/config'
const state = {
  singer: {},
  playing: false, //是否正在播放
  fullScreen: false, //是否全屏
  playList: [], //播放列表
  sequenceList: [], //顺序列表
  mode: PLAY_MODE.sequence, //播放模式，包括顺序、随机和单曲
  currentIndex: -1 //当前播放歌曲的索引
}
```

这里我们在 `js/config.js` 中配置了一个 `PLAY_MODE` 常量，后面会用到一些常量的时候也会在该文件中进行配置。

```javascript
//config.js
export const PLAY_MODE = {
  sequence: 0, //顺序播放
  loop: 1, //单曲循环播放
  random: 2 //随机播放
}
```

然后将这些 `state` 映射到 `getter` 中：

```javascript
//getter.js
export const playing = state => state.playing

export const fullScreen = state => state.fullScreen

export const playList = state => state.playList

export const sequenceList = state => state.sequenceList

export const mode = state => state.mode

export const currentIndex = state => state.currentIndex

// 当前播放歌曲是通过播放列表和当前播放歌曲索引来得到
export const currentSong = (state) => {
  return state.playList[state.currentIndex] || {}
}
```

然后来定义 `mutation-types` (有哪些动作):

```javascript
// mutation-types.js
export const SET_PLAYING_STATE = 'SET_PLAYING_STATE'

export const SET_FULL_SCREEN = 'SET_FULL_SCREEN'

export const SET_PLAY_LIST = 'SET_PLAY_LIST'

export const SET_SEQUENCE_LIST = 'SET_SEQUENCE_LIST'

export const SET_PLAY_MODE = 'SET_PLAY_MODE'

export const SET_CURRENT_INDEX = 'SET_CURRENT_INDEX'
```

最后就是写 `mutations` 了(数据修改逻辑,本身就是一些函数):

```javascript
// mutations.js
const mutations = {
  [types.SET_SINGER](state, singer) {
    state.singer = singer
  },
  [types.SET_PLAYING_STATE](state, flag) {
    state.playing = flag
  },
  [types.SET_FULL_SCREEN](state, flag) {
    state.fullScreen = flag
  },
  [types.SET_PLAY_LIST](state, list) {
    state.playList = list
  },
  [types.SET_SEQUENCE_LIST](state, list) {
    state.list = list
  },
  [types.SET_PLAY_MODE](state, mode) {
    state.mode = mode
  },
  [types.SET_CURRENT_INDEX](state, index) {
    state.currentIndex = index
  }
}
```

### **播放器组件**

`components/player/player.vue`

`player` 要在任何路由下都能实现播放，因此我们把它放到`App.vue`中去。

```vue
// player.vue
<template>
	<div class="player" v-show="playList.length>0">
		<div class="normal-player" v-show="fullScreen">播放器</div>
		<div class="mini-player" v-show="!fullScreen"></div>
	</div>
</template>

<script type="ecmascript-6">
	import {mapGetters} from 'vuex'
	export default {
		computed: {
			...mapGetters([
				'fullScreen',
				'playList',
				'currentSong'
			])
		}
	}
</script>
```

`Player` 要在播放列表中有歌曲的时候才能显示，同时通过 `fullScreen` 来控制是否全屏显示。因此我们需要在 `vuex` 中得到这两个值。通过 `mapGetters`.

当我们点击歌曲名称是要跳转到播放器并且开始播放。因此，首先我们需要到 `song-list` 组件中定义跳转逻辑，由于 `song-list` 是一个基础组件，因此在点击的时候我们让它派发一个 `select` 事件，然后到 `music-list` 组件中去进行监听。

```html
// song-list.vue 在这里我们需要把点击的歌曲信息和它在列表中的索引传过去
<li @click="selectItem(song,index)" v-for="(song,index) in songs" class="item">
	<div class="content">
		<h2 class="name">{{song.name}}</h2>
		<p class="desc">{{getDesc(song)}}</p>
	</div>
</li>
```

```javascript
// 派发一个 select 事件
methods: {
	selectItem(item,index) {
		this.$emit('select', item, index)
	}
}
```

```html
// music-list.vue 监听select事件
<song-list @select="selectItem" :songs="songs"></song-list>
```

在监听到 `select` 事件后我们需要修改 `vuex` 中的一系列状态（显示播放器，让点击的歌曲开始播放等），即要提交多个 `mutation`，这里我们就需要用到 `actions` 了：

```javascript
// store/actions.js
import * as types from './mutation-types'
export const selectPlay = function({commit, state}, {list, index}) {
  commit(types.SET_SEQUENCE_LIST, list)
  commit(types.SET_PLAY_LIST, list) //修改歌曲列表
  commit(types.SET_CURRENT_INDEX, index) //修改当前播放索引
  commit(types.SET_FULL_SCREEN, true) //修改全屏显示
  commit(types.SET_PLAYING_STATE, true) //修改为开始播放
}
```

与 `mapMutations` 一样，vuex 也提供了一个 `mapActions` 的辅助函数：

```
// music-list.vue
import {mapActions} from 'vuex'

methods: {
	...mapActions([
		'selectPlay'
	])
}
```

最后是在点击的时候执行 `selectPlay` 方法：

```
// music-list.vue
methods: {
	selectItem(item, index) {
		this.selectPlay({
			list: this.songs, //获取到的详细歌曲列表
			index //点击时传送过来的索引
		})
	},
}
```

### **播放器组件样式开发**

包括两个，一个是 `normal-player`，一个是 `mini-player`

在点击返回按钮的时候将全屏播放器收起，也就是要将 `fullScreen` 设为 `false`，这里我们不能够直接设置 `this.fullScreen = false` ，而是要在 `mutation` 中去更改。在点击小播放器的时候进去到大播放器也是同理将 `fullScreen` 改为 `true` 即可。

```
// player.vue
...
<div class="back" @click="back">
	<i class="icon-back"></i>
</div>
...
<div class="mini-player" @click="open" v-show="!fullScreen">
	...
</div>
...

methods: {
	back() {
		this.setFullScreen(false)
	},
	open() {
		this.setFullScreen(true)
	},
	...mapMutations({
		setFullScreen: 'SET_FULL_SCREEN'
	})
}
```

给大小播放器切换的时候添加动画，分别给 normal-player 和 mini-player 外套一层 transition ，name 分别为 normal 和 mini，在定义相应的样式即可：

```
<transition name="normal">
	<div class="normal-player" v-show="fullScreen">...</div>
</transition>
<transition name="mini">
	<div class="mini-player" @click="open" v-show="!fullScreen">...</div>
</transition>
```

```
...
.normal-player
	....
	&.normal-enter-active, &.normal-leave-active
		transition all .4s
		.top, .bottom
			transition all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)
	&.normal-enter, &.normal-leave-to
		opacity 0
		.top
			transform translate3d(0, -100px, 0)
		.bottom
			transform translate3d(0, 100px, 0)
	...
.mini-player
	...
	&.mini-enter-active, &.mini-leave-active
		transition all .4s
	&.mini-enter, &.mini-leave-to
		opacity 0
	...
```

**添加更加炫酷的动画**

利用JS来动态地写CSS3 动画 `create-keyframe-animation`：
https://github.com/HenrikJoreteg/create-keyframe-animation

在normal上面添加动画钩子：

```
<transition name="normal"
			@enter="enter"
			@after-enter="afterEnter"
			@leave="leave"
			@after-leave="afterLeave"
>
	<div class="normal-player" v-show="fullScreen">...</div>
</transition>
```

写动画函数：

```
import animations from 'create-keyframe-animation'
...
methods: {
	...
	enter(el, done) {
		const {x,y,scale} = this._getPosAndScale()

		let animation = {
			0: {
				transform: `translate3d(${x}px, ${y}px,0) scale(${scale})`
			},
			60: {
				transform: `translate3d(0, 0, 0) scale(1.1)`
			},
			100: {
				transform: `translate3d(0, 0, 0) scale(1)`
			}
		}
		animations.registerAnimation({
			name: 'move',
			animation,
			presets: {
				duration: 400,
				easing: 'linear'
			}
		})
		animations.runAnimation(this.$refs.cdWrapper, 'move', done)
	},
	afterEnter() {
		animations.unregisterAnimation('move')
		this.$refs.cdWrapper.style.animation = ''
	},
	leave(el, done) {
		this.$refs.cdWrapper.style.transition = 'all 0.4s'
		const {x,y,scale} = this._getPosAndScale()
		this.$refs.cdWrapper.style[transform] = `translate3d(${x}px, ${y}px,0) scale(${scale})`
		this.$refs.cdWrapper.addEventListener('transitionend', done)
	},
	afterLeave() {
		this.$refs.cdWrapper.style.transition = ''
		this.$refs.cdWrapper.style[transform] = ''
	},

	// 获得动画起始位置之间的距离和放大倍数
	_getPosAndScale() {
		const targetWidth = 40
		const paddingLeft = 40
		const paddingBottom = 30
		const paddingTop = 80
		const width = window.innerWidth * 0.8
		const scale = targetWidth / width
		const x = -(window.innerWidth/2 - paddingLeft)
		const y = window.innerHeight - paddingTop - width/2 - paddingBottom
		return {
			x,
			y,
			scale
		}
	}
	...
}
```

### **歌曲播放功能实现**

**播放/暂停**

首先引入 `audio` 标签，通过监听 `currentSong` 的变化来实现歌曲播放：

```
<div class="player">
	...
	<audio ref="audio" :src="currentSong.url"></audio>
</div>
```

```
...
watch: {
	currentSong() {
		this.$nextStick(()=>{
			this.$refs.audio.play()
		})
	}
}
...
```

当我们点击播放/暂停按钮的时候也要来控制歌曲的播放状态。
首先通过 `mapGetters` 来得到 `playing` 状态，然后通过 `mapMutations` 将 `SET_PLAYING_STATE` 映射到 `this.setPlayingState` 上, 当点击播放/暂停按钮时来调用 `this.setPlayingState` 从而改变播放状态：

```
...
computed: {
	...
	...mapGetters([
		'fullScreen',
		'playList',
		'currentSong',
		'playing' //添加 playing
	])
	...
}
...
methods: {
	...
	toggelPlaying() {
		this.setPlayingState(!this.playing)
	},
	...mapMutations({
		setFullScreen: 'SET_FULL_SCREEN',
		setPlayingState: 'SET_PLAYING_STATE' //
	})
	...
}
...
```

然后通过监听 `this.playing` 的值来控制播放，更改相应的 `class` 从而更改图标的显示和cd旋转等。

```
...
computed: {
	...
	cdCls() {
		return this.playing ? 'play' : 'play pause'
	},
	playIcon() {
		return this.playing ? 'icon-pause' : 'icon-play'
	},
	miniIcon() {
		return this.playing ? 'icon-pause-mini' : 'icon-play-mini'
	},
	...
}
...
watch: {
	...
	playing(newPlaying) {
		const audio = this.$refs.audio
		this.$nextTick(() => {
			newPlaying ? audio.play() : audio.pause()
		})
	}
}
...
```

**上一曲/下一曲**

点击上一曲下一曲的时候通过改变 `currentIndex` 从而改变 `currentSong` 来实现切换歌曲。因此我们需要通过 `mapGetters` 来拿到 `currentIndex`, 通过 `mapMutations` 来讲SET_CURRENT_INDEX映射到 `this.setCurrentIndex` 上（同上）。

```
// 这里DOM上绑定事件的代码就省略了
...
methods: {
	data() {
		return {
			songReady: false //标识位，用来判断歌曲是否可以播放了，防止快速点击上一曲/下一曲时报错
		}
	},
	...
	next() {
		//如果歌曲不能播放，直接返回
		if(!this.songReady) {
			return
		}
		let index = this.currentIndex + 1
		if(index === this.playList.length) {
			index = 0
		}
		this.setCurrentIndex(index)

		// 当在暂停状态点击下一曲时，currentSong改变了，因此会开始播放。但是this.playing的值没有改变，因此播放按钮的状态没有改变，所以这里需要再调用一次this.toggelPlaying()
		if(!this.playing) {
			this.toggelPlaying()
		}
		this.songReady = false //切换到下一曲后，将songReady重置为false
	},
	prev() {
		if(!this.songReady) {
			return
		}
		let index = this.currentIndex - 1
		if(index === -1) {
			index = this.playList.length - 1
		}
		this.setCurrentIndex(index)
		if(!this.playing) {
			this.toggelPlaying()
		}
		this.songReady = false
	},
	//当歌曲可以播放时会触发audio的ready事件，此时将this.songReady改为 true
	ready() {
		this.songReady = true
	},
	// 没有网络或歌曲链接错误时触发
	error() {

	}
	...
}

```

**播放进度条**

播放时间和总时间

当前播放时间可以通过监听 `audio` 的 `timeupdate` 时间来得到：

```
<audio ref="audio" :src="currentSong.url" @canplay="ready" @error="error" @timeupdate="updateTime"></audio>
```

```
...
data() {
	return {
		songReady: false,
		currentTime: 0
	}
},
...
methods: {
	...
	updateTime(e) {
		this.currentTime = e.target.currentTime
	},
	...
}
...
```

而总时间是在 `currentSong.duration` 里面保存的，可以直接获取。

但是获得的时间都是以秒为单位的，需要对它们进行一个格式化：

```
...
methods: {
	...
	// 将秒分割为 分:秒 的形式
	format(interval) {
		interval = interval | 0
		const minute = interval / 60 | 0
		const second = this._pad(interval % 60)
		return `${minute}:${second}`
	},
	// 秒数小于10的在前面补0 即 1:9 -> 1:09
	_pad(num, n=2) {
		let len = num.toString().length
		while(len < n) {
			num = '0' + num
			len++
		}
		return num
	},
	...
}
...
```

进度条组件

进度条组件是一个基础组件：`base/progress-bar/progress-bar.vue`

它主要是根据传入的 `percent` 属性来改变进度条和进度条按钮的宽度：

```
// progress-bar.vue
...
props: {
	percent: {
		type: Number,
		default: 0
	}
},
watch: {
	percent(newPercent) {
		if(newPercent >= 0) {
			const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth
			const offsetWidth = newPercent * barWidth
			this.$refs.progress.style.width = `${offsetWidth}px`
			this.$refs.progressBtn.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
		}
	}
}
```

然后在 `player` 组件中引入 `progress-bar` 组件并传入 `percent` 属性，这里的 `percent` 是通过当前播放时间和总时间相除得到的：

```
// player.vue
...
computed: {
	...
	percent() {
		return this.currentTime / this.currentSong.duration
	},
	...
},
...
```

进度条组件拖拽和点击功能

拖拽是通过 `touch` 事件来获得拖动的距离，从而计算 `offsetWidth`，进而改变 `percent` 的值来改变 `progress` 的长度和 `progressBtn` 的位置, 但是由于我们并没有真正地修改 `percent` 的值，当我们松开后，进度条又会弹回去，因此我们需要派发一个事件给到父组件来真正修改 `percent` 的值。

```
...
<div class="progress-btn-wrapper" ref="progressBtn"
	 @touchstart="progressTouchStart"
	 @touchmove="progressTouchMove"
	 @touchend="progressTouchEnd"
>
...
</div>
...

...
created() {
	this.touch = {} // 用来存储拖动过程中的一些数据
},
methods: {
	progressTouchStart(e) {
		this.touch.initiated = true // 标志touch开始
		this.touch.startX = e.touches[0].pageX // touch时的x坐标
		this.touch.left = this.$refs.progress.clientWidth // touch时的进度条宽度
	},
	progressTouchMove(e) {
		if(!this.touch.initiated) {
			return
		}
		const deltaX = e.touches[0].pageX - this.touch.startX // 拖动的距离
		const offsetWidth = Math.min(this.$refs.progressBar.clientWidth - progressBtnWidth, Math.max(0, this.touch.left + deltaX)) // 拖动过程中的进度条宽度
		this._offset(offsetWidth) // 设置进度条宽度和progressBtn的位置
	},
	progressTouchEnd() {
		this.touch.initiated = false // 标志touch结束
		this._triggerPercent() // 触发修改percent的事件，由于这是一个基础组件，事物处理要交给它的父组件来进行
	},
	// 事件触发函数
	_triggerPercent() {
		const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth
		const percent = this.$refs.progress.clientWidth / barWidth //计算percent的值
		this.$emit('percentChange', percent) // 触发一个percentChange事件，并把percent的值传递过去
	},
	// 抽象出来的设置进度条宽度和progressBtn的位置的方法，减少重复代码
	_offset(offsetWidth) {
		this.$refs.progress.style.width = `${offsetWidth}px`
		this.$refs.progressBtn.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
	}
},
...
```

然后我们在父组件中来监听 `percentChange` 事件，并修改歌曲的播放进度：

```
// player.vue
...
<progress-bar :percent="percent" @percentChange="onProgressBarChange"></progress-bar>
...

...
methods: {
	...
	onProgressBarChange(percent) {
		this.$refs.audio.currentTime = percent * this.currentSong.duration
		// 在暂停状态下，拖动之后要开始播放
		if(!this.playing) {
			this.toggelPlaying()
		}
	},
	...
}
...

```

点击功能的话相对来说就比较简单了，直接在 `progressBar` 上绑定一个点击事件即可：
```
...
<div class="progress-bar" ref="progressBar" @click="progressClick">
...
</div>
...

...
methods: {
	...
	progressClick(e) {
		const rect = this.$refs.progressBar.getBoundingClientRect()
		const offsetWidth = e.pageX - rect.left
		this._offset(offsetWidth)
		this._triggerPercent()
	},
	...
}
...
```


**圆形进度条**

它也是一个基础组件： `base/progress-circle/progress-circle.vue`

利用 `svg` 画出的两个小圆圈，将 `percent` 属性传入即可：

```
// progress-circle.vue
<template>
	<div class="progress-circle">
		<svg :width="radius" :height="radius" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">
			<circle class="progress-background" r="50" cx="50" cy="50" fill="transparent"></circle>
			<circle class="progress-bar" r="50" cx="50" cy="50" fill="transparent" :stroke-dasharray="dashArray" :stroke-dashoffset="dashOffset"></circle>
		</svg>
		<slot></slot>
	</div>
</template>

<script type="ecmascript-6">
	export default {
		props: {
			radius: {
				type: Number,
				default: 100
			},
			percent: {
				type: Number,
				default: 0
			}
		},
		data() {
			return {
				dashArray: Math.PI * 100
			}
		},
		computed: {
			dashOffset() {
				return (1 - this.percent) * this.dashArray
			}
		}
	}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
	@import "~common/stylus/variable"
	
	.progress-circle
		position relative
		circle
			stroke-width 8px
			transform-origin center
			&.progress-background
				transform scale(0.9)
				stroke $color-theme-d
			&.progress-bar
				transform scale(0.9) rotate(-90deg)
				stroke $color-theme
</style>
```

**播放模式切换**

首先当我们点击的时候，播放模式的图标要切换，可以用一个计算属性来实现：

```
...
computed: {
	...
	iconMode() {
		return this.mode === PLAY_MODE.sequence ? 'icon-sequence' : this.mode === PLAY_MODE.loop ? 'icon-loop' : 'icon-random'
	},
	...
}
...
```

同时要给播放模式图标绑定一个点击事件，在点击的时候改变 `playMode`:
```
<div class="icon i-left" @click="changeMode">
	<i :class="iconMode"></i>
</div>
```

这里我们就又要用到vuex了，首先要通过 `mapGetters` 来拿到 `mode` 这个状态，然后通过 `mapMutations` 来将 `SET_PLAY_MODE` 这个 `mutation` 映射到 `this.setPlayMode` 上：

```
...
computed: {
	...
	...mapGetters([
		...
		'mode'
	])
	...
}
...

...
methods: {
	...
	changeMode() {
		const mode = (this.mode + 1) % 3
		this.setPlayMode(mode)
	}
	...
	...mapMutations({
		...
		setPlayMode: 'SET_PLAY_MODE'
	})
	...
}
...
```

当 `mode` 为 `random` 的时候，我们需要对当前的播放列表进行打乱，这里我们在 `common/js` 下新创建了一个 `util.js`，用来存放需要用到的一些工具函数，在里面定义了一个 `shuffle` 函数，用来对给定的数组进行打乱操作，这个方法也是比较常见的：

```
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffle(arr) {
  for (let i = 0; i < arr.length; i++) {
    let j = getRandomInt(0, i)
    let t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}
```

这里同样我们需要通过 `mapGetters` 来拿到 `sequenceList` , 通过 `mapMutations` 来拿到 `SET_PLAY_LIST` , 为了不让切换播放模式后，当前播放歌曲也更改，这里需要在打乱的列表里找到当前播放歌曲的 `index`，并将它设为 `currentIndex`。
```
...
methods: {
	...
	changeMode() {
		const mode = (this.mode + 1) % 3
		this.setPlayMode(mode)

		let list = null

		if(mode === PLAY_MODE.random) {
			list = shuffle(this.sequenceList)
		} else {
			list = this.sequenceList
		}
		this.resetCurrentIndex(list)
		this.setPlayList(list)
	},
	resetCurrentIndex(list) {
		let index = list.findIndex((item) => {
			return item.id === this.currentSong.id
		})
		this.setCurrentIndex(index)
	},
	...
}
...
```

我们是通过监听 `currentSong` 的变化来实现歌曲播放的，而在切换播放模式的时候，`currentSong` 也是有变化的，只是还是变成的当前歌曲，因此为了避免在暂停状态下点击切换播放模式的时候歌曲又开始播放了，我们需要在监听 `currentSong` 的变化的时候做一个设定，即变化后的歌曲与之前的歌曲是同一首歌的时候，直接返回：

```
...
watch: {
	currentSong(newSong, oldSong) {
		if(newSong.id === oldSong.id) {
			return
		}
		this.$nextTick(() => {
			this.$refs.audio.play()
		})
	},
	...
},
...
```

当我们点击随机播放全部歌曲的时候，也要能让歌曲能够随机开始播放：

```
// music-list.vue

...
<div class="play-wrapper">
	<div class="play" v-show="songs.length>0" ref="playBtn" @click="random">
		<i class="icon-play"></i>
		<span class="text">随机播放全部</span>
	</div>
</div>
...
```

与前面的 selectPlay 一样，这里我们要去定义一个 randomPlay 的action：

```
// actions.js
...
import {PLAY_MODE} from 'common/js/config'
import {shuffle} from 'common/js/util'

...

export const randomPlay = function({commit}, {list}) {
  commit(types.SET_PLAY_MODE, PLAY_MODE.random)
  commit(types.SET_SEQUENCE_LIST, list)
  let randomList = shuffle(list)
  commit(types.SET_PLAY_LIST, randomList) // 将列表设置为随机列表
  commit(types.SET_CURRENT_INDEX, 0)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}
```

此时我们会发现一个问题，当我们在随机播放模式下，去点击歌曲列表里面的歌曲的时候，播放的并不是我们点击的那首歌，那是因为我们点击的时候传递的是顺序列表和索引，而此时列表已经变成了随机列表，所以歌曲就会对应不上，因此我们同样需要在 selectPlay 中进行相应的判断：

```
function findIndex(list, song) {
  return list.findIndex((item) => {
    return item.id === song.id
  })
}

export const selectPlay = function({commit, state}, {list, index}) {
  commit(types.SET_SEQUENCE_LIST, list)
  // 判断播放模式，如果为随机模式则打乱列表
  if (state.mode === PLAY_MODE.random) {
    let randomList = shuffle(list)
    commit(types.SET_PLAY_LIST, randomList)
    index = findIndex(randomList, list[index])
  } else {
    commit(types.SET_PLAY_LIST, list)
  }
  commit(types.SET_CURRENT_INDEX, index)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}
```

这里我们还需要对之前的shuffle函数做一个修改，我们在打乱列表的时候不能对原来的列表产生影响：

```
// util.js
export function shuffle(arr) {
  let _arr = arr.slice() // 对原来的列表作一个拷贝
  for (let i = 0; i < _arr.length; i++) {
    let j = getRandomInt(0, i)
    let t = _arr[i]
    _arr[i] = _arr[j]
    _arr[j] = t
  }
  return _arr
}
```

### **歌曲歌词抓取**

与前面的获取歌曲列表一样，这里获取歌词也需要用到后端代理，首先在 webpack.dev.conf.js 中添加以下代码：

```
...
 before(app) {
  ...
  app.get('/api/getLyric', function (req, res) {
    var url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'
    axios.get(url, {
      headers: {
        referer: 'https://c.y.qq.com/',
        host: 'c.y.qq.com'
      },
      params: req.query
    }).then((response) => {
      var ret = response.data
      // 这里返回的数据是一个JSONP的形式，也就是 callBack({xxxxxx}) 的形式，我们需要拿到的是{}里面的内容，因此这里用正则作了一个匹配
      if(typeof ret === 'string') {
        var reg = /^\w+\(({[^()]+})\)$/
        var matches = ret.match(reg)
        if(matches) {
          ret = JSON.parse(matches[1])
        }
      }
      res.json(ret)
    }).catch((e) => {
      console.log(e)
    })
  })
}
...
```

这里定义好之后，我们同样的在 api 下新建一个 song.js ，并在其中定义一个 getLyric 方法用来获取歌词：

```
// api/song.js
import {commonParams} from './config'
import axios from 'axios'

export function getLyric(mid) {
  const url = '/api/getLyric'

  const data = Object.assign({}, commonParams, {
    songmid: mid,
    pcachetime: +new Date(),
    platform: 'yqq',
    hostUin: 0,
    needNewCode: 0,
    g_tk: 67232076,
    format: 'json'
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data)
  })
}
```

歌词与歌曲的其他信息一样，属于 Song 类，因此我们在 common/js/song.js 中来调用 getLyric 方法获取歌词并保存到Song类中：

```
// common/js/song.js
import {getLyric} from 'api/song'
import {ERR_OK} from 'api/config'

export default class Song {
  constructor({id, mid, singer, name, album, duration, image, url}) {
    this.id = id
    this.mid = mid
    this.singer = singer
    this.name = name
    this.album = album
    this.duration = duration
    this.image = image
    this.url = url
  }
  // 定义一个getLyric 方法获取歌词
  getLyric() {
    getLyric(this.mid).then((res) => {
      if (res.retcode === ERR_OK) {
        this.lyric = res.lyric
        console.log(this.lyric)
      }
    })
  }
}
```

这里拿到的歌词数据是一个base64的字符串，因此我们需要对它进行解码。

这里我们利用一个叫作 js-base64 的插件来进行解码。

首先安装 js-base64：

> npm install --save js-base64

然后在 common/js/song.js 中引入并调用：

```
...
import {Base64} from 'js-base64'

export default class Song {
  ...
  getLyric() {
    getLyric(this.mid).then((res) => {
      if (res.retcode === ERR_OK) {
        this.lyric = Base64.decode(res.lyric) // 这里
        console.log(this.lyric)
      }
    })
  }
}
```

这样我们就可以拿到一个歌词的字符串了，像下面的格式：

![](http://img.blog.csdn.net/20171126141727667?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

我们还需要对得到的这个字符串进行解析，这里用到了一个叫 lyric-parser 的第三方库：

https://github.com/ustbhuangyi/lyric-parser

安装：

> npm install --save lyric-parser

这里我们在对 getLyric 做一些改造：

```
...
getLyric() {
	// 如果歌词已经存在的话就直接返回，不再去请求后端
  if (this.lyric) {
    return Promise.resolve(this.lyric)
  }
  return new Promise((resolve, reject) => {
    getLyric(this.mid).then((res) => {
      if (res.retcode === ERR_OK) {
        this.lyric = Base64.decode(res.lyric)
        resolve(this.lyric)
      } else {
        reject(new Error('no lyric'))
      }
    })
  })
}
...
```

然后我们就可以到 player.vue 中去调用这个 getLyric 方法了：

```
//player.vue
...
import Lyric from 'lyric-parser'

...
methods: {
	...
	getLyric() {
		this.currentSong.getLyric().then((lyric) => {
			this.currentLyric = new Lyric(lyric)
			console.log(this.currentLyric)
		})
	},
	...
}
...

watch: {
	currentSong(newSong, oldSong) {
		if(newSong.id === oldSong.id) {
			return
		}
		this.$nextTick(() => {
			this.$refs.audio.play()
			this.getLyric() // 获取歌词 
		})
	},
	...
},
...
```

### **歌词列表组件**

首先在 player.vue 中加入歌词列表的部分，并让它可滚动：

```
...
<div class="middle">
	...
	<scroll :scrollBar="false" :data="currentLyric && currentLyric.lines" class="middle-r" ref="lyricList">
		<div class="lyric-wrapper">
			<div v-if="currentLyric">
				<p :class="{'current': currentLineNum === index}" ref="lyricLine" class="text" v-for="(line, index) in currentLyric.lines">{{line.txt}}</p>
			</div>
		</div>
	</scroll>
</div>
...
```

```
...
getLyric() {
	this.currentSong.getLyric().then((lyric) => {
		this.currentLyric = new Lyric(lyric, this.handleLyric) // 加上handler
		// 如果实在播放状态，则让歌词滚动
		if(this.playing) {
			this.currentLyric.play()
		}
	})
},

handleLyric({lineNum, txt}) {
	this.currentLineNum = lineNum

	// 保证当前播放的歌词始终保持在屏幕中间
	if(lineNum > 5) {
		let lineEl = this.$refs.lyricLine[lineNum - 5]
		this.$refs.lyricList.scrollToElement(lineEl, 1000)
	} else {
		this.$refs.lyricList.scrollToElement(0, 0, 1000)
	}
},
...
```

### **歌词左右滑动功能**

歌词与CD层布局关系如图所示：

![](http://img.blog.csdn.net/20171126165505149?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

与前面的 progress-bar 进度条组件一样，这里我们在 `middle` 上绑定 touch 事件，通过计算滑动的距离来平移歌词页从而控制 cd 层和 lyric 层的切换：

```
...
<div class="middle" @touchstart.prevent="middleTouchStart"
				@touchmove.prevent="middleTouchMove"
				@touchend="middleTouchEnd">
	<div class="middle-l" ref="middleL">
		<div class="cd-wrapper" ref="cdWrapper">
			<div class="cd" :class="cdCls">
				<img class="image" :src="currentSong.image">
			</div>
		</div>
	</div>
	<scroll :scrollBar="false" :data="currentLyric && currentLyric.lines" class="middle-r" ref="lyricList">
		<div class="lyric-wrapper">
			<div v-if="currentLyric">
				<p :class="{'current': currentLineNum === index}" ref="lyricLine" class="text" v-for="(line, index) in currentLyric.lines">{{line.txt}}</p>
			</div>
		</div>
	</scroll>
</div>
<div class="bottom">
	<div class="dot-wrapper">
		<span class="dot" :class="{'active':currentShow === 'cd'}"></span>
		<span class="dot" :class="{'active':currentShow === 'lyric'}"></span>
	</div>
	...
</div>
...
```

在 data 里面定义了一个 currentShow 用来控制点的样式。

```
...
middleTouchStart(e) {
	this.touch.initiated = true
	const touch = e.touches[0]
	this.touch.startX = touch.pageX
	this.touch.startY = touch.pageY
},
middleTouchMove(e) {
	if(!this.touch.initiated) {
		return
	}
	const touch = e.touches[0]
	const deltaX = touch.pageX - this.touch.startX
	const deltaY = touch.pageY - this.touch.startY
	// 由于在歌词页我们要可以上下滚动歌词，因此当上下滑动的时候，不切换
	if(Math.abs(deltaY) > Math.abs(deltaX)) {
		return
	}

	const left = this.currentShow === 'cd' ? 0 : -window.innerWidth
	const offsetWidth = Math.min(Math.max(-window.innerWidth, left + deltaX), 0)
	this.touch.percent = Math.abs(offsetWidth/window.innerWidth)
	this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)` // lyricList 是绑定在 scroll组件上的，只能在它的 $el 上设置属性
	this.$refs.lyricList.$el.style[transitionDuration] = 0
	this.$refs.middleL.style.opacity = 1 - this.touch.percent
	this.$refs.middleL.style[transitionDuration] = 0
},
middleTouchEnd() {
	let offsetWidth
	let opacity
	if(this.currentShow === 'cd') {
		// 从右到左滑动到大于屏幕宽度10%的时候，直接切换
		if(this.touch.percent > 0.1) {
			offsetWidth = -window.innerWidth
			opacity = 0
			this.currentShow = 'lyric'
		} else {
			offsetWidth = 0
			opacity = 1
		}
	} else {
		if(this.touch.percent < 0.9) {
			offsetWidth = 0
			this.currentShow = 'cd'
			opacity = 1
		} else {
			offsetWidth = -window.innerWidth
			opacity = 0
		}
	}
	const time = 300
	this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
	this.$refs.lyricList.$el.style[transitionDuration] = `${time}ms`
	this.$refs.middleL.style.opacity = opacity
	this.$refs.middleL.style[transitionDuration] = `${time}ms`
},
...
```

### **优化及BUG处理**

**在转动的CD下加上当前播放的歌词**

```
...
<div class="middle-l" ref="middleL">
	...
	<div class="play-lyric-wrapper">
		<div class="playing-lyric">{{playingLyric}}</div>
	</div>
</div>
...

data() {
	return {
		songReady: false,
		currentTime: 0,
		radius: 32,
		currentLyric: null,
		currentLineNum: 0,
		currentShow: 'cd',
		playingLyric: '' // 添加
	}
},
...

handleLyric({lineNum, txt}) {
	this.currentLineNum = lineNum
	if(lineNum > 5) {
		let lineEl = this.$refs.lyricLine[lineNum - 5]
		this.$refs.lyricList.scrollToElement(lineEl, 1000)
	} else {
		this.$refs.lyricList.scrollToElement(0, 0, 1000)
	}
	this.playingLyric = txt // 这里
},
...
```

**暂停后歌词还在滚动**

在toggelPlaying下加上一个判断：

```
toggelPlaying() {
	if(!this.songReady) {
		return
	}
	this.setPlayingState(!this.playing)
	// 如果有歌词，则调用Lyric的togglePlay()方法
	if(this.currentLyric) {
		this.currentLyric.togglePlay()
	}
},
```

**拖动进度条时歌词不会跟着变化**

```
onProgressBarChange(percent) {
	const currentTime = percent * this.currentSong.duration
	this.$refs.audio.currentTime = currentTime
	if(!this.playing) {
		this.toggelPlaying()
	}
	// 如果有歌词，拖动进度条后定位到当前播放时间
	if(this.currentLyric) {
		this.currentLyric.seek(currentTime * 1000)
	}
},
```

**循环播放时歌曲跳转后歌词不会从头开始**

同样的我们也要loop()中加上上面的判断：

```
loop() {
	this.$refs.audio.currentTime = 0
	this.$refs.audio.play()
	if(this.currentLyric) {
		this.currentLyric.seek(0)
	}
},
```


**当歌曲切换到下一曲的时候回出现歌词闪跳**

我们需要在切换到下一首的时候，将当前歌词stop掉：

```
watch: {
	currentSong(newSong, oldSong) {
		if(newSong.id === oldSong.id) {
			return
		}
		// 调用 Lyric 的 stop 方法
		if(this.currentLyric) {
			this.currentLyric.stop()
		}
		setTimeout(() => {
			this.$refs.audio.play()
			this.getLyric()
		}, 1000)
	},
	...
},
```


**当歌曲列表中只有一首歌时，歌曲不会切换**

在监听currentSong的时候我们有判断歌曲的id是否有变化，当只有一首歌的时候，歌的id不会变，因此就不会自动切换播放。解决这个也很简单，我们只需判断当只有一首歌的时候调用循环播放即可：

```
next() {
	if(!this.songReady) {
		return
	}
	if(this.playList.length === 1) { // 判断列表长度
		this.loop()
	} else {
		let index = this.currentIndex + 1
		if(index === this.playList.length) {
			index = 0
		}
		this.setCurrentIndex(index)
		if(!this.playing) {
			this.toggelPlaying()
		}
	}
	
	this.songReady = false
},
prev() {
	if(!this.songReady) {
		return
	}
	if(this.playList.length === 1) { // 判断列表长度
		this.loop()
	} else {
		let index = this.currentIndex - 1
		if(index === -1) {
			index = this.playList.length - 1
		}
		this.setCurrentIndex(index)
		if(!this.playing) {
			this.toggelPlaying()
		}
	}
	this.songReady = false
},
```

**当获取歌词错误或没有歌词时**

我们也要进行相应的错误处理：

```
getLyric() {
	this.currentSong.getLyric().then((lyric) => {
		this.currentLyric = new Lyric(lyric, this.handleLyric)
		if(this.playing) {
			this.currentLyric.play()
		}
	}).catch(() => { // 获取歌词错误或没有歌词时
		this.currentLyric = null
		this.playingLyric = ''
		this.currentLineNum = 0
	})
},
```

**底部的小型播放器会遮挡住列表**

这个在所有页面里几乎都有出现，而且都是和scroll组件相关。这里我们只需要作相应的判断：当playList存在的时候，我们让scroll的bottom值为小播放器的高度即可。

由于在多个组件中都会用到这样的方法，因此这里我们用到了一个叫作 mixin 的方法。

我们在 `common/js` 下新建一个 `mixin.js` ,它其实就是一段公用的代码，在其他组件可以重复调用：

```
// mixin.js
import {mapGetters} from 'vuex'
export const playListMixin = {
  computed: {
    ...mapGetters([
      'playList'
    ])
  },
  mounted() {
    this.handlePlaylist(this.playList)
  },
  activated() {
    this.handlePlaylist(this.playList)
  },
  watch: {
    playList(newVal) {
      this.handlePlaylist(newVal)
    }
  },
  methods: {
  	// 这个方法必须要到组件中去定义，否则就抛出异常
    handlePlaylist() {
      throw new Error('component must implement handlePlaylist method')
    }
  }
}
```

我们需要到 `music-list`, `singer`, `recommend` 组件中去做相应的修改：

```
// music-list.vue
...
import {playListMixin} from 'common/js/mixin'

...
export default {
	mixins: [playListMixin],
	...
	methods: {
		handlePlaylist(playList) {
			const bottom = playList.length > 0 ? '60px' : ''
			this.$refs.list.$el.style.bottom = bottom // 设置bottom值为mini播放器的高度
			this.$refs.list.refresh() // scroll组件的refresh方法
		},
		...
	}
}
```

`recommen` 组件如上面类似。

`singer` 组件调用了 `listview` 组件，因此需要在 `listview` 组件中设置一个 `refresh` 方法，它是调用 `scroll` 组件的方法：

```
//listview.vue
methods: {
	...
	refresh() {
		this.$refs.ListView.refresh()
	},
	...
}
```

```
//singer.vue
<div class="singer" ref="singer">
	<list-view @select="selectSinger" :data="singers" ref="list"></list-view>
	<router-view></router-view>
</div>

...
import {playListMixin} from 'common/js/mixin'

...
export default {
	mixins: [playListMixin],
	...
	methods: {
		handlePlaylist(playList) {
			const bottom = playList.length > 0 ? '60px' : ''
			this.$refs.singer.style.bottom = bottom
			this.$refs.list.refresh()
		},
		...
	}
}
```

<-- 完结 -->