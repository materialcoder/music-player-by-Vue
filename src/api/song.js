import {commonParams} from './config'
import axios from 'axios'
import jsonp from 'common/js/jsonp'

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