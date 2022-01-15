<script lang='ts'>
	import {animations} from '../App.svelte'
	import {modalSlideInAnim, openModal} from '../ModalViewer.svelte'
	import ModalDiscrad from './Discard.svelte'
	import type {AnimationProjectPreset} from '../animation_creator'
	import {parseCssImport} from '../utils'

	export let closeThisModal

	let importCode = ''
	let importErr: null|Error = null
	let parsedImport: AnimationProjectPreset[] = null

	function importAskToKeepState() {
		closeThisModal()
		setTimeout(()=> {
			openModal({
				comp: ModalDiscrad,
				opts: {noEsc: true},
				props: {
					title: 'Importing Project',
					msg: 'Do you want to keep or discard the current animation projects?',
					discard: (closeModal)=> {
						applyImport(false)
						closeModal()
					},
					keep: (closeModal)=> {
						applyImport()
						closeModal()
					},
				},
			})
		}, 400)
	}

	function applyImport(keepState = true) {
		if (!parsedImport) return

		animations.import(parsedImport, keepState)
		importCode = ''
		parsedImport = null
		closeThisModal()
	}

	function parseImport() {
		try {
			parsedImport = null
			parsedImport = parseCssImport(importCode)
			importErr = null
		}
		catch(err) {
			importErr = err
		}
	}
</script>

<div class='modal fixed-width import' transition:modalSlideInAnim>
	<div class='header flex content-center-y gap-1'>
		<svg class='icon stroke icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path d='M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 19L12 11M12 11L15 14M12 11L9 14'/>
		</svg>
		<h1>Import</h1>
	</div>

	<div class='import-info grid gap-05'>
		<p>
			To import an animation project you have to define either or both
			the <code>animation</code> rule and the <code>@keyframes</code> block.
			This app is parsing the presets for from the animation rule in the
			following respected conventional order:
		</p>
		<ol>
			<li>name (has always to be the first value)</li>
			<li>duration</li>
			<li>timing-function</li>
			<li>delay</li>
			<li>iteration-count</li>
			<li>direction</li>
			<li>fill-mode</li>
		</ol>
		<p>Example:</p>
		<pre>{
			`animation: xplAnim 1s linear forwards;\n` +
			`@keyframes xplAnim {\n` +
				`\tfrom { color: red }\n` +
				`\tto   { color: blue }\n` +
			`}`
		}</pre>
	</div>

	<div class='input-field grid gap-05'>
		{#if importErr !== null}
			<p class='import-error'>{importErr.message}</p>
		{/if}
		<textarea id='keyframes-import'
			bind:value={importCode}
			on:change={parseImport}
			rows='16'
		/>
		<label for='keyframes-import'>CSS Keyframes & Animation presets</label>
	</div>

	<div class='actions flex content-center-y'>
		<button on:click={closeThisModal} class='btn has-icon'>
			<svg class='icon stroke icon-15 clr-red' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
				<path d='M19 5L5 19M5 5L19 19'/>
			</svg>
			<span class='label'>Cancel</span>
		</button>

		<button on:click={importAskToKeepState} class='btn has-icon align-right' disabled={parsedImport === null}>
			<svg class='icon stroke icon-15 clr-green' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
				<path stroke-width='2' d='M4 11.5L9.5 17L19.5 7'/>
			</svg>
			<span class='label'>Apply</span>
		</button>
	</div>
</div>

<style lang='stylus'>
	.import-info
		code
			padding: .2em .5em
			background-color: var(--fg)
			border-radius: var(--btn-radius)
		ol
			padding-left: 1.5em
			li::marker
				color: var(--prime)
		pre
			padding: .5em
			background-color: var(--fg)
			border: solid 1px var(--border)
			border-radius: var(--btn-radius)
			opacity: .75

	.import-error
		padding: 1em
		background-color: var(--clr-red-025)
		border: solid 1px var(--clr-red)
		border-radius: var(--btn-radius)
		color: var(--heading)
</style>
