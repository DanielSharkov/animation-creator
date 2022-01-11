<script lang='ts'>
import {cubicOut} from 'svelte/easing'
import {EasingFunctions} from './animation_creator'
import {cancelCreatorAction, CreatorAction, currentAction} from './App.svelte'
export let sidebarAnim
export let currentProjectStore
export let currentProject
export let selectedStep

function timeByPercentage(percentage: number) {
	return $currentProjectStore.duration / 100 * percentage
}

enum SideBarTab {Selected, Index}
let sideBarTab = SideBarTab.Selected

const timingFuncPanelAnim =(node, o?)=> ({
	duration: 250,
	css: (t)=> (
		`transform: translateX(${101 - 101 * cubicOut(t)}%);`
	)
})
</script>



<div class='sidebar-right' transition:sidebarAnim={false}>
	{#if $currentProjectStore.selectedStep === null}
		<p class='placeholder'>Select a step in the timeline</p>
	{:else}
		<div class='tabs flex'>
			<button on:click={()=> sideBarTab = SideBarTab.Selected} class:active={sideBarTab === SideBarTab.Selected}>
				Selected Step
			</button>
			<button on:click={()=> sideBarTab = SideBarTab.Index} class:active={sideBarTab === SideBarTab.Index}>
				Steps Index
			</button>
		</div>
		<div class='content'>
		{#if sideBarTab === SideBarTab.Selected}
			<div class='step-editor grid gap-1'>
				<div class='input-field'>
					<input type='number'
						id='selected-step-pos-perc'
						value={selectedStep.pos}
						min='0' step='1' max='100'
						on:change={(e)=> $currentProject.changeStepPos(Number(e.currentTarget.value))}
					/>
					<label for='selected-step-pos-perc'>
						Position by percentage
					</label>
				</div>
				<div class='input-field'>
					<input type='number'
						id='selected-step-pos-time'
						value={timeByPercentage(selectedStep.pos)}
						min='0' step='100'
						max={$currentProjectStore.duration}
						on:change={(e)=> $currentProject.changeStepPosByTime(Number(e.currentTarget.value))}
					/>
					<label for='selected-step-pos-time'>
						Position by time (ms)
					</label>
				</div>
				<div class='input-field'>
					<textarea id='selected-step-style'
						rows='10'
						value={selectedStep.styles}
						on:change={(e)=> $currentProject.updateStepStyles(e.currentTarget.value)}
					/>
					<label for='selected-step-style'>
						Styles (plain CSS)
					</label>
				</div>

				<div class='grid'>
					<button on:click={()=> $currentProject.changeStepTimingFunc()} class='btn has-icon'>
						<div class='checkbox flex content-center' class:active={selectedStep.timingFunc === undefined}>
							<svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
								<path d='M 4 11, l 5 4, l 8 -10' stroke-width='2'/>
							</svg>
						</div>
						<span class='label'>Inherit from animation</span>
					</button>
					<button on:click={()=> currentAction.set(CreatorAction.StepTimeFn)} class='btn has-icon flex'>
						<svg class='icon icon-2' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path fill='#fff' d='M3 1L1.55662 3.5L4.44338 3.5L3 1ZM3 21L2.75 21L2.75 21.25L3 21.25L3 21ZM23 21L20.5 19.5566L20.5 22.4434L23 21ZM2.75 3.25L2.75 21L3.25 21L3.25 3.25L2.75 3.25ZM3 21.25L20.75 21.25L20.75 20.75L3 20.75L3 21.25Z'/>
							<path fill='url(#paint0_linear_1552_25)' d='M3.5 20L3.5 20.5L4.5 20.5L4.5 20L3.5 20ZM20.5 4V3.5H19.5V4H20.5ZM4.5 20C4.5 17.1317 5.44511 15.5412 6.8 14.525C8.20385 13.4721 10.0962 12.9913 12.1213 12.4851C14.0962 11.9913 16.2038 11.4721 17.8 10.275C19.4451 9.04117 20.5 7.13172 20.5 4H19.5C19.5 6.86828 18.5549 8.45883 17.2 9.475C15.7962 10.5279 13.9038 11.0087 11.8787 11.5149C9.9038 12.0087 7.79615 12.5279 6.2 13.725C4.55489 14.9588 3.5 16.8683 3.5 20L4.5 20Z'/>
							<path opacity='0.5' d='M5 3H21V19' stroke='#fff' stroke-dasharray='1 1'/>
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
				</div>

				{#if $currentAction === CreatorAction.StepTimeFn}
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
							<input type='text'
								id='custom-timing-func'
								value={selectedStep.timingFunc || ''}
								on:change={(e)=> $currentProject.changeStepTimingFunc(e.currentTarget.value)}
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
										<button on:click={()=> $currentProject.changeStepTimingFunc(easeFn.value)}
										class:active={selectedStep.timingFunc === easeFn.value}
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
		{:else}
			<div class='steps-index grid gap-1'>
				{#each $currentProjectStore.steps as step, stepIdx}
					<button on:click={()=> $currentProject.selectStep(stepIdx)}
					class:active={$currentProjectStore.selectedStep === stepIdx}
					class='btn'>
						<span class='index'>{stepIdx+1}</span>
						<span class='percentage'>{step.pos}%</span>
						/
						<span class='time'>{timeByPercentage(step.pos)}ms</span>
					</button>
				{/each}
			</div>
		{/if}
		</div>
	{/if}
</div>


<style lang='stylus'>
.placeholder
	padding: 1rem

.tabs > button
	font-size: 1.15em
	flex: 1 1 auto
	padding: 1rem
	&:not(:first-child)
		border-left: solid 1px var(--border)
	&:not(.active)
		background-color: #151515
		border-bottom: solid 1px var(--border)
	&.active
		color: var(--prime)

.content
	padding: 1rem
	> .step-editor
		align-content: start
	> .steps-index
		overflow-y: auto
		> button
			padding: 0
			font-size: 1.15em
			> .index
				padding: .5em 1em
			&.active
				box-shadow: 0 0 20px var(--prime-05)
				background-color: var(--prime-01)
				border-color: var(--prime)
				color: var(--prime)
				> .index
					background-color: var(--prime)
					color: var(--bg)
</style>
