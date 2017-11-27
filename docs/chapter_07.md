# 歌单详情页开发

### **路由配置**

歌单详情页是通过recommend页点击进入的，因此要在recommend路由下设置一个子路由：

```javascript
// router/index.js
...
import Disc from 'components/disc/disc'

{
  path: '/recommend',
  component: Recommend,
  children: [
    {
      path: ':id',
      component: Disc
    }
  ]
},
```

然后在 recommend.vue 中加入 <router-view></router-view> 来承载子路由，并在每个 item 上绑定点击事件，点击时实现路由跳转：

```html
<div class="recommend-list">
  <h1 class="list-title">热门歌曲推荐</h1>
  <ul>
    <li @click="selectItem(item)" v-for="item in discList" class="item">
      <div class="icon">
        <img v-lazy="item.imgurl" width="60" height="60">
      </div>
      <div class="text">
        <h2 class="name" v-html="item.creator.name"></h2>
        <p class="desc" v-html="item.dissname"></p>
      </div>
    </li>
  </ul>
</div>
```

```javascript
methods: {
  ...
  selectItem(item) {
    this.$router.push({
      path: `/recommend/${item.dissid}`
    })
  },
  ...
}
```

这里的数据同样要通过 vuex 来进行传递。首先我们要添加一个 state：

```javascript
// state.js

const state = {
  singer: {},
  playing: false,
  fullScreen: false,
  playList: [],
  sequenceList: [],
  mode: PLAY_MODE.sequence,
  currentIndex: -1,
  disc: [] //添加
}
```

然后添加一个 mutation-type:

```javascript
// mutation-types.js
...
export const SET_DISC = 'SET_DISC'
```

添加一条 mutation :

```javascript
// mutations.js
...
const mutations = {
	...
  [types.SET_DISC](state, disc) {
    state.disc = disc
  }
}
...
```

然后在 recommend.vue 里面利用 mapMutations 将 SET_DISC 映射到 this.setDisc , 并在点击的时候调用它，我们就将数据存入到了 vuex 中，然后在 disc.vue 中利用 mapGetters 就可以拿到 disc 中的数据了：

```vue
// recommend.vue
import {mapMutations} from 'vuex'
...

methods: {
	...
	selectItem(item) {
    this.$router.push({
      path: `/recommend/${item.dissid}`
    })
    this.setDisc(item)
  },
  ...
}
...
```

```vue
// disc.vue
import {mapGetters} from 'vuex'
...

computed: {
	title() {
		return this.disc.dissname
	},
	bgImage() {
		return this.disc.imgurl
	},
	...mapGetters([
		'disc'
	])
},
...
```

### **歌单详情数据抓取**

这里的接口也要用到后端代理，同样先在 webpack.dev.conf.js 中定义接口：

```javascript
...
app.get('/api/getCdInfo', function (req, res) {
  var url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'
  axios.get(url, {
    headers: {
      referer: 'https://y.qq.com/w/taoge.html' // 关键是这个
    },
    params: req.query
  }).then((response) => {
    res.json(response.data)
  }).catch((e) => {
    console.log(e)
  })
})
...
```

然后在 api/recommend.js 中定义获取歌曲的方法：

```javascript
...
export function getSongList(disstid) {
  const url = '/api/getCdInfo'

  const data = Object.assign({}, commonParams, {
    disstid,
    g_tk: 5381,
    uin: 0,
    format: 'json',
    platform: 'h5',
    needNewCode: 1,
    new_format: 1,
    type: 1,
    json: 1,
    utf8: 1,
    onlysong: 0,
    song_begin: 0,
    song_num: 100
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data)
  })
}
```

接下来我们就可以到 disc.vue 中去调用这个方法来获取到歌曲了, 这里的 disc.vue 组件与前面的 music-list.vue 组件完全一样，因此只需要调用它并传入相应的属性即可：

```vue
<template>
	<transition name="slide">
		<music-list :title="title" :bgImage="bgImage" :songs="songs"></music-list>
	</transition>	
</template>

<script type="ecmascript-6">
	import MusicList from 'components/music-list/music-list'
	import {mapGetters} from 'vuex'
	import {getSongList} from 'api/recommend'
	import {ERR_OK} from 'api/config'
	import {createSong} from 'common/js/song'

	export default {
		data() {
			return {
				songs: []
			}
		},
		computed: {
			title() {
				return this.disc.dissname
			},
			bgImage() {
				return this.disc.imgurl
			},
			...mapGetters([
				'disc'
			])
		},
		created() {
			this._getSongList()
		},
		methods: {
			// 获取数据
			_getSongList() {
				if(!this.disc.dissid) {
					this.$router.push('/recommend')
				}
				getSongList(this.disc.dissid).then((res) => {
					if(res.code === ERR_OK) {
						this.songs = this._normalizeSongs(res.cdlist[0].songlist)
					}
				})
			},
			// 整理数据
			_normalizeSongs(list) {
				let ret = []
				list.forEach((item) => {
					const musicData = {
						songid: item.id,
						songmid: item.mid,
						singer: item.singer,
					    songname: item.name,
					    albumname: item.album.name,
					    interval: item.interval,
					    albummid: item.album.mid
					}
					if(musicData.songid && musicData.albummid) {
						ret.push(createSong(musicData))
					}
				})
				return ret
			}
		},
		components: {
			MusicList
		}
	}
</script>
```