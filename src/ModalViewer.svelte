<script lang='ts' context='module'>
export enum Modals {
	None, Target, Export, Import, DiscardAnim,
	ImportKeepOrDiscard, DiscardWholeProject,
}
let opendModal = writable(Modals.None)

let _onOpenModal: (id: Modals)=> void
export function openModal(id: Modals) {
	_onOpenModal(id)
	opendModal.set(id)
}

export function closeModal() {
	opendModal.set(Modals.None)
}
</script>



<svelte:window on:keydown|passive={(e)=> {
	if (e.key.toLocaleLowerCase() == 'escape') {
		if ([
			Modals.Target,
			Modals.Export,
			Modals.Import,
			Modals.DiscardAnim,
			Modals.DiscardWholeProject,
		].includes(
			$opendModal
		)) {
			closeModal()
		}
	}
}}/>



<script lang='ts'>
import {buildProjects, copyToClipboard, parseCssImport} from './utils'
import type {AnimationProjectPreset} from './animation_creator'
import {createEventDispatcher} from 'svelte'
import {cubicInOut} from 'svelte/easing'
import {writable} from 'svelte/store'
const dispatch = createEventDispatcher()

export let animations
export let onOpenModal: (id: Modals)=> void
_onOpenModal = onOpenModal

let importCode = ''
let importErr: null|Error = null
let parsedImport: AnimationProjectPreset[] = null

function importAskToKeepState() {
	closeModal()
	setTimeout(()=> {
		openModal(Modals.ImportKeepOrDiscard)
	}, 300)
}

function applyImport(keepState?: boolean) {
	if (!parsedImport) return

	animations.import(parsedImport, keepState)
	importCode = ''
	parsedImport = null
	closeModal()
}

function parseImport() {
	try {
		parsedImport = null
		parsedImport = parseCssImport(importCode)
	}
	catch(err) {
		importErr = err
	}
}

const modalAnim =(node, o?)=> ({
	duration: 300,
	css: (t)=> (
		`transform: translateY(${2 - 2 * cubicInOut(t)}rem);`
	)
})
</script>



<div id='ModalViewport' class='flex' class:active={$opendModal !== Modals.None}>
	{#if $opendModal === Modals.Target}
		<div class='modal animation-target' transition:modalAnim>
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
				<button on:click={closeModal} class='btn has-icon align-right'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M19 5L5 19M5 5L19 19'/>
					</svg>
					<span class='label'>Close</span>
				</button>
			</div>
		</div>
	{/if}

	{#if $opendModal === Modals.Export}
		<div class='modal export' transition:modalAnim>
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
					<textarea readonly rows='16'>{buildProjects($animations.projects)}</textarea>
				</div>
			</div>

			<div class='actions flex content-center-y'>
				<button on:click={closeModal} class='btn has-icon align-right'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M19 5L5 19M5 5L19 19'/>
					</svg>
					<span class='label'>Close</span>
				</button>
			</div>
		</div>
	{/if}

	{#if $opendModal === Modals.Import}
		<div class='modal import' transition:modalAnim>
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
				<button on:click={closeModal} class='btn has-icon'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path stroke='#ff1744' d='M19 5L5 19M5 5L19 19'/>
					</svg>
					<span class='label'>Cancel</span>
				</button>

				<button on:click={importAskToKeepState} class='btn has-icon align-right' disabled={parsedImport === null}>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path stroke='#4caf50' stroke-width='2' d='M4 11.5L9.5 17L19.5 7'/>
					</svg>
					<span class='label'>Apply</span>
				</button>
			</div>
		</div>
	{/if}

	{#if $opendModal === Modals.DiscardAnim}
		<div class='modal discard-anim' transition:modalAnim>
			<div class='header flex content-center-y gap-1'>
				<svg class='icon icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path stroke='#ffff00' d='M12 9V16M12 3L2 21H22L12 3ZM12 17.5L11.5 18L12 18.5L12.5 18L12 17.5Z'/>
				</svg>
				<h1>Discard Animation</h1>
			</div>

			<p>Are you sure you wan't to discard this animation?</p>

			<div class='actions flex content-center-y'>
				<button on:click={()=> dispatch('approveAnimDiscard')} class='discard btn has-icon'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8'/>
					</svg>
					<span class='label'>Discard</span>
				</button>

				<button on:click={closeModal} class='cancel btn has-icon align-right'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path stroke='#4caf50' d='M19 5L5 19M5 5L19 19'/>
					</svg>
					<span class='label'>Keep</span>
				</button>
			</div>
		</div>
	{/if}

	{#if $opendModal === Modals.DiscardWholeProject}
		<div class='modal discard-projects' transition:modalAnim>
			<div class='header flex content-center-y gap-1'>
				<svg class='icon icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path stroke='#ffff00' d='M12 9V16M12 3L2 21H22L12 3ZM12 17.5L11.5 18L12 18.5L12.5 18L12 17.5Z'/>
				</svg>
				<h1>Discard everything</h1>
			</div>

			<p>Are you sure you want to discard all projects including the targets HTML & CSS?</p>

			<div class='actions flex content-center-y'>
				<button on:click={()=> dispatch('discardAllProjects')} class='discard btn has-icon'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8'/>
					</svg>
					<span class='label'>Discard</span>
				</button>

				<button on:click={closeModal} class='cancel btn has-icon align-right'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path stroke='#4caf50' d='M19 5L5 19M5 5L19 19'/>
					</svg>
					<span class='label'>Keep</span>
				</button>
			</div>
		</div>
	{/if}

	{#if $opendModal === Modals.ImportKeepOrDiscard}
		<div class='modal import-keep-or-discard' transition:modalAnim>
			<div class='header flex content-center-y gap-1'>
				<svg class='icon stroke icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 19L12 11M12 11L15 14M12 11L9 14'/>
				</svg>
				<h1>Importing Project</h1>
			</div>

			<p>Do you want to keep or discard the current animation projects?</p>

			<div class='actions flex content-center-y'>
				<button on:click={applyImport} class='discard btn has-icon'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8'/>
					</svg>
					<span class='label'>Discard</span>
				</button>

				<button on:click={()=> applyImport(true)} class='cancel btn has-icon align-right'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path stroke='#4caf50' d='M19 5L5 19M5 5L19 19'/>
					</svg>
					<span class='label'>Keep</span>
				</button>
			</div>
		</div>
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
	background-color: rgba(#222, .75)
	justify-content: center
	overflow: auto
	transition-duration: .3s
	transition-property: opacity
	&:not(.active)
		pointer-events: none
		opacity: 0
	.modal
		display: grid
		width: 100%
		margin: auto
		grid-auto-columns: 100%
		align-content: start
		grid-gap: 1rem
		padding: 2rem
		border: solid 1px var(--border)
		background-color: var(--bg)
		box-shadow: 0 10px 40px #000
		.header
			margin-bottom: 1rem
			h1
				font-weight: 400
		.actions
			margin-top: 1rem
		textarea
			font-size: .85em
			padding: 1em
			background-color: rgba(#fff, .1)
			resize: vertical
			white-space: pre
	.modal.animation-target,
	.modal.export,
	.modal.import
	.modal.discard-anim,
	.import-keep-or-discard,
	.discard-projects
		max-width: 600px
	.modal.export > .body > .field > .label
		font-size: 1.25em
		color: var(--prime)
	.modal.discard-anim .actions > .discard,
	.modal.import-keep-or-discard .actions > .discard,
	.modal.discard-projects .actions > .discard
		color: #ff1744

.import-info
	code
		padding: .2em .5em
		background-color: rgba(#fff, .15)
	ol
		padding-left: 1.5em
		li::marker
			color: var(--prime)
	pre
		padding: .5em
		background-color: #151515
		border: solid 1px var(--border)
		opacity: .75

.import-error
	padding: 1em
	background-color: rgba(#ff1744, .25)
	border: solid 1px #ff1744
	color: var(--heading)
</style>
