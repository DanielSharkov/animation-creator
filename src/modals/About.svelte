<script>
	import {modalSlideInAnim} from '../ModalViewer.svelte'
	export let closeThisModal
</script>

<div class='modal fixed-width about-app' transition:modalSlideInAnim>
	<div class='header grid'>
		<img class='logo' src='app-icon/ico-512.png' alt='Logo'/>
		<h1>Animation Creator</h1>
		<p>
			A free css keyframer app made with <span class='beating-heart'>❤️</span>
			by <a href='https://danielsharkov.github.io/danielsharkov_com' class='link'>Daniel Sharkov</a>.
		</p>
	</div>

	<section id='stack'>
		<h1>Stack 🧱</h1>
		<div class='stack-list grid'>
			<div class='labels grid'>
				<span>Frontend</span>
				<span>Hosting</span>
				<span>Icons</span>
			</div>
			<div class='values grid'>
				<span><a href='https://svelte.dev' class='link'>Svelte</a>, <a href='https://stylus-lang.com/' class='link'>Stylus</a></span>
				<span>GitHub Pages</span>
				<span>Self made with <a href='https://figma.com' class='link'>Figma</a></span>
			</div>
		</div>
	</section>

	<section id='thankyou'>
		<h1>Thank you! 💖</h1>
		<p>
			I hope you're enjoying this css keyframer tool.
			I also hope that it may have saved you a lot of time
			and made your work an ease. I would really appreciate a
			<a href='https://github.com/DanielSharkov/animation-creator' class='link'>star on the repository ⭐</a>! 😁
		</p>
		<p>Stay safe & healthy!</p>
	</section>

	<div class='actions flex content-center-y'>
		<button on:click={closeThisModal} class='btn align-right'>
			<span class='label'>Close</span>
		</button>
	</div>
</div>

<style lang='stylus'>
	.modal
		grid-gap: 2rem
		> .header
			margin: 0
			place-self: center
			place-items: center
			> .logo
				width: 16rem
				height: 16rem
			> h1
				margin-top: .5em
				font-size: 2.5rem
		section
			> h1
				font-size: 2rem
				font-weight: 400
				margin-bottom: .25em
		.stack-list
			width: 100%
			grid-template-columns: auto 1fr
			border: solid 1px var(--border)
			border-radius: var(--modal-radius)
			overflow: hidden
			> div > span
				padding: .5em
				&:not(:last-child)
					border-bottom: solid 1px var(--border)
			> .labels
				border-right: solid 1px var(--border)
				> span
					padding: .5em 1em
					background-color: var(--fg)
					color: var(--heading)

	.beating-heart
		display: inline-block
		animation: infinite 1.25s heartBeating

	@keyframes heartBeating
		0%	 {transform: scale(1)}
		15%	 {transform: scale(1.125)}
		30%	 {transform: scale(1)}
		45%	 {transform: scale(1.25)}
		100% {transform: scale(1)}
</style>
