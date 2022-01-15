<script>
	import {modalSlideInAnim} from '../ModalViewer.svelte'
	import {animations} from '../App.svelte'
	export let closeThisModal
</script>

<div class='modal fixed-width animation-target' transition:modalSlideInAnim>
	<div class='header flex content-center-y gap-1'>
		<svg class='icon stroke icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path d='M15.7736 5.36887C14.3899 4.50149 12.7535 4 11 4C6.02944 4 2 8.02944 2 13C2 17.9706 6.02944 22 11 22C15.9706 22 20 17.9706 20 13C20 11.3038 19.5308 9.71728 18.7151 8.36302'/>
			<path d='M12.8458 8.35174C12.2747 8.12477 11.6519 8 11 8C8.23858 8 6 10.2386 6 13C6 15.7614 8.23858 18 11 18C13.7614 18 16 15.7614 16 13C16 12.4099 15.8978 11.8438 15.7101 11.3182'/>
			<path d='M12 12L18 6M20 4V1.73698e-07M20 4H24M20 4L18 6M20 4L23 1M18 6L18 2M18 6L22 6'/>
			<circle cx='11' cy='13' r='1.5'/>
		</svg>
		<h1>Animation Target</h1>
	</div>

	<div class='input-field'>
		<textarea id='target-html-input'
			rows='6'
			value={$animations.target.html}
			on:change={(e)=> animations.changeTargetHTML(e.currentTarget.value)}
		/>
		<label for='target-html-input'>HTML</label>
	</div>

	<div class='input-field'>
		<textarea id='target-css-input'
			rows='6'
			value={$animations.target.css}
			on:change={(e)=> animations.changeTargetCSS(e.currentTarget.value)}
		/>
		<label for='target-css-input'>CSS</label>
	</div>

	<div class='actions flex content-center-y'>
		<button on:click={closeThisModal} class='btn align-right'>
			Close
		</button>
	</div>
</div>
