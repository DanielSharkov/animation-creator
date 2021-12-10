<script lang='ts'>
	export let sidebarAnim
	export let currentProjectStore
	export let currentProject
	export let selectedStep

	function timeByPercentage(percentage: number) {
		return $currentProjectStore.duration / 100 * percentage
	}

	enum SideBarTab {Selected, Index}
	let sideBarTab = SideBarTab.Selected
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
		background-color: #222
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
