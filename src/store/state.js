import {PLAY_MODE} from 'common/js/config'
import {loadSearch} from 'common/js/cache'

const state = {
  singer: {},
  playing: false,
  fullScreen: false,
  playList: [],
  sequenceList: [],
  mode: PLAY_MODE.sequence,
  currentIndex: -1,
  disc: [],
  topList: [],
  searchHistory: loadSearch()
}

export default state