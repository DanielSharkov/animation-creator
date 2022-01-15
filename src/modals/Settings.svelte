<script>
	import {setAppTheming, AppTheming, appSettings, toggleBgBluring, toggleElRounding} from '../App.svelte'
	import {modalSlideInAnim} from '../ModalViewer.svelte'
	export let closeThisModal
</script>

<div class='modal fixed-width settings' transition:modalSlideInAnim>
	<div class='header flex content-center-y gap-1'>
		<svg class='icon stroke icon-3' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path stroke-linejoin='bevel' d='M10.3636 6.90909V2.5H12H13.6364V6.90909L14.4837 7.26879L18.0848 3.79187L20.2081 5.91524L16.7312 9.51634L17.0909 10.3636H21.5V12V13.6364H17.0909L16.7478 14.5001L20.3733 17.9196L17.9196 20.3733L14.5001 16.7478L13.6364 17.0909V21.5H12H10.3636V17.0909L9.4999 16.7478L6.08042 20.3733L3.62669 17.9196L7.25216 14.5001L6.90909 13.6364H2.5V12V10.3636H6.90909L7.26879 9.51634L3.79187 5.91524L5.91524 3.79187L9.51634 7.26879L10.3636 6.90909Z'/>
			<circle cx='12' cy='12' r='2.5'/>
		</svg>
		<h1>Settings</h1>
	</div>

	<div class='field grid gap-05'>
		<span class='label'>Theming</span>
		<div class='options btn-group'>
			<button on:click={()=> setAppTheming(AppTheming.System)}
			class:active={$appSettings.theme === AppTheming.System}>
				System
			</button>
			<button on:click={()=> setAppTheming(AppTheming.Light)}
			class:active={$appSettings.theme === AppTheming.Light}>
				Light
			</button>
			<button on:click={()=> setAppTheming(AppTheming.Dark)}
			class:active={$appSettings.theme === AppTheming.Dark}>
				Dark
			</button>
		</div>
	</div>

	<div class='field'>
		<button on:click={toggleElRounding} class='btn has-icon'>
			<div class='checkbox flex content-center' class:active={$appSettings.elRounding}>
				<svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M 4 11, l 5 4, l 8 -10' stroke-width='2'/>
				</svg>
			</div>
			<span class='label'>Elements rounding</span>
		</button>
	</div>

	<div class='field'>
		<button on:click={toggleBgBluring} class='btn has-icon'>
			<div class='checkbox flex content-center' class:active={$appSettings.bluring}>
				<svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M 4 11, l 5 4, l 8 -10' stroke-width='2'/>
				</svg>
			</div>
			<span class='label'>Background bluring (performance impact)</span>
		</button>
	</div>

	<div class='actions flex content-center-y'>
		<button on:click={closeThisModal} class='close btn align-right'>
			Close
		</button>
	</div>
</div>
