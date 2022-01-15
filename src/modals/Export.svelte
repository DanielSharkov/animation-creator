<script>
	import {animations} from '../App.svelte'
	import {modalSlideInAnim} from '../ModalViewer.svelte'
	import {copyToClipboard, buildProjects} from '../utils'
	export let closeThisModal
</script>

<div class='modal fixed-width export' transition:modalSlideInAnim>
	<div class='header flex content-center-y gap-1'>
		<svg class='icon stroke icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path d='M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 11V19M12 19L9 16M12 19L15 16'/>
		</svg>
		<h1>Export</h1>
	</div>

	<div class='body grid gap-2'>
		<div class='field grid gap-05'>
			<div class='label flex gap-05'>
				<span>Your targets HTML code</span>
				<button on:click={()=> copyToClipboard($animations.target.html)} class='btn even-pdg small align-right'>
					<svg class='icon stroke icon-1' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M9.5 9.5H16M7.5 9.5H8.5M9.5 12.5H15M7.5 12.5H8.5M9.5 15.5H16M7.5 15.5H8.5M9.5 18.5H15M7.5 18.5H8.5M10 4V2H14V4M10 4H14M10 4H8.5M14 4H15.5M8.5 4H5V22H19V4H15.5M8.5 4V6H15.5V4'/>
					</svg>
				</button>
			</div>
			<textarea readonly rows='6'>{$animations.target.html}</textarea>
		</div>
		<div class='field grid gap-05'>
			<div class='label flex gap-05'>
				<span>Your targets CSS code</span>
				<button on:click={()=> copyToClipboard($animations.target.css)} class='btn even-pdg small align-right'>
					<svg class='icon stroke icon-1' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M9.5 9.5H16M7.5 9.5H8.5M9.5 12.5H15M7.5 12.5H8.5M9.5 15.5H16M7.5 15.5H8.5M9.5 18.5H15M7.5 18.5H8.5M10 4V2H14V4M10 4H14M10 4H8.5M14 4H15.5M8.5 4H5V22H19V4H15.5M8.5 4V6H15.5V4'/>
					</svg>
				</button>
			</div>
			<textarea readonly rows='6'>{$animations.target.css}</textarea>
		</div>
		<div class='field grid gap-05'>
			<div class='label flex gap-05'>
				<span>Animation CSS</span>
				<button on:click={()=> copyToClipboard(buildProjects($animations.projects))} class='btn even-pdg small align-right'>
					<svg class='icon stroke icon-1' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M9.5 9.5H16M7.5 9.5H8.5M9.5 12.5H15M7.5 12.5H8.5M9.5 15.5H16M7.5 15.5H8.5M9.5 18.5H15M7.5 18.5H8.5M10 4V2H14V4M10 4H14M10 4H8.5M14 4H15.5M8.5 4H5V22H19V4H15.5M8.5 4V6H15.5V4'/>
					</svg>
				</button>
			</div>
			<textarea readonly rows='16'>{buildProjects($animations.projects, true)}</textarea>
		</div>
	</div>

	<div class='actions flex content-center-y'>
		<button on:click={closeThisModal} class='btn align-right'>
			Close
		</button>
	</div>
</div>

<style lang='stylus'>
	.modal > .body > .field > .label
		font-size: 1.25em
		color: var(--prime)
</style>
