<script lang='ts' context='module'>
interface ModalOptions {
	noEsc: boolean
}
type ModalStore = {
	comp:   typeof SvelteComponent
	opts?:  ModalOptions
	props?: any
}
let opendModal = writable<ModalStore>({
	comp:  undefined,
	opts:  undefined,
	props: undefined,
})

let _onOpenModal: ()=> void

export function openModal(modal: ModalStore) {
	_onOpenModal()
	opendModal.set(modal)
}
export function closeModal() {
	opendModal.set({comp: undefined, opts: undefined, props: undefined})
}

export const modalSlideInAnim =(node, o?)=> ({
	duration: 300,
	css: (t)=> (
		`transform: translateY(${2 - 2 * cubicInOut(t)}rem);`
	)
})
</script>

<svelte:window on:keydown|passive={(e)=> {
	if (e.key.toLocaleLowerCase() == 'escape') {
		if (!$opendModal.opts?.noEsc) closeModal()
	}
}}/>

<script lang='ts'>
import type {SvelteComponent} from 'svelte'
import {cubicInOut} from 'svelte/easing'
import {writable} from 'svelte/store'

export let onOpenModal: ()=> void
_onOpenModal = onOpenModal
</script>



<div id='ModalViewport' class='flex' class:active={$opendModal.comp !== undefined}>
{#if $opendModal.comp !== undefined}
	<svelte:component
		this={$opendModal.comp}
		props={$opendModal.props}
		closeThisModal={closeModal}
	/>
{/if}
</div>



<style lang='stylus'>
#ModalViewport
	z-index: 100
	position: fixed
	top: 0
	right: 0
	bottom: 0
	left: 0
	padding: 2rem
	background-color: var(--modal-viewport-bg)
	justify-content: center
	overflow: auto
	transition-duration: .3s
	transition-property: opacity
	&:not(.active)
		pointer-events: none
		opacity: 0

:global(html[bg-bluring] #ModalViewport)
	-webkit-backdrop-filter: blur(3px)
	backdrop-filter: blur(3px)
</style>
