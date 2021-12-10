const sveltePreprocess = require('svelte-preprocess')

module.exports = {
	preprocess: sveltePreprocess({sourceMap: true}),
	compilerOptions: {
		// enable run-time checks when not in production
		dev: true
	}
}
