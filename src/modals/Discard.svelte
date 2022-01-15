<script lang='ts'>
	import {modalSlideInAnim} from '../ModalViewer.svelte'
	export let closeThisModal
	export let props: {
		title: string
		msg: string
		discard: (closeThisModal: ()=> void)=> void
		keep: (closeThisModal: ()=> void)=> void
	}
</script>

<div class='modal fixed-width import-keep-or-discard' transition:modalSlideInAnim>
	<div class='header flex content-center-y gap-1'>
		<svg class='icon stroke icon-3 icon-warn' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path d='M12 9V16M12 3L2 21H22L12 3ZM12 17.5L11.5 18L12 18.5L12.5 18L12 17.5Z'/>
		</svg>
		<h1>{props.title}</h1>
	</div>

	<p>{props.msg}</p>

	<div class='actions flex content-center-y'>
		<button on:click={()=> props.discard(closeThisModal)} class='discard btn has-icon'>
			<svg class='icon stroke icon-15 clr-red' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
				<path d='M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8'/>
			</svg>
			<span class='label'>Discard</span>
		</button>

		<button on:click={()=> props.keep(closeThisModal)} class='cancel btn align-right'>
			Keep
		</button>
	</div>
</div>
