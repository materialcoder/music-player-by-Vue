# 搜索页面开发

最终效果图：

![](http://img.blog.csdn.net/20171129215348518?font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

#### search-box 组件开发

它是一个基础组件，在后面的其他组件中也会用到，因此我们在 base 目录下创建该组件：

```vue
<template>
  <div class="search-box">
    <i class="icon-search"></i>
    <input type="text" v-model="query" class="box" :placeholder="placeholder">
    <i @click="clear" v-show="query" class="icon-dismiss"></i>
  </div>
</template>

<script type="ecmascript-6">
  export default {
    props: {
      placeholder: {
        type: String,
        default: '搜索歌曲、歌手'
      }
    },
    data() {
      return {
        query: ''
      }
    },
    methods: {
      clear() {
        this.query = ''
      }
    },
    created() {
      this.$watch('query', (newQuery) => {
        this.$emit('query', newQuery)
      })
    }
  }
</script>
```

这里用到了 v-mode 对 input 输入框进行双向数据绑定，同时对输入框的内容进行监听，当它发生变化的时候向外部派发一个 query 事件。

#### 热门搜索数据抓取

在 api 目录下新建一个 search.js 用来获取搜索页需要的数据：

```javascript
// api/search.js
import jsonp from 'common/js/jsonp'
import {commonParams, options} from './config'

export function getHotKey() {
  const url = 'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg'

  const data = Object.assign({}, commonParams, {
    platform: 'h5',
    needNewCode: 1,
    format: 'json'
  })

  return jsonp(url, data, options)
}
```

然后我们就可以在 search 组件中调用该方法来获取到热搜数据了：

```vue
// search.vue
<template>
  <div class="search">
    <div class="search-box-wrapper">
      <search-box></search-box>
    </div>
    <div class="shortcut-wrapper">
      <div class="shortcut">
        <div class="hot-key">
          <h1 class="title">热门搜索</h1>
          <ul>
            <li v-for="item in hotKey" class="item">
              <span>{{item.k}}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script type="ecmascript-6">
  import SearchBox from 'base/search-box/search-box'
  import {getHotKey} from 'api/search'
  import {ERR_OK} from 'api/config'

  export default {
    created() {
      this._getHotKey()
    },
    data() {
      return {
        hotKey: []
      }
    },
    methods: {
      _getHotKey() {
        getHotKey().then((res) => {
          if(res.code === ERR_OK) {
            this.hotKey = res.data.hotkey.slice(0, 10)
          }
        })
      }
    },
    components: {
      SearchBox
    }
  }
</script>
```

当我们点击热搜关键词的时候，要在搜索框中显示，因此要在每一个搜索词上绑定一个点击事件，同时我们要在 search-box 组件中定义一个 setQuery 方法，用来在点击时调用，将传过来的参数值设定为搜索框中要显示的值：

```vue
// search.vue
<template>
  <div class="search">
    <div class="search-box-wrapper">
      <search-box ref="searchBox"></search-box>
    </div>
    <div class="shortcut-wrapper">
      ...
      <li @click="addQuery(item.k)" v-for="item in hotKey" class="item">
        <span>{{item.k}}</span>
      </li>
      ...
    </div>
  </div>
</template>
...

methods: {
  addQuery(query) {
    this.$refs.searchBox.setQuery(query)
  },
  ...
},
...
```

```vue
// search-box.vue

...
methods: {
  ...
  setQuery(query) {
    this.query = query
  }
},
...
```

接下来我们要实现输入框中输入内容时，从后台进行搜索数据。

### 搜索功能

首先我们要在 api 目录下的 search.js 中定义方法来抓取搜索数据，这里要传入三个参数，分别是搜索关键字（query）、页数（page）、是否显示搜索到的歌手（zhida）：

```javascript
// api/search.js
export function search(query, page, zhida) {
  const url = 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp'

  const data = Object.assign({}, commonParams, {
    w: query,
    p: page,
    catZhida: zhida ? 1 : 0,
    platform: 'h5',
    needNewCode: 1,
    zhidaqu: 1,
    t: 0,
    uin: 0,
    flag: 1,
    ie: 'utf-8',
    sem: 1,
    aggr: 0,
    perpage: 20,
    n: 20,
    remoteplace: 'txt.mqq.all'
  })

  return jsonp(url, data, options)
}
```

然后我们在 components 下新建一个 suggest 组件，用来显示搜索到的数据：

```vue
// suggest.vue
<template>
  <div class="suggest">
    <ul class="suggest-list">
      <li class="suggest-item" v-for="item in result">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text" v-html="getDisplayName(item)"></p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script type="ecmascript-6">
  import {search} from 'api/search'
  import {ERR_OK} from 'api/config'
  import {createSong} from 'common/js/song'

  const TYPE_SINGER = 'singer'

  export default {
    props: {
      query: {
        type: String,
        default: ''
      },
      showSinger: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        page: 1,
        result: []
      }
    },
    methods: {
      // 搜索数据
      search() {
        search(this.query, this.page, this.showSinger).then((res) => {
          if(res.code === ERR_OK) {
            this.result = this._genResult(res.data)
          }
        })
      },
      getIconCls(item) {
        if(item.type === TYPE_SINGER) {
          return 'icon-mine'
        } else {
          return 'icon-music'
        }
      },
      getDisplayName(item) {
        if(item.type === TYPE_SINGER) {
          return item.singername
        } else {
          return `${item.name} - ${item.singer}`
        }
      },
      _genResult(data) {
        let ret = []
        if(data.zhida && data.zhida.singerid) {
          ret.push({...data.zhida, ...{type: TYPE_SINGER}})
        }
        if(data.song) {
          ret = ret.concat(this._normalizeSongs(data.song.list))
        }
        return ret
      },
      _normalizeSongs(list) {
        let ret = []
        list.forEach((musicData) => {
          if(musicData.songid && musicData.albumid) {
            ret.push(createSong(musicData))
          }
        })
        return ret
      }
    },
    watch: {
      // 监听 query 属性的值，当query发生变化的时候，调用search方法进行搜索
      query(newQuery) {
        this.search()
      }
    }
  }
</script>
```

然后我们在 search 组件中引入 suggest 组件，并传入 query 的值。这里 query 的值是通过搜索框中的值拿到的，还记得我们在 search-box 组件中对搜索框中的值进行了监听，当搜索框中的值发生变化的时候，会派发一个 query 事件，并将新的值传递过来，因此我们在 search 组件中可以监听 search-box 组件的query事件，将传递过来的值赋给 this.query，并将这个 query 值给到 suggest 的 query 属性上，而在 suggest 组件中我们又监听了它的 query 属性变化，当 query 变化时就会在 suggest 组件中去调用 search 方法来获得搜索到的数据。这就是整个的搜索逻辑。

```vue
// search.vue
<template>
  <div class="search">
    <div class="search-box-wrapper">
      <search-box ref="searchBox" @query="onQueryChange"></search-box>
    </div>
    <div class="shortcut-wrapper" v-show="!query">
      ...
    </div>
    <div class="search-result-wrapper" v-show="query">
      <suggest :query="query"></suggest>
    </div>
  </div>
</template>

<script type="ecmascript-6">
  ...
  import Suggest from 'components/suggest/suggest'

  export default {
    ...
    data() {
      return {
        hotKey: [],
        query: ''
      }
    },
    methods: {
      ...
      onQueryChange(query) {
        this.query = query
      },
      ...
    },
    components: {
      SearchBox,
      Suggest
    }
  }
</script>
```

### 上拉刷新功能实现

首先我们需要对 scroll 组件进行一个扩展。给它添加一个 pullup 属性，用来判断是否需要实现上拉刷新功能：

```jjavascript
// base/scroll/scroll.vue
props: {
  ...
  pullup: {
    type: Boolean,
    default: false
  }
},
...
methods: {
  _initScroll() {
    ...
    if(this.pullup) {
      // 监听 better-scroll 组件的 scrollEnd 事件
      this.scroll.on('scrollEnd', () => {
        if(this.scroll.y <= (this.scroll.maxScrollY + 50)) {
          this.$emit('scrollToEnd') // 派发一个 scrollToEnd 事件给外部
        }
      })
    }
  },
  ...
}
```

然后我们到 suggest 组件中引入scroll 组件，并且监听 scroll 组件的 scrollToEnd 事件，当滑动到底部的时候调用 searchMore 方法：

```vue
// suggest.vue
<template>
  <scroll class="suggest" :data="result" :pullup="pullup" @scrollToEnd="searchMore"
  ref="suggest">
    <ul class="suggest-list">
      ...
      <loading v-show="hasMore" title=""></loading>
    </ul>
  </scroll>
</template>

<script type="ecmascript-6">
  ...
  import Scroll from 'base/scroll/scroll'
  import Loading from 'base/loading/loading'

  const TYPE_SINGER = 'singer'
  const perpage = 20

  export default {
    ...
    data() {
      return {
        page: 1,
        result: [],
        pullup: true,
        hasMore: true
      }
    },
    methods: {
      search() {
        this.hasMore = true
        this.page = 1
        this.$refs.suggest.scrollTo(0, 0)
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          ...
        })
      },
      // 搜索更多，其实就是增加this.page的值
      searchMore() {
        if(!this.hasMore) {
          return
        }
        this.page++
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          if(res.code === ERR_OK) {
            this.result = this.result.concat(this._genResult(res.data))
            this._checkMore(res.data)
          }
        })
      },
      ...
      // 检查是否还有更多数据
      _checkMore(data) {
        const song = data.song
        if(!song.list.length || (song.curnum + song.curpage*perpage) >= song.totalnum) {
          this.hasMore = false
        }
      },
      _genResult(data) {
        let ret = []
        // 只有在第一页的时候才加入搜索结果中的歌手数据
        if(data.zhida && data.zhida.singerid && this.page === 1) {
          ret.push({...data.zhida, ...{type: TYPE_SINGER}})
        }
        if(data.song) {
          ret = ret.concat(this._normalizeSongs(data.song.list))
        }
        return ret
      },
      ...
    },
    ...
  }
</script>
```

### 点击搜索结果进入相应页面

搜索结果分为两类，一个是歌手，一个是歌曲，当我们点击歌手的时候要进入到歌手详情页，点击歌曲的时候要进入播放页面。

第一个好实现，我们还是采用子路由的方式，给 search 路由下添加一个子路由，跳转到 SingerDetail 组件中：

```javascript
// router/index.js
{
  path: '/search',
  component: Search,
  children: [
    {
      path: ':id',
      component: SingerDetail
    }
  ]
}
```

在点击的时候进行路由跳转，同时要将歌手的信息传递过去，这里我们采用 vuex 来实现：

```vue
// suggest.vue
...
<li @click="selectItem(item)" class="suggest-item" v-for="item in result">
 ...
</li>

...
import Singer from 'common/js/singer'
import {mapMutations} from 'vuex'

...
selectItem(item) {
  if(item.type === TYPE_SINGER) {
    const singer = new Singer({
      id: item.singermid,
      name: item.singername
    })
    this.$router.push({
      path: `/search/${singer.id}`
    })
    this.setSinger(singer)
  }
},
...
...mapMutations({
  setSinger: 'SET_SINGER'
}),
...
```

接下来是点击歌曲会进入到播放器进行播放，这个相对来说比较麻烦。会涉及到一系列的状态改变，因此我们会用到 actions:

```javascript
// actions.js
export const insertSong = function({commit, state}, song) {
  let playList = state.playList.slice() // 不能直接对playList进行修改，因此我们先进行一次浅复制
  let sequenceList = state.sequenceList.slice()
  let currentIndex = state.currentIndex
  // 记录当前歌曲
  let currentSong = playList[currentIndex]
  // 查找当前列表中是否有待插入的歌曲并返回其索引
  let fpIndex = findIndex(playList, song)
  // 因为是插入歌曲，所以索引要加1
  currentIndex++
  playList.splice(currentIndex, 0, song)
  // 如果已经包含了这首歌, 删除掉重复的
  if (fpIndex > -1) {
    // 如果当前插入的序号要大于列表中的序号
    if (currentIndex > fpIndex) {
      playList.splice(fpIndex, 1)
      currentIndex--
    } else {
      playList.splice(fpIndex + 1, 1)
    }
  }

  let currentSIndex = findIndex(sequenceList, currentSong) + 1

  let fsIndex = findIndex(sequenceList, song)

  sequenceList.splice(currentIndex, 0, song)

  if (fsIndex > -1) {
    if (currentSIndex > fsIndex) {
      sequenceList.splice(fsIndex, 1)
    } else {
      sequenceList.splice(fsIndex + 1, 1)
    }
  }

  commit(types.SET_PLAY_LIST, playList)
  commit(types.SET_SEQUENCE_LIST, sequenceList)
  commit(types.SET_CURRENT_INDEX, currentIndex)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}
```

然后在 suggest 组件中点击事件下提交这个action：

```vue
// suggest.vue
...
import {mapMutations, mapActions} from 'vuex'
...
selectItem(item) {
  if(item.type === TYPE_SINGER) {
    ...
  } else {
    this.insertSong(item)
  }

},
...mapActions([
  'insertSong'
])
```

### 优化

**查找不到时**

为了更好的用户体验，当搜索不到结果的时候，我们给用户一个提示。这里我们写了一个 no-result 基础组件来实现这个任务：

```vue
// base/no-result
<template>
  <div class="no-result">
    <div class="no-result-icon"></div>
    <p class="no-result-text">{{title}}</p>
  </div>
</template>

<script type="ecmascript-6">
  export default {
    props: {
      title: {
        type: String,
        default: ''
      }
    }
  }
</script>
```

然后在 suggest 组件中进行调用即可：

```vue
// suggest.vue

<template>
  <scroll class="suggest" >
    ...
    <div v-show="!hasMore && !result.length" class="no-result-wrapper">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>
```

**节流**

我们每次对搜索内容进行任何修改的时候都会发送一次请求，这会大大加重不必要的流量消耗，因此我们这里需要进行节流处理。我们在 util.js 中来定义这样的一个方法，它其实就是在执行的函数上加一个定时器，让它延迟执行即可：

```javascript
export function debounce(func, delay) {
  let timer
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}
```

然后在 search-box 组件中进行调用：

```vue
// search-box.vue
import {debounce} from 'common/js/util'
...
created() {
  this.$watch('query', debounce((newQuery) => {
    this.$emit('query', newQuery)
  }, 200))
}
...
```

**滚动时让input失去焦点（主要是移动端，将键盘收起来）**

这里我们对 scroll 组件再进行一个扩展，给它添加一个 beforeScroll 属性：

```vue
// scroll.vue
...
props: {
  ...
  beforeScroll: {
    type: Boolean,
    default: false
  }
},
methods: {
  _initScroll() {
    ...
    if(this.beforeScroll) {
      this.scroll.on('beforeScrollStart', () => {
        this.$emit('beforeScroll')
      })
    }
  }
}
...
```

要实现这样的一个功能，首先我们要在 suggest 组件中去监听 beforeScroll 事件，并向外派发一个 listScroll 事件，然后我们要在 search 组件中监听 listScroll 事件，并调用 serach-box 组件的 blur 方法，该方法就是让 input 输入框失去焦点，从而让键盘收起来：

```vue
// suggest.vue

<scroll class="suggest"
      :data="result"
      :pullup="pullup"
      :beforeScroll="beforeScroll"
      @scrollToEnd="searchMore"
      @beforeScroll="listenScroll"
      ref="suggest"
  >
  ...
</scroll>
...

data() {
  return {
    ...
    beforeScroll: true
  }
},
methods: {
  ...
  listenScroll() {
    this.$emit('listScroll')
  },
}
...
```

```vue
// search-box.vue
...
  <input ref="query" type="text" v-model="query" class="box" :placeholder="placeholder">
...
methods: {
  ...
  blur() {
    this.$refs.query.blur()
  }
},
...
```

```vue
// search.vue
...
<div class="search-box-wrapper">
  <search-box ref="searchBox" @query="onQueryChange"></search-box>
</div>
...
<div class="search-result" v-show="query">
  <suggest :query="query" @listScroll="blurInput"></suggest>
</div>
...

methods: {
  ...
  blurInput() {
    this.$refs.searchBox.blur()
  },
  ...
},
...
```

### 搜索历史

在我们进行搜索后要将搜索关键词存入到搜索历史中，同时要保存到本地缓存中。这里我们仍然使用 vuex 来进行搜索历史的存取：

```javascript
// state.js

const state = {
  ...
  searchHistory: loadSearch() // 这里的loadSearch是获取 storage 中的 __search__ 值，因为在刷新后如果本地未清除的话，searchHistory 仍然是有值的
}

// mutation-types.js
export const SET_SEARCH_HISTORY = 'SET_SEARCH_HISTORY'

// mutations.js
const mutations = {
  ...
  [types.SET_SEARCH_HISTORY](state, history) {
    state.searchHistory = history
  }
}

// getters.js
export const searchHistory = state => state.searchHistory
```

```javascript
// common/js/cache.js

export function loadSearch() {
  return storage.get(SEARCH_KEY, [])
}
```

接下来我们在 search 组件中加入 searchHistory 的 DOM 结构，并通过 vuex 拿到 searchHistory 的值，将它作为 search-list 组件的 searches 属性传入：

```vue
// search.vue
<div class="shortcut">
  ...
  <div class="search-history" v-show="searchHistory.length">
    <h1 class="title">
      <span class="text">搜索历史</span>
      <span class="clear">
        <i class="icon-clear"></i>
      </span>
    </h1>
    <search-list :searches="searchHistory"></search-list>
  </div>
</div>

...
computed: {
  ...mapGetters([
    'searchHistory'
  ])
},
...
```

这里的 search-list (搜索历史列表)组件在其他组件中也有用到，因此我们把它作为一个基础组件，写在 base 目录下：

```vue
// base/search-list/search-list

<template>
  <div class="search-list" v-show="searches.length">
    <ul>
      <li @click="selectItem(item)" class="search-item" v-for="item in searches">
        <span class="text">{{item}}</span>
        <span class="icon">
          <i class="icon-delete"></i>
        </span>
      </li>
    </ul>
  </div>
</template>

<script type="ecmascript-6">
  export default {
    props: {
      searches: {
        type: Array,
        default: []
      }
    },
    methods: {
      selectItem(item) {
        this.$emit('select', item)
      }
    }
  }
</script>
```

在 search-list 组件中，当我们点击一条历史记录的时候，要将它显示到搜索框中进行搜索。这里当点击的时候我们让它派发了一个 select 事件，然后在它的父组件中去进行监听，直接调用之前的 addQeury 方法：

```vue
// search.vue
...
<search-list :searches="searchHistory" @select="addQuery"></search-list>
...
```

接下来我们来实现历史记录的存储，历史记录不仅要存储到 vuex 中进行数据传递，还要存到本地缓存里。这里，我们在 common/js 目录新建一个 cache.js ，用来专门处理本地存储的逻辑。localStorage 中只能存取字符串，为了方便处理，我们这里引入了一个叫作 good-storage 的插件:

安装:

> npm install --save good-storage

首先我们来定义一个存储搜索历史到本地的方法：

```javascript
// cache.js
import storage from 'good-storage'

const SEARCH_KEY = '__search__'
const SEARCH_MAX_LENGTH = 15 // 历史记录的最大长度

// 在数组中插入新的值，如果是重复的话就删除旧值，并且新值要放在数组的前面，并且要控制数组的最大长度
function insertArray(arr, val, compare, maxLen) {
  const index = arr.findIndex(compare)
  if (index === 0) {
    return
  }
  if (index > 0) {
    arr.splice(index, 1)
  }
  arr.unshift(val)
  if (maxLen && arr.length > maxLen) {
    arr.pop()
  }
}

// 存储搜索历史方法
export function saveSearch(query) {
  let searches = storage.get(SEARCH_KEY, [])
  insertArray(searches, query, (item) => {
    return item === query
  }, SEARCH_MAX_LENGTH)
  storage.set(SEARCH_KEY, searches)
  return searches
}
```

然后我们在 actions.js 中去引入这个方法，并在提交修改历史列表的 mutation 中进行使用：

```javascript
// actions.js
import {saveSearch} from 'common/js/cache'
...
export const saveSearchHistory = function({commit}, query) {
  commit(types.SET_SEARCH_HISTORY, saveSearch(query))
}
```

当我们在 suggest 组件中点击搜索结果的时候派发一个 select 事件给它的父组件，父组件中监听到这个事件的时候进行历史记录存储：

```vue
// suggest.vue
...
selectItem(item) {
  ...
  this.$emit('select')
},
...
```

```vue
// search.vue
import {mapActions, mapGetters} from 'vuex'
...
<div class="search-result" v-show="query">
  <suggest :query="query" @listScroll="blurInput" @select="saveSearch"></suggest>
</div>

...
saveSearch() {
  this.saveSearchHistory(this.query)
},
...
...mapActions([
  'saveSearchHistory'
])
```

整个存储搜索历史就完成了。

接下来是删除搜索历史，分为两个部分，一个是删除单个搜索历史，一个是删除所有搜索历史。

我们先来看第一个：

在 search-list 组件中点击 'x' 的时候派发出一个 delete 事件，在父组件中监听到这个事件后在 vuex 及本地 storage 中都要删除该条记录：

```vue
// search-list
<template>
  <div class="search-list" v-show="searches.length">
    <ul>
      <li @click="selectItem(item)" class="search-item" v-for="item in searches">
        <span class="text">{{item}}</span>
        <span class="icon" @click.stop="deleteOne(item)">
          ...
        </span>
      </li>
    </ul>
  </div>
</template>

<script type="ecmascript-6">
  export default {
    ...
    methods: {
      ...
      deleteOne(item) {
        this.$emit('delete', item)
      }
    }
  }
</script>
```

```vue
// search.vue

...
<search-list :searches="searchHistory" @select="addQuery" @delete="deleteSearchHistory"></search-list>
...

...mapActions([
  'saveSearchHistory',
  'deleteSearchHistory'
])
```

```javascript
// cache.js
...
function deleteFromArray(arr, compare) {
  const index = arr.findIndex(compare)

  if (index > -1) {
    arr.splice(index, 1)
  }
}
export function deleteSearch(query) {
  let searches = storage.get(SEARCH_KEY, [])

  deleteFromArray(searches, (item) => {
    return item === query
  })
  storage.set(SEARCH_KEY, searches)
  return searches
}
```

```javascript
// actions.js
import {saveSearch, deleteSearch} from 'common/js/cache'
...
export const deleteSearchHistory = function({commit}, query) {
  commit(types.SET_SEARCH_HISTORY, deleteSearch(query))
}
```

在suggest 组件中点击垃圾桶图标清除所有历史记录也是同样的逻辑：

```vue
// search.vue
...
<div class="search-history" v-show="searchHistory.length">
  <h1 class="title">
    <span class="text">搜索历史</span>
    <span class="clear" @click="clearSearchHistory">
      <i class="icon-clear"></i>
    </span>
  </h1>
  <search-list :searches="searchHistory" @select="addQuery" @delete="deleteSearchHistory"></search-list>
</div>
...

...mapActions([
  'saveSearchHistory',
  'deleteSearchHistory',
  'clearSearchHistory'
])
```

```javascript
// cache.js
...
export function clearSearch() {
  storage.remove(SEARCH_KEY)
  return []
}
```

```javascript
// actions.js
import {saveSearch, deleteSearch, clearSearch} from 'common/js/cache'
...
export const clearSearchHistory = function({commit}) {
  commit(types.SET_SEARCH_HISTORY, clearSearch())
}
```


### 确认弹窗组件

当点击清空历史图标的时候，我们希望能够弹出一个确认操作，毕竟这是一个毁灭性的操作。

我们将弹窗组件作为一个基础组件，并给它加一些属性：

```vue
// base/confirm/confirm.vue
<template>
  <transition name="confirm-fade">
    <div class="confirm" v-show="showFlag">
      <div class="confirm-wrapper">
        <div class="confirm-content">
          <p class="text">{{text}}</p>
          <div class="operate">
            <div class="operate-btn left">{{cancelBtnText}}</div>
            <div class="operate-btn">{{confirmBtnText}}</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="ecmascript-6">
  export default {
    props: {
      text: {
        type: String,
        default: ''
      },
      confirmBtnText: {
        type: String,
        default: '确定'
      },
      cancelBtnText: {
        type: String,
        default: '取消'
      }
    },
    data() {
      return {
        showFlag: false
      }
    }
  }
</script>
```

confirm 组件有两种引入方法，一种是放在根组件上，一种是哪里要用在哪儿引入，这里我们采用第二种。

首先在 search 组件中引入该组件：

```vue
// search.vue
<div class="search">
  ...
  <div class="shortcut-wrapper" v-show="!query">
    <div class="shortcut">
      ...
      <div class="search-history" v-show="searchHistory.length">
        <h1 class="title">
          <span class="text">搜索历史</span>
          <span class="clear" @click="showConfirm">
            <i class="icon-clear"></i>
          </span>
        </h1>
        ...
      </div>
    </div>
  </div>
  <confirm ref="confirm" text="是否清空所有搜索历史" confirmBtnText="清空"></confirm>
  <router-view></router-view>
</div>
```

这里当点击垃圾桶图标的时候不再是调用 clearSearchHistory 方法，而是将弹窗显示出来。弹窗的显示和隐藏我们在 confirm 组件中定义方法来实现：

```vue
// confirm.vue
methods: {
      show() {
        this.showFlag = true
      },
      hide() {
        this.showFlag = false
      }
    }
```

```vue
// search.vue
...
showConfirm() {
  this.$refs.confirm.show()
},
...
```

当我们点击取消按钮的时候让弹窗隐藏，并且派发一个 cancel 事件，点击清空按钮的时候也要让弹窗消失，并同时向外派发一个 confirm 事件：

```vue
// confirm.vue
methods: {
  ...
  cancel() {
    this.hide()
    this.$emit('cancel')
  },
  confirm() {
    this.hide()
    this.$emit('confirm')
  }
}
```

这里点击取消的时候我们只做隐藏操作，不做其他逻辑处理。因此我们在 search 组件中只监听 confirm 组件的 confirm 事件，并调用 clearSearchHistory 方法清除历史记录：

```vue
// search.vue
...
<confirm ref="confirm" text="是否清空所有搜索历史" confirmBtnText="清空" @confirm="clearSearchHistory"></confirm>
...
```

### 剩余功能优化

**当历史记录增多的时候我们希望它能滚动**

首先我们是在 search 组件中引入 scroll 组件：

```vue
// search.vue
...
<div class="shortcut-wrapper" v-show="!query">
  <scroll :data="shortcut" class="shortcut" ref="shortcut">
    <div>
      ...
      ...
    </div>
  </scroll>
</div>
...
computed: {
  shortcut() {
    return this.hotKey.concat(this.searchHistory)
  },
  ...
},
...
watch: {
  query(newQuery) {
    if(!newQuery) {
      setTimeout(() => {
        this.$refs.shortcut.refresh()
      }, 20)
    }
  }
},
...
```

**滚动底部与mini播放器高度自适应问题**

这里同样是要引入 mixin 来进行实现。

```vue
// search.vue

<div ref="shortcutWrapper" class="shortcut-wrapper" v-show="!query">
  <scroll :data="shortcut" class="shortcut" ref="shortcut">
   ...
  </scroll>
</div>
<div class="search-result" v-show="query" ref="searchResult">
  <suggest :query="query" @listScroll="blurInput" @select="saveSearch" ref="suggest"></suggest>
</div>


import {playListMixin} from 'common/js/mixin'
...

mixins: [playListMixin],
...
methods: {
  handlePlaylist(playlist) {
    const bottom = playlist.length > 0 ? '60px' : 0
    this.$refs.shortcutWrapper.style.bottom = bottom
    this.$refs.searchResult.style.bottom = bottom
    this.$refs.shortcut.refresh()
    this.$refs.suggest.refresh()
  },
  ...
}
...
```

这里是在 suggest 组件里面引入了 scroll 组件，因此要在 scroll 组件里面去定义一个 refresh 方法，用它了调用 scroll 的 refresh 方法：

```vue
// suggest.vue
...
refresh() {
  this.$refs.suggest.refresh()
},
...
```

到这儿这一章也就结束了。