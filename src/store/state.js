import {PLAY_MODE} from 'common/js/config'

const state = {
  singer: {},
  playing: false,
  fullScreen: false,
  playList: [],
  sequenceList: [],
  mode: PLAY_MODE.sequence,
  currentIndex: -1,
  disc: [],
  topList: []
}

export default state