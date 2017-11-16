<template>
	<div ref="wrapper">
		<slot></slot>
	</div>
</template>

<script type="ecmascript-6">
	import BScroll from 'better-scroll'
	export default {
		props: {
			probeType: {
				type: Number,
				default: 1
			},
			click: {
				type: Boolean,
				default: true
			}
		}
	}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
	
</style>