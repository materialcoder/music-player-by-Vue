# 播放列表组件

最终效果图：

![](http://img.blog.csdn.net/20171130210053672?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![](http://img.blog.csdn.net/20171130210105260?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![](http://img.blog.csdn.net/20171130210115272?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![](http://img.blog.csdn.net/20171130210125599?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

### 基本样式

我们通过定义一个 showFlag 标识位来控制播放列表的显示和隐藏，并在 show 和 hide 方法中来控制 showFlag 的值，当点击列表外面以及关闭按钮的时候调用 hide 方法，让列表隐藏。


```vue
// playlist.vue
<template>
  <transition name="list-fade">
    <div class="playlist" v-show="showFlag" @click="hide">
      <div class="list-wrapper" @click.stop> <!-- 点击内博的时候禁止冒泡 -->
        <div class="list-header">
          <h1 class="title">
            <i class="icon"></i>
            <span class="text"></span>
            <span class="clear"><i class="icon-clear"></i></span>
          </h1>
        </div>
        <div class="list-content">
          <ul>
            <li class="item">
              <i class="current"></i>
              <span class="text"></span>
              <span class="like">
                <i class="icon-not-favorite"></i>
              </span>
              <span class="delete">
                <i class="icon-delete"></i>
              </span>
            </li>
          </ul>
        </div>
        <div class="list-operate">
          <div class="add">
            <i class="icon-add"></i>
            <span class="text">添加歌曲到队列</span>
          </div>
        </div>
        <div class="list-close" @click="hide">
          <span>关闭</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="ecmascript-6">
	export default {
    data() {
      return {
        showFlag: false
      }
    },
    methods: {
      show() {
        this.showFlag = true
      },
      hide() {
        this.showFlag = false
      }
    }
  }
</script>
```

然后我们在 Player 组件中引用该组件，并在点击播放列表图标的时候让列表显示出来：

```vue
// player.vue
...
<transition name="mini">
  <div class="mini-player" @click="open" v-show="!fullScreen">
    ...
    <div class="control" @click.stop="showPlaylist">
      <i class="icon-playlist"></i>
    </div>
  </div>
</transition>
<playlist ref="playlist"></playlist>
...

methods: {
  ...
  showPlaylist() {
    this.$refs.playlist.show()
  },
  ...
}
...
```

### 播放列表展示

接下来我们要从 vuex 中获得播放列表数据，并将它展示出来：

```vue
// playlist.vue
...
<li ref="listItem" class="item" v-for="(item, index) in sequenceList">
  <i class="current"></i>
  <span class="text">{{item.name}}</span>
  <span class="like">
    <i class="icon-not-favorite"></i>
  </span>
  <span class="delete">
    <i class="icon-delete"></i>
  </span>
</li>
...
import {mapGetters} from 'vuex'
...

computed: {
  ...mapGetters([
    'sequenceList'
  ])
},
...
```

播放列表内容很多的时候要可滚动显示，因此我们引入了 scroll 组件，对于当前播放歌曲，我们给它添加了一个播放图标，同时将正在播放的歌曲始终显示在顶部：

```vue
// playlist.vue
<scroll ref="listContent" :data="sequenceList" class="list-content">
  <ul>
    <li ref="listItem" class="item" v-for="(item, index) in sequenceList">
      <i class="current" :class="getCurrentIcon(item)"></i>
      ...
    </li>
  </ul>
</scroll>
...
computed: {
  ...mapGetters([
    'sequenceList',
    'currentSong'
  ])
},
methods: {
  show() {
    this.showFlag = true
    setTimeout(() => {
      this.$refs.listContent.refresh()
      this.scrollToCurrent(this.currentSong)
    }, 20)
  },
  ...
  getCurrentIcon(item) {
    if (this.currentSong.id === item.id) {
      return 'icon-play'
    }
    return ''
  },
  scrollToCurrent(current) {
    const index = this.sequenceList.findIndex((song) => {
      return song.id === current.id
    })
    this.$refs.listContent.scrollToElement(this.$refs.listItem[index], 300)
  },
},
watch: {
  currentSong(newSong, oldSong) {
    if(!this.showFlag || newSong.id === oldSong.id) {
      return
    }
    this.scrollToCurrent(newSong)
  }
},
...
```

同时点击列表中的歌曲时要跳转到播放器并开始播放歌曲，这里我们通过在 item 上绑定 click 事件，然后修改当前播放歌曲即可：

```vue
// playlist.vue
...
<scroll ref="listContent" :data="sequenceList" class="list-content">
  <ul>
    <li ref="listItem" class="item" v-for="(item, index) in sequenceList" @click="selecteItem(item, index)">
      ...
    </li>
  </ul>
</scroll>
...

computed: {
  ...mapGetters([
    'sequenceList',
    'currentSong',
    'mode',
    'playList'
  ])
},
methods: {
  ...
  selecteItem(item, index) {
    if(this.mode === PLAY_MODE.random) {
      index = this.playList.findIndex((song) => {
        return song.id === item.id
      })
    }
    this.setCurrentIndex(index)
    this.setPlayingState(true)
  },
  ...
  ...mapMutations({
    'setCurrentIndex': 'SET_CURRENT_INDEX',
    'setPlayingState': 'SET_PLAYING_STATE'
  })
},
...
```

点击删除按钮的时候要删除播放列表中的歌曲，这里我们要用到 actions 来进行操作：

```javascript
// actions.js
export const deleteSong = function({commit, state}, song) {
  let playList = state.playList.slice()
  let sequenceList = state.sequenceList.slice()
  let currentIndex = state.currentIndex
  let pIndex = findIndex(playList, song)
  playList.splice(pIndex, 1)
  let sIndex = findIndex(sequenceList, song)
  sequenceList.splice(sIndex, 1)
  
  // 删除的是当前歌曲的前面的歌曲，或者删除的是当前歌曲且当前歌曲是最后一首的时候，要让 currentIndex--
  if (currentIndex > pIndex || currentIndex === playList.length) {
    currentIndex--
  }

  commit(types.SET_PLAY_LIST, playList)
  commit(types.SET_SEQUENCE_LIST, sequenceList)
  commit(types.SET_CURRENT_INDEX, currentIndex)

  // 如果当前列表中歌曲被删完了要让播放状态停止，否则自动播放前一曲
  if (!playList.length) {
    commit(types.SET_PLAYING_STATE, false)
  } else {
    commit(types.SET_PLAYING_STATE, true)
  }
}
```

```vue
// playlist.vue
...
<span class="delete" @click.stop="deleteOne(item)">
  <i class="icon-delete"></i>
</span>
...

deleteOne(item) {
  this.deleteSong(item)
  // 当播放列表为空的时候，让它隐藏
  if(!this.playList.length) {
    this.hide()
  }
},
...
...mapActions([
  'deleteSong'
])
...
```

当我们删除最后一首歌的时候，我们监听到的 currentSong 中的 newSong 为空，这是去获取 newSong.id 获取不到，就会报错，我们需要在 player 中去做一点修改：

```vue
// player.vue
...
watch: {
  currentSong(newSong, oldSong) {
    // 当找不到 newSong.id 时直接返回
    if(!newSong.id || newSong.id === oldSong.id) {
      return
    }
    ...
  },
  ...
},
```

这里我们给删除增加一点动画效果，这里我们使用了 vue 自带的 transition-group 来实现，它和 transition 很类似，它这里除了 name 属性还要添加一个 tag 属性，说明是一个什么样的标签，同时它里面的内容要添加一个唯一的 key 属性：

```vue
// playlist.vue
<scroll ref="listContent" :data="sequenceList" class="list-content">
  <transition-group name="list" tag="ul">
    <li :key="item.id" ref="listItem" class="item" v-for="(item, index) in sequenceList" @click="selecteItem(item, index)">
      ...
    </li>
  </transition-group>
</scroll>
...
&.list-enter-active, &.list-leave-active
  transition all 0.1s
&.list-enter, &.list-leave-to
  height 0
...
```

### 清除列表功能

在清空播放列表的时候，同样我们需要给用户一个确认提示。这里我们在 playlist 组件中引入 confirm 组件，并在点击清空按钮后，清空播放列表，这里播放列表的清空同样是利用了 vuex 来进行：

```vue
// playlist.vue
<transition name="list-fade">
  <div class="playlist" v-show="showFlag" @click="hide">
    <div class="list-wrapper" @click.stop>
      <div class="list-header">
        <h1 class="title">
          ..
          <span class="clear" @click="showConfirm"><i class="icon-clear"></i></span>
        </h1>
      </div>
      ...
    </div>
    <confirm ref="confirm" @confirm="confirmClear" text="是否清空播放列表" confirmBtnText="清空"></confirm>
  </div>
</transition>
...
showConfirm() {
  this.$refs.confirm.show()
},
confirmClear() {
  this.deleteSongList()
  this.hide()
},
...
...mapActions([
  'deleteSong',
  'deleteSongList'
])
```

```javascript
// actions.js
export const deleteSongList = function({commit}) {
  commit(types.SET_PLAY_LIST, [])
  commit(types.SET_CURRENT_INDEX, -1)
  commit(types.SET_SEQUENCE_LIST, [])
  commit(types.SET_PLAYING_STATE, false)
}
```

这里当我们点击 “取消” 按钮的时候，播放列表也会隐藏，这是因为在 confirm 组件中的点击事件冒泡到了播放列表最外层，所以在 confirm 组件中我们要加一个阻止冒泡的行为：

```vue
// confrim.vue
<transition name="confirm-fade">
  <div class="confirm" v-show="showFlag" @click.stop>
    ...
  </div>
</transition>
```

### 播放模式切换

切换播放模式在播放器组件里已经实现过了，而且在 player 组件和 playlist 组件中有很多 getters 和 mutations 都是重复的，因此这里我们还是抽象出一个 mixin 出来，也就是找出两个组件中共用的代码，在这两个组件中进行复用：

```javascript
// mixin.js
import {mapGetters, mapMutations} from 'vuex'
import {shuffle} from 'common/js/util'
...
export const playerMixin = {
  computed: {
    iconMode() {
      return this.mode === PLAY_MODE.sequence ? 'icon-sequence' : this.mode === PLAY_MODE.loop ? 'icon-loop' : 'icon-random'
    },
    ...mapGetters([
      'sequenceList',
      'currentSong',
      'mode',
      'playList'
    ])
  },
  methods: {
    changeMode() {
      const mode = (this.mode + 1) % 3
      this.setPlayMode(mode)

      let list = null

      if (mode === PLAY_MODE.random) {
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
    ...mapMutations({
      setPlayingState: 'SET_PLAYING_STATE',
      setCurrentIndex: 'SET_CURRENT_INDEX',
      setPlayMode: 'SET_PLAY_MODE',
      setPlayList: 'SET_PLAY_LIST'
    })
  }
}
```

然后在 player 组件中引入 playerMixin 就可以删除掉这些公共的代码了。

然后我们在 playlist 组件中也引入 playerMixin，删除掉 mapGetters 和 mapMutations 中的公共部分，然后给 mode 图标绑定上点击事件即可：

```vue
// playlist.vue
...
<div class="list-header">
  <h1 class="title">
    <i class="icon" :class="iconMode" @click="changeMode"></i>
    <span class="text">{{modeText}}</span>
    ...
  </h1>
</div>
...
computed: {
  modeText() {
    return this.mode === PLAY_MODE.random ? '随机播放' : this.mode === PLAY_MODE.sequence ? '顺序播放' : '单曲循环'
  }
},
...
```

### 添加歌曲到列表

首先我们来添加一个 add-song 组件，当我们点击“添加歌曲到列表”时显示该组件，在点击关闭按钮的时候隐藏：

```vue
// add-song.vue
<template>
  <transition name="slide">
    <div class="add-song" v-show="showFlag" @click.stop> <!-- 阻止冒泡 -->
      <div class="header">
        <h1 class="title">添加歌曲到列表</h1>
        <div class="close" @click="hide">
          <i class="icon-close"></i>
        </div> 
      </div>
      <div class="search-box-wrapper"></div>
      <div class="shortcut"></div>
      <div class="search-result"></div>
    </div>
  </transition>
</template>
<script type="ecmascript-6">
  export default {
    data() {
      return {
        showFlag: false
      }
    },
    methods: {
      show() {
        this.showFlag = true
      },
      hide() {
        this.showFlag = false
      }
    }
  }
</script>
```

```vue
// playlist.vue
<transition name="list-fade">
  <div class="playlist" v-show="showFlag" @click="hide">
    <div class="list-wrapper" @click.stop>
      ...
      <div class="list-operate">
        <div class="add" @click="addSong">
          <i class="icon-add"></i>
          <span class="text">添加歌曲到队列</span>
        </div>
      </div>
      ...
    </div>
    ...
    <add-song ref="addSong"></add-song>
  </div>
</transition>
...
addSong() {
  this.$refs.addSong.show()
},
...
```

在添加歌曲组件里也要用到搜素框和搜索结果组件，这里我们把这两个组件引入：

```vue
// add-song.vue
<div class="search-box-wrapper">
  <search-box placeholder="搜索歌曲" @query="search"></search-box>
</div>
<div class="shortcut" v-show="!query"></div>
<div class="search-result" v-show="query">
  <suggest :query="query" :showSinger="showSinger"></suggest>
</div>
...

<script type="ecmascript-6">
  import SearchBox from 'base/search-box/search-box'
  import Suggest from 'components/suggest/suggest'
  export default {
    data() {
      return {
        showFlag: false,
        query: '',
        showSinger: false
      }
    },
    methods: {
      ...
      search(query) {
        this.query = query
      }
    },
    components: {
      SearchBox,
      Suggest
    }
  }
</script>
```

这里我们发现在 search 组件和 add-song 组将中其实有很多逻辑处理也是相同的。因此这里我们还是采用 mixin 的方法来减少代码量：

```javascript
// mixin.js
...
export const searchMixin = {
  data() {
    return {
      query: ''
    }
  },
  computed: {
    ...mapGetters([
      'searchHistory'
    ])
  },
  methods: {
    onQueryChange(query) {
      this.query = query
    },
    blurInput() {
      this.$refs.searchBox.blur()
    },
    addQuery(query) {
      this.$refs.searchBox.setQuery(query)
    },
    saveSearch() {
      this.saveSearchHistory(this.query)
    },
    ...mapActions([
      'deleteSearchHistory',
      'saveSearchHistory'
    ])
  }
}
```

然后将 search 组件和 add-song 组件中重复的部分删除，并引入 searchMixin 即可。

在点击搜索结果的时候进行 saveSearch 操作：

```vue
// add-song.vue
...
<div class="search-box-wrapper">
  <search-box placeholder="搜索歌曲" @query="onQueryChange"></search-box>
</div>
<div class="shortcut" v-show="!query"></div>
<div class="search-result" v-show="query">
  <suggest :query="query" :showSinger="showSinger" @select="selectSuggest" @listScroll="blurInput"></suggest>
</div>
...

methods: {
  ...
  selectSuggest() {
    this.saveSearch()
  }
},
```

### 切换组件(Switches)

由于在很多地方都会用到这个组件，因此把它也作为一个基础组件。

```vue
// base/switches/switches.vue
<template>
  <ul class="switches">
    <li class="switch-item" v-for="(item, index) in switches" :class="{'active' : currentIndex === index}" @click="switchItem(index)">
      <span>{{item.name}}</span>
    </li>
  </ul>
</template>

<script type="ecmascript-6">
  export default {
    props: {
      switches: {
        type: Array,
        default: []
      },
      currentIndex: {
        type: Number,
        default: 0
      }
    },
    methods: {
      // 点击的时候向父组件派发一个 switch 事件
      switchItem(index) {
        this.$emit('switch', index)
      }
    }
  }
</script>
```

然后我们在 add-song 组件中引入：

```vue
// add-song
...
<div class="shortcut" v-show="!query">
  <switches @switch="switchItem" :currentIndex="currentIndex" :switches="switches"></switches>
</div>
...

data() {
  return {
    ...
    currentIndex: 0,
    switches: [
      {name: '最近播放'},
      {name: '搜索历史'}
    ]
  }
},
methods: {
  ...
  switchItem(index) {
    this.currentIndex = index
  }
},
```

### 最近播放

这里我们还是要使用 vuex 来进行数据的存取和修改，和前面是一样的套路：

```javascript
// state.js
import {loadSearch, loadPlay} from 'common/js/cache'

const state = {
  ...
  playHistory: loadPlay()
}
```

```javascript
// cache.js
// 获取缓存中的播放历史
export function loadPlay() {
  return storage.get(PLAY_KEY, [])
}
```

```javascript
// mutation-types.js
export const SET_PLAY_HISTORY = 'SET_PLAY_HISTORY'
```

```javascript
// mutations.js
const mutations = {
  ...
  [types.SET_PLAY_HISTORY](state, history) {
    state.playHistory = history
  }
}
```

```javascript
// getters.js
...
export const playHistory = state => state.playHistory
```

播放历史也要保存在本地中，因此这里和前面的搜索历史一样，在 cache.js 中定义一个 savePlay 方法：

```javascript
// cache.js
const PLAY_KEY = '__play__'
const PLAY_MAX_LENGTH = 200
...
export function savePlay(song) {
  let songs = storage.get(PLAY_KEY, [])

  insertArray(songs, song, (item) => {
    return item.id === song.id
  }, PLAY_MAX_LENGTH)

  storage.set(PLAY_KEY, songs)
  return songs
}
```

然后在 vuex 中增加一个 action 用来修改 playList：

```javascript
// actions.js
import {saveSearch, deleteSearch, clearSearch, savePlay} from 'common/js/cache'
...
export const savePlayHistory = function({commit, state}, song) {
  commit(types.SET_PLAY_HISTORY, savePlay(song))
}
```

当我们播放器中的音乐 ready 的时候存储播放记录，因此在 player.vue 中调用 savePlayHistory 方法将当前播放歌曲保存到播放历史中：

```vue
// player.vue
...
methods: {
  ...
  ready() {
    this.songReady = true
    this.savePlayHistory(this.currentSong)
  },
  ...
  ...mapActions([
    'savePlayHistory'
  ])
}
...
```

然后我们在 add-song 组件中通过 mapGetters 就可以拿到播放记录，并通过前面的 song-list 组件展现出来：

```vue
// add-song.vue
...
<div class="shortcut" v-show="!query">
  <switches @switch="switchItem" :currentIndex="currentIndex" :switches="switches"></switches>
  <div class="list-wrapper">
    <scroll v-if="currentIndex===0" :data="playHistory" class="list-scroll">
      <div class="list-inner">
        <song-list :songs="playHistory"></song-list>
      </div>
    </scroll>
  </div>
</div>
...
import {mapGetters} from 'vuex'
import SongList from 'base/song-list/song-list'
...
computed: {
  ...mapGetters([
    'playHistory'
  ])
},
...
```

同时当我们点击播放记录的时候，要将它加入到播放列表中：

```vue
// add-song.vue
<div class="shortcut" v-show="!query">
      ...
        <song-list :songs="playHistory" @select="selectSong"></song-list>
      ...
</div>
...
import {mapGetters, mapActions} from 'vuex'
import Song from 'common/js/song'
...
selectSong(song, index) {
  if(index !== 0) {
    this.insertSong(new Song(song))
  }
},
...mapActions([
  'insertSong'
])
...
```

### 搜索历史

搜索历史记录可以从 mixn 中共享数据里拿到，以及删除和点击搜索都可以和之前 search 组件的共用，这个相对来说比较简单：

```vue
// add-song.vue
...
<div class="shortcut" v-show="!query">
  <switches @switch="switchItem" :currentIndex="currentIndex" :switches="switches"></switches>
  <div class="list-wrapper">
    <scroll ref="songList" v-if="currentIndex === 0" :data="playHistory" class="list-scroll">
      ...
    </scroll>
    <scroll ref="searchList" class="list-scroll" v-if="currentIndex === 1" :data="searchHistory">
      <div class="list-inner">
        <search-list :searches="searchHistory" @delete="deleteSearchHistory" @select="addQuery"></search-list>
      </div>
    </scroll> 
  </div>
</div>
...
```

当我们第一次打开播放历史或者搜索历史页面的时候，这两部分都是无法滚动的，原因和之前一样，我们需要对 scroll 组件进行一次刷新，让它重新获得高度：

```vue
// add-song.vue
...
methods: {
  show() {
    this.showFlag = true
    setTimeout(() => {
      if(this.currentIndex === 0) {
        this.$refs.songList.refresh()
      } else {
        this.$refs.searchList.refresh()
      }
    }, 20)
  },
  ...
}
...
```

另外在搜索历史列表里进行删除操作也是比较生硬的，这里和前面的播放列表一样，我们给它加入一个 transition-group 的过渡动画：

```vue
// search-list.vue
<div class="search-list" v-show="searches.length">
  <transition-group name="list" tag="ul">
    ...
  </transition-group>
</div>
...

.search-item
  ...
  &.list-enter-active, &.list-leave-active
    transition all 0.1s
  &.list-enter, &.list-leave-to
    height 0
```

### 添加歌曲时提示效果

这里我们将它抽象成一个基础组件，因为这个效果在很多场景下都有见到过。定义了一个 delay 属性用来控制显示的事件，向外暴露了两个方法：显示和隐藏。

```vue
// top-tip.vue
<template>
  <transition name="drop">
    <div class="top-tip" v-show="showFlag" @click.stop="hide">
      <slot></slot>
    </div>
  </transition>
</template>

<script type="ecmascript-6">
  export default {
    props: {
      delay: {
        type: Number,
        default: 1500
      }
    },
    data() {
      return {
        showFlag: false
      }
    },
    methods: {
      show() {
        this.showFlag = true
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.hide()
        }, this.delay)
      },
      hide() {
        this.showFlag = false
      }
    }
  }
</script>
```

然后我们在 add-song 组件中进行引用，当我们点击播放记录或者搜索结果中的歌曲时，显示top-tip：

```vue
// add-song.vue
...
<transition name="slide">
  <div class="add-song" v-show="showFlag" @click.stop>
    ...
    <top-tip ref="topTip">
      <div class="tip-title">
        <i class="icon-ok"></i>
        <span class="text">1首歌曲已经添加到播放队列</span>
      </div>
    </top-tip>
  </div>
</transition>
...

selectSuggest() {
  this.saveSearch()
  this.showTip()
},
...
selectSong(song, index) {
  if(index !== 0) {
    this.insertSong(new Song(song))
    this.showTip()
  }
},
showTip() {
  this.$refs.topTip.show()
},
...
```

### 当播放列表到底部的时候，往里面添加歌曲，滚动位置出现问题

这是由于加入了 transition-group 的动画之后，scroll 组件 refresh 时真正的高度没有拿到。其实也很好解决，将 scroll refresh 时间再往后延就可以了。所以这里我们给 scroll 组件增加了一个 delayRefresh 属性，用来在 scroll 组件里有 transition-group 的时候，将刷新时间推迟。这里主要是在 playlist 组件、search-list 组件中有 transition-group ，而 search 组件和 add-song 组件引用了 search-list 组件。因此我们需要在 playlist 组件、 search 组件和 add-song 组件的 scroll 上设置 refreshDelay 属性。