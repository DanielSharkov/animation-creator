<script context='module' lang='ts'>
export enum CreatorAction {
	None, AddStep, DeleteStep, ChangeVpBg, PrjTimeFn, StepTimeFn,
}
export const currentAction = writable(CreatorAction.None)

export function cancelCreatorAction() {
	currentAction.set(CreatorAction.None)
}
</script>



<script lang='ts'>
import {onMount} from 'svelte'
import {AnimationCreator, AnimStep, AnimDirection, AnimFillmode} from './animation_creator'
import {cubicInOut} from 'svelte/easing'
import {derived, get as getStore, Unsubscriber, writable} from 'svelte/store'
import {renderAllKeyframeStyles, buildCursorKeyframeStyle, wrapInTags, selectedKeyframeStyle, debounce} from './utils'
import ModalViewer, {closeModal, Modals, openModal} from './ModalViewer.svelte'
import SidebarLeft from './SidebarLeft.svelte'
import SidebarRight from './SidebarRight.svelte'

let targetViewportEl: HTMLDivElement
let targetShadowDOM: ShadowRoot
onMount(()=> {
	targetShadowDOM = targetViewportEl.attachShadow({mode: 'open'})
	animations.selectProject(0)
})

const animations = new AnimationCreator
const currentProject = derived(animations, ($)=> $.projects[$.curPrj])
const currentProjectReacted = derived(currentProject, ($)=> $)
$:currentProjectStore = $currentProject
$:doesAnimTargetElExist = (
	targetShadowDOM &&
	$currentProjectStore.targetEl &&
	!!targetShadowDOM.querySelector($currentProjectStore.targetEl)
)

let selectedStep: AnimStep
let stepsExisting: boolean = false
let durationSteps: number[] = []
let playerCursorStyles: string

$:isAnimPlaying = animationState === AnimationState.Playing
$:isAnimPaused = animationState === AnimationState.Paused
$:isAnimStopped = animationState === AnimationState.Stopped
$:playerCursorState = (
	isAnimPlaying || isAnimStopped ? 'running' : 'paused'
)

enum AnimationState {Stopped, Playing, Paused}
let animationState = AnimationState.Stopped

let playOnlyCurSelAnim = writable(true)
function togglePlayOnlyCurSelAnim() {
	playOnlyCurSelAnim.set(!$playOnlyCurSelAnim)
}
playOnlyCurSelAnim.subscribe(async ()=> {
	if (isAnimPlaying) {
		stopAnimation()
		setTimeout(playAnimation)
	}
})

function playAnimation() {
	animationState = AnimationState.Playing

	for (let prjIdx = 0; prjIdx < $animations.projects.length; prjIdx++) {
		if ($playOnlyCurSelAnim && prjIdx !== $animations.curPrj) {
			continue
		}

		const prjStr = getStore($animations.projects[prjIdx])
		if (prjStr.targetEl === '') continue
		const el = (
			targetShadowDOM.querySelector(prjStr.targetEl) as HTMLElement
		)
		if (!el) continue
		el.style.animationPlayState = 'running'
		el.style.animationName = prjStr.name
		el.style.animationDuration = prjStr.duration + 'ms'
		el.style.animationDelay = prjStr.delay + 'ms'
		el.style.animationIterationCount = (
			prjStr.iterations === 0 ? 'infinite' : '' + prjStr.iterations
		)
		if (prjStr.fillMode !== AnimFillmode.None) {
			el.style.animationFillMode = prjStr.fillMode
		} else {
			el.style.animationFillMode = null
		}
		if (prjStr.direction !== AnimDirection.None) {
			el.style.animationDirection = prjStr.direction
		} else {
			el.style.animationDirection = null
		}
		if (prjStr.timingFunc !== '') {
			el.style.animationTimingFunction = prjStr.timingFunc
		}
	}
}

function pauseAnimation() {
	animationState = AnimationState.Paused
	for (const prj of $animations.projects) {
		const prjStr = getStore(prj)
		if (prjStr.targetEl === '') continue
		const el = (
			targetShadowDOM.querySelector(prjStr.targetEl) as HTMLElement
		)
		if (!el) continue
		el.style.animationPlayState = 'paused'
	}
}

function stopAnimation() {
	animationState = AnimationState.Stopped
	for (const prj of $animations.projects) {
		const prjStr = getStore(prj)
		if (prjStr.targetEl === '') continue
		const el = (
			targetShadowDOM.querySelector(prjStr.targetEl) as HTMLElement
		)
		if (!el) continue
		el.style.animationName = null
		el.style.animationDuration = null
		el.style.animationDelay = null
		el.style.animationIterationCount = null
		el.style.animationFillMode = null
		el.style.animationDirection = null
		el.style.animationTimingFunction = null
	}
}

let timelineEl: HTMLDivElement
function timelineClick(e) {
	if ($currentAction === CreatorAction.AddStep) {
		const newIdx = $currentProject.addStep(
			Number((100 / timelineEl.clientWidth * e.offsetX).toFixed(0))
		)
		if (newIdx > -1) {
			$currentProject.selectStep(newIdx)
		}
	}
}

let movingStepIdx: number = null
let movingStepPos: number = null
function windowPointerUp(e: PointerEvent) {
	// Re-positioning step
	if (movingStepIdx !== null) {
		$currentProject.changeStepPos(movingStepPos)
		movingStepIdx = null
		movingStepPos = null
	}
	// Creating new step
	else if (movingStepPos !== null) {
		movingStepPos = null
	}
}

function timelinePointerMove(e: PointerEvent) {
	if (movingStepIdx !== null || $currentAction === CreatorAction.AddStep) {
		movingStepPos = (
			Number((100 / timelineEl.clientWidth * e.offsetX).toFixed(0))
		)
	}
}

function timelineStepGrabbing(pos: number, idx: number) {
	if ($currentAction === CreatorAction.None) {
		$currentProject.selectStep(idx)
		movingStepIdx = idx
		movingStepPos = pos
	}
	else if ($currentAction === CreatorAction.DeleteStep) {
		$currentProject.discardStep(idx)
	}
}

$:stepPos =(pos: number, idx: number)=> (
	idx === movingStepIdx ? movingStepPos : pos
)

function userKeyboardInput(e: KeyboardEvent) {
	const target = e.target as HTMLElement
	if (
		target?.tagName &&
		(target.tagName.toLowerCase() === 'input' ||
		target.tagName.toLowerCase() === 'textarea')
	) {
		if (e.key.toLowerCase() === 'escape') {
			target.blur()
		}
		return
	}

	if (e.key.toLowerCase() === 'escape') {
		e.preventDefault()
		cancelCreatorAction()
	}

	if (e.key.toLowerCase() === ' ') {
		if (isAnimPlaying) pauseAnimation()
		else playAnimation()
	}

	if (e.key.toLowerCase() === 's') {
		stopAnimation()
	}

	if ('0123456789'.includes(e.key)) {
		keyboardSelectStep += e.key
		selectStepDebouncer()
	}

	if (e.key.toLowerCase() === 'a') {
		if (e.ctrlKey) {
			e.preventDefault()
			togglePlayOnlyCurSelAnim()
		}
	}
}

let keyboardSelectStep = ''
let selectStepDebouncer = debounce(()=> {
	const idx = Number(keyboardSelectStep)
	if (idx > 0 && idx <= $currentProjectStore.steps.length) {
		$currentProject.selectStep(idx-1)
	}
	if (idx > $currentProjectStore.steps.length) {
		console.log('not existing')
	}
	keyboardSelectStep = ''
}, 350)

function toggleAddStepMode() {
	if ($currentAction === CreatorAction.AddStep) {
		cancelCreatorAction()
	}
	else currentAction.set(CreatorAction.AddStep)
}

function toggleDeleteStepMode() {
	if ($currentAction === CreatorAction.DeleteStep) {
		cancelCreatorAction()
	}
	else currentAction.set(CreatorAction.DeleteStep)
}

function toggleChangeVpBg() {
	if ($currentAction === CreatorAction.ChangeVpBg) {
		cancelCreatorAction()
	}
	else currentAction.set(CreatorAction.ChangeVpBg)
}

function approveAnimDiscard() {
	animations.discardProject()
	closeModal()
}

function discardAllProjects() {
	animations.reset()
	closeModal()
}

function onOpenModal(id: Modals) {
	stopAnimation()
}

let showSidebarLeft = true
let showSidebarRight = true

const sidebarAnim =(node, isLeft: boolean)=> ({
	duration: 300,
	css: (t)=> (
		`transform: translateX(`+
			(isLeft ? '-' : '') +
			(101 - 101 * cubicInOut(t))
		+`%);`
	)
})

const colorPickerAnim =(node, o?)=> ({
	duration: 150,
	css: (t)=> (
		`opacity: ${cubicInOut(t)};` +
		`transform: translateY(-${1-cubicInOut(t)}rem);`
	)
})

function newProject() {
	stopAnimation()
	animations.newProject()
}

function changeProject(prjIdx: number) {
	if (isAnimPlaying) {
		stopAnimation()
		setTimeout(playAnimation)
	}
	animations.selectProject(prjIdx)
}

let _cachedTargetStyles: string = null
let _cachedTargetHTML: string = null
let currentProjectWatcher: Unsubscriber
let selectedStepWatcher: Unsubscriber
animations.subscribe(()=> {
	if (currentProjectWatcher) {
		currentProjectWatcher()
	}

	currentProjectWatcher = currentProjectReacted.subscribe(()=> {
		if (selectedStepWatcher) {
			selectedStepWatcher()
		}
		selectedStepWatcher = $currentProjectReacted.subscribe(($)=> {
			animations.syncProjectsWithStorage()

			selectedStep = $.steps[$.selectedStep]
			stepsExisting = $.steps.length > 0
			durationSteps = Array(Number(($.duration/250).toFixed(0)) + 1)
			if (targetShadowDOM) {
				const html = $animations.target.html
				const styles = (
					$animations.target.css +'\n'+
					renderAllKeyframeStyles($animations.projects, true) +'\n'+
					buildCursorKeyframeStyle($.steps) +'\n'+
					($.selectedStep === null ? '' : selectedKeyframeStyle(
						$.targetEl,
						$.steps[$.selectedStep].styles,
					))
				)
				if (html !== _cachedTargetHTML) {
					_cachedTargetHTML = html
					_cachedTargetStyles = styles
					targetShadowDOM.innerHTML = (
						wrapInTags('style', styles) +'\n'+
						$animations.target.html
					)
				}
				else if (styles !== _cachedTargetStyles) {
					targetShadowDOM.querySelector('style').remove()
					const stylesheet = document.createElement('style')
					stylesheet.innerText = styles
					targetShadowDOM.appendChild(stylesheet)
					_cachedTargetStyles = styles
				}
			}
			playerCursorStyles = (
				`animation-direction: ${$.direction};` +
				`animation-timing-function: ${$.timingFunc};` +
				`animation-duration: ${$.duration}ms;` +
				`animation-iteration-count: ${
					$.iterations > 0 ? $.iterations : 'infinite'
				};`
			)
	
			if (animationState === AnimationState.Playing && targetShadowDOM) {
				const el: HTMLElement = targetShadowDOM.querySelector(
					$currentProjectStore.targetEl
				)
				if (el) {
					el.style.animationPlayState = 'running'
					el.style.animationName = $.name
					el.style.animationDuration = $.duration + 'ms'
					el.style.animationDelay = $.delay + 'ms'
					el.style.animationIterationCount = (
						$.iterations === 0 ? 'infinite' : '' + $.iterations
					)
					if ($.fillMode !== AnimFillmode.None) {
						el.style.animationFillMode = $.fillMode
					} else {
						el.style.animationFillMode = null
					}
					if ($.direction !== AnimDirection.None) {
						el.style.animationDirection = $.direction
					} else {
						el.style.animationDirection = null
					}
					if ($.timingFunc !== '') {
						el.style.animationTimingFunction = $.timingFunc
					}
				}
			}
		})
	})
})
</script>

<svelte:window
	on:keydown={userKeyboardInput}
	on:pointerup|passive={windowPointerUp}
/>

<main>
	<header>
		<div class='tab-bar flex nowrap'>
			<div class='tabs flex nowrap'>
				{#each $animations.projects as prj, prjIdx}
					<button on:click={()=> changeProject(prjIdx)}
					class:active={prjIdx === $animations.curPrj}>
						{#if prjIdx === $animations.curPrj}
							{$currentProjectStore.name}
						{:else}
							{getStore(prj).name}
						{/if}
					</button>
				{/each}

				<button on:click={newProject} class='new-project'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M12 4V20M4 12H20'/>
					</svg>
				</button>

				<div class='empty-space'></div>
			</div>

			<div class='options flex align-right'>
				<button on:click={()=> openModal(Modals.Import)} class='import flex content-center gap-05'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 19L12 11M12 11L15 14M12 11L9 14'/>
					</svg>
					<span class='label'>Import</span>
				</button>
	
				<button on:click={()=> openModal(Modals.Export)} class='export flex content-center gap-05'>
					<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 11V19M12 19L9 16M12 19L15 16'/>
					</svg>
					
					<span class='label'>Export</span>
				</button>
			</div>
		</div>

		<div class='project-options flex content-center-y nowrap gap-1'>
			<button on:click={()=> showSidebarLeft = !showSidebarLeft} class='btn even-pdg'>
				<svg class='icon stroke icon-2' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M3 6H21'/> <path d='M3 12H21'/> <path d='M3 18H15'/>
				</svg>
			</button>

			<button on:click={()=> openModal(Modals.Target)} class='btn has-icon'>
				<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M15.7736 5.36887C14.3899 4.50149 12.7535 4 11 4C6.02944 4 2 8.02944 2 13C2 17.9706 6.02944 22 11 22C15.9706 22 20 17.9706 20 13C20 11.3038 19.5308 9.71728 18.7151 8.36302'/>
					<path d='M12.8458 8.35174C12.2747 8.12477 11.6519 8 11 8C8.23858 8 6 10.2386 6 13C6 15.7614 8.23858 18 11 18C13.7614 18 16 15.7614 16 13C16 12.4099 15.8978 11.8438 15.7101 11.3182'/>
					<path d='M12 12L18 6M20 4V1.73698e-07M20 4H24M20 4L18 6M20 4L23 1M18 6L18 2M18 6L22 6'/>
					<circle cx='11' cy='13' r='1.5'/>
				</svg>
				<span class='label'>Target element</span>
			</button>

			<button on:click={togglePlayOnlyCurSelAnim} class='btn has-icon'>
				<div class='checkbox flex content-center' class:active={!$playOnlyCurSelAnim}>
					<svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path d='M 4 11, l 5 4, l 8 -10' stroke-width='2'/>
					</svg>
				</div>
				<span class='label'>Play all animations</span>
			</button>

			<div class='viewport-bg-picker'
			class:transparent-bg={$animations.viewportBg === 'transparent'}>
				<button on:click={toggleChangeVpBg} class='btn has-icon'>
					<div class='color-preview' style='background-color: {$animations.viewportBg};'/>
					<span class='label'>Viewport Bg color</span>
				</button>
				{#if $currentAction === CreatorAction.ChangeVpBg}
					<div class='disclosure flex content-center gap-05' transition:colorPickerAnim>
						<button class='set-transparent' on:click={()=> animations.setViewportBg('transparent')}>
							<div class='color-preview'/>
						</button>
						<span>or</span>
						<div class='input-wrapper'>
							<div
								class='color-preview'
								style='background-color: {$animations.viewportBg}'
							/>
							<input type='color'
								value={$animations.viewportBg}
								on:input={(e)=> animations.setViewportBg(e.currentTarget.value)}
							/>
						</div>
					</div>
				{/if}
			</div>

			<button on:click={()=> openModal(Modals.DiscardWholeProject)} class='btn has-icon'>
				<svg class='icon stroke icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8'/>
				</svg>
				<span class='label'>Discard everything</span>
			</button>

			<button on:click={()=> showSidebarRight = !showSidebarRight} class='btn even-pdg align-right'>
				<svg class='icon stroke icon-2' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M3 6H21'/> <path d='M3 12H21'/> <path d='M9 18H21'/>
				</svg>
			</button>
		</div>
	</header>

	<div id='Viewport' class='flex nowrap'
	class:transparent-bg={$animations.viewportBg === 'transparent'}>
		{#if showSidebarLeft}
		<SidebarLeft
			{sidebarAnim}
			{openModal}
			{doesAnimTargetElExist}
			{currentProject}
			{currentProjectStore}
		/>
		{/if}

		<div
			id='AnimationTarget'
			class='flex content-center'
			style='background-color: {$animations.viewportBg};'
			bind:this={targetViewportEl}
		/>

		{#if showSidebarRight}
		<SidebarRight
			{sidebarAnim}
			{currentProjectStore}
			{currentProject}
			{selectedStep}
		/>
		{/if}
	</div>

	<div id='AnimationSteps'>
		<div class='controls flex gap-1 nowrap'>
			<div class='anim flex gap-1 nowrap'>
				<button on:click={playAnimation}
				disabled={!stepsExisting || isAnimPlaying}
				class='btn even-pdg'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path fill='#448aff' d='M6 20L6 4L20 12L6 20Z'/>
					</svg>
				</button>

				<button on:click={pauseAnimation}
				disabled={!stepsExisting || isAnimPaused || isAnimStopped}
				class='btn even-pdg'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path fill='#4caf50' d='M6 20V4h4v16H6ZM14 20V4h4v16h-4Z'/>
					</svg>
				</button>

				<button on:click={stopAnimation}
				disabled={!stepsExisting || isAnimStopped}
				class='btn even-pdg'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path fill='#ff1744' d='M5 19V5H19V19H5Z'/>
					</svg>
				</button>
			</div>

			<div class='steps flex gap-1 nowrap align-right'>
				<button on:click={toggleAddStepMode}
				class:pulse={!stepsExisting && $currentAction !== CreatorAction.AddStep}
				class='btn has-icon'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path stroke='#4caf50' d='M12 4V20M4 12H20'/>
					</svg>
					<span class='label'>
						{#if $currentAction === CreatorAction.AddStep}
							Cancel
						{:else}
							Add a step
						{/if}
					</span>
				</button>

				<button on:click={toggleDeleteStepMode}
				disabled={!stepsExisting}
				class='btn has-icon'>
					<svg class='icon icon-15' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path stroke='#ff1744' d='M19 5L5 19M5 5L19 19'/>
					</svg>
					<span class='label'>
						{#if $currentAction === CreatorAction.DeleteStep}
							Cancel
						{:else}
							Discard a step
						{/if}
					</span>
				</button>
			</div>
		</div>

		<div class='timeline'
		bind:this={timelineEl}
		on:click={timelineClick}
		on:pointermove={timelinePointerMove}
		class:add-mode={$currentAction === CreatorAction.AddStep}
		class:delete-mode={$currentAction === CreatorAction.DeleteStep}>
			<div class='percent-steps'>
				{#each Array(100) as _}<div/>{/each}
			</div>
			<div class='duration-steps'>
				{#each durationSteps as _, stepIdx}
					<div class='flex content-center' style='left: {100 / $currentProjectStore.duration * (250 * stepIdx)}%;'>
						<span>{.25 * stepIdx}s</span>
					</div>
				{/each}
			</div>
			<div class='actual-steps flex nowrap' class:moving={movingStepIdx !== null}>
				{#each $currentProjectStore.steps as step, stepIdx}
					<button on:pointerdown={(e)=> timelineStepGrabbing(step.pos, stepIdx)}
					class='step flex content-center'
					class:ignored={step.styles === ''}
					class:selected={stepIdx === $currentProjectStore.selectedStep}
					style='left: {stepPos(step.pos, stepIdx)}%; animation-delay: {100 * Math.random()}ms;'>
						{#if step.styles === ''}
							<span class='ignored-label'>Ignored<br>No styles</span>
						{/if}
						<div class='clickable'></div>
						<span class='indicator'>{stepPos(step.pos, stepIdx)}%</span>
					</button>
				{/each}
			</div>
			<div class='player-cursor'>
				{@html wrapInTags('style', buildCursorKeyframeStyle($currentProjectStore.steps))}
				<div
					class='cursor' class:stopped={isAnimStopped}
					on:animationend={(e)=> isAnimPlaying ? stopAnimation() : 0}
					style={`animation-play-state: ${playerCursorState};` + playerCursorStyles}
				/>
			</div>
			{#if $currentAction === CreatorAction.AddStep && movingStepPos !== null}
				<div class='creation-pseudo-step'>
					<div class='step flex content-center' style='left: {movingStepPos}%;'>
						<span class='indicator'>{movingStepPos}%</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>



<ModalViewer
	{animations}
	{onOpenModal}
	on:approveAnimDiscard={approveAnimDiscard}
	on:discardAllProjects={discardAllProjects}
/>



<style lang='stylus' global>@import './global';</style>
