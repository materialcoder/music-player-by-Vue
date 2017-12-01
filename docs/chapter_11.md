# 用户个人中心页

首先在 components 目录下新建一个 user-center 组件，基本结构：

```vue
// user-center.vue
<template>
	<transition name="slide">
		<div class="user-center">
			<div class="back">
				<i class="icon-back"></i>
			</div>
			<div class="switches-wrapper">
				
			</div>
			<div class="play-btn" ref="playBtn">
				<i class="icon-play"></i>
				<span class="text">随机播放全部</span>
			</div>
			<div class="list-wrapper" ref="listWrapper"></div>
		</div>
	</transition>
</template>
<style scoped lang="stylus" rel="stylesheet/stylus">
	@import "~common/stylus/variable"
	
	.user-center
		position fixed
		top 0px
		bottom 0px
		z-index 100
		width 100%
		background $color-background
		&.slide-enter-active, &.slide-leave-active
			transition all 0.3s
		&.slide-enter, &.slide-leave-to
			transform translate3d(100%, 0, 0)
		.back
			position absolute
			top 0px
			left 6px
			z-index 50
			.icon-back
				display block
				padding 10px
				font-size $font-size-large-x
				color $color-theme
		.switches-wrapper
			margin 10px 0 30px 0
		.play-btn
			box-sizing border-box
			width 135px
			padding 7px 0
			margin 0 auto
			text-align-last value
			border 1px solid $color-text-l
			color $color-text-l
			border-radius 100px
			font-size 0
			.icon-play
				display inline-block
				vertical-align middle
				margin-right 6px
				font-size $font-size-medium-x
			.text
				display inline-block
				vertical-align middle
				font-size $font-size-small
		.list-wrapper
			position absolute
			top 110px
			bottom 0px
			width 100%
			.list-scroll
				height 100%
				overflow hidden
				.list-inner
					padding 20px 30px
		.no-result-wrapper
			position absolute
			width 100%
			top 50%
			transform translateY(-50%)	
</style>
```

user-center 组件也是作为一个路由组件，在点击用户图标的时候进行跳转，首先在 m-header 里面加入一个入口：

```vue
// m-header.vue
<template>
  <div class="m-header">
    <div class="icon"></div>
    <router-link to="/user" class="mine" tag="div">
      <i class="icon-mine"></i>
    </router-link>
  </div>
</template>
```

然后配置路由：

```javascript
// router/index.js
...
import UserCenter from 'components/user-center/user-center'
...
{
	path: '/user',
	component: UserCenter
}
...
```

接下来在 user-center 中加入 switch 组件：

```vue
// user-center.vue
...
<div class="switches-wrapper">
	<switches @switch="switchItem" :currentIndex="currentIndex" :switches="switches"></switches>
</div>
...
import Switches from 'base/switches/switches'
export default {
	data() {
		return {
			currentIndex: 0,
			switches: [
				{name: '我喜欢的'},
				{name: '最近听的'}
			]
		}
	},
	methods: {
		switchItem(index) {
			this.currentIndex = index
		}
	},
	components: {
		Switches
	}
}
```

### 收藏列表

收藏列表的数据也是在多个组件中要共用的，因此我们还是通过 vuex 来存取：

```javascript
// state.js
import {loadSearch, loadPlay, loadFavorite} from 'common/js/cache'

const state = {
  ...
  favoriteList: loadFavorite()
}
```

```javascript
// mutation-types.js
...
export const SET_FAVORITE_LIST = 'SET_FAVORITE_LIST'
```

```javascript
// mutations.js
const mutations = {
  ...
  [types.SET_FAVORITE_LIST](state, list) {
    state.favoriteList = list
  }
}
```

```javascript
// getter.js
...
export const favoriteList = state => state.favoriteList
```

```javascript
// cache.js
...
const FAVORITE_KEY = '__favorite__'
const FAVORITE_MAX_LENGTH = 200
...

export function saveFavorite(song) {
  let songs = storage.get(FAVORITE_KEY, [])

  insertArray(songs, song, (item) => {
    return song.id === item.id
  }, FAVORITE_MAX_LENGTH)

  storage.set(FAVORITE_KEY, songs)
  return songs
}

export function deleteFavorite(song) {
  let songs = storage.get(FAVORITE_KEY, [])

  deleteFromArray(songs, (item) => {
    return item.id === song.id
  })

  storage.set(FAVORITE_KEY, songs)
  return songs
}

export function loadFavorite() {
  return storage.get(FAVORITE_KEY, [])
}
```

```javascript
// actions.js
...
import {saveSearch, deleteSearch, clearSearch, savePlay, saveFavorite, deleteFavorite} from 'common/js/cache'
...

export const saveFavoriteList = function({commit}, song) {
  commit(types.SET_FAVORITE_LIST, saveFavorite(song))
}

export const deleteFavoriteList = function({commit}, song) {
  commit(types.SET_FAVORITE_LIST, deleteFavorite(song))
}
```

收藏功能在播放器和播放列表中都有，这里的逻辑是可以复用的，因此我们还是在 mixin 中来定义：

```vue
// player.vue
<div class="operators">
	...
	<div class="icon i-right">
		<i class="icon" @click="toggleFavorite(currentSong)" :class="getFavoriteIcon(currentSong)"></i>
	</div>
</div>
```

```javascript
// mixin.js
...

export const playerMixin = {
  computed: {
    ...
    ...mapGetters([
      ...
      'favoriteList'
    ])
  },
  methods: {
    ...
    getFavoriteIcon(song) {
      if (this.isFavorite(song)) {
        return 'icon-favorite'
      }
      return 'icon-not-favorite'
    },
    toggleFavorite(song) {
      if (this.isFavorite(song)) {
        this.deleteFavoriteList(song)
      } else {
        this.saveFavoriteList(song)
      }
    },
    isFavorite(song) {
      const index = this.favoriteList.findIndex((item) => {
        return item.id === song.id
      })
      return index > -1
    },
    ...
    ...mapActions([
      'saveFavoriteList',
      'deleteFavoriteList'
    ])
  }
}

...
```

在 playlist 中也是一样的：

```vue
// playlist.vue
...
<span @click.stop="toggleFavorite(item)" class="like">
  <i :class="getFavoriteIcon(item)"></i>
</span>
...
```

接下来我们在用户中心将收藏列表和播放列表渲染出来：

```vue
// user-center.vue
...
<div class="list-wrapper" ref="listWrapper">
	<scroll ref="favoriteList" v-if="currentIndex === 0" :data="favoriteList" class="list-scroll">
		<div class="list-inner">favoriteList
			<song-list :songs="" @select="selectSong"></song-list>
		</div>
	</scroll>
	<scroll ref="playList" class="list-scroll" v-if="currentIndex === 1" :data="playHistory">
		<div class="list-inner">
			<song-list :songs="playHistory" @select="selectSong"></song-list>
		</div>
	</scroll>
</div>
...

import {mapGetters, mapActions} from 'vuex'
import SongList from 'base/song-list/song-list'
import Scroll from 'base/scroll/scroll'
import Song from 'common/js/song'

export default {
	...
	computed: {
		...mapGetters([
			'favoriteList',
			'playHistory'
		])
	},
	methods: {
		...
		selectSong(song) {
			this.insertSong(new Song(song))
		},
		...mapActions([
			'insertSong'
		])
	},
	components: {
		Switches,
		Scroll,
		SongList
	}
}
```

### 其他功能

**返回功能**

```vue
// user-center.vue
...
<div class="back" @click="back">
	<i class="icon-back"></i>
</div>
...
methods: {
	...
	back() {
		this.$router.back()
	},
	...
},
```

**随机播放按钮**

```vue
// user-center.vue
...
<div class="play-btn" ref="playBtn" @click="random">
	<i class="icon-play"></i>
	<span class="text">随机播放全部</span>
</div>
...
methods: {
	...
	random() {
		let list = this.currentIndex === 0 ? this.favoriteList : this.playHistory
		list = list.map((song) => {
			return new Song(song)
		})
		this.randomPlay({list})
	},
	...mapActions([
		'insertSong',
		'randomPlay'
	])
},
...
```

**滚动列表与底部高度自适应**

这个与前面一样，已经做过很多次了：

```vue
...
import {playListMixin} from 'common/js/mixin'
...
export default {
	mixins: [playListMixin],
	...
	methods: {
		handlePlaylist(playlist) {
			const bottom = playlist.length > 0 ? '60px' : ''
			this.$refs.listWrapper.style.bottom = bottom
			this.$refs.favoriteList && this.$refs.favoriteList.refresh()
			this.$refs.playList && this.$refs.playList.refresh()
		},
		...
	}
}
```

**当列表中没有内容的时候**

我们给它加入一个 no-result 组件：

```vue
// user-center.vue
...
<div class="no-result-wrapper" v-show="noResult">
	<no-result :title="noResultDesc"></no-result>
</div>
...
import NoResult from 'base/no-result/no-result'
...
computed: {
	noResult() {
		if(this.currentIndex === 0) {
			return !this.favoriteList.length
		} else {
			return !this.playList.length
		}
	},
	noResultDesc() {
		if(this.currentIndex === 0) {
			return '暂无收藏歌曲'
		} else {
			return '你还没有听过歌曲'
		}
	},
	...
},
methods: {
	...
	random() {
		let list = this.currentIndex === 0 ? this.favoriteList : this.playHistory
		// 列表中没有内容的时候，点击随机播放列表无效
		if(list.length === 0) {
			return
		}
		list = list.map((song) => {
			return new Song(song)
		})
		this.randomPlay({list})
	},
	...
},
...
```