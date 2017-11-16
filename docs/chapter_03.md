# 推荐页面开发

### **数据轮播图获取**

该项目中的所有数据都是从QQ音乐上抓取下来的，采用JSONP方法来获取数据。
首先需要安装 `JSONP` 库：

> npm install --save jsonp

在common/js文件夹下新建一个jsonp.js文件，利用Promise对jsonp进行再封装，方便后面调用。

```
import originJSONP from 'jsonp'

/**
* url 请求地址
* data query信息
* option 原生jsonp中的option参数一样，主要传入callback函数名
*/
export default function jsonp(url, data, option) {
  url += (url.indexOf('?') < 0 ? '?' : '&') + param(data)
  return new Promise((resolve, reject) => {
    originJSONP(url, option, (err, data) => {
      if (!err) {
        resolve(data)
      } else {
        reject(err)
      }
    })
  })
}

//拼接URL地址
function param(data) {
  let url = ''
  for (var k in data) {
    let value = data[k] !== undefined ? data[k] : ''
    url += `&${k}=${encodeURIComponent(value)}`
  }
  return url ? url.substring(1) : ''
}
```

获取推荐页面信息。在api目录下新建一个recommend.js文件，并定义一个getRecommend方法，通过调用我们新封装的jsonp方法用来获取推荐歌曲信息。同时在api目录下有一个config.js文件，用来配置公共的参数。

**`config.js`**

```
export const commonParams = {
  g_tk: 5381,
  inCharset: 'utf-8',
  outCharset: 'utf-8',
  notice: 0,
  format: 'jsonp'
}

//jsonp中的option参数
export const options = {
  param: 'jsonpCallback'
}

export const ERR_OK = 0 //请求成功
```

**`recommend.js`**

```
import jsonp from 'common/js/jsonp'
import {commonParams, options} from './config'

export function getRecommend() {
  const url = 'https://c.y.qq.com/musichall/fcgi-bin/fcg_yqqhomepagerecommend.fcg'
  const data = Object.assign({}, commonParams, {
    platform: 'h5',
    uin: 0,
    needNewCode: 1
  })

  return jsonp(url, data, options)
}
```

获取数据的方法定义完毕，接下来就是在recommend组件中调用方法来获取数据了。通常我们在created钩子中来获取外部数据：

```
import {getRecommend} from 'api/recommend'
import {ERR_OK} from 'api/config'

export default {
	created() {
	  this._getRecommend();
	},
	methods: {
	  _getRecommend() {
	    getRecommend().then((res) => {
	      if(res.code === ERR_OK) {
	        console.log(res.data.slider)
	      }
	    })
	  }
	}
}
```


### **轮播图组件开发**

轮播图组件属于基础组件，因此我们在src目录下单独建了一个base目录用于存放该类组件，将slider组件放在该目录下。

轮播图的滚动采用的better-scroll插件，它是一款重点解决移动端（未来可能会考虑 PC 端）各种滚动场景需求的插件 (地址: http://ustbhuangyi.github.io/better-scroll )。

### **歌单数据获取**

歌单数据由于无法直接获取得到，这里采用后端代理的方式。首先安装axios：

> npm install --save axios

最新的vue-cli安装的vue+webpack环境中，在buildbuild目录下没有dev-server.js。因此后端代理需要在webpack.dev.conf.js中进行设置。首先需要引入一些依赖：

```
const express = require('express')
const app = express()
const apiRoutes = express.Router()
const axios = require('axios')

app.use('/api', apiRoutes)
```

然后webpack.dev.conf.js文件中找到devServer选项，在该项下新增一项：

```
devServer: {
	before(app) {
	  app.get('/api/getDiscList', function (req, res) {
	    var url = 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg'
	    axios.get(url, {
	      headers: {
	        referer: 'https://c.y.qq.com/',
	        host: 'c.y.qq.com'
	      },
	      params: req.query
	    }).then((response) => {
	      res.json(response.data)
	    }).catch((e) => {
	      console.log(e)
	    })
	  })
	}
}
```

然后在recommend.js中新增一个getDiscList方法，用来获取歌曲列表：

```
export function getDiscList() {
  const url = '/api/getDiscList'
  const data = Object.assign({}, commonParams, {
    platform: 'yqq',
    hostUin: 0,
    sin: 0,
    ein: 29,
    sortId: 5,
    needNewCode: 0,
    categoryId: 10000000,
    rnd: Math.random(),
    format: 'json'
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data)
  })
}
```

### **歌单列表组件开发**

将获取到的数据在 `recommend` 组件中渲染出来。

列表的局部滚动仍然用better-scroll来做。