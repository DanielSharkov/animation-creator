<script lang='ts'>
	import {AnimationProject, AnimDirection, AnimFillmode, EasingFunctions} from './animation_creator'
	import {cubicOut} from 'svelte/easing'
	import {cancelCreatorAction, CreatorAction, currentAction, animations} from './App.svelte'
	import {openModal} from './ModalViewer.svelte'
	import ModalDiscard from './modals/Discard.svelte'
	import ModalTimingFnEdit from './modals/TimingFnEdit.svelte'

	export let sidebarAnim
	export let doesAnimTargetElExist: boolean
	export let currentProject: SvelteStore<AnimationProject>
	export let currentProjectStore

	const timingFuncPanelAnim =(node, o?)=> ({
		duration: 250,
		css: (t)=> (
			`transform: translateX(${101 - 101 * cubicOut(t)}%);`
		)
	})

	function changeTargetElSelector(e: Event & {currentTarget: EventTarget & HTMLInputElement}) {
		const sltr = e.currentTarget.value
		try {
			// check if selector is valid
			document.querySelector(sltr)
			$currentProject.targetChangeSelector(sltr)
		} catch(err) {
			e.currentTarget.value = $currentProjectStore.targetEl
		}
	}

	function discardAnim() {
		openModal({
			comp: ModalDiscard,
			props: {
				title: 'Discard Animation',
				msg: 'Are you sure you wan\'t to discard this animation?',
				discard: (closeModal)=> {
					animations.discardProject()
					closeModal()
				},
				keep: (closeModal)=> closeModal(),
			},
		})
	}

	function visualTimingFnEditor() {
		openModal({
			comp: ModalTimingFnEdit,
			opts: {noEsc: true},
			props: {
				preset: $currentProjectStore.timingFunc || undefined,
				apply(timingFn) {
					$currentProject.changeTimingFunc(timingFn)
				},
			},
		})
	}
</script>



<div class='sidebar-left grid gap-15' transition:sidebarAnim={true}>
	<div class='header flex nowrap content-center-y gap-05'>
		<h1>Animtion Settings</h1>

		<button on:click={discardAnim} class='discard btn even-pdg small align-right'>
			<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
				<path d='M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8'/>
			</svg>
		</button>
	</div>

	<div class='input-field'>
		{#if !doesAnimTargetElExist}
			<div class='selector-search-not-found flex content-center-y gap-05'>
				<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M12 9V16M12 3L2 21H22L12 3ZM12 17.5L11.5 18L12 18.5L12.5 18L12 17.5Z'/>
				</svg>
				<span>Element not found</span>
			</div>
		{/if}
		<input type='text'
			id='target-query-input'
			value={$currentProjectStore.targetEl}
			on:change={changeTargetElSelector}
		/>
		<label for='target-query-input'>
			CSS selector for Element
		</label>
	</div>

	<div class='input-field'>
		<input
			id='animation-name'
			type='text'
			value={$currentProjectStore.name}
			on:change={(e)=> $currentProject.changeName(e.currentTarget.value)}
		/>
		<label for='animation-name'>Name</label>
	</div>

	<div class='input-field'>
		<button on:click={()=> $currentProject.toggleStepsRelativeOnTime()} class='btn has-icon'>
			<div class='checkbox flex content-center' class:active={$currentProjectStore.stepsRelativeToTime}>
				<svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M 4 11 l 5 4 l 8 -10' stroke-width='2'/>
				</svg>
			</div>
			<span class='label'>Steps relative to time</span>
		</button>
		<input
			id='animation-duration'
			type='number'
			min='0'
			value={$currentProjectStore.duration}
			on:change={(e)=> $currentProject.changeDuration(Number(e.currentTarget.value))}
		/>
		<label for='animation-duration'>Duration</label>
	</div>

	<div class='input-field'>
		<input
			id='animation-delay'
			type='number'
			min='0'
			value={$currentProjectStore.delay}
			on:change={(e)=> $currentProject.changeDelay(Number(e.currentTarget.value))}
		/>
		<label for='animation-delay'>Delay</label>
	</div>

	<div class='input-field'>
		<input
			id='animation-iteration-count'
			type='number'
			min='0'
			value={$currentProjectStore.iterations}
			on:change={(e)=> $currentProject.changeIterations(Number(e.currentTarget.value))}
		/>
		<label for='animation-iteration-count'>
			Iteration count (0 = infinite)
		</label>
	</div>

	<div class='grid gap-05'>
		<span class='label'>Fill mode</span>
		<div class='btn-group'>
			<button on:click={()=> $currentProject.changeFillMode(AnimFillmode.None)}
			class:active={$currentProjectStore.fillMode === AnimFillmode.None}>
				<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M19 5L5 19M5 5L19 19'/>
				</svg>
			</button>
			<button on:click={()=> $currentProject.changeFillMode(AnimFillmode.Forwards)}
			class:active={$currentProjectStore.fillMode === AnimFillmode.Forwards}>
				Forwards
			</button>
			<button on:click={()=> $currentProject.changeFillMode(AnimFillmode.Backwards)}
			class:active={$currentProjectStore.fillMode === AnimFillmode.Backwards}>
				Backwards
			</button>
			<button on:click={()=> $currentProject.changeFillMode(AnimFillmode.Both)}
			class:active={$currentProjectStore.fillMode === AnimFillmode.Both}>
				Both
			</button>
		</div>
	</div>

	<div class='grid gap-05'>
		<span class='label'>Direction</span>
		<div class='btn-group'>
			<button on:click={()=> $currentProject.changeDirection(AnimDirection.None)}
			class:active={$currentProjectStore.direction === AnimDirection.None}>
				<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M19 5L5 19M5 5L19 19'/>
				</svg>
			</button>
			<button on:click={()=> $currentProject.changeDirection(AnimDirection.Normal)}
			class:active={$currentProjectStore.direction === AnimDirection.Normal}>
				Normal
			</button>
			<button on:click={()=> $currentProject.changeDirection(AnimDirection.Reverse)}
			class:active={$currentProjectStore.direction === AnimDirection.Reverse}>
				Reverse
			</button>
			<button on:click={()=> $currentProject.changeDirection(AnimDirection.Alternate)}
			class:active={$currentProjectStore.direction === AnimDirection.Alternate}>
				Alternate
			</button>
			<button on:click={()=> $currentProject.changeDirection(AnimDirection.AlternateReverse)}
			class:active={$currentProjectStore.direction === AnimDirection.AlternateReverse}>
				Alt-Reverse
			</button>
		</div>
	</div>

	<button on:click={()=> currentAction.set(CreatorAction.PrjTimeFn)} class='btn has-icon flex'>
		<svg class='icon icon-2' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
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
		<span class='label'>Timing Function</span>
		<svg class='icon stroke icon-15 align-right' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path d='M8 20.9706L16.9853 11.9853L8 3.00002'/>
		</svg>
	</button>

	{#if $currentAction === CreatorAction.PrjTimeFn}
	<div class='timing-func-panel grid gap-1' transition:timingFuncPanelAnim>
		<div class='header flex content-center-y gap-1'>
			<button on:click={cancelCreatorAction} class='btn even-pdg'>
				<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M16.9854 3L8.00007 11.9853L16.9854 20.9706'/>
				</svg>
			</button>
			<h1>Timing Functions</h1>
		</div>

		<div class='options grid gap-1'>
			<div class='input-field'>
				<button on:click={visualTimingFnEditor} class='btn has-icon'>
					<svg class='icon icon-2' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path class='stroke' d='M8.5 2.5V21.5M15.5 2.5V21.5M2.5 15.5H21.5M2.5 8.5H21.5' stroke-opacity='0.1' stroke-width='0.5'/>
						<path d='M2.5 21.5C17 17 7 7 21.5 2.5' stroke='url(#paint0_linear_1908_2)' stroke-linecap='round'/>
						<path class='stroke' d='M7 7L21.5 2.5M2.5 21.5L17 17' stroke-width='0.5' stroke-linecap='round'/>
						<path class='stroke' d='M21.75 21.75H2.25V2.25H21.75V21.75Z' stroke-opacity='0.5' stroke-width='0.5'/>
						<defs>
						<linearGradient id='paint0_linear_1908_2' x1='12' y1='3' x2='12' y2='21' gradientUnits='userSpaceOnUse'>
							<stop stop-color='#3D8AFF'/>
							<stop offset='1' stop-color='#15DF66'/>
						</linearGradient>
						</defs>
					</svg>
					<span class='label'>Visual cubic-bezier editor</span>
				</button>
				<input type='text'
					id='custom-timing-func'
					value={$currentProjectStore.timingFunc}
					on:change={(e)=> $currentProject.changeTimingFunc(e.currentTarget.value)}
				/>
				<label for='custom-timing-func'>Customize timing function</label>
			</div>

			{#each Object.keys(EasingFunctions) as easeGroupID}
				<div class='group grid gap-05'>
					<span class='name'>
						{EasingFunctions[easeGroupID].name}
					</span>
					<div class='options flex gap-05'>
						{#each EasingFunctions[easeGroupID].options as easeFn}
							<button on:click={()=> $currentProject.changeTimingFunc(easeFn.value)}
							class:active={$currentProjectStore.timingFunc === easeFn.value}
							class='btn even-pdg'>
								<span class='name'>{easeFn.name}</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
	{/if}
</div>



<style lang='stylus'>
	.header
		.discard
			&:hover
				box-shadow: 0 0 20px var(--clr-red)
				background-color: var(--clr-red-025)
				border-color: var(--clr-red)
				color: var(--clr-red)
			&:active, &:focus
				box-shadow: 0 0 20px var(--clr-red)
				background-color: var(--clr-red)
				border-color: var(--clr-red)
				color: #fff

	.selector-search-not-found
		padding: .5em
		border-radius: var(--btn-radius)
		background-color: var(--clr-yellow)
		color: #000
</style>
