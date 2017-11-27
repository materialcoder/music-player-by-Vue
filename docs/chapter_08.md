# 排行榜页面

### **数据抓取**

在 `api` 目录下新建一个 `rank.js` ：

```javascript
import jsonp from 'common/js/jsonp'
import {commonParams, options} from './config'

export function getTopList() {
  const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg'

  const data = Object.assign({}, commonParams, {
    platform: 'h5',
    needNewCode: 1
  })

  return jsonp(url, data, options)
}
```

### **排行榜单首页结构**

这个页面结构比较简单，就不多讲了。同样这里要引入 `mixin` , 通过判断 `playlist` 是否存在来调整页面的底部距离。

```vue
<template>
  <div class="rank" ref="rank">
		<scroll :data="topList" class="toplist" ref="topList">
			<ul>
				<li class="item" v-for="item in topList">
					<div class="icon">
						<img width="100%" height="100%" v-lazy="item.picUrl">
					</div>
					<ul class="songlist">
						<li class="song" v-for="(song, index) in item.songList">
							<span>{{index+1}}</span>
							<span>{{song.songname}} - {{song.singername}}</span>
						</li>
					</ul>
				</li>
			</ul>
			<div class="loading-container" v-show="!topList.length">
				<loading></loading>
			</div>
		</scroll>
  </div>
</template>

<script type="ecmascript-6">
  import {getTopList} from 'api/rank'
  import {ERR_OK} from 'api/config'
  import Scroll from 'base/scroll/scroll'
  import Loading from 'base/loading/loading'
  import {playListMixin} from 'common/js/mixin'

  export default{
  	mixins: [playListMixin],
  	data() {
			return {
				topList: []
			}
  	},
		created() {
			this._getTopList()
		},
		methods: {
			handlePlaylist(playlist) {
				const bottom = playlist.length ? '60px' : 0
				this.$refs.rank.style.bottom = bottom
				this.$refs.topList.refresh()
			},
			_getTopList() {
				getTopList().then((res) => {
					if(res.code === ERR_OK) {
						this.topList = res.data.topList
					}
				})
			}
		},
		components: {
			Scroll,
			Loading
		}
  }
</script>
```

### **榜单详情页**

在 base 目录下新建一个 `top-list` 组件，它和 `music-list` 组件是相似的，因此这里我们会对 `music-list` 组件进行复用：

```vue
// top-list.vue
<template>
	<transition name="slide">
		<music-list></music-list>
	</transition>
</template>
```

在排行榜页进行点击时候跳转到详情页，因此这里也需要到 rank 下去设置一个子路由：

```javascript
// router/index.js
import TopList from 'components/top-list/top-list'
...
{
  path: '/rank',
  component: Rank,
  children: [
    {
      path: ':id',
      component: TopList
    }
  ]
},
...
```

然后到 `rank` 组件下添加 `router-view` 和点击事件进行路由跳转，同样这里组件间的数据传递我们要用到 `vuex`。与前面的步骤一样，首先要添加一个 `state` :

```javascript
// store/state.js
const state = {
  ...
  topList: []
}
```

然后添加一个 `mutation-type` :

```javascript
// store/mutation-types.js
...
export const SET_TOP_LIST = 'SET_TOP_LIST'
```

添加 `mutation` :

```javascript
// store/mutations.js
const mutations = {
  ...
  [types.SET_TOP_LIST](state, topList) {
    state.topList = topList
  }
}
```

添加一个 `getter` :

```javascript
// store/getters.js
...
export const topList = state => state.topList
```

到此 `vuex` 设置结束。

然后在 `rank` 组件中，在点击跳转的同时提交这个 `mutation` :

```vue
// rank.vue
<template>
  <div class="rank" ref="rank">
		<scroll :data="topList" class="toplist" ref="topList">
			<ul>
				<li class="item" v-for="item in topList" @click="selectItem(item)">
					...
				</li>
			</ul>
			...
		</scroll>
		<router-view></router-view>
  </div>
</template>

<script type="ecmascript-6">
  //...
  import {mapMutations} from 'vuex'

  export default{
  	//...
		methods: {
			//...
			selectItem(item) {
				this.$router.push({
					path: `/rank/${item.id}`
				})
				this.setTopList(item)
			},
			//...
			...mapMutations({
				setTopList: 'SET_TOP_LIST'
			})
		},
		//...
  }
</script>
```

然后我们就可以在 top-list 组件中通过 mapGetters 来获取到传递过来的数据了：

```vue
// top-list.vue
<template>
	<transition name="slide">
		<music-list :title="title" :bgImage="bgImage"></music-list>
	</transition>
</template>

<script type="ecmascript-6">
	import MusicList from 'components/music-list/music-list'
	import {mapGetters} from 'vuex'

	export default {
		computed: {
			title() {
				return this.topList.topTitle
			},
			bgImage() {
				return this.topList.picUrl
			},
			...mapGetters([
				'topList'
			])
		},
		components: {
			MusicList
		}
	}
</script>
```

### **榜单详情页数据抓取**

在 api/rank.js 中加入一个 MusicList 方法，用来获取榜单详情列表：

```javascript
// api/rank.js
...
export function getMusicList(topid) {
  const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg'

  const data = Object.assign({}, commonParams, {
    format: 'json',
    platform: 'h5',
    needNewCode: 1,
    tpl: 3,
    page: 'detail',
    type: 'top',
    topid
  })

  return jsonp(url, data, options)
}
```

然后在 top-list 组件中去调用该方法获得歌曲列表并传递给 music-list 组件来呈现：

```vue
// top-list.vue

<template>
	<transition name="slide">
		<music-list :title="title" :bgImage="bgImage" :songs="songs"></music-list>
	</transition>
</template>

<script type="ecmascript-6">
	...
	import {getMusicList} from 'api/rank'
	import {ERR_OK} from 'api/config'
	import {createSong} from 'common/js/song'

	export default {
		data() {
			return {
				songs: []
			}
		},
		...
		created() {
			this._getMusciList()
		},
		methods: {
			_getMusciList() {
				getMusicList(this.topList.id).then((res) => {
					if(res.code === ERR_OK) {
						this.songs = this._normalizeSongs(res.songlist)
					}
				})
			},
			_normalizeSongs(list) {
				const ret = []
				list.forEach((item) => {
					const musicData = item.data
					if(musicData.songid && musicData.albummid) {
						ret.push(createSong(musicData))
					}
				})
				return ret
			}
		},
		...
	}
</script>
```

到这里出现了一个问题，之前播放歌曲的 URL 地址用在排行榜单的歌曲上永不了，因此又要重新去找歌曲的播放地址，经过一番周折终于找到了，大致是下面的形式：

`http://dl.stream.qqmusic.qq.com/C400${songmid}.m4a?vkey=${vkey}&guid=${guid}&uin=0&fromtag=66`

这里主要需要去获取三个参数：songmid, vkey, guid

vkey 相对来比较麻烦，它是利用 songmid 和 guid 到另外一个接口去获取的，songmid 在得到的歌曲信息里可以直接拿到， guid 是通过下面的一段代码来计算得到的：

```javascript
Math.round(2147483647 * Math.random()) * ((new Date()).getUTCMilliseconds()) % 1e10
```

为了拿到 vkey 的值，我们 api/song.js 中定义了一个 getVkey 的方法：

```javascript
// api/song.js
...
export function getVkey(songmid, guid) {
  const url = 'https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg'

  const data = Object.assign({}, commonParams, {
    'format': 'json',
    'cid': 205361747,
    songmid,
    'filename': 'C400' + songmid + '.m4a',
    guid,
    platform: 'yqq',
    needNewCode: 0
  })

  return jsonp(url, data, {
    param: 'callback'
  })
}
```

歌曲的播放地址是每一首歌都必须需要的，因此我们在 Song 类下定义了一个 getUrl 方法，用来获取歌曲播放地址：

```javascript
// common/js/song.js
import {getLyric, getVkey} from 'api/song'
import {ERR_OK} from 'api/config'
import {Base64} from 'js-base64'

export default class Song {
  constructor({id, mid, singer, name, album, duration, image}) {
    this.id = id
    this.mid = mid
    this.singer = singer
    this.name = name
    this.album = album
    this.duration = duration
    this.image = image
  }
  ...
  getUrl() {
    if (this.url) {
      return Promise.resolve(this.url)
    }
    return new Promise((resolve, reject) => {
      const guid = Math.round(2147483647 * Math.random()) * ((new Date()).getUTCMilliseconds()) % 1e10
      getVkey(this.mid, guid).then((res) => {
        if (res.code === ERR_OK) {
          const vkey = res.data.items[0].vkey
          this.url = `http://dl.stream.qqmusic.qq.com/C400${this.mid}.m4a?vkey=${vkey}&guid=${guid}&uin=0&fromtag=66`
          resolve(this.url)
        } else {
          reject(new Error('can not find the play url'))
        }
      })
    })
  }
}
```

之后我们需要到 player 播放器组件下进行相应修改：

```vue
// player.vue
<script type="ecmascript-6">
	...
	export default {
		...
		watch: {
			currentSong(newSong, oldSong) {
				if(newSong.id === oldSong.id) {
					return
				}
				if(this.currentLyric) {
					this.currentLyric.stop()
				}
				this.currentSong.getUrl() // 在播放前调用获取地址
				setTimeout(() => {
					this.$refs.audio.play()
					this.getLyric()
				}, 1000)
			},
			...
		},
		...
	}
</script>
```

到这里我们把歌曲的播放地址重新做了修改。

接下来我们还想对排行榜的歌曲列表样式做一点修改：加一个排名图标，这个在其他列表中没有。因此我们要在 song-list 中做一些修改：

```vue
<template>
	<div class="song-list">
		<ul>
			<li @click="selectItem(song,index)" v-for="(song,index) in songs" class="item">
				<div class="rank" v-show="rank">
					<span :class="getRankCls(index)">{{getRankText(index)}}</span>
				</div>
				...
			</li>
		</ul>
	</div>
</template>

<script type="ecmascript-6">
	export default {
		props: {
			songs: {
				type: Array,
				default: []
			},
			// 添加了一个属性用来判断是否需要加排名图标，默认为false，不显示
			rank: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			...
			getRankCls(index) {
				if(index <= 2) {
					return `icon icon${index}`
				} else {
					return `text`
				}
			},
			getRankText(index) {
				if(index > 2) {
					return index + 1
				}
			}
		}
	}
</script>
```

在 music-list 组件中调用了 song-list 组件，因此要在 music-list 组件中传入 rank 属性：

```vue
// music-list
...
<div class="song-list-wrapper">
	<song-list @select="selectItem" :songs="songs" :rank="rank"></song-list>
</div>
...

props: {
	...
	// 默认也是不显示
	rank: {
		type: Boolean,
		default: false
	}
},
...
```

最后在调用到 music-list 的组件中，如果需要显示排名图标，则传入rank属性为true，这里我们在top-list 组件中需要显示排名图标，所以：

```vue
// top-list.vue
<template>
	<transition name="slide">
		<music-list :title="title" :bgImage="bgImage" :songs="songs" :rank="rank"></music-list>
	</transition>
</template>

...
data() {
	return {
		songs: [],
		rank: true // 显示图标
	}
},
...
```

到此为止，排行榜组件完成了。