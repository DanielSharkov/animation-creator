import {AnimationProject, AnimationProjectPreset, AnimDirection, AnimFillmode, AnimStep} from './animation_creator'
import {get as getStore} from 'svelte/store'

export function debounce(func: (...attrs: any)=> any, wait: number): (...attrs: any)=> any {
	let timeout = null
	return function() {
		let context = this
		let args = arguments
		clearTimeout(timeout)
		timeout = setTimeout(function() {
			timeout = null
			func.apply(context, args)
		}, wait || 0)
	}
}

export function htmlDecode(x: string) {
	const doc = new DOMParser().parseFromString(x, 'text/html')
	return doc.documentElement.textContent
}

export function indentCode(code: string, step = 1) {
	let indent = ''
	for (let itr = 0; itr < step; itr++) {
		indent += '\t'
	}

	let str = ''
	let idx = 0
	const cssRules = parseCssRules(code)
	for (const rule of Object.keys(cssRules)) {
		str += `${indent}${rule}: ${cssRules[rule]};`
		if (idx+1 < Object.keys(cssRules).length) {
			str += '\n'
		}
		idx++
	}
	return str
}

export function wrapInTags(tagName: string, val: string) {
	return (
		htmlDecode('&lt;'+ tagName+ '&gt;')
		+ val
		+ htmlDecode('&lt;/'+ tagName +'&gt;')
	)
}

export function renderAllKeyframeStyles(prjs: AnimationProject[], isExport = false) {
	let css = ''
	let idx = 0
	for (const prj of prjs) {
		const $ = getStore(prj)
		css += buildKeyframeStyle($.name, $.steps, isExport)
		if (idx+1 < prjs.length) {
			css += '\n\n'
		}
		idx++
	}
	return css
}

export function buildKeyframeStyle(name: string, steps: Array<AnimStep>, isExport = false) {
	let css = `@keyframes ${name} {\n`
	for (const step of steps) {
		if (step.styles === '') continue
		let code = step.styles
		if (step.timingFunc && isExport) {
			code += (
				'animation-timing-function: ' + step.timingFunc + ';\n'
			)
		}
		css += `\t${step.pos}% {\n${indentCode(code, 2)}\n\t}\n`
	}
	return css + '}'
}

export function buildCursorKeyframeStyle(steps: Array<AnimStep>) {
	let css = `@keyframes moveCursor {\n`
	for (const step of steps) {
		if (step.styles === '') continue
		css += `\t${step.pos}% {transform: translateX(${step.pos}%)}\n`
	}
	css += '\tto {transformX(100%)}'
	return css + '}'
}

export function selectedKeyframeStyle(target: string, css: string) {
	return `${target} {transition: .1s all linear;${css}}`
}

function toDurationUnit(duration: number) {
	if (duration < 100) {
		return duration +'ms'
	}
	return duration / 1000 +'s'
}

export function buildProjects(prjs: AnimationProject[], isExport = false) {
	let css = ''
	let idx = 0
	for (const prj of prjs) {
		const $ = getStore(prj)

		const ruleProps = [$.name, toDurationUnit($.duration)]
		if ($.timingFunc !== '') {
			ruleProps.push($.timingFunc)
		}
		if ($.delay > 0) {
			ruleProps.push(toDurationUnit($.delay))
		}
		ruleProps.push(
			$.iterations === 0 ? 'infinite' : ''+$.iterations
		)
		if ($.direction !== AnimDirection.None) {
			ruleProps.push($.direction)
		}
		if ($.fillMode !== AnimFillmode.None) {
			ruleProps.push($.fillMode)
		}
		css += `animation: ${ruleProps.join(' ')};\n`

		css += buildKeyframeStyle($.name, $.steps, isExport)
		if (idx+1 < prjs.length) {
			css += '\n\n'
		}
		idx++
	}
	return css
}

export function copyToClipboard(str: string) {
	if (navigator?.clipboard?.writeText) {
		navigator.clipboard.writeText(str)
	}
}

export function parseCssRules(code: string) {
	const rules: {[rule: string]: string} = {}
	let currentRule: string|null = null
	let cursor = 0
	for (let idx = 0; idx < code.length; idx++) {
		const char = code[idx]
		if (char === ':') {
			currentRule = code.slice(cursor, idx).trim()
			cursor = idx+1
		}
		if (char === ';') {
			rules[currentRule] = code.slice(cursor, idx).trim()
			currentRule = null
			cursor = idx+1
		}
		if (idx === code.length-1 && currentRule !== null) {
			rules[currentRule] = code.slice(cursor, idx).trim()
		}
	}
	return rules
}

export function extractCssRules(code: string) {
	const rulesObj = parseCssRules(code)
	let timeFn: string
	let serializedCode = ''
	let idx = 0
	for (const rule of Object.keys(rulesObj)) {
		switch (rule) {
			case 'animation-timing-function':
				timeFn = rulesObj[rule]
				delete rulesObj[rule]
				break
			default:
				serializedCode += `${rule}: ${rulesObj[rule]};`
		}
		if (idx < Object.keys(rulesObj).length - 1) {
			serializedCode += '\n'
		}
		idx++
	}
	return {timeFn, serializedCode}
}

export function parseCssImport(css: string) {
	const projects: AnimationProjectPreset[] = []
	const nameMap: {[name: string]: number} = {}

	let inKeyframeName = false
	let currentCodeBlock: null|string = null
	let currentStepPos: null|number = null
	let currentStepBlockCursor: null|number = null
	let isAnimPresets = false

	function curPrj(name: string) {
		return projects[nameMap[name]]
	}

	let cursor = 0
	for (let idx = 0; idx < css.length; idx++) {
		const char = css[idx]

		// parsing animation presets
		if (isAnimPresets) {
			if (char !== ';') continue
			let preset = css.slice(cursor, idx).trim()

			const tiFnCubic = preset.indexOf('cubic-bezier')
			const tiFnSteps = preset.indexOf('steps')
			const closingParentheses = preset.indexOf(')')
			let timeFunc: string

			if (
				(tiFnCubic !== -1 || tiFnSteps !== -1) &&
				closingParentheses === -1
			) throw new Error(
				'Invalid timing function in animation rule.'
			)
			if (tiFnCubic !== -1) {
				timeFunc = preset.slice(tiFnCubic, closingParentheses+1)
				preset = (
					preset.slice(0, tiFnCubic) +
					preset.slice(closingParentheses+1)
				).trim()
			}
			if (tiFnSteps !== -1) {
				timeFunc = preset.slice(tiFnSteps, closingParentheses+1)
				preset = (
					preset.slice(0, tiFnSteps) +
					preset.slice(closingParentheses+1)
				).trim()
			}

			const props = preset.split(' ')
			if (props.length < 1) {
				throw new Error(
					'Invalid animation rule, no properties are set.'
				)
			}
			const animName = props[0]
			props.shift()
			if (!(animName in nameMap)) {
				projects.push({
					name: animName,
				})
				nameMap[animName] = projects.length-1
				// throw new Error(
				// 	`Unable to set preset of animation project "${animName}", ` +
				// 	`because it was already defined.`
				// )
			}
			if (timeFunc) {
				curPrj(animName).timingFunc = timeFunc
			}
			for (const prop of props) {
				// trailing space
				if (prop === '') continue

				// is fill-mode
				if (['forwards', 'backwards', 'both'].includes(prop)) {
					if (curPrj(animName).fillMode) {
						throw new Error(
							`Duplicate fill-mode on animation preset "${animName}".`
						)
					}
					curPrj(animName).fillMode = (prop as AnimFillmode)
					continue
				}

				// is direction
				if (['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(prop)) {
					if (curPrj(animName).fillMode) {
						throw new Error(
							`Duplicate direction on animation preset "${animName}".`
						)
					}
					curPrj(animName).direction = (prop as AnimDirection)
					continue
				}

				// duration / delay
				if (prop.endsWith('ms') || prop.endsWith('s')) {
					const isInMS = prop.endsWith('ms')
					let time = (
						isInMS ?
							Number(prop.slice(0, prop.length-2))
							: Number(prop.slice(0, prop.length-1))
					)
					if (!Number.isNaN(time)) {
						time = isInMS ? time : time * 1000

						if (Number.isNaN(Number(curPrj(animName).duration))) {
							curPrj(animName).duration = time
							continue
						}
						if (Number.isNaN(Number(curPrj(animName).delay))) {
							curPrj(animName).delay = time
							continue
						}
					}
				}

				// iteration count
				if (prop === 'infinite') {
					curPrj(animName).iterations = 0
					continue
				}
				if (!Number.isNaN(Number(prop))) {
					curPrj(animName).iterations = Number(prop)
					continue
				}

				// timing function
				if (prop === 'linear') {
					if (timeFunc) throw new Error(
						`Duplicate timing function linear, "${timeFunc}" ` +
						`is already defined.`
					)
					curPrj(animName).timingFunc = prop
					continue
				}

				throw new Error(
					`Unable to handle "${prop}" on animation preset "${animName}".`
				)
			}
			isAnimPresets = false
			cursor = idx
		}
		// parsing @keyframes block
		else if (currentCodeBlock !== null) {
			if (currentStepBlockCursor !== null) {
				if (char === '}') {
					const stepCss = extractCssRules(css.slice(currentStepBlockCursor, idx + 1))
					curPrj(currentCodeBlock).steps.push({
						timingFunc: stepCss.timeFn,
						pos: currentStepPos,
						styles: stepCss.serializedCode,
					})
					currentStepBlockCursor = null
					currentStepPos = null
					cursor = idx+1
				}
				continue
			}
			else if (char === '{') {
				if (currentStepPos !== null) {
					throw new Error(
						`Invalid step position in "${currentCodeBlock}" at step "${currentStepPos}".`
					)
				}

				let strPos = css.slice(cursor, idx).trim()
				if (strPos === 'from') strPos = '0%'
				else if (strPos === 'to') strPos = '100%'
				else if (strPos.indexOf('%') < 0) {
					break // panic, invalid position
				}
				const pos = Number(strPos.slice(0, strPos.length-1)) // remove %

				if (Number.isNaN(pos)) {
					throw new Error(
						`Invalid step in "${currentCodeBlock}" on position "${css.slice(cursor, idx)}".`
					)
				}
				currentStepPos = pos
				cursor = idx+1
				currentStepBlockCursor = cursor
			}
			else if (char === '}') {
				currentCodeBlock = null
			}
		}
		// parsing @keyframes name
		else if (inKeyframeName) {
			if (char === '{') {
				currentCodeBlock = css.slice(cursor, idx-1).trim()
				if (currentCodeBlock in nameMap) {
					if (Array.isArray(curPrj(currentCodeBlock).steps)) {
						throw new Error(
							`Keyframes block by name "${currentCodeBlock}" already exists.`
						)
					}
					else {
						curPrj(currentCodeBlock).steps = []
					}
				} else {
					projects.push({
						name: currentCodeBlock,
						steps: [],
					})
					nameMap[currentCodeBlock] = projects.length-1
				}
				inKeyframeName = false
				cursor = idx+1
			}
		}
		// @keyframes block found
		else if (char === '@') {
			if (css.slice(idx+1, idx+10) === 'keyframes') {
				inKeyframeName = true
				idx += 10
				cursor = idx
			}
		}
		// animation presets found
		else if (char === 'a') {
			if (css.slice(idx, idx+10) === 'animation:') {
				isAnimPresets = true
				idx += 10
				cursor = idx
			}
		}
	}

	if (
		inKeyframeName ||
		currentCodeBlock !== null ||
		currentStepPos !== null ||
		currentStepBlockCursor !== null ||
		isAnimPresets
	) {
		console.log('inKeyframeName:', inKeyframeName)
		console.log('currentCodeBlock:', currentCodeBlock)
		console.log('currentStepPos:', currentStepPos)
		console.log('currentStepBlockCursor:', currentStepBlockCursor)
		console.log('isAnimPresets:', isAnimPresets)
		throw new Error('Invaid CSS, unable to parse.')
	}

	return projects
}
