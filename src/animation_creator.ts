import {Readable, writable, get as getStore} from 'svelte/store'

export const EasingFunctions = [
	{name: 'Linear',       value: 'linear'},
	{name: 'Steps',        value: 'steps(10, end)'},

	{name: 'Sine In',      value: 'cubic-bezier(0.12, 0, 0.39, 0)'},
	{name: 'Sine Out',     value: 'cubic-bezier(0.37, 0, 0.63, 1)'},
	{name: 'Sine In/Out',  value: 'cubic-bezier(0.61, 1, 0.88, 1)'},

	{name: 'Cubic In',     value: 'cubic-bezier(0.32, 0, 0.67, 0)'},
	{name: 'Cubic Out',    value: 'cubic-bezier(0.33, 1, 0.68, 1)'},
	{name: 'Cubic In/Out', value: 'cubic-bezier(0.65, 0, 0.35, 1)'},

	{name: 'Quint In',     value: 'cubic-bezier(0.64, 0, 0.78, 0)'},
	{name: 'Quint Out',    value: 'cubic-bezier(0.22, 1, 0.36, 1)'},
	{name: 'Quint In/Out', value: 'cubic-bezier(0.83, 0, 0.17, 1)'},

	{name: 'Circ In',      value: 'cubic-bezier(0.55, 0, 1, 0.45)'},
	{name: 'Circ Out',     value: 'cubic-bezier(0, 0.55, 0.45, 1)'},
	{name: 'Circ In/Out',  value: 'cubic-bezier(0.85, 0, 0.15, 1)'},

	{name: 'Quad In',      value: 'cubic-bezier(0.11, 0, 0.5, 0)'},
	{name: 'Quad Out',     value: 'cubic-bezier(0.5, 1, 0.89, 1)'},
	{name: 'Quad In/Out',  value: 'cubic-bezier(0.45, 0, 0.55, 1)'},

	{name: 'Quart In',     value: 'cubic-bezier(0.5, 0, 0.75, 0)'},
	{name: 'Quart Out',    value: 'cubic-bezier(0.25, 1, 0.5, 1)'},
	{name: 'Quart In/Out', value: 'cubic-bezier(0.76, 0, 0.24, 1)'},

	{name: 'Expo In',      value: 'cubic-bezier(0.7, 0, 0.84, 0)'},
	{name: 'Expo Out',     value: 'cubic-bezier(0.16, 1, 0.3, 1)'},
	{name: 'Expo In/Out',  value: 'cubic-bezier(0.87, 0, 0.13, 1)'},

	{name: 'Back In',      value: 'cubic-bezier(0.36, 0, 0.66, -0.56)'},
	{name: 'Back Out',     value: 'cubic-bezier(0.34, 1.56, 0.64, 1)'},
	{name: 'Back In/Out',  value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'},
]

export type T_AnimationCreator = {
	curPrj:     number,
	projects:   AnimationProject[]
	target:     {html: string, css: string}
	viewportBg: string
}

export class AnimationCreator implements Readable<T_AnimationCreator> {
	#store = writable<T_AnimationCreator>({
		curPrj: 0,
		projects: [] as AnimationProject[],
		target: {html: '', css: ''},
		viewportBg: 'transparent',
	})
	readonly subscribe = this.#store.subscribe

	constructor() {
		this.#store.update(($)=> {
			$.target.html = `\<div id='TestBall'\>\</div\>\n\<div id='TestBall2'\>\</div\>`
			$.target.css = (
				`#TestBall, #TestBall2 {` +
					`\n\twidth: 150px;` +
					`\n\theight: 150px;` +
					`\n\tborder-radius: 100%;` +
					`\n\toutline: dotted 6px #fff5;` +
				`\n}\n` +
				`#TestBall {` +
					`\n\tbackground-color: #f00;` +
				`\n}\n` +
				`#TestBall2 {` +
					`\n\tbackground-color: yellow;` +
					`\n\ttransform-origin: 100%;` +
				`\n}`
			)
			return $
		})
		this.newProject({
			name: 'ball_1',
			targetEl: '#TestBall',
			steps: [
				{pos: 0, styles: `background-color: red;\ntransform: translateY(0);`},
				{pos: 50, styles: `background-color: green;\ntransform: translateY(100%) scale(1.5);`},
				{pos: 100, styles: `background-color: blue;\ntransform: translateY(0);`},
			],
			timingFunction: EasingFunctions[7].value,
		})
		this.newProject({
			name: 'ball_2',
			targetEl: '#TestBall2',
			steps: [
				{pos: 0, styles: `background-color: yellow;\ntransform: translateY(0);`},
				{pos: 50, styles: `background-color: purple;\ntransform: translateX(50%) rotate(45deg) scale(1.5);`},
				{pos: 100, styles: `background-color: red;\ntransform: translateY(0);`},
			],
			timingFunction: EasingFunctions[12].value,
		})
		this.selectProject(0)
	}

	newProject(preset?: AnimationProjectPreset) {
		this.#store.update(($)=> {
			$.projects.push(new AnimationProject(preset))
			$.curPrj = $.projects.length-1
			return $
		})
	}

	selectProject(idx: number) {
		this.#store.update(($)=> {
			$.curPrj = idx
			return $
		})
	}

	discardProject() {
		this.#store.update(($)=> {
			$.projects.splice($.curPrj, 1)
			$.curPrj -= 1
			if ($.curPrj < 0) $.curPrj = 0
			if ($.projects.length < 1) {
				$.projects.push(new AnimationProject)
				$.curPrj = $.projects.length-1
			}
			return $
		})
	}

	changeTargetHTML(code: string) {
		this.#store.update(($)=> {
			$.target.html = code
			return $
		})
	}

	changeTargetCSS(code: string) {
		this.#store.update(($)=> {
			$.target.css = code
			return $
		})
	}

	import(presets: AnimationProjectPreset[], keepState: boolean) {
		this.#store.update(($)=> {
			if (keepState !== true) {
				$.projects = []
			}
			for (const prj of presets) {
				$.projects.push(new AnimationProject(prj))
			}
			return $
		})
	}

	setViewportBg(color: string) {
		this.#store.update(($)=> {
			$.viewportBg = color
			return $
		})
	}
}

// Project .....................................................................

export enum AnimFillmode {
	None = 'unset',
	Forwards = 'forwards',
	Backwards = 'backwards',
	Both = 'both',
}

export enum AnimDirection {
	None = 'unset',
	Normal = 'normal',
	Reverse = 'reverse',
	Alternate = 'alternate',
	AlternateReverse = 'alternate-reverse',
}

export type AnimStep = {
	pos:    number // Percentage position
	styles: string
}

export type T_AnimationProject = {
	name:                string
	duration:            number
	stepsRelativeToTime: boolean
	delay:               number
	timingFunction:      string
	iterations:          number // 0 == infinite
	fillMode:            AnimFillmode
	direction:           AnimDirection
	steps:               Array<AnimStep>
	selectedStep:        number
	targetEl:            string // CSS Selector
}

export interface AnimationProjectPreset {
	name?:           string
	duration?:       number
	delay?:          number
	timingFunction?: string
	iterations?:     number // 0 == infinite
	fillMode?:       AnimFillmode
	direction?:      AnimDirection
	steps?:          Array<AnimStep>
	selectedStep?:   number
	targetEl?:       string // CSS Selector
}

export class AnimationProject implements Readable<T_AnimationProject> {
	#store = writable<T_AnimationProject>({
		name: 'animation-name',
		duration: 1000,
		stepsRelativeToTime: false,
		delay: 0,
		timingFunction: 'linear',
		iterations: 0,
		fillMode: AnimFillmode.None,
		direction: AnimDirection.None,
		steps: [] as AnimStep[],
		selectedStep: null,
		targetEl: '',
	})
	readonly subscribe = this.#store.subscribe

	constructor(preset?: AnimationProjectPreset) {
		if (preset) this.#store.update(($)=> {
			if (preset.name) {
				$.name = preset.name
			}
			if (preset.duration) {
				$.duration = preset.duration
			}
			if (preset.delay) {
				$.delay = preset.delay
			}
			if (preset.timingFunction) {
				$.timingFunction = preset.timingFunction
			}
			if (preset.iterations) {
				$.iterations = preset.iterations
			}
			if (preset.fillMode) {
				$.fillMode = preset.fillMode
			}
			if (preset.direction) {
				$.direction = preset.direction
			}
			if (preset.steps) {
				$.steps = preset.steps
			}
			if (preset.selectedStep) {
				$.selectedStep = preset.selectedStep
			}
			if (preset.targetEl) {
				$.targetEl = preset.targetEl
			}
			return $
		})
	}

	getName() {
		return getStore(this.#store).name
	}

	changeName(name: string) {
		this.#store.update(($)=> {
			$.name = name
			return $
		})
	}

	changeFillMode(mode: AnimFillmode) {
		this.#store.update(($)=> {
			$.fillMode = mode
			return $
		})
	}

	changeDirection(direction: AnimDirection) {
		this.#store.update(($)=> {
			$.direction = direction
			return $
		})
	}

	changeTimingFunc(fn: string) {
		this.#store.update(($)=> {
			$.timingFunction = fn
			return $
		})
	}

	changeIterations(n: number) {
		this.#store.update(($)=> {
			$.iterations = n
			return $
		})
	}

	addStep(pos: number): number {
		let returnVal = -1
		this.#store.update(($)=> {
			if (
				$.steps.findIndex(
					(o)=> o.pos === pos ? true : false
				) === -1
			) {
				$.steps.push({pos, styles: ''})
				$.steps = (
					$.steps.sort(
						(a,b)=> a.pos < b.pos ? -1 : 1
					)
				)
				$.steps = $.steps

				returnVal = $.steps.findIndex((o)=> o.pos === pos)
			}
			return $
		})
		return returnVal
	}

	updateStepStyles(css: string) {
		this.#store.update(($)=> {
			$.steps[$.selectedStep].styles = css
			return $
		})
	}

	toggleStepsRelativeOnTime() {
		this.#store.update(($)=> {
			$.stepsRelativeToTime = !$.stepsRelativeToTime
			return $
		})
	}

	changeDuration(dur: number) {
		this.#store.update(($)=> {
			if ($.stepsRelativeToTime) {
				for (const step of $.steps) {
					step.pos = (
						100 / dur * ($.duration / 100 * step.pos)
					)
					if (step.pos > 100) step.pos = 100
				}
			}
			$.duration = dur
			return $
		})
	}

	changeDelay(delay: number) {
		this.#store.update(($)=> {
			$.delay = delay
			return $
		})
	}

	changeStepPos(percent: number) {
		this.#store.update(($)=> {
			if (percent >= 0 && percent <= 100) {
				$.steps[$.selectedStep].pos = percent
			}
			return $
		})
	}

	changeStepPosByTime(time: number) {
		this.#store.update(($)=> {
			console.log(time, $.duration, time >= 0, time <= $.duration)
			if (time >= 0 && time <= $.duration) {
				$.steps[$.selectedStep].pos = 100 / $.duration * time
			}
			return $
		})
	}

	selectStep(idx: number) {
		this.#store.update(($)=> {
			$.selectedStep = idx
			return $
		})
	}

	targetChangeSelector(code: string) {
		this.#store.update(($)=> {
			$.targetEl = code
			return $
		})
	}

	discardStep(idx: number) {
		this.#store.update(($)=> {
			$.steps.splice(idx, 1)
			$.selectedStep -= 1
			if ($.selectedStep < 0) {
				$.selectedStep = 0
			}
			return $
		})
	}
}
