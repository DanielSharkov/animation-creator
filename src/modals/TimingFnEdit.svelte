<script lang='ts'>
	import {modalSlideInAnim} from '../ModalViewer.svelte'
	export let closeThisModal
	export let props: {
		preset: string
		apply: (result: string)=> void
	}

	let editorViewportEl: SVGElement
	const anchors = [[180,160], [120,140]]

	if (props.preset !== undefined) {
		parseCubicBezier(props.preset)
	}

	let timeCursorPos = 0
	let progressCursorPos = 0

	$:anchorBeginPath = `M100 200L${anchors[0][0]} ${anchors[0][1]}`
	$:anchorEndPath = `M200 100L${anchors[1][0]} ${anchors[1][1]}`
	$:theCurve = (
		`M100 200C${anchors[0][0]} ${anchors[0][1]}, ` +
		`${anchors[1][0]} ${anchors[1][1]}, 200 100`
	)
	// cubic-bezier point 1
	$:cbP1 = [
		fixedNum((anchors[0][0] - 100) / 100),
		fixedNum(((300 - anchors[0][1]) - 100) / 100),
	]
	// cubic-bezier point 2
	$:cbP2 = [
		fixedNum((anchors[1][0] - 100) / 100),
		fixedNum(((300 - anchors[1][1]) - 100) / 100),
	]
	$:cubicBezier =()=> {
		return (
			'cubic-bezier(' +
				`${cbP1[0]}, ${cbP1[1]}, ${cbP2[0]}, ${cbP2[1]}` +
			')'
		)
	}

	enum Anchor {Begin, End}
	let movingAnchor: Anchor|null = null

	function moveAnchor(anchor: Anchor) {
		movingAnchor = anchor
	}

	function viewportMoving(e: PointerEvent) {
		const vpSize = editorViewportEl.clientWidth
		timeCursorPos = Math.round(
			300 / 100 * (100 / vpSize * e.offsetX) - 100
		)
		progressCursorPos = Math.round(
			300 / 100 * (100 - (100 / vpSize * e.offsetY)) - 100
		)

		if (movingAnchor !== null) {
			anchors[movingAnchor] = [
				300 / 100 * fixedNum(100 / vpSize * e.offsetX),
				300 / 100 * fixedNum(100 / vpSize * e.offsetY),
			]
			if (anchors[movingAnchor][0] < 100) {
				anchors[movingAnchor][0] = 100
			}
			if (anchors[movingAnchor][0] > 200) {
				anchors[movingAnchor][0] = 200
			}
		}
	}

	function viewportPointerRelease(e: PointerEvent) {
		if (movingAnchor !== null) {
			movingAnchor = null
		}
	}

	function changePoint(
		e: Event & {currentTarget: EventTarget & HTMLInputElement},
		anchor: Anchor, axis: number,
	) {
		let val = Number(e.currentTarget.value)
		if (val < -1) val = -1
		if (val > 2) val = 2
		if (axis === 0) {
			if (val < 0) val = 0
			if (val > 1) val = 1
		}
		e.currentTarget.value = ''+ val
		anchors[anchor][axis] = fromBezierUnit(val, axis === 1)
	}

	function fromBezierUnit(n: number, isYAxis = false) {
		if (isYAxis) {
			return Number(((3 - (n + 1)) * 100).toFixed(2))
		}
		return Number(((n + 1) * 100).toFixed(2))
	}

	function fixedNum(n: number) {
		return Number(n.toFixed(2))
	}

	function applyEdit() {
		props.apply(cubicBezier())
		closeThisModal()
	}

	function parseCubicBezier(str: string) {
		if (str === 'linear') {
			anchors[0][0] = 100
			anchors[0][1] = 200
			anchors[1][0] = 200
			anchors[1][1] = 100
		}

		if (str.slice(0,13) !== 'cubic-bezier(') {
			return
		}
		let beginOfValues = str.indexOf('(')
		let cursor = beginOfValues+1
		let currAnchor = 0
		let currAxis = 0
		for (let idx = beginOfValues; idx < str.length; idx++) {
			const char = str[idx]
			if (char === ',' || char === ')') {
				let val = Number(str.slice(cursor, idx))
				if (Number.isNaN(val)) {
					val = 0
				}

				anchors[currAnchor][currAxis] = (
					fromBezierUnit(val, currAxis === 1)
				)
				if (currAxis === 1) {
					currAnchor = 1
					currAxis = 0
				}
				else {
					currAxis++
				}

				cursor = idx+1
				if (char === ')') break
			}
		}
	}
</script>

<div class='modal timing-fn-edit' transition:modalSlideInAnim>
	<div class='header flex content-center-y gap-1'>
		<svg class='icon icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path class='fill' d='M3 1L1.55662 3.5L4.44338 3.5L3 1ZM3 21L2.75 21L2.75 21.25L3 21.25L3 21ZM23 21L20.5 19.5566L20.5 22.4434L23 21ZM2.75 3.25L2.75 21L3.25 21L3.25 3.25L2.75 3.25ZM3 21.25L20.75 21.25L20.75 20.75L3 20.75L3 21.25Z'/>
			<path fill='url(#paint0_linear_1552_25)' d='M3.5 20L3.5 20.5L4.5 20.5L4.5 20L3.5 20ZM20.5 4V3.5H19.5V4H20.5ZM4.5 20C4.5 17.1317 5.44511 15.5412 6.8 14.525C8.20385 13.4721 10.0962 12.9913 12.1213 12.4851C14.0962 11.9913 16.2038 11.4721 17.8 10.275C19.4451 9.04117 20.5 7.13172 20.5 4H19.5C19.5 6.86828 18.5549 8.45883 17.2 9.475C15.7962 10.5279 13.9038 11.0087 11.8787 11.5149C9.9038 12.0087 7.79615 12.5279 6.2 13.725C4.55489 14.9588 3.5 16.8683 3.5 20L4.5 20Z'/>
			<path class='stroke' opacity='0.5' d='M5 3H21V19' stroke-dasharray='1 1'/>
			<defs>
				<linearGradient id='paint0_linear_1552_25' x1='12' y1='3' x2='12' y2='21' gradientUnits='userSpaceOnUse'>
					<stop stop-color='#15DF66'/>
					<stop offset='1' stop-color='#3D8AFF'/>
				</linearGradient>
			</defs>
		</svg>
		<h1>Timing function editor</h1>
	</div>

	<div class='timing-fn-editor'>
		<svg viewBox='0 0 300 300' fill='none' xmlns='http://www.w3.org/2000/svg'
		on:pointermove={viewportMoving}
		on:pointerup={viewportPointerRelease}
		on:pointerleave={viewportPointerRelease}
		bind:this={editorViewportEl}>
			<pattern id='grid-pattern' width='100' height='100' patternUnits='userSpaceOnUse'>
				<path stroke-opacity='.05' stroke-width='.5' d='M10 0v100M20 0v100M30 0v100M40 0v100M50 0v100M60 0v100M70 0v100M80 0v100M90 0v100M0 10h100M0 20h100M0 30h100M0 40h100M0 50h100M0 60h100M0 70h100M0 80h100M0 90h100'/>
			</pattern>
			<rect width='300' height='300' fill='url(#grid-pattern)'/>

			<path class='the-curve' d={theCurve} stroke-width='1.5' stroke='url(#paint0_linear_1911_62)'/>

			<path class='anchor-path anchor-begin-path stroke' d={anchorBeginPath} stroke-width='0.5'/>
			<path class='anchor-path anchor-end-path stroke' d={anchorEndPath} stroke-width='0.5'/>

			<circle class='end-point fill' cx='200' cy='100' r='1'/>
			<circle class='begin-point fill' cx='100' cy='200' r='1'/>

			<circle
				class='anchor end'
				r='5' stroke-width='0.5'
				cx={anchors[1][0]}
				cy={anchors[1][1]}
				on:pointerdown={()=> moveAnchor(Anchor.End)}
			/>
			<circle
				class='anchor begin'
				r='5' stroke-width='0.5'
				cx={anchors[0][0]}
				cy={anchors[0][1]}
				on:pointerdown={()=> moveAnchor(Anchor.Begin)}
			/>

			<defs>
				<linearGradient id='paint0_linear_1911_62' x1='150' y1='100' x2='150' y2='200' gradientUnits='userSpaceOnUse'>
					<stop stop-color='#3D8AFF'/>
					<stop offset='1' stop-color='#15DF66'/>
				</linearGradient>
			</defs>
		</svg>

		<div class='visual-grid'>
			<div class='horizontal'>
				<div/><div/><div/>
			</div>
			<div class='vertical'>
				<div/><div/><div/>
			</div>
		</div>

		<div class='labels'>
			<span class='x-axis'>Time ({timeCursorPos}%)</span>
			<span class='y-axis'>Animation progess ({progressCursorPos}%)</span>
			<div class='x-units flex nowrap'>
				<span/>
				<span>-0.5</span>
				<span/>
				<span>0.5</span>
				<span>1</span>
				<span>1.5</span>
				<span/>
			</div>
			<div class='y-units flex nowrap'>
				<span/>
				<span>1.5</span>
				<span>1</span>
				<span>0.5</span>
				<span/>
				<span>-0.5</span>
				<span/>
			</div>
		</div>

		<div class='animation-preview flex content-center'>
			<div class='time-line'/>
			<div class='progress-line' style='animation-timing-function: {cubicBezier()};'/>
			<div class='ball' style='animation-timing-function: {cubicBezier()};'/>
		</div>
	</div>
	<div class='raw-input flex content-center-y gap-05'>
		<span>cubic-bezier(</span>
		<input type='number'
			value={cbP1[0]}
			min='0' max='1' step='0.01'
			on:change={(e)=> changePoint(e,0,0)}
		/>
		<input type='number'
			value={cbP1[1]}
			min='-1' max='2' step='0.01'
			on:change={(e)=> changePoint(e,0,1)}
		/>
		<input type='number'
			value={cbP2[0]}
			min='0' max='1' step='0.01'
			on:change={(e)=> changePoint(e,1,0)}
		/>
		<input type='number'
			value={cbP2[1]}
			min='-1' max='2' step='0.01'
			on:change={(e)=> changePoint(e,1,1)}
		/>
		<span>)</span>
	</div>
	<input readonly type='text'
		value={cubicBezier()}
		class='timing-fn-cubic-bezier'
	/>

	<div class='actions flex content-center-y'>
		<button on:click={closeThisModal} class='cancel btn has-icon'>
			<svg class='icon stroke icon-15 clr-red' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
				<path d='M19 5L5 19M5 5L19 19'/>
			</svg>
			<span class='label'>Cancel</span>
		</button>

		<button on:click={applyEdit} class='btn has-icon align-right'>
			<svg class='icon stroke icon-15 clr-green' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
				<path stroke-width='2' d='M4 11.5L9.5 17L19.5 7'/>
			</svg>
			<span class='label'>Apply</span>
		</button>
	</div>
</div>

<style lang='stylus'>
	.modal
		width: auto !important
		.timing-fn-editor
			z-index: 0
			position: relative
			width: 800px
			height: 800px
			user-select: none
			@media screen and (max-width: 1000px)
				width: 600px
				height: 600px
			@media screen and (max-height: 1200px)
				width: 600px
				height: 600px
			@media screen and (max-height: 800px)
				width: 500px
				height: 500px
			#grid-pattern path
				stroke: var(--heading)
			.visual-grid
				z-index: -1
				position: absolute
				top: 0
				left: 0
				width: 100%
				height: 100%
				pointer-events: none
				border: solid 1px var(--border)
				border-radius: var(--btn-radius)
				overflow: hidden
				> div
					position: absolute
					top: 0
					left: 0
					width: 100%
					height: 100%
					display: flex
					> div
						flex: 1 1 100%
						&:first-child
							border: none
				.horizontal
					flex-flow: column nowrap
					> div
						border-top: solid 1px var(--border)
				.vertical
					flex-flow: row nowrap
					> div
						border-left: solid 1px var(--border)
			.timing-fn-value
				padding: 1em
			> svg
				.anchor
					stroke: var(--font)
					fill: var(--bg)
					cursor: pointer
					&:hover
						stroke: var(--prime)
						stroke-width: 2
				.anchor-path
					stroke: var(--font)
				.begin-point, .end-point
					fill: var(--heading)
			> .labels
				position: absolute
				top: 0
				left: 0
				width: 100%
				height: 100%
				pointer-events: none
				> .x-axis, > .y-axis
					opacity: .35
				> .x-axis, > .y-axis, > .x-units, > .y-units
					position: absolute
				> .x-axis
					left: 50%
					bottom: .5em
					transform: translateX(-50%)
				> .y-axis
					top: 50%
					left: .5em
					transform: translateY(-50%)
					writing-mode: vertical-lr
				> .x-units, > .y-units
					font-size: .65em
					> span
						flex: 0 0 (100%/6)
						text-align: center
				> .x-units
					bottom: 31.5%
					left: -8%
					width: 100%
				> .y-units
					left: 31.5%
					top: -8%
					height: 100%
					writing-mode: vertical-lr
			> .animation-preview
				position: absolute
				top: 0%
				left: 0%
				width: 100%
				height: 100%
				pointer-events: none
				overflow: hidden
				> .time-line, > .progress-line
					position: absolute
					top: 0
					left: 0
					width: 100%
					height: 100%
				> .time-line
					border-left: dashed 1px var(--heading)
					animation: previewTimeLine 3s infinite linear
					@keyframes previewTimeLine
						from {transform: translateX(33.3333%)}
						to {transform: translateX(66.6666%)}
				> .progress-line
					border-top: dashed 1px var(--heading)
					animation: previewProgressLine 3s infinite
					@keyframes previewProgressLine
						from {transform: translateY(66.6666%)}
						to {transform: translateY(33.3333%)}
				> .ball
					position: absolute
					top: 33.3333%
					left: 66.6666%
					height: 33.3333%
					animation: previewAnim 3s infinite
					&:before
						content: ''
						display: inline-block
						width: 40px
						height: 40px
						background-color: var(--clr-red)
						border-radius: 100%
						transform: translateY(-50%)
					@keyframes previewAnim
						from {transform: translateY(100%)}
						to {transform: translateY(0%)}
		.raw-input
			padding: .5rem 1rem
			border-radius: var(--modal-radius)
			background-color: var(--fg)
			> input
				width: 1rem
				flex: 1 1 1rem
				background-color: var(--bg)
		.timing-fn-cubic-bezier
			padding: 1rem
			font-size: 1.25rem
			font-family: 'IBM Plex Mono', 'Fira Code', 'Cascadia Code', monospace
</style>
