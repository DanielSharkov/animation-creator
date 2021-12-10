
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    class HtmlTag {
        constructor() {
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var _AnimationCreator_instances, _AnimationCreator_store, _AnimationCreator_update, _AnimationProject_store;
    const EasingFunctions = [
        { name: 'Linear', value: 'linear' },
        { name: 'Steps', value: 'steps(10, end)' },
        { name: 'Sine In', value: 'cubic-bezier(0.12, 0, 0.39, 0)' },
        { name: 'Sine Out', value: 'cubic-bezier(0.37, 0, 0.63, 1)' },
        { name: 'Sine In/Out', value: 'cubic-bezier(0.61, 1, 0.88, 1)' },
        { name: 'Cubic In', value: 'cubic-bezier(0.32, 0, 0.67, 0)' },
        { name: 'Cubic Out', value: 'cubic-bezier(0.33, 1, 0.68, 1)' },
        { name: 'Cubic In/Out', value: 'cubic-bezier(0.65, 0, 0.35, 1)' },
        { name: 'Quint In', value: 'cubic-bezier(0.64, 0, 0.78, 0)' },
        { name: 'Quint Out', value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        { name: 'Quint In/Out', value: 'cubic-bezier(0.83, 0, 0.17, 1)' },
        { name: 'Circ In', value: 'cubic-bezier(0.55, 0, 1, 0.45)' },
        { name: 'Circ Out', value: 'cubic-bezier(0, 0.55, 0.45, 1)' },
        { name: 'Circ In/Out', value: 'cubic-bezier(0.85, 0, 0.15, 1)' },
        { name: 'Quad In', value: 'cubic-bezier(0.11, 0, 0.5, 0)' },
        { name: 'Quad Out', value: 'cubic-bezier(0.5, 1, 0.89, 1)' },
        { name: 'Quad In/Out', value: 'cubic-bezier(0.45, 0, 0.55, 1)' },
        { name: 'Quart In', value: 'cubic-bezier(0.5, 0, 0.75, 0)' },
        { name: 'Quart Out', value: 'cubic-bezier(0.25, 1, 0.5, 1)' },
        { name: 'Quart In/Out', value: 'cubic-bezier(0.76, 0, 0.24, 1)' },
        { name: 'Expo In', value: 'cubic-bezier(0.7, 0, 0.84, 0)' },
        { name: 'Expo Out', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        { name: 'Expo In/Out', value: 'cubic-bezier(0.87, 0, 0.13, 1)' },
        { name: 'Back In', value: 'cubic-bezier(0.36, 0, 0.66, -0.56)' },
        { name: 'Back Out', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
        { name: 'Back In/Out', value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' },
    ];
    const LocStr_AnimCreator = 'git@github.com:DanielSharkov/animation-creator';
    const LocStr_Projects = 'git@github.com:DanielSharkov/animation-creator__projects';
    class AnimationCreator {
        constructor() {
            _AnimationCreator_instances.add(this);
            _AnimationCreator_store.set(this, writable({
                curPrj: 0,
                projects: [],
                target: { html: '', css: '' },
                viewportBg: 'transparent',
            }));
            this.subscribe = __classPrivateFieldGet(this, _AnimationCreator_store, "f").subscribe;
            let notInited = true;
            if ('localStorage' in window) {
                const locStr = localStorage.getItem(LocStr_AnimCreator);
                if (locStr) {
                    notInited = false;
                    const json = JSON.parse(locStr);
                    __classPrivateFieldGet(this, _AnimationCreator_store, "f").update(($) => {
                        $.curPrj = json.curPrj;
                        $.target = json.target;
                        $.viewportBg = json.viewportBg;
                        return $;
                    });
                }
                const prjsLocStr = localStorage.getItem(LocStr_Projects);
                if (prjsLocStr) {
                    __classPrivateFieldGet(this, _AnimationCreator_store, "f").update(($) => {
                        for (const preset of JSON.parse(prjsLocStr)) {
                            $.projects.push(new AnimationProject(preset));
                        }
                        return $;
                    });
                }
            }
            if (notInited) { // init examples
                console.log('initing examples');
                __classPrivateFieldGet(this, _AnimationCreator_store, "f").update(($) => {
                    $.target.html = `\<div id='TestBall'\>\</div\>\n\<div id='TestBall2'\>\</div\>`;
                    $.target.css = (`#TestBall, #TestBall2 {` +
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
                        `\n}`);
                    return $;
                });
                this.newProject({
                    name: 'ball_1',
                    targetEl: '#TestBall',
                    steps: [
                        { pos: 0, styles: `background-color: red;\ntransform: translateY(0);` },
                        { pos: 50, styles: `background-color: green;\ntransform: translateY(100%) scale(1.5);` },
                        { pos: 100, styles: `background-color: blue;\ntransform: translateY(0);` },
                    ],
                    timingFunction: EasingFunctions[7].value,
                });
                this.newProject({
                    name: 'ball_2',
                    targetEl: '#TestBall2',
                    steps: [
                        { pos: 0, styles: `background-color: yellow;\ntransform: translateY(0);` },
                        { pos: 50, styles: `background-color: purple;\ntransform: translateX(50%) rotate(45deg) scale(1.5);` },
                        { pos: 100, styles: `background-color: red;\ntransform: translateY(0);` },
                    ],
                    timingFunction: EasingFunctions[12].value,
                });
                this.selectProject(0);
            }
        }
        newProject(preset) {
            __classPrivateFieldGet(this, _AnimationCreator_instances, "m", _AnimationCreator_update).call(this, ($) => {
                $.projects.push(new AnimationProject(preset));
                $.curPrj = $.projects.length - 1;
                return $;
            });
        }
        selectProject(idx) {
            __classPrivateFieldGet(this, _AnimationCreator_instances, "m", _AnimationCreator_update).call(this, ($) => {
                $.curPrj = idx;
                return $;
            });
        }
        discardProject() {
            __classPrivateFieldGet(this, _AnimationCreator_instances, "m", _AnimationCreator_update).call(this, ($) => {
                $.projects.splice($.curPrj, 1);
                $.curPrj -= 1;
                if ($.curPrj < 0)
                    $.curPrj = 0;
                if ($.projects.length < 1) {
                    $.projects.push(new AnimationProject);
                    $.curPrj = $.projects.length - 1;
                }
                return $;
            });
        }
        changeTargetHTML(code) {
            __classPrivateFieldGet(this, _AnimationCreator_instances, "m", _AnimationCreator_update).call(this, ($) => {
                $.target.html = code;
                return $;
            });
        }
        changeTargetCSS(code) {
            __classPrivateFieldGet(this, _AnimationCreator_instances, "m", _AnimationCreator_update).call(this, ($) => {
                $.target.css = code;
                return $;
            });
        }
        import(presets, keepState) {
            __classPrivateFieldGet(this, _AnimationCreator_instances, "m", _AnimationCreator_update).call(this, ($) => {
                if (keepState !== true) {
                    $.projects = [];
                }
                for (const prj of presets) {
                    $.projects.push(new AnimationProject(prj));
                }
                return $;
            });
        }
        syncProjectsWithStorage() {
            if ('localStorage' in window) {
                const prjs = [];
                for (const prj of get_store_value(__classPrivateFieldGet(this, _AnimationCreator_store, "f")).projects) {
                    prjs.push(get_store_value(prj));
                }
                localStorage.setItem(LocStr_Projects, JSON.stringify(prjs));
            }
        }
        setViewportBg(color) {
            __classPrivateFieldGet(this, _AnimationCreator_instances, "m", _AnimationCreator_update).call(this, ($) => {
                $.viewportBg = color;
                return $;
            });
        }
        reset() {
            __classPrivateFieldGet(this, _AnimationCreator_store, "f").update(($) => {
                $.target = { html: '', css: '' };
                $.viewportBg = 'transparent';
                $.projects = [];
                $.projects.push(new AnimationProject());
                $.curPrj = 0;
                return $;
            });
            if ('localStorage' in window) {
                localStorage.removeItem(LocStr_AnimCreator);
                localStorage.removeItem(LocStr_Projects);
            }
        }
    }
    _AnimationCreator_store = new WeakMap(), _AnimationCreator_instances = new WeakSet(), _AnimationCreator_update = function _AnimationCreator_update(fn) {
        __classPrivateFieldGet(this, _AnimationCreator_store, "f").update(($) => {
            $ = fn($);
            if ('localStorage' in window) {
                localStorage.setItem(LocStr_AnimCreator, JSON.stringify({
                    curPrj: $.curPrj,
                    target: $.target,
                    viewportBg: $.viewportBg,
                }));
            }
            return $;
        });
    };
    // Project .....................................................................
    var AnimFillmode;
    (function (AnimFillmode) {
        AnimFillmode["None"] = "unset";
        AnimFillmode["Forwards"] = "forwards";
        AnimFillmode["Backwards"] = "backwards";
        AnimFillmode["Both"] = "both";
    })(AnimFillmode || (AnimFillmode = {}));
    var AnimDirection;
    (function (AnimDirection) {
        AnimDirection["None"] = "unset";
        AnimDirection["Normal"] = "normal";
        AnimDirection["Reverse"] = "reverse";
        AnimDirection["Alternate"] = "alternate";
        AnimDirection["AlternateReverse"] = "alternate-reverse";
    })(AnimDirection || (AnimDirection = {}));
    class AnimationProject {
        constructor(preset) {
            _AnimationProject_store.set(this, writable({
                name: 'animation-name',
                duration: 1000,
                stepsRelativeToTime: false,
                delay: 0,
                timingFunction: 'linear',
                iterations: 0,
                fillMode: AnimFillmode.None,
                direction: AnimDirection.None,
                steps: [],
                selectedStep: null,
                targetEl: '',
            }));
            this.subscribe = __classPrivateFieldGet(this, _AnimationProject_store, "f").subscribe;
            if (preset)
                __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                    if (preset.name) {
                        $.name = preset.name;
                    }
                    if (preset.duration) {
                        $.duration = preset.duration;
                    }
                    if (preset.delay) {
                        $.delay = preset.delay;
                    }
                    if (preset.timingFunction) {
                        $.timingFunction = preset.timingFunction;
                    }
                    if (preset.iterations) {
                        $.iterations = preset.iterations;
                    }
                    if (preset.fillMode) {
                        $.fillMode = preset.fillMode;
                    }
                    if (preset.direction) {
                        $.direction = preset.direction;
                    }
                    if (preset.steps) {
                        $.steps = preset.steps;
                    }
                    if (preset.selectedStep) {
                        $.selectedStep = preset.selectedStep;
                    }
                    if (preset.targetEl) {
                        $.targetEl = preset.targetEl;
                    }
                    return $;
                });
        }
        getName() {
            return get_store_value(__classPrivateFieldGet(this, _AnimationProject_store, "f")).name;
        }
        changeName(name) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.name = name;
                return $;
            });
        }
        changeFillMode(mode) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.fillMode = mode;
                return $;
            });
        }
        changeDirection(direction) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.direction = direction;
                return $;
            });
        }
        changeTimingFunc(fn) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.timingFunction = fn;
                return $;
            });
        }
        changeIterations(n) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.iterations = n;
                return $;
            });
        }
        addStep(pos) {
            let returnVal = -1;
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                if ($.steps.findIndex((o) => o.pos === pos ? true : false) === -1) {
                    $.steps.push({ pos, styles: '' });
                    $.steps = ($.steps.sort((a, b) => a.pos < b.pos ? -1 : 1));
                    $.steps = $.steps;
                    returnVal = $.steps.findIndex((o) => o.pos === pos);
                }
                return $;
            });
            return returnVal;
        }
        updateStepStyles(css) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.steps[$.selectedStep].styles = css;
                return $;
            });
        }
        toggleStepsRelativeOnTime() {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.stepsRelativeToTime = !$.stepsRelativeToTime;
                return $;
            });
        }
        changeDuration(dur) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                if ($.stepsRelativeToTime) {
                    for (const step of $.steps) {
                        step.pos = (100 / dur * ($.duration / 100 * step.pos));
                        if (step.pos > 100)
                            step.pos = 100;
                    }
                }
                $.duration = dur;
                return $;
            });
        }
        changeDelay(delay) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.delay = delay;
                return $;
            });
        }
        changeStepPos(percent) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                if (percent >= 0 && percent <= 100) {
                    $.steps[$.selectedStep].pos = percent;
                }
                return $;
            });
        }
        changeStepPosByTime(time) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                console.log(time, $.duration, time >= 0, time <= $.duration);
                if (time >= 0 && time <= $.duration) {
                    $.steps[$.selectedStep].pos = 100 / $.duration * time;
                }
                return $;
            });
        }
        selectStep(idx) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.selectedStep = idx;
                return $;
            });
        }
        targetChangeSelector(code) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.targetEl = code;
                return $;
            });
        }
        discardStep(idx) {
            __classPrivateFieldGet(this, _AnimationProject_store, "f").update(($) => {
                $.steps.splice(idx, 1);
                $.selectedStep -= 1;
                if ($.selectedStep < 0) {
                    $.selectedStep = 0;
                }
                return $;
            });
        }
    }
    _AnimationProject_store = new WeakMap();

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function htmlDecode(x) {
        const doc = new DOMParser().parseFromString(x, 'text/html');
        return doc.documentElement.textContent;
    }
    function indentCode(code, step = 1) {
        let indent = '';
        for (let itr = 0; itr < step; itr++) {
            indent += '\t';
        }
        let str = '';
        let idx = 0;
        const codeLines = code.split('\n');
        for (const line of codeLines) {
            str += indent + line;
            if (idx + 1 < codeLines.length) {
                str += '\n';
            }
            idx++;
        }
        return str;
    }
    function wrapInTags(tagName, val) {
        return (htmlDecode('&lt;' + tagName + '&gt;')
            + val
            + htmlDecode('&lt;/' + tagName + '&gt;'));
    }
    function renderAllKeyframeStyles(prjs) {
        let css = '';
        let idx = 0;
        for (const prj of prjs) {
            const $ = get_store_value(prj);
            css += buildKeyframeStyle($.name, $.steps);
            if (idx + 1 < prjs.length) {
                css += '\n\n';
            }
            idx++;
        }
        return css;
    }
    function buildKeyframeStyle(name, steps) {
        let css = `@keyframes ${name} {\n`;
        for (const step of steps) {
            if (step.styles === '')
                continue;
            css += `\t${step.pos}% {\n${indentCode(step.styles, 2)}\n\t}\n`;
        }
        return css + '}';
    }
    function buildCursorKeyframeStyle(steps) {
        let css = `@keyframes moveCursor {\n`;
        for (const step of steps) {
            if (step.styles === '')
                continue;
            css += `\t${step.pos}% {transform: translateX(${step.pos}%)}\n`;
        }
        css += '\tto {transformX(100%)}';
        return css + '}';
    }
    function selectedKeyframeStyle(target, css) {
        return `${target} {transition: .1s all linear;${css}}`;
    }
    function toDurationUnit(duration) {
        if (duration < 100) {
            return duration + 'ms';
        }
        return duration / 1000 + 's';
    }
    function buildProjects(prjs) {
        let css = '';
        let idx = 0;
        for (const prj of prjs) {
            const $ = get_store_value(prj);
            const ruleProps = [$.name, toDurationUnit($.duration)];
            if ($.timingFunction !== '') {
                ruleProps.push($.timingFunction);
            }
            if ($.delay > 0) {
                ruleProps.push(toDurationUnit($.delay));
            }
            ruleProps.push($.iterations === 0 ? 'infinite' : '' + $.iterations);
            if ($.direction !== AnimDirection.None) {
                ruleProps.push($.direction);
            }
            if ($.fillMode !== AnimFillmode.None) {
                ruleProps.push($.fillMode);
            }
            css += `animation: ${ruleProps.join(' ')};\n`;
            css += buildKeyframeStyle($.name, $.steps);
            if (idx + 1 < prjs.length) {
                css += '\n\n';
            }
            idx++;
        }
        return css;
    }
    function copyToClipboard(str) {
        var _a;
        if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText) {
            navigator.clipboard.writeText(str);
        }
    }
    function parseCssImport(css) {
        const projects = [];
        const nameMap = {};
        let inKeyframeName = false;
        let currentCodeBlock = null;
        let currentStepPos = null;
        let isCurrentStepBlock = false;
        let isAnimPresets = false;
        function curPrj(name) {
            return projects[nameMap[name]];
        }
        let cursor = 0;
        for (let idx = 0; idx < css.length; idx++) {
            const char = css[idx];
            // parsing animation presets
            if (isAnimPresets) {
                if (char !== ';')
                    continue;
                let preset = css.slice(cursor, idx).trim();
                const tiFnCubic = preset.indexOf('cubic-bezier');
                const tiFnSteps = preset.indexOf('steps');
                const closingParentheses = preset.indexOf(')');
                let timeFunc;
                if ((tiFnCubic !== -1 || tiFnSteps !== -1) &&
                    closingParentheses === -1)
                    throw new Error('Invalid timing function in animation rule.');
                if (tiFnCubic !== -1) {
                    timeFunc = preset.slice(tiFnCubic, closingParentheses + 1);
                    preset = (preset.slice(0, tiFnCubic) +
                        preset.slice(closingParentheses + 1)).trim();
                }
                if (tiFnSteps !== -1) {
                    timeFunc = preset.slice(tiFnSteps, closingParentheses + 1);
                    preset = (preset.slice(0, tiFnSteps) +
                        preset.slice(closingParentheses + 1)).trim();
                }
                const props = preset.split(' ');
                if (props.length < 1) {
                    throw new Error('Invalid animation rule, no properties are set.');
                }
                const animName = props[0];
                props.shift();
                if (!(animName in nameMap)) {
                    projects.push({
                        name: animName,
                    });
                    nameMap[animName] = projects.length - 1;
                    // throw new Error(
                    // 	`Unable to set preset of animation project "${animName}", ` +
                    // 	`because it was already defined.`
                    // )
                }
                if (timeFunc) {
                    curPrj(animName).timingFunction = timeFunc;
                }
                for (const prop of props) {
                    // tailing space
                    if (prop === '')
                        continue;
                    // is fill-mode
                    if (['forwards', 'backwards', 'both'].includes(prop)) {
                        if (curPrj(animName).fillMode) {
                            throw new Error(`Duplicate fill-mode on animation preset "${animName}".`);
                        }
                        curPrj(animName).fillMode = prop;
                        continue;
                    }
                    // is direction
                    if (['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(prop)) {
                        if (curPrj(animName).fillMode) {
                            throw new Error(`Duplicate direction on animation preset "${animName}".`);
                        }
                        curPrj(animName).direction = prop;
                        continue;
                    }
                    // duration / delay
                    if (prop.endsWith('ms') || prop.endsWith('s')) {
                        const isInMS = prop.endsWith('ms');
                        let time = (isInMS ?
                            Number(prop.slice(0, prop.length - 2))
                            : Number(prop.slice(0, prop.length - 1)));
                        if (!Number.isNaN(time)) {
                            time = isInMS ? time : time * 1000;
                            if (Number.isNaN(Number(curPrj(animName).duration))) {
                                curPrj(animName).duration = time;
                                continue;
                            }
                            if (Number.isNaN(Number(curPrj(animName).delay))) {
                                curPrj(animName).delay = time;
                                continue;
                            }
                        }
                    }
                    // iteration count
                    if (prop === 'infinite') {
                        curPrj(animName).iterations = 0;
                        continue;
                    }
                    if (!Number.isNaN(Number(prop))) {
                        curPrj(animName).iterations = Number(prop);
                        continue;
                    }
                    // timing function
                    if (prop === 'linear') {
                        if (timeFunc)
                            throw new Error(`Duplicate timing function linear, "${timeFunc}" ` +
                                `is already defined.`);
                        curPrj(animName).timingFunction = prop;
                        continue;
                    }
                    throw new Error(`Unable to handle "${prop}" on animation preset "${animName}".`);
                }
                isAnimPresets = false;
                cursor = idx;
            }
            // parsing @keyframes block
            else if (currentCodeBlock !== null) {
                if (isCurrentStepBlock) {
                    if (char !== '}')
                        continue;
                    curPrj(currentCodeBlock).steps.push({
                        pos: currentStepPos,
                        styles: css.slice(cursor, idx).replace(/\t/g, '').trim(),
                    });
                    isCurrentStepBlock = false;
                    currentStepPos = null;
                    cursor = idx + 1;
                }
                else if (char === '}') {
                    currentCodeBlock = null;
                }
                else if (char === '{') {
                    if (currentStepPos !== null) {
                        throw new Error(`Invalid step position in "${currentCodeBlock}" at step "${currentStepPos}".`);
                    }
                    let strPos = css.slice(cursor, idx).trim();
                    if (strPos === 'from')
                        strPos = '0%';
                    if (strPos === 'to')
                        strPos = '100%';
                    const pos = Number(strPos.slice(0, strPos.length - 1)); // remove %
                    if (Number.isNaN(pos)) {
                        throw new Error(`Invalid step in "${currentCodeBlock}" on position "${css.slice(cursor, idx)}".`);
                    }
                    currentStepPos = pos;
                    isCurrentStepBlock = true;
                    cursor = idx + 1;
                }
            }
            // parsing @keyframes name
            else if (inKeyframeName) {
                if (char === '{') {
                    currentCodeBlock = css.slice(cursor, idx - 1).trim();
                    if (currentCodeBlock in nameMap) {
                        if (Array.isArray(curPrj(currentCodeBlock).steps)) {
                            throw new Error(`Keyframes block by name "${currentCodeBlock}" already exists.`);
                        }
                        else {
                            curPrj(currentCodeBlock).steps = [];
                        }
                    }
                    else {
                        projects.push({
                            name: currentCodeBlock,
                            steps: [],
                        });
                        nameMap[currentCodeBlock] = projects.length - 1;
                    }
                    inKeyframeName = false;
                    cursor = idx + 1;
                }
            }
            // @keyframes block found
            else if (char === '@') {
                if (css.slice(idx + 1, idx + 10) === 'keyframes') {
                    inKeyframeName = true;
                    idx += 10;
                    cursor = idx;
                }
            }
            // animation presets found
            else if (char === 'a') {
                if (css.slice(idx, idx + 10) === 'animation:') {
                    isAnimPresets = true;
                    idx += 10;
                    cursor = idx;
                }
            }
        }
        if (inKeyframeName ||
            currentCodeBlock !== null ||
            currentStepPos !== null ||
            isCurrentStepBlock ||
            isAnimPresets) {
            console.log('inKeyframeName:', inKeyframeName);
            console.log('currentCodeBlock:', currentCodeBlock);
            console.log('currentStepPos:', currentStepPos);
            console.log('isCurrentStepBlock:', isCurrentStepBlock);
            console.log('isAnimPresets:', isAnimPresets);
            throw new Error('Invaid CSS, unable to parse.');
        }
        return projects;
    }

    /* src\ModalViewer.svelte generated by Svelte v3.44.2 */
    const file$3 = "src\\ModalViewer.svelte";

    // (67:1) {#if $opendModal === Modals.Target}
    function create_if_block_6$1(ctx) {
    	let div4;
    	let div0;
    	let svg0;
    	let path0;
    	let path1;
    	let path2;
    	let circle;
    	let t0;
    	let h1;
    	let t2;
    	let div1;
    	let textarea0;
    	let textarea0_value_value;
    	let t3;
    	let label0;
    	let t5;
    	let div2;
    	let textarea1;
    	let textarea1_value_value;
    	let t6;
    	let label1;
    	let t8;
    	let div3;
    	let button;
    	let svg1;
    	let path3;
    	let t9;
    	let span;
    	let div4_intro;
    	let div4_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			circle = svg_element("circle");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Animation Target";
    			t2 = space();
    			div1 = element("div");
    			textarea0 = element("textarea");
    			t3 = space();
    			label0 = element("label");
    			label0.textContent = "HTML";
    			t5 = space();
    			div2 = element("div");
    			textarea1 = element("textarea");
    			t6 = space();
    			label1 = element("label");
    			label1.textContent = "CSS";
    			t8 = space();
    			div3 = element("div");
    			button = element("button");
    			svg1 = svg_element("svg");
    			path3 = svg_element("path");
    			t9 = space();
    			span = element("span");
    			span.textContent = "Close";
    			attr_dev(path0, "d", "M15.7736 5.36887C14.3899 4.50149 12.7535 4 11 4C6.02944 4 2 8.02944 2 13C2 17.9706 6.02944 22 11 22C15.9706 22 20 17.9706 20 13C20 11.3038 19.5308 9.71728 18.7151 8.36302");
    			add_location(path0, file$3, 70, 5, 2178);
    			attr_dev(path1, "d", "M12.8458 8.35174C12.2747 8.12477 11.6519 8 11 8C8.23858 8 6 10.2386 6 13C6 15.7614 8.23858 18 11 18C13.7614 18 16 15.7614 16 13C16 12.4099 15.8978 11.8438 15.7101 11.3182");
    			add_location(path1, file$3, 71, 5, 2367);
    			attr_dev(path2, "d", "M12 12L18 6M20 4V1.73698e-07M20 4H24M20 4L18 6M20 4L23 1M18 6L18 2M18 6L22 6");
    			add_location(path2, file$3, 72, 5, 2556);
    			attr_dev(circle, "cx", "11");
    			attr_dev(circle, "cy", "13");
    			attr_dev(circle, "r", "1.5");
    			add_location(circle, file$3, 73, 5, 2651);
    			attr_dev(svg0, "class", "icon stroke icon-3");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$3, 69, 4, 2072);
    			attr_dev(h1, "class", "svelte-16jn8ie");
    			add_location(h1, file$3, 75, 4, 2702);
    			attr_dev(div0, "class", "header flex content-center-y gap-1 svelte-16jn8ie");
    			add_location(div0, file$3, 68, 3, 2018);
    			attr_dev(textarea0, "id", "target-html-input");
    			attr_dev(textarea0, "rows", "6");
    			textarea0.value = textarea0_value_value = /*$animations*/ ctx[5].target.html;
    			attr_dev(textarea0, "class", "svelte-16jn8ie");
    			add_location(textarea0, file$3, 79, 4, 2776);
    			attr_dev(label0, "for", "target-html-input");
    			add_location(label0, file$3, 84, 4, 2950);
    			attr_dev(div1, "class", "input-field");
    			add_location(div1, file$3, 78, 3, 2745);
    			attr_dev(textarea1, "id", "target-css-input");
    			attr_dev(textarea1, "rows", "6");
    			textarea1.value = textarea1_value_value = /*$animations*/ ctx[5].target.css;
    			attr_dev(textarea1, "class", "svelte-16jn8ie");
    			add_location(textarea1, file$3, 88, 4, 3042);
    			attr_dev(label1, "for", "target-css-input");
    			add_location(label1, file$3, 93, 4, 3213);
    			attr_dev(div2, "class", "input-field");
    			add_location(div2, file$3, 87, 3, 3011);
    			attr_dev(path3, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path3, file$3, 99, 6, 3499);
    			attr_dev(svg1, "class", "icon stroke icon-15");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$3, 98, 5, 3391);
    			attr_dev(span, "class", "label");
    			add_location(span, file$3, 101, 5, 3551);
    			attr_dev(button, "class", "btn has-icon align-right");
    			add_location(button, file$3, 97, 4, 3321);
    			attr_dev(div3, "class", "actions flex content-center-y svelte-16jn8ie");
    			add_location(div3, file$3, 96, 3, 3272);
    			attr_dev(div4, "class", "modal animation-target svelte-16jn8ie");
    			add_location(div4, file$3, 67, 2, 1935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			append_dev(svg0, path2);
    			append_dev(svg0, circle);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, textarea0);
    			append_dev(div1, t3);
    			append_dev(div1, label0);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, textarea1);
    			append_dev(div2, t6);
    			append_dev(div2, label1);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, svg1);
    			append_dev(svg1, path3);
    			append_dev(button, t9);
    			append_dev(button, span);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "change", /*change_handler*/ ctx[11], false, false, false),
    					listen_dev(textarea1, "change", /*change_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button, "click", closeModal, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$animations*/ 32 && textarea0_value_value !== (textarea0_value_value = /*$animations*/ ctx[5].target.html)) {
    				prop_dev(textarea0, "value", textarea0_value_value);
    			}

    			if (!current || dirty & /*$animations*/ 32 && textarea1_value_value !== (textarea1_value_value = /*$animations*/ ctx[5].target.css)) {
    				prop_dev(textarea1, "value", textarea1_value_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div4_outro) div4_outro.end(1);
    				div4_intro = create_in_transition(div4, /*modalAnim*/ ctx[9], true);
    				div4_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div4_intro) div4_intro.invalidate();
    			div4_outro = create_out_transition(div4, /*modalAnim*/ ctx[9], false);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (detaching && div4_outro) div4_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(67:1) {#if $opendModal === Modals.Target}",
    		ctx
    	});

    	return block;
    }

    // (108:1) {#if $opendModal === Modals.Export}
    function create_if_block_5$1(ctx) {
    	let div9;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let h1;
    	let t2;
    	let div7;
    	let div2;
    	let div1;
    	let span0;
    	let t4;
    	let button0;
    	let svg1;
    	let path1;
    	let t5;
    	let textarea0;
    	let textarea0_value_value;
    	let t6;
    	let div4;
    	let div3;
    	let span1;
    	let t8;
    	let button1;
    	let svg2;
    	let path2;
    	let t9;
    	let textarea1;
    	let textarea1_value_value;
    	let t10;
    	let div6;
    	let div5;
    	let span2;
    	let t12;
    	let button2;
    	let svg3;
    	let path3;
    	let t13;
    	let textarea2;
    	let textarea2_value_value;
    	let t14;
    	let div8;
    	let button3;
    	let svg4;
    	let path4;
    	let t15;
    	let span3;
    	let div9_intro;
    	let div9_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Export";
    			t2 = space();
    			div7 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Your targets HTML code";
    			t4 = space();
    			button0 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t5 = space();
    			textarea0 = element("textarea");
    			t6 = space();
    			div4 = element("div");
    			div3 = element("div");
    			span1 = element("span");
    			span1.textContent = "Your targets CSS code";
    			t8 = space();
    			button1 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t9 = space();
    			textarea1 = element("textarea");
    			t10 = space();
    			div6 = element("div");
    			div5 = element("div");
    			span2 = element("span");
    			span2.textContent = "Animation CSS";
    			t12 = space();
    			button2 = element("button");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t13 = space();
    			textarea2 = element("textarea");
    			t14 = space();
    			div8 = element("div");
    			button3 = element("button");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			t15 = space();
    			span3 = element("span");
    			span3.textContent = "Close";
    			attr_dev(path0, "d", "M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 11V19M12 19L9 16M12 19L15 16");
    			add_location(path0, file$3, 111, 5, 3904);
    			attr_dev(svg0, "class", "icon stroke icon-3");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$3, 110, 4, 3798);
    			attr_dev(h1, "class", "svelte-16jn8ie");
    			add_location(h1, file$3, 113, 4, 4001);
    			attr_dev(div0, "class", "header flex content-center-y gap-1 svelte-16jn8ie");
    			add_location(div0, file$3, 109, 3, 3744);
    			add_location(span0, file$3, 119, 6, 4146);
    			attr_dev(path1, "d", "M9.5 9.5H16M7.5 9.5H8.5M9.5 12.5H15M7.5 12.5H8.5M9.5 15.5H16M7.5 15.5H8.5M9.5 18.5H15M7.5 18.5H8.5M10 4V2H14V4M10 4H14M10 4H8.5M14 4H15.5M8.5 4H5V22H19V4H15.5M8.5 4V6H15.5V4");
    			add_location(path1, file$3, 122, 8, 4411);
    			attr_dev(svg1, "class", "icon stroke icon-1");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$3, 121, 7, 4302);
    			attr_dev(button0, "class", "btn even-pdg small align-right");
    			add_location(button0, file$3, 120, 6, 4189);
    			attr_dev(div1, "class", "label flex gap-05 svelte-16jn8ie");
    			add_location(div1, file$3, 118, 5, 4107);
    			textarea0.readOnly = true;
    			attr_dev(textarea0, "rows", "6");
    			textarea0.value = textarea0_value_value = /*$animations*/ ctx[5].target.html;
    			attr_dev(textarea0, "class", "svelte-16jn8ie");
    			add_location(textarea0, file$3, 126, 5, 4648);
    			attr_dev(div2, "class", "field grid gap-05 svelte-16jn8ie");
    			add_location(div2, file$3, 117, 4, 4069);
    			add_location(span1, file$3, 130, 6, 4807);
    			attr_dev(path2, "d", "M9.5 9.5H16M7.5 9.5H8.5M9.5 12.5H15M7.5 12.5H8.5M9.5 15.5H16M7.5 15.5H8.5M9.5 18.5H15M7.5 18.5H8.5M10 4V2H14V4M10 4H14M10 4H8.5M14 4H15.5M8.5 4H5V22H19V4H15.5M8.5 4V6H15.5V4");
    			add_location(path2, file$3, 133, 8, 5070);
    			attr_dev(svg2, "class", "icon stroke icon-1");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$3, 132, 7, 4961);
    			attr_dev(button1, "class", "btn even-pdg small align-right");
    			add_location(button1, file$3, 131, 6, 4849);
    			attr_dev(div3, "class", "label flex gap-05 svelte-16jn8ie");
    			add_location(div3, file$3, 129, 5, 4768);
    			textarea1.readOnly = true;
    			attr_dev(textarea1, "rows", "6");
    			textarea1.value = textarea1_value_value = /*$animations*/ ctx[5].target.css;
    			attr_dev(textarea1, "class", "svelte-16jn8ie");
    			add_location(textarea1, file$3, 137, 5, 5307);
    			attr_dev(div4, "class", "field grid gap-05 svelte-16jn8ie");
    			add_location(div4, file$3, 128, 4, 4730);
    			add_location(span2, file$3, 141, 6, 5465);
    			attr_dev(path3, "d", "M9.5 9.5H16M7.5 9.5H8.5M9.5 12.5H15M7.5 12.5H8.5M9.5 15.5H16M7.5 15.5H8.5M9.5 18.5H15M7.5 18.5H8.5M10 4V2H14V4M10 4H14M10 4H8.5M14 4H15.5M8.5 4H5V22H19V4H15.5M8.5 4V6H15.5V4");
    			add_location(path3, file$3, 144, 8, 5733);
    			attr_dev(svg3, "class", "icon stroke icon-1");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg3, file$3, 143, 7, 5624);
    			attr_dev(button2, "class", "btn even-pdg small align-right");
    			add_location(button2, file$3, 142, 6, 5499);
    			attr_dev(div5, "class", "label flex gap-05 svelte-16jn8ie");
    			add_location(div5, file$3, 140, 5, 5426);
    			textarea2.readOnly = true;
    			attr_dev(textarea2, "rows", "16");
    			textarea2.value = textarea2_value_value = buildProjects(/*$animations*/ ctx[5].projects);
    			attr_dev(textarea2, "class", "svelte-16jn8ie");
    			add_location(textarea2, file$3, 148, 5, 5970);
    			attr_dev(div6, "class", "field grid gap-05 svelte-16jn8ie");
    			add_location(div6, file$3, 139, 4, 5388);
    			attr_dev(div7, "class", "body grid gap-2 svelte-16jn8ie");
    			add_location(div7, file$3, 116, 3, 4034);
    			attr_dev(path4, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path4, file$3, 155, 6, 6304);
    			attr_dev(svg4, "class", "icon stroke icon-15");
    			attr_dev(svg4, "viewBox", "0 0 24 24");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg4, file$3, 154, 5, 6196);
    			attr_dev(span3, "class", "label");
    			add_location(span3, file$3, 157, 5, 6356);
    			attr_dev(button3, "class", "btn has-icon align-right");
    			add_location(button3, file$3, 153, 4, 6126);
    			attr_dev(div8, "class", "actions flex content-center-y svelte-16jn8ie");
    			add_location(div8, file$3, 152, 3, 6077);
    			attr_dev(div9, "class", "modal export svelte-16jn8ie");
    			add_location(div9, file$3, 108, 2, 3671);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div9, t2);
    			append_dev(div9, div7);
    			append_dev(div7, div2);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t4);
    			append_dev(div1, button0);
    			append_dev(button0, svg1);
    			append_dev(svg1, path1);
    			append_dev(div2, t5);
    			append_dev(div2, textarea0);
    			append_dev(div7, t6);
    			append_dev(div7, div4);
    			append_dev(div4, div3);
    			append_dev(div3, span1);
    			append_dev(div3, t8);
    			append_dev(div3, button1);
    			append_dev(button1, svg2);
    			append_dev(svg2, path2);
    			append_dev(div4, t9);
    			append_dev(div4, textarea1);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, span2);
    			append_dev(div5, t12);
    			append_dev(div5, button2);
    			append_dev(button2, svg3);
    			append_dev(svg3, path3);
    			append_dev(div6, t13);
    			append_dev(div6, textarea2);
    			append_dev(div9, t14);
    			append_dev(div9, div8);
    			append_dev(div8, button3);
    			append_dev(button3, svg4);
    			append_dev(svg4, path4);
    			append_dev(button3, t15);
    			append_dev(button3, span3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[13], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[14], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[15], false, false, false),
    					listen_dev(button3, "click", closeModal, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$animations*/ 32 && textarea0_value_value !== (textarea0_value_value = /*$animations*/ ctx[5].target.html)) {
    				prop_dev(textarea0, "value", textarea0_value_value);
    			}

    			if (!current || dirty & /*$animations*/ 32 && textarea1_value_value !== (textarea1_value_value = /*$animations*/ ctx[5].target.css)) {
    				prop_dev(textarea1, "value", textarea1_value_value);
    			}

    			if (!current || dirty & /*$animations*/ 32 && textarea2_value_value !== (textarea2_value_value = buildProjects(/*$animations*/ ctx[5].projects))) {
    				prop_dev(textarea2, "value", textarea2_value_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div9_outro) div9_outro.end(1);
    				div9_intro = create_in_transition(div9, /*modalAnim*/ ctx[9], true);
    				div9_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div9_intro) div9_intro.invalidate();
    			div9_outro = create_out_transition(div9, /*modalAnim*/ ctx[9], false);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			if (detaching && div9_outro) div9_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(108:1) {#if $opendModal === Modals.Export}",
    		ctx
    	});

    	return block;
    }

    // (164:1) {#if $opendModal === Modals.Import}
    function create_if_block_3$1(ctx) {
    	let div4;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let h1;
    	let t2;
    	let div1;
    	let p0;
    	let t3;
    	let code0;
    	let t5;
    	let code1;
    	let t7;
    	let t8;
    	let ol;
    	let li0;
    	let t10;
    	let li1;
    	let t12;
    	let li2;
    	let t14;
    	let li3;
    	let t16;
    	let li4;
    	let t18;
    	let li5;
    	let t20;
    	let li6;
    	let t22;
    	let p1;
    	let t24;
    	let pre;
    	let t26;
    	let div2;
    	let t27;
    	let textarea;
    	let t28;
    	let label;
    	let t30;
    	let div3;
    	let button0;
    	let svg1;
    	let path1;
    	let t31;
    	let span0;
    	let t33;
    	let button1;
    	let svg2;
    	let path2;
    	let t34;
    	let span1;
    	let button1_disabled_value;
    	let div4_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*importErr*/ ctx[2] !== null && create_if_block_4$1(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Import";
    			t2 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t3 = text("To import an animation project you have to define either or both\r\n\t\t\t\t\tthe ");
    			code0 = element("code");
    			code0.textContent = "animation";
    			t5 = text(" rule and the ");
    			code1 = element("code");
    			code1.textContent = "@keyframes";
    			t7 = text(" block.\r\n\t\t\t\t\tThis app is parsing the presets for from the animation rule in the\r\n\t\t\t\t\tfollowing respected conventional order:");
    			t8 = space();
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "name (has always to be the first value)";
    			t10 = space();
    			li1 = element("li");
    			li1.textContent = "duration";
    			t12 = space();
    			li2 = element("li");
    			li2.textContent = "timing-function";
    			t14 = space();
    			li3 = element("li");
    			li3.textContent = "delay";
    			t16 = space();
    			li4 = element("li");
    			li4.textContent = "iteration-count";
    			t18 = space();
    			li5 = element("li");
    			li5.textContent = "direction";
    			t20 = space();
    			li6 = element("li");
    			li6.textContent = "fill-mode";
    			t22 = space();
    			p1 = element("p");
    			p1.textContent = "Example:";
    			t24 = space();
    			pre = element("pre");
    			pre.textContent = `${`animation: xplAnim 1s linear forwards;\n` + `@keyframes xplAnim {\n` + `\tfrom { color: red }\n` + `\tto   { color: blue }\n` + `}`}`;
    			t26 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t27 = space();
    			textarea = element("textarea");
    			t28 = space();
    			label = element("label");
    			label.textContent = "CSS Keyframes & Animation presets";
    			t30 = space();
    			div3 = element("div");
    			button0 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t31 = space();
    			span0 = element("span");
    			span0.textContent = "Cancel";
    			t33 = space();
    			button1 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t34 = space();
    			span1 = element("span");
    			span1.textContent = "Apply";
    			attr_dev(path0, "d", "M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 19L12 11M12 11L15 14M12 11L9 14");
    			add_location(path0, file$3, 167, 5, 6688);
    			attr_dev(svg0, "class", "icon stroke icon-3");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$3, 166, 4, 6582);
    			attr_dev(h1, "class", "svelte-16jn8ie");
    			add_location(h1, file$3, 169, 4, 6788);
    			attr_dev(div0, "class", "header flex content-center-y gap-1 svelte-16jn8ie");
    			add_location(div0, file$3, 165, 3, 6528);
    			attr_dev(code0, "class", "svelte-16jn8ie");
    			add_location(code0, file$3, 175, 9, 6949);
    			attr_dev(code1, "class", "svelte-16jn8ie");
    			add_location(code1, file$3, 175, 45, 6985);
    			add_location(p0, file$3, 173, 4, 6864);
    			attr_dev(li0, "class", "svelte-16jn8ie");
    			add_location(li0, file$3, 180, 5, 7161);
    			attr_dev(li1, "class", "svelte-16jn8ie");
    			add_location(li1, file$3, 181, 5, 7216);
    			attr_dev(li2, "class", "svelte-16jn8ie");
    			add_location(li2, file$3, 182, 5, 7240);
    			attr_dev(li3, "class", "svelte-16jn8ie");
    			add_location(li3, file$3, 183, 5, 7271);
    			attr_dev(li4, "class", "svelte-16jn8ie");
    			add_location(li4, file$3, 184, 5, 7292);
    			attr_dev(li5, "class", "svelte-16jn8ie");
    			add_location(li5, file$3, 185, 5, 7323);
    			attr_dev(li6, "class", "svelte-16jn8ie");
    			add_location(li6, file$3, 186, 5, 7348);
    			attr_dev(ol, "class", "svelte-16jn8ie");
    			add_location(ol, file$3, 179, 4, 7150);
    			add_location(p1, file$3, 188, 4, 7383);
    			attr_dev(pre, "class", "svelte-16jn8ie");
    			add_location(pre, file$3, 189, 4, 7404);
    			attr_dev(div1, "class", "import-info grid gap-05 svelte-16jn8ie");
    			add_location(div1, file$3, 172, 3, 6821);
    			attr_dev(textarea, "id", "keyframes-import");
    			attr_dev(textarea, "rows", "16");
    			attr_dev(textarea, "class", "svelte-16jn8ie");
    			add_location(textarea, file$3, 202, 4, 7744);
    			attr_dev(label, "for", "keyframes-import");
    			add_location(label, file$3, 207, 4, 7865);
    			attr_dev(div2, "class", "input-field grid gap-05");
    			add_location(div2, file$3, 198, 3, 7606);
    			attr_dev(path1, "stroke", "#ff1744");
    			attr_dev(path1, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path1, file$3, 213, 6, 8162);
    			attr_dev(svg1, "class", "icon icon-15");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$3, 212, 5, 8061);
    			attr_dev(span0, "class", "label");
    			add_location(span0, file$3, 215, 5, 8231);
    			attr_dev(button0, "class", "btn has-icon");
    			add_location(button0, file$3, 211, 4, 8003);
    			attr_dev(path2, "stroke", "#4caf50");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M4 11.5L9.5 17L19.5 7");
    			add_location(path2, file$3, 220, 6, 8501);
    			attr_dev(svg2, "class", "icon icon-15");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$3, 219, 5, 8400);
    			attr_dev(span1, "class", "label");
    			add_location(span1, file$3, 222, 5, 8588);
    			attr_dev(button1, "class", "btn has-icon align-right");
    			button1.disabled = button1_disabled_value = /*parsedImport*/ ctx[3] === null;
    			add_location(button1, file$3, 218, 4, 8287);
    			attr_dev(div3, "class", "actions flex content-center-y svelte-16jn8ie");
    			add_location(div3, file$3, 210, 3, 7954);
    			attr_dev(div4, "class", "modal import svelte-16jn8ie");
    			add_location(div4, file$3, 164, 2, 6476);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(p0, code0);
    			append_dev(p0, t5);
    			append_dev(p0, code1);
    			append_dev(p0, t7);
    			append_dev(div1, t8);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t10);
    			append_dev(ol, li1);
    			append_dev(ol, t12);
    			append_dev(ol, li2);
    			append_dev(ol, t14);
    			append_dev(ol, li3);
    			append_dev(ol, t16);
    			append_dev(ol, li4);
    			append_dev(ol, t18);
    			append_dev(ol, li5);
    			append_dev(ol, t20);
    			append_dev(ol, li6);
    			append_dev(div1, t22);
    			append_dev(div1, p1);
    			append_dev(div1, t24);
    			append_dev(div1, pre);
    			append_dev(div4, t26);
    			append_dev(div4, div2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t27);
    			append_dev(div2, textarea);
    			set_input_value(textarea, /*importCode*/ ctx[1]);
    			append_dev(div2, t28);
    			append_dev(div2, label);
    			append_dev(div4, t30);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(button0, svg1);
    			append_dev(svg1, path1);
    			append_dev(button0, t31);
    			append_dev(button0, span0);
    			append_dev(div3, t33);
    			append_dev(div3, button1);
    			append_dev(button1, svg2);
    			append_dev(svg2, path2);
    			append_dev(button1, t34);
    			append_dev(button1, span1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[16]),
    					listen_dev(textarea, "change", /*parseImport*/ ctx[8], false, false, false),
    					listen_dev(button0, "click", closeModal, false, false, false),
    					listen_dev(button1, "click", importAskToKeepState, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*importErr*/ ctx[2] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4$1(ctx);
    					if_block.c();
    					if_block.m(div2, t27);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*importCode*/ 2) {
    				set_input_value(textarea, /*importCode*/ ctx[1]);
    			}

    			if (!current || dirty & /*parsedImport*/ 8 && button1_disabled_value !== (button1_disabled_value = /*parsedImport*/ ctx[3] === null)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div4_transition) div4_transition = create_bidirectional_transition(div4, /*modalAnim*/ ctx[9], {}, true);
    				div4_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div4_transition) div4_transition = create_bidirectional_transition(div4, /*modalAnim*/ ctx[9], {}, false);
    			div4_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			if (detaching && div4_transition) div4_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(164:1) {#if $opendModal === Modals.Import}",
    		ctx
    	});

    	return block;
    }

    // (200:4) {#if importErr !== null}
    function create_if_block_4$1(ctx) {
    	let p;
    	let t_value = /*importErr*/ ctx[2].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "import-error svelte-16jn8ie");
    			add_location(p, file$3, 200, 5, 7680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*importErr*/ 4 && t_value !== (t_value = /*importErr*/ ctx[2].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(200:4) {#if importErr !== null}",
    		ctx
    	});

    	return block;
    }

    // (229:1) {#if $opendModal === Modals.DiscardAnim}
    function create_if_block_2$1(ctx) {
    	let div2;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let h1;
    	let t2;
    	let p;
    	let t4;
    	let div1;
    	let button0;
    	let svg1;
    	let path1;
    	let t5;
    	let span0;
    	let t7;
    	let button1;
    	let svg2;
    	let path2;
    	let t8;
    	let span1;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Discard Animation";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Are you sure you wan't to discard this animation?";
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t5 = space();
    			span0 = element("span");
    			span0.textContent = "Discard";
    			t7 = space();
    			button1 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t8 = space();
    			span1 = element("span");
    			span1.textContent = "Keep";
    			attr_dev(path0, "stroke", "#ffff00");
    			attr_dev(path0, "d", "M12 9V16M12 3L2 21H22L12 3ZM12 17.5L11.5 18L12 18.5L12.5 18L12 17.5Z");
    			add_location(path0, file$3, 232, 5, 8924);
    			attr_dev(svg0, "class", "icon icon-3");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$3, 231, 4, 8825);
    			attr_dev(h1, "class", "svelte-16jn8ie");
    			add_location(h1, file$3, 234, 4, 9039);
    			attr_dev(div0, "class", "header flex content-center-y gap-1 svelte-16jn8ie");
    			add_location(div0, file$3, 230, 3, 8771);
    			add_location(p, file$3, 237, 3, 9083);
    			attr_dev(path1, "d", "M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8");
    			add_location(path1, file$3, 242, 6, 9394);
    			attr_dev(svg1, "class", "icon stroke icon-15");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$3, 241, 5, 9286);
    			attr_dev(span0, "class", "label");
    			add_location(span0, file$3, 244, 5, 9561);
    			attr_dev(button0, "class", "discard btn has-icon svelte-16jn8ie");
    			add_location(button0, file$3, 240, 4, 9195);
    			attr_dev(path2, "stroke", "#4caf50");
    			attr_dev(path2, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path2, file$3, 249, 6, 9796);
    			attr_dev(svg2, "class", "icon icon-15");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$3, 248, 5, 9695);
    			attr_dev(span1, "class", "label");
    			add_location(span1, file$3, 251, 5, 9865);
    			attr_dev(button1, "class", "cancel btn has-icon align-right");
    			add_location(button1, file$3, 247, 4, 9618);
    			attr_dev(div1, "class", "actions flex content-center-y svelte-16jn8ie");
    			add_location(div1, file$3, 239, 3, 9146);
    			attr_dev(div2, "class", "modal discard-anim svelte-16jn8ie");
    			add_location(div2, file$3, 229, 2, 8713);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div2, t2);
    			append_dev(div2, p);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, svg1);
    			append_dev(svg1, path1);
    			append_dev(button0, t5);
    			append_dev(button0, span0);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(button1, svg2);
    			append_dev(svg2, path2);
    			append_dev(button1, t8);
    			append_dev(button1, span1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[17], false, false, false),
    					listen_dev(button1, "click", closeModal, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*modalAnim*/ ctx[9], {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*modalAnim*/ ctx[9], {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(229:1) {#if $opendModal === Modals.DiscardAnim}",
    		ctx
    	});

    	return block;
    }

    // (258:1) {#if $opendModal === Modals.DiscardWholeProject}
    function create_if_block_1$3(ctx) {
    	let div2;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let h1;
    	let t2;
    	let p;
    	let t4;
    	let div1;
    	let button0;
    	let svg1;
    	let path1;
    	let t5;
    	let span0;
    	let t7;
    	let button1;
    	let svg2;
    	let path2;
    	let t8;
    	let span1;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Discard everything";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Are you sure you want to discard all projects including the targets HTML & CSS?";
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t5 = space();
    			span0 = element("span");
    			span0.textContent = "Discard";
    			t7 = space();
    			button1 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t8 = space();
    			span1 = element("span");
    			span1.textContent = "Keep";
    			attr_dev(path0, "stroke", "#ffff00");
    			attr_dev(path0, "d", "M12 9V16M12 3L2 21H22L12 3ZM12 17.5L11.5 18L12 18.5L12.5 18L12 17.5Z");
    			add_location(path0, file$3, 261, 5, 10212);
    			attr_dev(svg0, "class", "icon icon-3");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$3, 260, 4, 10113);
    			attr_dev(h1, "class", "svelte-16jn8ie");
    			add_location(h1, file$3, 263, 4, 10327);
    			attr_dev(div0, "class", "header flex content-center-y gap-1 svelte-16jn8ie");
    			add_location(div0, file$3, 259, 3, 10059);
    			add_location(p, file$3, 266, 3, 10372);
    			attr_dev(path1, "d", "M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8");
    			add_location(path1, file$3, 271, 6, 10713);
    			attr_dev(svg1, "class", "icon stroke icon-15");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$3, 270, 5, 10605);
    			attr_dev(span0, "class", "label");
    			add_location(span0, file$3, 273, 5, 10880);
    			attr_dev(button0, "class", "discard btn has-icon svelte-16jn8ie");
    			add_location(button0, file$3, 269, 4, 10514);
    			attr_dev(path2, "stroke", "#4caf50");
    			attr_dev(path2, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path2, file$3, 278, 6, 11115);
    			attr_dev(svg2, "class", "icon icon-15");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$3, 277, 5, 11014);
    			attr_dev(span1, "class", "label");
    			add_location(span1, file$3, 280, 5, 11184);
    			attr_dev(button1, "class", "cancel btn has-icon align-right");
    			add_location(button1, file$3, 276, 4, 10937);
    			attr_dev(div1, "class", "actions flex content-center-y svelte-16jn8ie");
    			add_location(div1, file$3, 268, 3, 10465);
    			attr_dev(div2, "class", "modal discard-projects svelte-16jn8ie");
    			add_location(div2, file$3, 258, 2, 9997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div2, t2);
    			append_dev(div2, p);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, svg1);
    			append_dev(svg1, path1);
    			append_dev(button0, t5);
    			append_dev(button0, span0);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(button1, svg2);
    			append_dev(svg2, path2);
    			append_dev(button1, t8);
    			append_dev(button1, span1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_4*/ ctx[18], false, false, false),
    					listen_dev(button1, "click", closeModal, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*modalAnim*/ ctx[9], {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*modalAnim*/ ctx[9], {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(258:1) {#if $opendModal === Modals.DiscardWholeProject}",
    		ctx
    	});

    	return block;
    }

    // (287:1) {#if $opendModal === Modals.ImportKeepOrDiscard}
    function create_if_block$3(ctx) {
    	let div2;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let h1;
    	let t2;
    	let p;
    	let t4;
    	let div1;
    	let button0;
    	let svg1;
    	let path1;
    	let t5;
    	let span0;
    	let t7;
    	let button1;
    	let svg2;
    	let path2;
    	let t8;
    	let span1;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Importing Project";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Do you want to keep or discard the current animation projects?";
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t5 = space();
    			span0 = element("span");
    			span0.textContent = "Discard";
    			t7 = space();
    			button1 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t8 = space();
    			span1 = element("span");
    			span1.textContent = "Keep";
    			attr_dev(path0, "d", "M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 19L12 11M12 11L15 14M12 11L9 14");
    			add_location(path0, file$3, 290, 5, 11544);
    			attr_dev(svg0, "class", "icon stroke icon-3");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$3, 289, 4, 11438);
    			attr_dev(h1, "class", "svelte-16jn8ie");
    			add_location(h1, file$3, 292, 4, 11644);
    			attr_dev(div0, "class", "header flex content-center-y gap-1 svelte-16jn8ie");
    			add_location(div0, file$3, 288, 3, 11384);
    			add_location(p, file$3, 295, 3, 11688);
    			attr_dev(path1, "d", "M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8");
    			add_location(path1, file$3, 300, 6, 11988);
    			attr_dev(svg1, "class", "icon stroke icon-15");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$3, 299, 5, 11880);
    			attr_dev(span0, "class", "label");
    			add_location(span0, file$3, 302, 5, 12155);
    			attr_dev(button0, "class", "discard btn has-icon svelte-16jn8ie");
    			add_location(button0, file$3, 298, 4, 11813);
    			attr_dev(path2, "stroke", "#4caf50");
    			attr_dev(path2, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path2, file$3, 307, 6, 12402);
    			attr_dev(svg2, "class", "icon icon-15");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$3, 306, 5, 12301);
    			attr_dev(span1, "class", "label");
    			add_location(span1, file$3, 309, 5, 12471);
    			attr_dev(button1, "class", "cancel btn has-icon align-right");
    			add_location(button1, file$3, 305, 4, 12212);
    			attr_dev(div1, "class", "actions flex content-center-y svelte-16jn8ie");
    			add_location(div1, file$3, 297, 3, 11764);
    			attr_dev(div2, "class", "modal import-keep-or-discard svelte-16jn8ie");
    			add_location(div2, file$3, 287, 2, 11316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div2, t2);
    			append_dev(div2, p);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, svg1);
    			append_dev(svg1, path1);
    			append_dev(button0, t5);
    			append_dev(button0, span0);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(button1, svg2);
    			append_dev(svg2, path2);
    			append_dev(button1, t8);
    			append_dev(button1, span1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*applyImport*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*modalAnim*/ ctx[9], {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*modalAnim*/ ctx[9], {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(287:1) {#if $opendModal === Modals.ImportKeepOrDiscard}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	let if_block0 = /*$opendModal*/ ctx[4] === Modals.Target && create_if_block_6$1(ctx);
    	let if_block1 = /*$opendModal*/ ctx[4] === Modals.Export && create_if_block_5$1(ctx);
    	let if_block2 = /*$opendModal*/ ctx[4] === Modals.Import && create_if_block_3$1(ctx);
    	let if_block3 = /*$opendModal*/ ctx[4] === Modals.DiscardAnim && create_if_block_2$1(ctx);
    	let if_block4 = /*$opendModal*/ ctx[4] === Modals.DiscardWholeProject && create_if_block_1$3(ctx);
    	let if_block5 = /*$opendModal*/ ctx[4] === Modals.ImportKeepOrDiscard && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			attr_dev(div, "id", "ModalViewport");
    			attr_dev(div, "class", "flex svelte-16jn8ie");
    			toggle_class(div, "active", /*$opendModal*/ ctx[4] !== Modals.None);
    			add_location(div, file$3, 65, 0, 1813);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			append_dev(div, t3);
    			if (if_block4) if_block4.m(div, null);
    			append_dev(div, t4);
    			if (if_block5) if_block5.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$opendModal*/ ctx[4] === Modals.Target) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$opendModal*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$opendModal*/ ctx[4] === Modals.Export) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$opendModal*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$opendModal*/ ctx[4] === Modals.Import) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*$opendModal*/ 16) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_3$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*$opendModal*/ ctx[4] === Modals.DiscardAnim) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*$opendModal*/ 16) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_2$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*$opendModal*/ ctx[4] === Modals.DiscardWholeProject) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*$opendModal*/ 16) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1$3(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div, t4);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*$opendModal*/ ctx[4] === Modals.ImportKeepOrDiscard) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty & /*$opendModal*/ 16) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block$3(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(div, null);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$opendModal, Modals*/ 16) {
    				toggle_class(div, "active", /*$opendModal*/ ctx[4] !== Modals.None);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    var Modals;

    (function (Modals) {
    	Modals[Modals["None"] = 0] = "None";
    	Modals[Modals["Target"] = 1] = "Target";
    	Modals[Modals["Export"] = 2] = "Export";
    	Modals[Modals["Import"] = 3] = "Import";
    	Modals[Modals["DiscardAnim"] = 4] = "DiscardAnim";
    	Modals[Modals["ImportKeepOrDiscard"] = 5] = "ImportKeepOrDiscard";
    	Modals[Modals["DiscardWholeProject"] = 6] = "DiscardWholeProject";
    })(Modals || (Modals = {}));

    let opendModal = writable(Modals.None);
    let _onOpenModal;

    function openModal(id) {
    	_onOpenModal(id);
    	opendModal.set(id);
    }

    function closeModal() {
    	opendModal.set(Modals.None);
    }

    function importAskToKeepState() {
    	closeModal();

    	setTimeout(
    		() => {
    			openModal(Modals.ImportKeepOrDiscard);
    		},
    		300
    	);
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $opendModal;

    	let $animations,
    		$$unsubscribe_animations = noop,
    		$$subscribe_animations = () => ($$unsubscribe_animations(), $$unsubscribe_animations = subscribe(animations, $$value => $$invalidate(5, $animations = $$value)), animations);

    	validate_store(opendModal, 'opendModal');
    	component_subscribe($$self, opendModal, $$value => $$invalidate(4, $opendModal = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_animations());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ModalViewer', slots, []);
    	const dispatch = createEventDispatcher();
    	let { animations } = $$props;
    	validate_store(animations, 'animations');
    	$$subscribe_animations();
    	let { onOpenModal } = $$props;
    	_onOpenModal = onOpenModal;
    	let importCode = '';
    	let importErr = null;
    	let parsedImport = null;

    	function applyImport(keepState) {
    		if (!parsedImport) return;
    		animations.import(parsedImport, keepState);
    		$$invalidate(1, importCode = '');
    		$$invalidate(3, parsedImport = null);
    		closeModal();
    	}

    	function parseImport() {
    		try {
    			$$invalidate(3, parsedImport = null);
    			$$invalidate(3, parsedImport = parseCssImport(importCode));
    		} catch(err) {
    			$$invalidate(2, importErr = err);
    		}
    	}

    	const modalAnim = (node, isIntro) => ({
    		duration: 300,
    		css: t => `transform: translateY(${2 - 2 * cubicInOut(t)}rem);`
    	});

    	const writable_props = ['animations', 'onOpenModal'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ModalViewer> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => animations.changeTargetHTML(e.currentTarget.value);
    	const change_handler_1 = e => animations.changeTargetCSS(e.currentTarget.value);
    	const click_handler = () => copyToClipboard($animations.target.html);
    	const click_handler_1 = () => copyToClipboard($animations.target.css);
    	const click_handler_2 = () => copyToClipboard(buildProjects($animations.projects));

    	function textarea_input_handler() {
    		importCode = this.value;
    		$$invalidate(1, importCode);
    	}

    	const click_handler_3 = () => dispatch('approveAnimDiscard');
    	const click_handler_4 = () => dispatch('discardAllProjects');
    	const click_handler_5 = () => applyImport(true);

    	$$self.$$set = $$props => {
    		if ('animations' in $$props) $$subscribe_animations($$invalidate(0, animations = $$props.animations));
    		if ('onOpenModal' in $$props) $$invalidate(10, onOpenModal = $$props.onOpenModal);
    	};

    	$$self.$capture_state = () => ({
    		Modals,
    		opendModal,
    		_onOpenModal,
    		openModal,
    		closeModal,
    		buildProjects,
    		copyToClipboard,
    		parseCssImport,
    		createEventDispatcher,
    		cubicInOut,
    		writable,
    		dispatch,
    		animations,
    		onOpenModal,
    		importCode,
    		importErr,
    		parsedImport,
    		importAskToKeepState,
    		applyImport,
    		parseImport,
    		modalAnim,
    		$opendModal,
    		$animations
    	});

    	$$self.$inject_state = $$props => {
    		if ('animations' in $$props) $$subscribe_animations($$invalidate(0, animations = $$props.animations));
    		if ('onOpenModal' in $$props) $$invalidate(10, onOpenModal = $$props.onOpenModal);
    		if ('importCode' in $$props) $$invalidate(1, importCode = $$props.importCode);
    		if ('importErr' in $$props) $$invalidate(2, importErr = $$props.importErr);
    		if ('parsedImport' in $$props) $$invalidate(3, parsedImport = $$props.parsedImport);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		animations,
    		importCode,
    		importErr,
    		parsedImport,
    		$opendModal,
    		$animations,
    		dispatch,
    		applyImport,
    		parseImport,
    		modalAnim,
    		onOpenModal,
    		change_handler,
    		change_handler_1,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		textarea_input_handler,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class ModalViewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { animations: 0, onOpenModal: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalViewer",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*animations*/ ctx[0] === undefined && !('animations' in props)) {
    			console.warn("<ModalViewer> was created without expected prop 'animations'");
    		}

    		if (/*onOpenModal*/ ctx[10] === undefined && !('onOpenModal' in props)) {
    			console.warn("<ModalViewer> was created without expected prop 'onOpenModal'");
    		}
    	}

    	get animations() {
    		throw new Error("<ModalViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animations(value) {
    		throw new Error("<ModalViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onOpenModal() {
    		throw new Error("<ModalViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onOpenModal(value) {
    		throw new Error("<ModalViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SidebarLeft.svelte generated by Svelte v3.44.2 */
    const file$2 = "src\\SidebarLeft.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    // (30:2) {#if !doesAnimTargetElExist}
    function create_if_block_1$2(ctx) {
    	let div;
    	let svg;
    	let path;
    	let t0;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			span = element("span");
    			span.textContent = "Element not found";
    			attr_dev(path, "d", "M12 9V16M12 3L2 21H22L12 3ZM12 17.5L11.5 18L12 18.5L12.5 18L12 17.5Z");
    			add_location(path, file$2, 32, 5, 1335);
    			attr_dev(svg, "class", "icon stroke icon-15");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$2, 31, 4, 1228);
    			add_location(span, file$2, 34, 4, 1433);
    			attr_dev(div, "class", "selector-search-not-found flex content-center-y gap-05 svelte-jxl25l");
    			add_location(div, file$2, 30, 3, 1154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    			append_dev(div, t0);
    			append_dev(div, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(30:2) {#if !doesAnimTargetElExist}",
    		ctx
    	});

    	return block;
    }

    // (171:1) {#if timingFuncSelection}
    function create_if_block$2(ctx) {
    	let div3;
    	let div0;
    	let button;
    	let svg;
    	let path;
    	let t0;
    	let h1;
    	let t2;
    	let div2;
    	let div1;
    	let input;
    	let input_value_value;
    	let t3;
    	let label;
    	let t5;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = EasingFunctions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Timing Functions";
    			t2 = space();
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t3 = space();
    			label = element("label");
    			label.textContent = "Customize timing function";
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(path, "d", "M16.9854 3L8.00007 11.9853L16.9854 20.9706");
    			add_location(path, file$2, 175, 5, 7336);
    			attr_dev(svg, "class", "icon stroke icon-15");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$2, 174, 4, 7229);
    			attr_dev(button, "class", "btn even-pdg");
    			add_location(button, file$2, 173, 3, 7150);
    			add_location(h1, file$2, 178, 3, 7421);
    			attr_dev(div0, "class", "header flex content-center-y gap-1");
    			add_location(div0, file$2, 172, 2, 7097);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "custom-timing-func");
    			input.value = input_value_value = /*$currentProjectStore*/ ctx[6].timingFunction;
    			add_location(input, file$2, 183, 4, 7531);
    			attr_dev(label, "for", "custom-timing-func");
    			add_location(label, file$2, 188, 4, 7723);
    			attr_dev(div1, "class", "input-field svelte-jxl25l");
    			add_location(div1, file$2, 182, 3, 7500);
    			attr_dev(div2, "class", "options grid gap-05 svelte-jxl25l");
    			add_location(div2, file$2, 181, 2, 7462);
    			attr_dev(div3, "class", "timing-func-panel grid gap-1 svelte-jxl25l");
    			add_location(div3, file$2, 171, 1, 7020);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			append_dev(div1, t3);
    			append_dev(div1, label);
    			append_dev(div2, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler_12*/ ctx[26], false, false, false),
    					listen_dev(input, "change", /*change_handler_5*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*$currentProjectStore*/ 64 && input_value_value !== (input_value_value = /*$currentProjectStore*/ ctx[6].timingFunction) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*$currentProjectStore, $currentProject*/ 192) {
    				each_value = EasingFunctions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*timingFuncPanelAnim*/ ctx[8], {}, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*timingFuncPanelAnim*/ ctx[8], {}, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(171:1) {#if timingFuncSelection}",
    		ctx
    	});

    	return block;
    }

    // (192:3) {#each EasingFunctions as easeFn}
    function create_each_block$2(ctx) {
    	let button;
    	let span;
    	let t0_value = /*easeFn*/ ctx[29].name + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_13() {
    		return /*click_handler_13*/ ctx[28](/*easeFn*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "name");
    			add_location(span, file$2, 195, 5, 8022);
    			attr_dev(button, "class", "btn even-pdg svelte-jxl25l");
    			toggle_class(button, "active", /*$currentProjectStore*/ ctx[6].timingFunction === /*easeFn*/ ctx[29].value);
    			add_location(button, file$2, 192, 4, 7845);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);
    			append_dev(span, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_13, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button, "active", /*$currentProjectStore*/ ctx[6].timingFunction === /*easeFn*/ ctx[29].value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(192:3) {#each EasingFunctions as easeFn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div11;
    	let div0;
    	let h1;
    	let t1;
    	let button0;
    	let svg0;
    	let path0;
    	let t2;
    	let div1;
    	let t3;
    	let input0;
    	let input0_value_value;
    	let t4;
    	let label0;
    	let t6;
    	let div2;
    	let input1;
    	let input1_value_value;
    	let t7;
    	let label1;
    	let t9;
    	let div4;
    	let button1;
    	let div3;
    	let svg1;
    	let path1;
    	let t10;
    	let span0;
    	let t12;
    	let input2;
    	let input2_value_value;
    	let t13;
    	let label2;
    	let t15;
    	let div5;
    	let input3;
    	let input3_value_value;
    	let t16;
    	let label3;
    	let t18;
    	let div6;
    	let input4;
    	let input4_value_value;
    	let t19;
    	let label4;
    	let t21;
    	let div8;
    	let span1;
    	let t23;
    	let div7;
    	let button2;
    	let svg2;
    	let path2;
    	let t24;
    	let button3;
    	let t26;
    	let button4;
    	let t28;
    	let button5;
    	let t30;
    	let div10;
    	let span2;
    	let t32;
    	let div9;
    	let button6;
    	let svg3;
    	let path3;
    	let t33;
    	let button7;
    	let t35;
    	let button8;
    	let t37;
    	let button9;
    	let t39;
    	let button10;
    	let t41;
    	let button11;
    	let svg4;
    	let path4;
    	let path5;
    	let path6;
    	let defs;
    	let linearGradient;
    	let stop0;
    	let stop1;
    	let t42;
    	let span3;
    	let t44;
    	let svg5;
    	let path7;
    	let t45;
    	let div11_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*doesAnimTargetElExist*/ ctx[2] && create_if_block_1$2(ctx);
    	let if_block1 = /*timingFuncSelection*/ ctx[5] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Animtion Settings";
    			t1 = space();
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label0 = element("label");
    			label0.textContent = "CSS selector for Element";
    			t6 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Name";
    			t9 = space();
    			div4 = element("div");
    			button1 = element("button");
    			div3 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t10 = space();
    			span0 = element("span");
    			span0.textContent = "Steps relative to time";
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			label2 = element("label");
    			label2.textContent = "Duration";
    			t15 = space();
    			div5 = element("div");
    			input3 = element("input");
    			t16 = space();
    			label3 = element("label");
    			label3.textContent = "Delay";
    			t18 = space();
    			div6 = element("div");
    			input4 = element("input");
    			t19 = space();
    			label4 = element("label");
    			label4.textContent = "Iteration count (0 = infinite)";
    			t21 = space();
    			div8 = element("div");
    			span1 = element("span");
    			span1.textContent = "Fill mode";
    			t23 = space();
    			div7 = element("div");
    			button2 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t24 = space();
    			button3 = element("button");
    			button3.textContent = "Forwards";
    			t26 = space();
    			button4 = element("button");
    			button4.textContent = "Backwards";
    			t28 = space();
    			button5 = element("button");
    			button5.textContent = "Both";
    			t30 = space();
    			div10 = element("div");
    			span2 = element("span");
    			span2.textContent = "Direction";
    			t32 = space();
    			div9 = element("div");
    			button6 = element("button");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t33 = space();
    			button7 = element("button");
    			button7.textContent = "Normal";
    			t35 = space();
    			button8 = element("button");
    			button8.textContent = "Reverse";
    			t37 = space();
    			button9 = element("button");
    			button9.textContent = "Alternate";
    			t39 = space();
    			button10 = element("button");
    			button10.textContent = "Alt-Reverse";
    			t41 = space();
    			button11 = element("button");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			defs = svg_element("defs");
    			linearGradient = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			t42 = space();
    			span3 = element("span");
    			span3.textContent = "Timing Function";
    			t44 = space();
    			svg5 = svg_element("svg");
    			path7 = svg_element("path");
    			t45 = space();
    			if (if_block1) if_block1.c();
    			add_location(h1, file$2, 19, 2, 663);
    			attr_dev(path0, "d", "M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8");
    			add_location(path0, file$2, 23, 4, 907);
    			attr_dev(svg0, "class", "icon stroke icon-15");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$2, 22, 3, 801);
    			attr_dev(button0, "class", "discard btn even-pdg small align-right svelte-jxl25l");
    			add_location(button0, file$2, 21, 2, 695);
    			attr_dev(div0, "class", "header flex nowrap content-center-y gap-05 svelte-jxl25l");
    			add_location(div0, file$2, 18, 1, 603);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "target-query-input");
    			input0.value = input0_value_value = /*$currentProjectStore*/ ctx[6].targetEl;
    			add_location(input0, file$2, 37, 2, 1487);
    			attr_dev(label0, "for", "target-query-input");
    			add_location(label0, file$2, 42, 2, 1667);
    			attr_dev(div1, "class", "input-field");
    			add_location(div1, file$2, 28, 1, 1092);
    			attr_dev(input1, "id", "animation-name");
    			attr_dev(input1, "type", "text");
    			input1.value = input1_value_value = /*$currentProjectStore*/ ctx[6].name;
    			add_location(input1, file$2, 48, 2, 1783);
    			attr_dev(label1, "for", "animation-name");
    			add_location(label1, file$2, 54, 2, 1949);
    			attr_dev(div2, "class", "input-field");
    			add_location(div2, file$2, 47, 1, 1754);
    			attr_dev(path1, "d", "M 4 11, l 5 4, l 8 -10");
    			attr_dev(path1, "stroke-width", "2");
    			add_location(path1, file$2, 61, 5, 2309);
    			attr_dev(svg1, "viewBox", "0 0 20 20");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$2, 60, 4, 2230);
    			attr_dev(div3, "class", "checkbox flex content-center");
    			toggle_class(div3, "active", /*$currentProjectStore*/ ctx[6].stepsRelativeToTime);
    			add_location(div3, file$2, 59, 3, 2126);
    			attr_dev(span0, "class", "label");
    			add_location(span0, file$2, 64, 3, 2388);
    			attr_dev(button1, "class", "btn has-icon");
    			add_location(button1, file$2, 58, 2, 2032);
    			attr_dev(input2, "id", "animation-duration");
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "min", "0");
    			input2.value = input2_value_value = /*$currentProjectStore*/ ctx[6].duration;
    			add_location(input2, file$2, 66, 2, 2454);
    			attr_dev(label2, "for", "animation-duration");
    			add_location(label2, file$2, 73, 2, 2654);
    			attr_dev(div4, "class", "input-field");
    			add_location(div4, file$2, 57, 1, 2003);
    			attr_dev(input3, "id", "animation-delay");
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "min", "0");
    			input3.value = input3_value_value = /*$currentProjectStore*/ ctx[6].delay;
    			add_location(input3, file$2, 77, 2, 2745);
    			attr_dev(label3, "for", "animation-delay");
    			add_location(label3, file$2, 84, 2, 2936);
    			attr_dev(div5, "class", "input-field");
    			add_location(div5, file$2, 76, 1, 2716);
    			attr_dev(input4, "id", "animation-iteration-count");
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "min", "0");
    			input4.value = input4_value_value = /*$currentProjectStore*/ ctx[6].iterations;
    			add_location(input4, file$2, 88, 2, 3021);
    			attr_dev(label4, "for", "animation-iteration-count");
    			add_location(label4, file$2, 95, 2, 3232);
    			attr_dev(div6, "class", "input-field");
    			add_location(div6, file$2, 87, 1, 2992);
    			attr_dev(span1, "class", "label");
    			add_location(span1, file$2, 101, 2, 3361);
    			attr_dev(path2, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path2, file$2, 106, 5, 3687);
    			attr_dev(svg2, "class", "icon stroke icon-15");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$2, 105, 4, 3580);
    			toggle_class(button2, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.None);
    			add_location(button2, file$2, 103, 3, 3429);
    			toggle_class(button3, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.Forwards);
    			add_location(button3, file$2, 109, 3, 3750);
    			toggle_class(button4, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.Backwards);
    			add_location(button4, file$2, 113, 3, 3936);
    			toggle_class(button5, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.Both);
    			add_location(button5, file$2, 117, 3, 4125);
    			attr_dev(div7, "class", "btn-group");
    			add_location(div7, file$2, 102, 2, 3401);
    			attr_dev(div8, "class", "grid gap-05");
    			add_location(div8, file$2, 100, 1, 3332);
    			attr_dev(span2, "class", "label");
    			add_location(span2, file$2, 125, 2, 4347);
    			attr_dev(path3, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path3, file$2, 130, 5, 4677);
    			attr_dev(svg3, "class", "icon stroke icon-15");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg3, file$2, 129, 4, 4570);
    			toggle_class(button6, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.None);
    			add_location(button6, file$2, 127, 3, 4415);
    			toggle_class(button7, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.Normal);
    			add_location(button7, file$2, 133, 3, 4740);
    			toggle_class(button8, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.Reverse);
    			add_location(button8, file$2, 137, 3, 4924);
    			toggle_class(button9, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.Alternate);
    			add_location(button9, file$2, 141, 3, 5111);
    			toggle_class(button10, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.AlternateReverse);
    			add_location(button10, file$2, 145, 3, 5304);
    			attr_dev(div9, "class", "btn-group");
    			add_location(div9, file$2, 126, 2, 4387);
    			attr_dev(div10, "class", "grid gap-05");
    			add_location(div10, file$2, 124, 1, 4318);
    			attr_dev(path4, "fill", "#fff");
    			attr_dev(path4, "d", "M3 1L1.55662 3.5L4.44338 3.5L3 1ZM3 21L2.75 21L2.75 21.25L3 21.25L3 21ZM23 21L20.5 19.5566L20.5 22.4434L23 21ZM2.75 3.25L2.75 21L3.25 21L3.25 3.25L2.75 3.25ZM3 21.25L20.75 21.25L20.75 20.75L3 20.75L3 21.25Z");
    			add_location(path4, file$2, 154, 3, 5726);
    			attr_dev(path5, "fill", "url(#paint0_linear_1552_25)");
    			attr_dev(path5, "d", "M3.5 20L3.5 20.5L4.5 20.5L4.5 20L3.5 20ZM20.5 4V3.5H19.5V4H20.5ZM4.5 20C4.5 17.1317 5.44511 15.5412 6.8 14.525C8.20385 13.4721 10.0962 12.9913 12.1213 12.4851C14.0962 11.9913 16.2038 11.4721 17.8 10.275C19.4451 9.04117 20.5 7.13172 20.5 4H19.5C19.5 6.86828 18.5549 8.45883 17.2 9.475C15.7962 10.5279 13.9038 11.0087 11.8787 11.5149C9.9038 12.0087 7.79615 12.5279 6.2 13.725C4.55489 14.9588 3.5 16.8683 3.5 20L4.5 20Z");
    			add_location(path5, file$2, 155, 3, 5961);
    			attr_dev(path6, "opacity", "0.5");
    			attr_dev(path6, "d", "M5 3H21V19");
    			attr_dev(path6, "stroke", "#fff");
    			attr_dev(path6, "stroke-dasharray", "1 1");
    			add_location(path6, file$2, 156, 3, 6429);
    			attr_dev(stop0, "stop-color", "#15DF66");
    			add_location(stop0, file$2, 159, 5, 6631);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#3D8AFF");
    			add_location(stop1, file$2, 160, 5, 6666);
    			attr_dev(linearGradient, "id", "paint0_linear_1552_25");
    			attr_dev(linearGradient, "x1", "12");
    			attr_dev(linearGradient, "y1", "3");
    			attr_dev(linearGradient, "x2", "12");
    			attr_dev(linearGradient, "y2", "21");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$2, 158, 4, 6519);
    			add_location(defs, file$2, 157, 3, 6507);
    			attr_dev(svg4, "class", "icon icon-2");
    			attr_dev(svg4, "viewBox", "0 0 24 24");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg4, file$2, 153, 2, 5629);
    			attr_dev(span3, "class", "label");
    			add_location(span3, file$2, 164, 2, 6754);
    			attr_dev(path7, "d", "M8 20.9706L16.9853 11.9853L8 3.00002");
    			add_location(path7, file$2, 166, 3, 6917);
    			attr_dev(svg5, "class", "icon stroke icon-15 align-right");
    			attr_dev(svg5, "viewBox", "0 0 24 24");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg5, file$2, 165, 2, 6800);
    			attr_dev(button11, "class", "btn has-icon flex");
    			add_location(button11, file$2, 152, 1, 5532);
    			attr_dev(div11, "class", "sidebar-left grid gap-15");
    			add_location(div11, file$2, 17, 0, 532);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div11, t2);
    			append_dev(div11, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div1, t4);
    			append_dev(div1, label0);
    			append_dev(div11, t6);
    			append_dev(div11, div2);
    			append_dev(div2, input1);
    			append_dev(div2, t7);
    			append_dev(div2, label1);
    			append_dev(div11, t9);
    			append_dev(div11, div4);
    			append_dev(div4, button1);
    			append_dev(button1, div3);
    			append_dev(div3, svg1);
    			append_dev(svg1, path1);
    			append_dev(button1, t10);
    			append_dev(button1, span0);
    			append_dev(div4, t12);
    			append_dev(div4, input2);
    			append_dev(div4, t13);
    			append_dev(div4, label2);
    			append_dev(div11, t15);
    			append_dev(div11, div5);
    			append_dev(div5, input3);
    			append_dev(div5, t16);
    			append_dev(div5, label3);
    			append_dev(div11, t18);
    			append_dev(div11, div6);
    			append_dev(div6, input4);
    			append_dev(div6, t19);
    			append_dev(div6, label4);
    			append_dev(div11, t21);
    			append_dev(div11, div8);
    			append_dev(div8, span1);
    			append_dev(div8, t23);
    			append_dev(div8, div7);
    			append_dev(div7, button2);
    			append_dev(button2, svg2);
    			append_dev(svg2, path2);
    			append_dev(div7, t24);
    			append_dev(div7, button3);
    			append_dev(div7, t26);
    			append_dev(div7, button4);
    			append_dev(div7, t28);
    			append_dev(div7, button5);
    			append_dev(div11, t30);
    			append_dev(div11, div10);
    			append_dev(div10, span2);
    			append_dev(div10, t32);
    			append_dev(div10, div9);
    			append_dev(div9, button6);
    			append_dev(button6, svg3);
    			append_dev(svg3, path3);
    			append_dev(div9, t33);
    			append_dev(div9, button7);
    			append_dev(div9, t35);
    			append_dev(div9, button8);
    			append_dev(div9, t37);
    			append_dev(div9, button9);
    			append_dev(div9, t39);
    			append_dev(div9, button10);
    			append_dev(div11, t41);
    			append_dev(div11, button11);
    			append_dev(button11, svg4);
    			append_dev(svg4, path4);
    			append_dev(svg4, path5);
    			append_dev(svg4, path6);
    			append_dev(svg4, defs);
    			append_dev(defs, linearGradient);
    			append_dev(linearGradient, stop0);
    			append_dev(linearGradient, stop1);
    			append_dev(button11, t42);
    			append_dev(button11, span3);
    			append_dev(button11, t44);
    			append_dev(button11, svg5);
    			append_dev(svg5, path7);
    			append_dev(div11, t45);
    			if (if_block1) if_block1.m(div11, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(input0, "change", /*change_handler*/ ctx[10], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[13], false, false, false),
    					listen_dev(input3, "change", /*change_handler_3*/ ctx[14], false, false, false),
    					listen_dev(input4, "change", /*change_handler_4*/ ctx[15], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[16], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[17], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[18], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[19], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[20], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[21], false, false, false),
    					listen_dev(button8, "click", /*click_handler_8*/ ctx[22], false, false, false),
    					listen_dev(button9, "click", /*click_handler_9*/ ctx[23], false, false, false),
    					listen_dev(button10, "click", /*click_handler_10*/ ctx[24], false, false, false),
    					listen_dev(button11, "click", /*click_handler_11*/ ctx[25], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!/*doesAnimTargetElExist*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div1, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty[0] & /*$currentProjectStore*/ 64 && input0_value_value !== (input0_value_value = /*$currentProjectStore*/ ctx[6].targetEl) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (!current || dirty[0] & /*$currentProjectStore*/ 64 && input1_value_value !== (input1_value_value = /*$currentProjectStore*/ ctx[6].name) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(div3, "active", /*$currentProjectStore*/ ctx[6].stepsRelativeToTime);
    			}

    			if (!current || dirty[0] & /*$currentProjectStore*/ 64 && input2_value_value !== (input2_value_value = /*$currentProjectStore*/ ctx[6].duration)) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (!current || dirty[0] & /*$currentProjectStore*/ 64 && input3_value_value !== (input3_value_value = /*$currentProjectStore*/ ctx[6].delay)) {
    				prop_dev(input3, "value", input3_value_value);
    			}

    			if (!current || dirty[0] & /*$currentProjectStore*/ 64 && input4_value_value !== (input4_value_value = /*$currentProjectStore*/ ctx[6].iterations)) {
    				prop_dev(input4, "value", input4_value_value);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button2, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.None);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button3, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.Forwards);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button4, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.Backwards);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button5, "active", /*$currentProjectStore*/ ctx[6].fillMode === AnimFillmode.Both);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button6, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.None);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button7, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.Normal);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button8, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.Reverse);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button9, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.Alternate);
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 64) {
    				toggle_class(button10, "active", /*$currentProjectStore*/ ctx[6].direction === AnimDirection.AlternateReverse);
    			}

    			if (/*timingFuncSelection*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*timingFuncSelection*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div11, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);

    			add_render_callback(() => {
    				if (!div11_transition) div11_transition = create_bidirectional_transition(div11, /*sidebarAnim*/ ctx[0], true, true);
    				div11_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			if (!div11_transition) div11_transition = create_bidirectional_transition(div11, /*sidebarAnim*/ ctx[0], true, false);
    			div11_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching && div11_transition) div11_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $currentProjectStore,
    		$$unsubscribe_currentProjectStore = noop,
    		$$subscribe_currentProjectStore = () => ($$unsubscribe_currentProjectStore(), $$unsubscribe_currentProjectStore = subscribe(currentProjectStore, $$value => $$invalidate(6, $currentProjectStore = $$value)), currentProjectStore);

    	let $currentProject,
    		$$unsubscribe_currentProject = noop,
    		$$subscribe_currentProject = () => ($$unsubscribe_currentProject(), $$unsubscribe_currentProject = subscribe(currentProject, $$value => $$invalidate(7, $currentProject = $$value)), currentProject);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_currentProjectStore());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_currentProject());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SidebarLeft', slots, []);
    	let { sidebarAnim } = $$props;
    	let { openModal } = $$props;
    	let { doesAnimTargetElExist } = $$props;
    	let { currentProject } = $$props;
    	validate_store(currentProject, 'currentProject');
    	$$subscribe_currentProject();
    	let { currentProjectStore } = $$props;
    	validate_store(currentProjectStore, 'currentProjectStore');
    	$$subscribe_currentProjectStore();

    	const timingFuncPanelAnim = (node, o) => ({
    		duration: 250,
    		css: t => `transform: translateX(${101 - 101 * cubicOut(t)}%);`
    	});

    	let timingFuncSelection = false;

    	const writable_props = [
    		'sidebarAnim',
    		'openModal',
    		'doesAnimTargetElExist',
    		'currentProject',
    		'currentProjectStore'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SidebarLeft> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => openModal(Modals.DiscardAnim);
    	const change_handler = e => $currentProject.targetChangeSelector(e.currentTarget.value);
    	const change_handler_1 = e => $currentProject.changeName(e.currentTarget.value);
    	const click_handler_1 = () => $currentProject.toggleStepsRelativeOnTime();
    	const change_handler_2 = e => $currentProject.changeDuration(Number(e.currentTarget.value));
    	const change_handler_3 = e => $currentProject.changeDelay(Number(e.currentTarget.value));
    	const change_handler_4 = e => $currentProject.changeIterations(Number(e.currentTarget.value));
    	const click_handler_2 = () => $currentProject.changeFillMode(AnimFillmode.None);
    	const click_handler_3 = () => $currentProject.changeFillMode(AnimFillmode.Forwards);
    	const click_handler_4 = () => $currentProject.changeFillMode(AnimFillmode.Backwards);
    	const click_handler_5 = () => $currentProject.changeFillMode(AnimFillmode.Both);
    	const click_handler_6 = () => $currentProject.changeDirection(AnimDirection.None);
    	const click_handler_7 = () => $currentProject.changeDirection(AnimDirection.Normal);
    	const click_handler_8 = () => $currentProject.changeDirection(AnimDirection.Reverse);
    	const click_handler_9 = () => $currentProject.changeDirection(AnimDirection.Alternate);
    	const click_handler_10 = () => $currentProject.changeDirection(AnimDirection.AlternateReverse);
    	const click_handler_11 = () => $$invalidate(5, timingFuncSelection = !timingFuncSelection);
    	const click_handler_12 = () => $$invalidate(5, timingFuncSelection = false);
    	const change_handler_5 = e => $currentProject.changeTimingFunc(e.currentTarget.value);
    	const click_handler_13 = easeFn => $currentProject.changeTimingFunc(easeFn.value);

    	$$self.$$set = $$props => {
    		if ('sidebarAnim' in $$props) $$invalidate(0, sidebarAnim = $$props.sidebarAnim);
    		if ('openModal' in $$props) $$invalidate(1, openModal = $$props.openModal);
    		if ('doesAnimTargetElExist' in $$props) $$invalidate(2, doesAnimTargetElExist = $$props.doesAnimTargetElExist);
    		if ('currentProject' in $$props) $$subscribe_currentProject($$invalidate(3, currentProject = $$props.currentProject));
    		if ('currentProjectStore' in $$props) $$subscribe_currentProjectStore($$invalidate(4, currentProjectStore = $$props.currentProjectStore));
    	};

    	$$self.$capture_state = () => ({
    		AnimDirection,
    		AnimFillmode,
    		EasingFunctions,
    		cubicOut,
    		Modals,
    		sidebarAnim,
    		openModal,
    		doesAnimTargetElExist,
    		currentProject,
    		currentProjectStore,
    		timingFuncPanelAnim,
    		timingFuncSelection,
    		$currentProjectStore,
    		$currentProject
    	});

    	$$self.$inject_state = $$props => {
    		if ('sidebarAnim' in $$props) $$invalidate(0, sidebarAnim = $$props.sidebarAnim);
    		if ('openModal' in $$props) $$invalidate(1, openModal = $$props.openModal);
    		if ('doesAnimTargetElExist' in $$props) $$invalidate(2, doesAnimTargetElExist = $$props.doesAnimTargetElExist);
    		if ('currentProject' in $$props) $$subscribe_currentProject($$invalidate(3, currentProject = $$props.currentProject));
    		if ('currentProjectStore' in $$props) $$subscribe_currentProjectStore($$invalidate(4, currentProjectStore = $$props.currentProjectStore));
    		if ('timingFuncSelection' in $$props) $$invalidate(5, timingFuncSelection = $$props.timingFuncSelection);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sidebarAnim,
    		openModal,
    		doesAnimTargetElExist,
    		currentProject,
    		currentProjectStore,
    		timingFuncSelection,
    		$currentProjectStore,
    		$currentProject,
    		timingFuncPanelAnim,
    		click_handler,
    		change_handler,
    		change_handler_1,
    		click_handler_1,
    		change_handler_2,
    		change_handler_3,
    		change_handler_4,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		change_handler_5,
    		click_handler_13
    	];
    }

    class SidebarLeft extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				sidebarAnim: 0,
    				openModal: 1,
    				doesAnimTargetElExist: 2,
    				currentProject: 3,
    				currentProjectStore: 4
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SidebarLeft",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sidebarAnim*/ ctx[0] === undefined && !('sidebarAnim' in props)) {
    			console.warn("<SidebarLeft> was created without expected prop 'sidebarAnim'");
    		}

    		if (/*openModal*/ ctx[1] === undefined && !('openModal' in props)) {
    			console.warn("<SidebarLeft> was created without expected prop 'openModal'");
    		}

    		if (/*doesAnimTargetElExist*/ ctx[2] === undefined && !('doesAnimTargetElExist' in props)) {
    			console.warn("<SidebarLeft> was created without expected prop 'doesAnimTargetElExist'");
    		}

    		if (/*currentProject*/ ctx[3] === undefined && !('currentProject' in props)) {
    			console.warn("<SidebarLeft> was created without expected prop 'currentProject'");
    		}

    		if (/*currentProjectStore*/ ctx[4] === undefined && !('currentProjectStore' in props)) {
    			console.warn("<SidebarLeft> was created without expected prop 'currentProjectStore'");
    		}
    	}

    	get sidebarAnim() {
    		throw new Error("<SidebarLeft>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebarAnim(value) {
    		throw new Error("<SidebarLeft>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get openModal() {
    		throw new Error("<SidebarLeft>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set openModal(value) {
    		throw new Error("<SidebarLeft>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get doesAnimTargetElExist() {
    		throw new Error("<SidebarLeft>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set doesAnimTargetElExist(value) {
    		throw new Error("<SidebarLeft>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentProject() {
    		throw new Error("<SidebarLeft>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentProject(value) {
    		throw new Error("<SidebarLeft>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentProjectStore() {
    		throw new Error("<SidebarLeft>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentProjectStore(value) {
    		throw new Error("<SidebarLeft>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SidebarRight.svelte generated by Svelte v3.44.2 */

    const file$1 = "src\\SidebarRight.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (21:1) {:else}
    function create_else_block$1(ctx) {
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let div1;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*sideBarTab*/ ctx[5] === /*SideBarTab*/ ctx[4].Selected) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Selected Step";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Steps Index";
    			t3 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(button0, "class", "svelte-csjvgv");
    			toggle_class(button0, "active", /*sideBarTab*/ ctx[5] === /*SideBarTab*/ ctx[4].Selected);
    			add_location(button0, file$1, 22, 3, 694);
    			attr_dev(button1, "class", "svelte-csjvgv");
    			toggle_class(button1, "active", /*sideBarTab*/ ctx[5] === /*SideBarTab*/ ctx[4].Index);
    			add_location(button1, file$1, 25, 3, 839);
    			attr_dev(div0, "class", "tabs flex svelte-csjvgv");
    			add_location(div0, file$1, 21, 2, 666);
    			attr_dev(div1, "class", "content svelte-csjvgv");
    			add_location(div1, file$1, 29, 2, 985);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sideBarTab, SideBarTab*/ 48) {
    				toggle_class(button0, "active", /*sideBarTab*/ ctx[5] === /*SideBarTab*/ ctx[4].Selected);
    			}

    			if (dirty & /*sideBarTab, SideBarTab*/ 48) {
    				toggle_class(button1, "active", /*sideBarTab*/ ctx[5] === /*SideBarTab*/ ctx[4].Index);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(21:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (19:1) {#if $currentProjectStore.selectedStep === null}
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Select a step in the timeline";
    			attr_dev(p, "class", "placeholder svelte-csjvgv");
    			add_location(p, file$1, 19, 2, 596);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(19:1) {#if $currentProjectStore.selectedStep === null}",
    		ctx
    	});

    	return block;
    }

    // (67:2) {:else}
    function create_else_block_1$1(ctx) {
    	let div;
    	let each_value = /*$currentProjectStore*/ ctx[6].steps;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "steps-index grid gap-1 svelte-csjvgv");
    			add_location(div, file$1, 67, 3, 2191);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentProjectStore, $currentProject, timeByPercentage*/ 448) {
    				each_value = /*$currentProjectStore*/ ctx[6].steps;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(67:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (31:2) {#if sideBarTab === SideBarTab.Selected}
    function create_if_block_1$1(ctx) {
    	let div3;
    	let div0;
    	let input0;
    	let input0_value_value;
    	let t0;
    	let label0;
    	let t2;
    	let div1;
    	let input1;
    	let input1_value_value;
    	let input1_max_value;
    	let t3;
    	let label1;
    	let t5;
    	let div2;
    	let textarea;
    	let textarea_value_value;
    	let t6;
    	let label2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			label0 = element("label");
    			label0.textContent = "Position by percentage";
    			t2 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "Position by time (ms)";
    			t5 = space();
    			div2 = element("div");
    			textarea = element("textarea");
    			t6 = space();
    			label2 = element("label");
    			label2.textContent = "Styles (plain CSS)";
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "id", "selected-step-pos-perc");
    			input0.value = input0_value_value = /*selectedStep*/ ctx[3].pos;
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "step", "1");
    			attr_dev(input0, "max", "100");
    			add_location(input0, file$1, 33, 5, 1129);
    			attr_dev(label0, "for", "selected-step-pos-perc");
    			add_location(label0, file$1, 39, 5, 1352);
    			attr_dev(div0, "class", "input-field");
    			add_location(div0, file$1, 32, 4, 1097);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "selected-step-pos-time");
    			input1.value = input1_value_value = /*timeByPercentage*/ ctx[8](/*selectedStep*/ ctx[3].pos);
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "step", "100");
    			attr_dev(input1, "max", input1_max_value = /*$currentProjectStore*/ ctx[6].duration);
    			add_location(input1, file$1, 44, 5, 1483);
    			attr_dev(label1, "for", "selected-step-pos-time");
    			add_location(label1, file$1, 51, 5, 1765);
    			attr_dev(div1, "class", "input-field");
    			add_location(div1, file$1, 43, 4, 1451);
    			attr_dev(textarea, "id", "selected-step-style");
    			attr_dev(textarea, "rows", "10");
    			textarea.value = textarea_value_value = /*selectedStep*/ ctx[3].styles;
    			add_location(textarea, file$1, 56, 5, 1895);
    			attr_dev(label2, "for", "selected-step-style");
    			add_location(label2, file$1, 61, 5, 2078);
    			attr_dev(div2, "class", "input-field");
    			add_location(div2, file$1, 55, 4, 1863);
    			attr_dev(div3, "class", "step-editor grid gap-1 svelte-csjvgv");
    			add_location(div3, file$1, 31, 3, 1055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, input0);
    			append_dev(div0, t0);
    			append_dev(div0, label0);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, input1);
    			append_dev(div1, t3);
    			append_dev(div1, label1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, textarea);
    			append_dev(div2, t6);
    			append_dev(div2, label2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[11], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[12], false, false, false),
    					listen_dev(textarea, "change", /*change_handler_2*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedStep*/ 8 && input0_value_value !== (input0_value_value = /*selectedStep*/ ctx[3].pos)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*selectedStep*/ 8 && input1_value_value !== (input1_value_value = /*timeByPercentage*/ ctx[8](/*selectedStep*/ ctx[3].pos))) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*$currentProjectStore*/ 64 && input1_max_value !== (input1_max_value = /*$currentProjectStore*/ ctx[6].duration)) {
    				attr_dev(input1, "max", input1_max_value);
    			}

    			if (dirty & /*selectedStep*/ 8 && textarea_value_value !== (textarea_value_value = /*selectedStep*/ ctx[3].styles)) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(31:2) {#if sideBarTab === SideBarTab.Selected}",
    		ctx
    	});

    	return block;
    }

    // (69:4) {#each $currentProjectStore.steps as step, stepIdx}
    function create_each_block$1(ctx) {
    	let button;
    	let span0;
    	let t0_value = /*stepIdx*/ ctx[17] + 1 + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*step*/ ctx[15].pos + "";
    	let t2;
    	let t3;
    	let t4;
    	let span2;
    	let t5_value = /*timeByPercentage*/ ctx[8](/*step*/ ctx[15].pos) + "";
    	let t5;
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[14](/*stepIdx*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = text("%");
    			t4 = text("\r\n\t\t\t\t\t\t/\r\n\t\t\t\t\t\t");
    			span2 = element("span");
    			t5 = text(t5_value);
    			t6 = text("ms");
    			t7 = space();
    			attr_dev(span0, "class", "index svelte-csjvgv");
    			add_location(span0, file$1, 72, 6, 2444);
    			attr_dev(span1, "class", "percentage");
    			add_location(span1, file$1, 73, 6, 2490);
    			attr_dev(span2, "class", "time");
    			add_location(span2, file$1, 75, 6, 2550);
    			attr_dev(button, "class", "btn svelte-csjvgv");
    			toggle_class(button, "active", /*$currentProjectStore*/ ctx[6].selectedStep === /*stepIdx*/ ctx[17]);
    			add_location(button, file$1, 69, 5, 2291);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span0);
    			append_dev(span0, t0);
    			append_dev(button, t1);
    			append_dev(button, span1);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    			append_dev(button, t4);
    			append_dev(button, span2);
    			append_dev(span2, t5);
    			append_dev(span2, t6);
    			append_dev(button, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$currentProjectStore*/ 64 && t2_value !== (t2_value = /*step*/ ctx[15].pos + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$currentProjectStore*/ 64 && t5_value !== (t5_value = /*timeByPercentage*/ ctx[8](/*step*/ ctx[15].pos) + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*$currentProjectStore*/ 64) {
    				toggle_class(button, "active", /*$currentProjectStore*/ ctx[6].selectedStep === /*stepIdx*/ ctx[17]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(69:4) {#each $currentProjectStore.steps as step, stepIdx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*$currentProjectStore*/ ctx[6].selectedStep === null) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "sidebar-right");
    			add_location(div, file$1, 17, 0, 483);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, /*sidebarAnim*/ ctx[0], false, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, /*sidebarAnim*/ ctx[0], false, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $currentProjectStore,
    		$$unsubscribe_currentProjectStore = noop,
    		$$subscribe_currentProjectStore = () => ($$unsubscribe_currentProjectStore(), $$unsubscribe_currentProjectStore = subscribe(currentProjectStore, $$value => $$invalidate(6, $currentProjectStore = $$value)), currentProjectStore);

    	let $currentProject,
    		$$unsubscribe_currentProject = noop,
    		$$subscribe_currentProject = () => ($$unsubscribe_currentProject(), $$unsubscribe_currentProject = subscribe(currentProject, $$value => $$invalidate(7, $currentProject = $$value)), currentProject);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_currentProjectStore());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_currentProject());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SidebarRight', slots, []);
    	let { sidebarAnim } = $$props;
    	let { currentProjectStore } = $$props;
    	validate_store(currentProjectStore, 'currentProjectStore');
    	$$subscribe_currentProjectStore();
    	let { currentProject } = $$props;
    	validate_store(currentProject, 'currentProject');
    	$$subscribe_currentProject();
    	let { selectedStep } = $$props;

    	function timeByPercentage(percentage) {
    		return $currentProjectStore.duration / 100 * percentage;
    	}

    	var SideBarTab;

    	(function (SideBarTab) {
    		SideBarTab[SideBarTab["Selected"] = 0] = "Selected";
    		SideBarTab[SideBarTab["Index"] = 1] = "Index";
    	})(SideBarTab || (SideBarTab = {}));

    	let sideBarTab = SideBarTab.Selected;
    	const writable_props = ['sidebarAnim', 'currentProjectStore', 'currentProject', 'selectedStep'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SidebarRight> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(5, sideBarTab = SideBarTab.Selected);
    	const click_handler_1 = () => $$invalidate(5, sideBarTab = SideBarTab.Index);
    	const change_handler = e => $currentProject.changeStepPos(Number(e.currentTarget.value));
    	const change_handler_1 = e => $currentProject.changeStepPosByTime(Number(e.currentTarget.value));
    	const change_handler_2 = e => $currentProject.updateStepStyles(e.currentTarget.value);
    	const click_handler_2 = stepIdx => $currentProject.selectStep(stepIdx);

    	$$self.$$set = $$props => {
    		if ('sidebarAnim' in $$props) $$invalidate(0, sidebarAnim = $$props.sidebarAnim);
    		if ('currentProjectStore' in $$props) $$subscribe_currentProjectStore($$invalidate(1, currentProjectStore = $$props.currentProjectStore));
    		if ('currentProject' in $$props) $$subscribe_currentProject($$invalidate(2, currentProject = $$props.currentProject));
    		if ('selectedStep' in $$props) $$invalidate(3, selectedStep = $$props.selectedStep);
    	};

    	$$self.$capture_state = () => ({
    		sidebarAnim,
    		currentProjectStore,
    		currentProject,
    		selectedStep,
    		timeByPercentage,
    		SideBarTab,
    		sideBarTab,
    		$currentProjectStore,
    		$currentProject
    	});

    	$$self.$inject_state = $$props => {
    		if ('sidebarAnim' in $$props) $$invalidate(0, sidebarAnim = $$props.sidebarAnim);
    		if ('currentProjectStore' in $$props) $$subscribe_currentProjectStore($$invalidate(1, currentProjectStore = $$props.currentProjectStore));
    		if ('currentProject' in $$props) $$subscribe_currentProject($$invalidate(2, currentProject = $$props.currentProject));
    		if ('selectedStep' in $$props) $$invalidate(3, selectedStep = $$props.selectedStep);
    		if ('SideBarTab' in $$props) $$invalidate(4, SideBarTab = $$props.SideBarTab);
    		if ('sideBarTab' in $$props) $$invalidate(5, sideBarTab = $$props.sideBarTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sidebarAnim,
    		currentProjectStore,
    		currentProject,
    		selectedStep,
    		SideBarTab,
    		sideBarTab,
    		$currentProjectStore,
    		$currentProject,
    		timeByPercentage,
    		click_handler,
    		click_handler_1,
    		change_handler,
    		change_handler_1,
    		change_handler_2,
    		click_handler_2
    	];
    }

    class SidebarRight extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			sidebarAnim: 0,
    			currentProjectStore: 1,
    			currentProject: 2,
    			selectedStep: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SidebarRight",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sidebarAnim*/ ctx[0] === undefined && !('sidebarAnim' in props)) {
    			console.warn("<SidebarRight> was created without expected prop 'sidebarAnim'");
    		}

    		if (/*currentProjectStore*/ ctx[1] === undefined && !('currentProjectStore' in props)) {
    			console.warn("<SidebarRight> was created without expected prop 'currentProjectStore'");
    		}

    		if (/*currentProject*/ ctx[2] === undefined && !('currentProject' in props)) {
    			console.warn("<SidebarRight> was created without expected prop 'currentProject'");
    		}

    		if (/*selectedStep*/ ctx[3] === undefined && !('selectedStep' in props)) {
    			console.warn("<SidebarRight> was created without expected prop 'selectedStep'");
    		}
    	}

    	get sidebarAnim() {
    		throw new Error("<SidebarRight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebarAnim(value) {
    		throw new Error("<SidebarRight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentProjectStore() {
    		throw new Error("<SidebarRight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentProjectStore(value) {
    		throw new Error("<SidebarRight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentProject() {
    		throw new Error("<SidebarRight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentProject(value) {
    		throw new Error("<SidebarRight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedStep() {
    		throw new Error("<SidebarRight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedStep(value) {
    		throw new Error("<SidebarRight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[69] = list[i];
    	child_ctx[71] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[72] = list[i];
    	child_ctx[71] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[72] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[76] = list[i];
    	child_ctx[78] = i;
    	return child_ctx;
    }

    // (300:6) {:else}
    function create_else_block_2(ctx) {
    	let t_value = get_store_value(/*prj*/ ctx[76]).name + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$animations*/ 2097152 && t_value !== (t_value = get_store_value(/*prj*/ ctx[76]).name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(300:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (298:6) {#if prjIdx === $animations.curPrj}
    function create_if_block_7(ctx) {
    	let t_value = /*$currentProjectStore*/ ctx[4].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$currentProjectStore*/ 16 && t_value !== (t_value = /*$currentProjectStore*/ ctx[4].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(298:6) {#if prjIdx === $animations.curPrj}",
    		ctx
    	});

    	return block;
    }

    // (295:4) {#each $animations.projects as prj, prjIdx}
    function create_each_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*prjIdx*/ ctx[78] === /*$animations*/ ctx[21].curPrj) return create_if_block_7;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[50](/*prjIdx*/ ctx[78]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			toggle_class(button, "active", /*prjIdx*/ ctx[78] === /*$animations*/ ctx[21].curPrj);
    			add_location(button, file, 295, 5, 11162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if (dirty[0] & /*$animations*/ 2097152) {
    				toggle_class(button, "active", /*prjIdx*/ ctx[78] === /*$animations*/ ctx[21].curPrj);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(295:4) {#each $animations.projects as prj, prjIdx}",
    		ctx
    	});

    	return block;
    }

    // (365:4) {#if showVpBgPicker}
    function create_if_block_6(ctx) {
    	let div3;
    	let button;
    	let div0;
    	let t0;
    	let span;
    	let t2;
    	let div2;
    	let div1;
    	let t3;
    	let input;
    	let input_value_value;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			button = element("button");
    			div0 = element("div");
    			t0 = space();
    			span = element("span");
    			span.textContent = "or";
    			t2 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t3 = space();
    			input = element("input");
    			attr_dev(div0, "class", "color-preview");
    			add_location(div0, file, 367, 7, 14553);
    			attr_dev(button, "class", "set-transparent");
    			add_location(button, file, 366, 6, 14456);
    			add_location(span, file, 369, 6, 14606);
    			attr_dev(div1, "class", "color-preview");
    			set_style(div1, "background-color", /*$animations*/ ctx[21].viewportBg);
    			add_location(div1, file, 371, 7, 14665);
    			attr_dev(input, "type", "color");
    			input.value = input_value_value = /*$animations*/ ctx[21].viewportBg;
    			add_location(input, file, 375, 7, 14780);
    			attr_dev(div2, "class", "input-wrapper");
    			add_location(div2, file, 370, 6, 14629);
    			attr_dev(div3, "class", "disclosure flex content-center gap-05");
    			add_location(div3, file, 365, 5, 14370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, button);
    			append_dev(button, div0);
    			append_dev(div3, t0);
    			append_dev(div3, span);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			append_dev(div2, input);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler_5*/ ctx[55], false, false, false),
    					listen_dev(input, "input", /*input_handler*/ ctx[56], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*$animations*/ 2097152) {
    				set_style(div1, "background-color", /*$animations*/ ctx[21].viewportBg);
    			}

    			if (!current || dirty[0] & /*$animations*/ 2097152 && input_value_value !== (input_value_value = /*$animations*/ ctx[21].viewportBg)) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*colorPickerAnim*/ ctx[42], {}, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*colorPickerAnim*/ ctx[42], {}, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(365:4) {#if showVpBgPicker}",
    		ctx
    	});

    	return block;
    }

    // (402:2) {#if showSidebarLeft}
    function create_if_block_5(ctx) {
    	let sidebarleft;
    	let current;

    	sidebarleft = new SidebarLeft({
    			props: {
    				sidebarAnim: /*sidebarAnim*/ ctx[41],
    				openModal,
    				doesAnimTargetElExist: /*doesAnimTargetElExist*/ ctx[19],
    				currentProject: /*currentProject*/ ctx[24],
    				currentProjectStore: /*currentProjectStore*/ ctx[20]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sidebarleft.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebarleft, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sidebarleft_changes = {};
    			if (dirty[0] & /*doesAnimTargetElExist*/ 524288) sidebarleft_changes.doesAnimTargetElExist = /*doesAnimTargetElExist*/ ctx[19];
    			if (dirty[0] & /*currentProjectStore*/ 1048576) sidebarleft_changes.currentProjectStore = /*currentProjectStore*/ ctx[20];
    			sidebarleft.$set(sidebarleft_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebarleft.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebarleft.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebarleft, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(402:2) {#if showSidebarLeft}",
    		ctx
    	});

    	return block;
    }

    // (419:2) {#if showSidebarRight}
    function create_if_block_4(ctx) {
    	let sidebarright;
    	let current;

    	sidebarright = new SidebarRight({
    			props: {
    				sidebarAnim: /*sidebarAnim*/ ctx[41],
    				currentProjectStore: /*currentProjectStore*/ ctx[20],
    				currentProject: /*currentProject*/ ctx[24],
    				selectedStep: /*selectedStep*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sidebarright.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebarright, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sidebarright_changes = {};
    			if (dirty[0] & /*currentProjectStore*/ 1048576) sidebarright_changes.currentProjectStore = /*currentProjectStore*/ ctx[20];
    			if (dirty[0] & /*selectedStep*/ 64) sidebarright_changes.selectedStep = /*selectedStep*/ ctx[6];
    			sidebarright.$set(sidebarright_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebarright.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebarright.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebarright, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(419:2) {#if showSidebarRight}",
    		ctx
    	});

    	return block;
    }

    // (467:6) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Add a step");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(467:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (465:6) {#if currentAction === CreatorAction.AddStep}
    function create_if_block_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(465:6) {#if currentAction === CreatorAction.AddStep}",
    		ctx
    	});

    	return block;
    }

    // (482:6) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Discard a step");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(482:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (480:6) {#if currentAction === CreatorAction.DeleteStep}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(480:6) {#if currentAction === CreatorAction.DeleteStep}",
    		ctx
    	});

    	return block;
    }

    // (497:4) {#each Array(100) as _}
    function create_each_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file, 496, 27, 18678);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(497:4) {#each Array(100) as _}",
    		ctx
    	});

    	return block;
    }

    // (500:4) {#each durationSteps as _, stepIdx}
    function create_each_block_1(ctx) {
    	let div;
    	let span;
    	let t0_value = .25 * /*stepIdx*/ ctx[71] + "";
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text("s");
    			t2 = space();
    			add_location(span, file, 501, 6, 18896);
    			attr_dev(div, "class", "flex content-center");
    			set_style(div, "left", 100 / /*$currentProjectStore*/ ctx[4].duration * (250 * /*stepIdx*/ ctx[71]) + "%");
    			add_location(div, file, 500, 5, 18783);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$currentProjectStore*/ 16) {
    				set_style(div, "left", 100 / /*$currentProjectStore*/ ctx[4].duration * (250 * /*stepIdx*/ ctx[71]) + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(500:4) {#each durationSteps as _, stepIdx}",
    		ctx
    	});

    	return block;
    }

    // (513:6) {#if step.styles === ''}
    function create_if_block_1(ctx) {
    	let span;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Ignored");
    			br = element("br");
    			t1 = text("No styles");
    			add_location(br, file, 513, 42, 19496);
    			attr_dev(span, "class", "ignored-label");
    			add_location(span, file, 513, 7, 19461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, br);
    			append_dev(span, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(513:6) {#if step.styles === ''}",
    		ctx
    	});

    	return block;
    }

    // (507:4) {#each $currentProjectStore.steps as step, stepIdx}
    function create_each_block(ctx) {
    	let button;
    	let t0;
    	let div;
    	let t1;
    	let span;
    	let t2_value = /*stepPos*/ ctx[16](/*step*/ ctx[69].pos, /*stepIdx*/ ctx[71]) + "";
    	let t2;
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;
    	let if_block = /*step*/ ctx[69].styles === '' && create_if_block_1(ctx);

    	function pointerdown_handler(...args) {
    		return /*pointerdown_handler*/ ctx[60](/*step*/ ctx[69], /*stepIdx*/ ctx[71], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = text("%");
    			t4 = space();
    			attr_dev(div, "class", "clickable");
    			add_location(div, file, 515, 6, 19537);
    			attr_dev(span, "class", "indicator");
    			add_location(span, file, 516, 6, 19574);
    			attr_dev(button, "class", "step flex content-center");
    			set_style(button, "left", /*stepPos*/ ctx[16](/*step*/ ctx[69].pos, /*stepIdx*/ ctx[71]) + "%");
    			set_style(button, "animation-delay", 100 * Math.random() + "ms");
    			toggle_class(button, "ignored", /*step*/ ctx[69].styles === '');
    			toggle_class(button, "selected", /*stepIdx*/ ctx[71] === /*$currentProjectStore*/ ctx[4].selectedStep);
    			add_location(button, file, 507, 5, 19107);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, div);
    			append_dev(button, t1);
    			append_dev(button, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(button, t4);

    			if (!mounted) {
    				dispose = listen_dev(button, "pointerdown", pointerdown_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*step*/ ctx[69].styles === '') {
    				if (if_block) ; else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(button, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*stepPos, $currentProjectStore*/ 65552 && t2_value !== (t2_value = /*stepPos*/ ctx[16](/*step*/ ctx[69].pos, /*stepIdx*/ ctx[71]) + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*stepPos, $currentProjectStore*/ 65552) {
    				set_style(button, "left", /*stepPos*/ ctx[16](/*step*/ ctx[69].pos, /*stepIdx*/ ctx[71]) + "%");
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 16) {
    				toggle_class(button, "ignored", /*step*/ ctx[69].styles === '');
    			}

    			if (dirty[0] & /*$currentProjectStore*/ 16) {
    				toggle_class(button, "selected", /*stepIdx*/ ctx[71] === /*$currentProjectStore*/ ctx[4].selectedStep);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(507:4) {#each $currentProjectStore.steps as step, stepIdx}",
    		ctx
    	});

    	return block;
    }

    // (529:3) {#if currentAction === CreatorAction.AddStep && movingStepPos !== null}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(/*movingStepPos*/ ctx[1]);
    			t1 = text("%");
    			attr_dev(span, "class", "indicator");
    			add_location(span, file, 531, 6, 20221);
    			attr_dev(div0, "class", "step flex content-center");
    			set_style(div0, "left", /*movingStepPos*/ ctx[1] + "%");
    			add_location(div0, file, 530, 5, 20143);
    			attr_dev(div1, "class", "creation-pseudo-step");
    			add_location(div1, file, 529, 4, 20102);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*movingStepPos*/ 2) set_data_dev(t0, /*movingStepPos*/ ctx[1]);

    			if (dirty[0] & /*movingStepPos*/ 2) {
    				set_style(div0, "left", /*movingStepPos*/ ctx[1] + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(529:3) {#if currentAction === CreatorAction.AddStep && movingStepPos !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let div3;
    	let div1;
    	let t0;
    	let button0;
    	let svg0;
    	let path0;
    	let t1;
    	let div0;
    	let t2;
    	let div2;
    	let button1;
    	let svg1;
    	let path1;
    	let t3;
    	let span0;
    	let t5;
    	let button2;
    	let svg2;
    	let path2;
    	let t6;
    	let span1;
    	let t8;
    	let div7;
    	let button3;
    	let svg3;
    	let path3;
    	let path4;
    	let path5;
    	let t9;
    	let button4;
    	let svg4;
    	let path6;
    	let path7;
    	let path8;
    	let circle;
    	let t10;
    	let span2;
    	let t12;
    	let button5;
    	let div4;
    	let svg5;
    	let path9;
    	let t13;
    	let span3;
    	let t15;
    	let div6;
    	let button6;
    	let div5;
    	let t16;
    	let span4;
    	let t18;
    	let t19;
    	let button7;
    	let svg6;
    	let path10;
    	let t20;
    	let span5;
    	let t22;
    	let button8;
    	let svg7;
    	let path11;
    	let path12;
    	let path13;
    	let t23;
    	let div9;
    	let t24;
    	let div8;
    	let t25;
    	let t26;
    	let div19;
    	let div12;
    	let div10;
    	let button9;
    	let svg8;
    	let path14;
    	let button9_disabled_value;
    	let t27;
    	let button10;
    	let svg9;
    	let path15;
    	let button10_disabled_value;
    	let t28;
    	let button11;
    	let svg10;
    	let path16;
    	let button11_disabled_value;
    	let t29;
    	let div11;
    	let button12;
    	let svg11;
    	let path17;
    	let t30;
    	let span6;
    	let t31;
    	let button13;
    	let svg12;
    	let path18;
    	let t32;
    	let span7;
    	let button13_disabled_value;
    	let t33;
    	let div18;
    	let div13;
    	let t34;
    	let div14;
    	let t35;
    	let div15;
    	let t36;
    	let div17;
    	let html_tag;
    	let raw_value = wrapInTags('style', buildCursorKeyframeStyle(/*$currentProjectStore*/ ctx[4].steps)) + "";
    	let t37;
    	let div16;
    	let div16_style_value;
    	let t38;
    	let t39;
    	let modalviewer;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*$animations*/ ctx[21].projects;
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let if_block0 = /*showVpBgPicker*/ ctx[15] && create_if_block_6(ctx);
    	let if_block1 = /*showSidebarLeft*/ ctx[13] && create_if_block_5(ctx);
    	let if_block2 = /*showSidebarRight*/ ctx[14] && create_if_block_4(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].AddStep) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block3 = current_block_type(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].DeleteStep) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_2(ctx);
    	let if_block4 = current_block_type_1(ctx);
    	let each_value_2 = Array(100);
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*durationSteps*/ ctx[8];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*$currentProjectStore*/ ctx[4].steps;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block5 = /*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].AddStep && /*movingStepPos*/ ctx[1] !== null && create_if_block(ctx);

    	modalviewer = new ModalViewer({
    			props: {
    				animations: /*animations*/ ctx[23],
    				onOpenModal: /*onOpenModal*/ ctx[40]
    			},
    			$$inline: true
    		});

    	modalviewer.$on("approveAnimDiscard", /*approveAnimDiscard*/ ctx[38]);
    	modalviewer.$on("discardAllProjects", /*discardAllProjects*/ ctx[39]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			div3 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t0 = space();
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			div2 = element("div");
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t3 = space();
    			span0 = element("span");
    			span0.textContent = "Import";
    			t5 = space();
    			button2 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t6 = space();
    			span1 = element("span");
    			span1.textContent = "Export";
    			t8 = space();
    			div7 = element("div");
    			button3 = element("button");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			t9 = space();
    			button4 = element("button");
    			svg4 = svg_element("svg");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			circle = svg_element("circle");
    			t10 = space();
    			span2 = element("span");
    			span2.textContent = "Target element";
    			t12 = space();
    			button5 = element("button");
    			div4 = element("div");
    			svg5 = svg_element("svg");
    			path9 = svg_element("path");
    			t13 = space();
    			span3 = element("span");
    			span3.textContent = "Play all animations";
    			t15 = space();
    			div6 = element("div");
    			button6 = element("button");
    			div5 = element("div");
    			t16 = space();
    			span4 = element("span");
    			span4.textContent = "Viewport Bg color";
    			t18 = space();
    			if (if_block0) if_block0.c();
    			t19 = space();
    			button7 = element("button");
    			svg6 = svg_element("svg");
    			path10 = svg_element("path");
    			t20 = space();
    			span5 = element("span");
    			span5.textContent = "Discard everything";
    			t22 = space();
    			button8 = element("button");
    			svg7 = svg_element("svg");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			t23 = space();
    			div9 = element("div");
    			if (if_block1) if_block1.c();
    			t24 = space();
    			div8 = element("div");
    			t25 = space();
    			if (if_block2) if_block2.c();
    			t26 = space();
    			div19 = element("div");
    			div12 = element("div");
    			div10 = element("div");
    			button9 = element("button");
    			svg8 = svg_element("svg");
    			path14 = svg_element("path");
    			t27 = space();
    			button10 = element("button");
    			svg9 = svg_element("svg");
    			path15 = svg_element("path");
    			t28 = space();
    			button11 = element("button");
    			svg10 = svg_element("svg");
    			path16 = svg_element("path");
    			t29 = space();
    			div11 = element("div");
    			button12 = element("button");
    			svg11 = svg_element("svg");
    			path17 = svg_element("path");
    			t30 = space();
    			span6 = element("span");
    			if_block3.c();
    			t31 = space();
    			button13 = element("button");
    			svg12 = svg_element("svg");
    			path18 = svg_element("path");
    			t32 = space();
    			span7 = element("span");
    			if_block4.c();
    			t33 = space();
    			div18 = element("div");
    			div13 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t34 = space();
    			div14 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t35 = space();
    			div15 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t36 = space();
    			div17 = element("div");
    			html_tag = new HtmlTag();
    			t37 = space();
    			div16 = element("div");
    			t38 = space();
    			if (if_block5) if_block5.c();
    			t39 = space();
    			create_component(modalviewer.$$.fragment);
    			attr_dev(path0, "d", "M12 4V20M4 12H20");
    			add_location(path0, file, 307, 6, 11597);
    			attr_dev(svg0, "class", "icon stroke icon-15");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file, 306, 5, 11489);
    			attr_dev(button0, "class", "new-project");
    			add_location(button0, file, 305, 4, 11432);
    			attr_dev(div0, "class", "empty-space");
    			add_location(div0, file, 311, 4, 11661);
    			attr_dev(div1, "class", "tabs flex nowrap");
    			add_location(div1, file, 293, 3, 11076);
    			attr_dev(path1, "d", "M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 19L12 11M12 11L15 14M12 11L9 14");
    			add_location(path1, file, 317, 6, 11960);
    			attr_dev(svg1, "class", "icon stroke icon-15");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file, 316, 5, 11852);
    			attr_dev(span0, "class", "label");
    			add_location(span0, file, 319, 5, 12062);
    			attr_dev(button1, "class", "import flex content-center gap-05");
    			add_location(button1, file, 315, 4, 11754);
    			attr_dev(path2, "d", "M20 8V22H4V2H12M20 8H12V2M20 8L12 2M12 11V19M12 19L9 16M12 19L15 16");
    			add_location(path2, file, 324, 6, 12325);
    			attr_dev(svg2, "class", "icon stroke icon-15");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file, 323, 5, 12217);
    			attr_dev(span1, "class", "label");
    			add_location(span1, file, 327, 5, 12431);
    			attr_dev(button2, "class", "export flex content-center gap-05");
    			add_location(button2, file, 322, 4, 12119);
    			attr_dev(div2, "class", "options flex align-right");
    			add_location(div2, file, 314, 3, 11710);
    			attr_dev(div3, "class", "tab-bar flex nowrap");
    			add_location(div3, file, 292, 2, 11038);
    			attr_dev(path3, "d", "M3 6H21");
    			add_location(path3, file, 335, 5, 12767);
    			attr_dev(path4, "d", "M3 12H21");
    			add_location(path4, file, 335, 25, 12787);
    			attr_dev(path5, "d", "M3 18H15");
    			add_location(path5, file, 335, 46, 12808);
    			attr_dev(svg3, "class", "icon stroke icon-2");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg3, file, 334, 4, 12661);
    			attr_dev(button3, "class", "btn even-pdg");
    			add_location(button3, file, 333, 3, 12575);
    			attr_dev(path6, "d", "M15.7736 5.36887C14.3899 4.50149 12.7535 4 11 4C6.02944 4 2 8.02944 2 13C2 17.9706 6.02944 22 11 22C15.9706 22 20 17.9706 20 13C20 11.3038 19.5308 9.71728 18.7151 8.36302");
    			add_location(path6, file, 341, 5, 13044);
    			attr_dev(path7, "d", "M12.8458 8.35174C12.2747 8.12477 11.6519 8 11 8C8.23858 8 6 10.2386 6 13C6 15.7614 8.23858 18 11 18C13.7614 18 16 15.7614 16 13C16 12.4099 15.8978 11.8438 15.7101 11.3182");
    			add_location(path7, file, 342, 5, 13233);
    			attr_dev(path8, "d", "M12 12L18 6M20 4V1.73698e-07M20 4H24M20 4L18 6M20 4L23 1M18 6L18 2M18 6L22 6");
    			add_location(path8, file, 343, 5, 13422);
    			attr_dev(circle, "cx", "11");
    			attr_dev(circle, "cy", "13");
    			attr_dev(circle, "r", "1.5");
    			add_location(circle, file, 344, 5, 13517);
    			attr_dev(svg4, "class", "icon stroke icon-15");
    			attr_dev(svg4, "viewBox", "0 0 24 24");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg4, file, 340, 4, 12937);
    			attr_dev(span2, "class", "label");
    			add_location(span2, file, 346, 4, 13568);
    			attr_dev(button4, "class", "btn has-icon");
    			add_location(button4, file, 339, 3, 12861);
    			attr_dev(path9, "d", "M 4 11, l 5 4, l 8 -10");
    			attr_dev(path9, "stroke-width", "2");
    			add_location(path9, file, 352, 6, 13866);
    			attr_dev(svg5, "viewBox", "0 0 20 20");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg5, file, 351, 5, 13786);
    			attr_dev(div4, "class", "checkbox flex content-center");
    			toggle_class(div4, "active", !/*$playOnlyCurSelAnim*/ ctx[22]);
    			add_location(div4, file, 350, 4, 13701);
    			attr_dev(span3, "class", "label");
    			add_location(span3, file, 355, 4, 13948);
    			attr_dev(button5, "class", "btn has-icon");
    			add_location(button5, file, 349, 3, 13630);
    			attr_dev(div5, "class", "color-preview");
    			set_style(div5, "background-color", /*$animations*/ ctx[21].viewportBg);
    			add_location(div5, file, 361, 5, 14191);
    			attr_dev(span4, "class", "label");
    			add_location(span4, file, 362, 5, 14278);
    			attr_dev(button6, "class", "btn has-icon");
    			add_location(button6, file, 360, 4, 14121);
    			attr_dev(div6, "class", "viewport-bg-picker");
    			toggle_class(div6, "transparent-bg", /*$animations*/ ctx[21].viewportBg === 'transparent');
    			add_location(div6, file, 358, 3, 14015);
    			attr_dev(path10, "d", "M18 4.8V20.8H6V4.8M9 7.6L9 18M12 7.6L12 18M15 7.6L15 18M4 4.8L8.00002 4.8M8.00002 4.8L16 4.8M8.00002 4.8L10 3L14 3L16 4.8M16 4.8L20 4.8");
    			add_location(path10, file, 386, 5, 15176);
    			attr_dev(svg6, "class", "icon stroke icon-15");
    			attr_dev(svg6, "viewBox", "0 0 24 24");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg6, file, 385, 4, 15069);
    			attr_dev(span5, "class", "label");
    			add_location(span5, file, 388, 4, 15341);
    			attr_dev(button7, "class", "btn has-icon");
    			add_location(button7, file, 384, 3, 14980);
    			attr_dev(path11, "d", "M3 6H21");
    			add_location(path11, file, 393, 5, 15613);
    			attr_dev(path12, "d", "M3 12H21");
    			add_location(path12, file, 393, 25, 15633);
    			attr_dev(path13, "d", "M9 18H21");
    			add_location(path13, file, 393, 46, 15654);
    			attr_dev(svg7, "class", "icon stroke icon-2");
    			attr_dev(svg7, "viewBox", "0 0 24 24");
    			attr_dev(svg7, "fill", "none");
    			attr_dev(svg7, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg7, file, 392, 4, 15507);
    			attr_dev(button8, "class", "btn even-pdg align-right");
    			add_location(button8, file, 391, 3, 15407);
    			attr_dev(div7, "class", "project-options flex content-center-y nowrap gap-1");
    			add_location(div7, file, 332, 2, 12506);
    			add_location(header, file, 291, 1, 11026);
    			attr_dev(div8, "id", "AnimationTarget");
    			attr_dev(div8, "class", "flex content-center");
    			set_style(div8, "background-color", /*$animations*/ ctx[21].viewportBg);
    			add_location(div8, file, 411, 2, 16003);
    			attr_dev(div9, "id", "Viewport");
    			attr_dev(div9, "class", "flex nowrap");
    			toggle_class(div9, "transparent-bg", /*$animations*/ ctx[21].viewportBg === 'transparent');
    			add_location(div9, file, 399, 1, 15727);
    			attr_dev(path14, "fill", "#448aff");
    			attr_dev(path14, "d", "M6 20L6 4L20 12L6 20Z");
    			add_location(path14, file, 435, 6, 16648);
    			attr_dev(svg8, "class", "icon icon-15");
    			attr_dev(svg8, "viewBox", "0 0 24 24");
    			attr_dev(svg8, "fill", "none");
    			attr_dev(svg8, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg8, file, 434, 5, 16547);
    			button9.disabled = button9_disabled_value = !/*stepsExisting*/ ctx[7] || /*isAnimPlaying*/ ctx[2];
    			attr_dev(button9, "class", "btn even-pdg");
    			add_location(button9, file, 431, 4, 16433);
    			attr_dev(path15, "fill", "#4caf50");
    			attr_dev(path15, "d", "M6 20V4h4v16H6ZM14 20V4h4v16h-4Z");
    			add_location(path15, file, 443, 6, 16964);
    			attr_dev(svg9, "class", "icon icon-15");
    			attr_dev(svg9, "viewBox", "0 0 24 24");
    			attr_dev(svg9, "fill", "none");
    			attr_dev(svg9, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg9, file, 442, 5, 16863);
    			button10.disabled = button10_disabled_value = !/*stepsExisting*/ ctx[7] || /*isAnimPaused*/ ctx[18] || /*isAnimStopped*/ ctx[3];
    			attr_dev(button10, "class", "btn even-pdg");
    			add_location(button10, file, 439, 4, 16732);
    			attr_dev(path16, "fill", "#ff1744");
    			attr_dev(path16, "d", "M5 19V5H19V19H5Z");
    			add_location(path16, file, 451, 6, 17274);
    			attr_dev(svg10, "class", "icon icon-15");
    			attr_dev(svg10, "viewBox", "0 0 24 24");
    			attr_dev(svg10, "fill", "none");
    			attr_dev(svg10, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg10, file, 450, 5, 17173);
    			button11.disabled = button11_disabled_value = !/*stepsExisting*/ ctx[7] || /*isAnimStopped*/ ctx[3];
    			attr_dev(button11, "class", "btn even-pdg");
    			add_location(button11, file, 447, 4, 17059);
    			attr_dev(div10, "class", "anim flex gap-1 nowrap");
    			add_location(div10, file, 430, 3, 16391);
    			attr_dev(path17, "stroke", "#4caf50");
    			attr_dev(path17, "d", "M12 4V20M4 12H20");
    			add_location(path17, file, 461, 6, 17666);
    			attr_dev(svg11, "class", "icon icon-15");
    			attr_dev(svg11, "viewBox", "0 0 24 24");
    			attr_dev(svg11, "fill", "none");
    			attr_dev(svg11, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg11, file, 460, 5, 17565);
    			attr_dev(span6, "class", "label");
    			add_location(span6, file, 463, 5, 17731);
    			attr_dev(button12, "class", "btn has-icon");
    			toggle_class(button12, "pulse", !/*stepsExisting*/ ctx[7] && /*currentAction*/ ctx[12] !== /*CreatorAction*/ ctx[11].AddStep);
    			add_location(button12, file, 457, 4, 17418);
    			attr_dev(path18, "stroke", "#ff1744");
    			attr_dev(path18, "d", "M19 5L5 19M5 5L19 19");
    			add_location(path18, file, 476, 6, 18108);
    			attr_dev(svg12, "class", "icon icon-15");
    			attr_dev(svg12, "viewBox", "0 0 24 24");
    			attr_dev(svg12, "fill", "none");
    			attr_dev(svg12, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg12, file, 475, 5, 18007);
    			attr_dev(span7, "class", "label");
    			add_location(span7, file, 478, 5, 18177);
    			button13.disabled = button13_disabled_value = !/*stepsExisting*/ ctx[7];
    			attr_dev(button13, "class", "btn has-icon");
    			add_location(button13, file, 472, 4, 17903);
    			attr_dev(div11, "class", "steps flex gap-1 nowrap align-right");
    			add_location(div11, file, 456, 3, 17363);
    			attr_dev(div12, "class", "controls flex gap-1 nowrap");
    			add_location(div12, file, 429, 2, 16346);
    			attr_dev(div13, "class", "percent-steps");
    			add_location(div13, file, 495, 3, 18622);
    			attr_dev(div14, "class", "duration-steps");
    			add_location(div14, file, 498, 3, 18707);
    			attr_dev(div15, "class", "actual-steps flex nowrap");
    			toggle_class(div15, "moving", /*movingStepIdx*/ ctx[0] !== null);
    			add_location(div15, file, 505, 3, 18967);
    			html_tag.a = t37;
    			attr_dev(div16, "class", "cursor");
    			attr_dev(div16, "style", div16_style_value = `animation-play-state: ${/*playerCursorState*/ ctx[17]};` + /*playerCursorStyles*/ ctx[9]);
    			toggle_class(div16, "stopped", /*isAnimStopped*/ ctx[3]);
    			add_location(div16, file, 522, 4, 19799);
    			attr_dev(div17, "class", "player-cursor");
    			add_location(div17, file, 520, 3, 19679);
    			attr_dev(div18, "class", "timeline");
    			toggle_class(div18, "add-mode", /*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].AddStep);
    			toggle_class(div18, "delete-mode", /*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].DeleteStep);
    			add_location(div18, file, 489, 2, 18375);
    			attr_dev(div19, "id", "AnimationSteps");
    			add_location(div19, file, 428, 1, 16317);
    			add_location(main, file, 290, 0, 11017);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, div3);
    			append_dev(div3, div1);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(button1, t3);
    			append_dev(button1, span0);
    			append_dev(div2, t5);
    			append_dev(div2, button2);
    			append_dev(button2, svg2);
    			append_dev(svg2, path2);
    			append_dev(button2, t6);
    			append_dev(button2, span1);
    			append_dev(header, t8);
    			append_dev(header, div7);
    			append_dev(div7, button3);
    			append_dev(button3, svg3);
    			append_dev(svg3, path3);
    			append_dev(svg3, path4);
    			append_dev(svg3, path5);
    			append_dev(div7, t9);
    			append_dev(div7, button4);
    			append_dev(button4, svg4);
    			append_dev(svg4, path6);
    			append_dev(svg4, path7);
    			append_dev(svg4, path8);
    			append_dev(svg4, circle);
    			append_dev(button4, t10);
    			append_dev(button4, span2);
    			append_dev(div7, t12);
    			append_dev(div7, button5);
    			append_dev(button5, div4);
    			append_dev(div4, svg5);
    			append_dev(svg5, path9);
    			append_dev(button5, t13);
    			append_dev(button5, span3);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(div6, button6);
    			append_dev(button6, div5);
    			append_dev(button6, t16);
    			append_dev(button6, span4);
    			append_dev(div6, t18);
    			if (if_block0) if_block0.m(div6, null);
    			append_dev(div7, t19);
    			append_dev(div7, button7);
    			append_dev(button7, svg6);
    			append_dev(svg6, path10);
    			append_dev(button7, t20);
    			append_dev(button7, span5);
    			append_dev(div7, t22);
    			append_dev(div7, button8);
    			append_dev(button8, svg7);
    			append_dev(svg7, path11);
    			append_dev(svg7, path12);
    			append_dev(svg7, path13);
    			append_dev(main, t23);
    			append_dev(main, div9);
    			if (if_block1) if_block1.m(div9, null);
    			append_dev(div9, t24);
    			append_dev(div9, div8);
    			/*div8_binding*/ ctx[59](div8);
    			append_dev(div9, t25);
    			if (if_block2) if_block2.m(div9, null);
    			append_dev(main, t26);
    			append_dev(main, div19);
    			append_dev(div19, div12);
    			append_dev(div12, div10);
    			append_dev(div10, button9);
    			append_dev(button9, svg8);
    			append_dev(svg8, path14);
    			append_dev(div10, t27);
    			append_dev(div10, button10);
    			append_dev(button10, svg9);
    			append_dev(svg9, path15);
    			append_dev(div10, t28);
    			append_dev(div10, button11);
    			append_dev(button11, svg10);
    			append_dev(svg10, path16);
    			append_dev(div12, t29);
    			append_dev(div12, div11);
    			append_dev(div11, button12);
    			append_dev(button12, svg11);
    			append_dev(svg11, path17);
    			append_dev(button12, t30);
    			append_dev(button12, span6);
    			if_block3.m(span6, null);
    			append_dev(div11, t31);
    			append_dev(div11, button13);
    			append_dev(button13, svg12);
    			append_dev(svg12, path18);
    			append_dev(button13, t32);
    			append_dev(button13, span7);
    			if_block4.m(span7, null);
    			append_dev(div19, t33);
    			append_dev(div19, div18);
    			append_dev(div18, div13);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div13, null);
    			}

    			append_dev(div18, t34);
    			append_dev(div18, div14);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div14, null);
    			}

    			append_dev(div18, t35);
    			append_dev(div18, div15);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div15, null);
    			}

    			append_dev(div18, t36);
    			append_dev(div18, div17);
    			html_tag.m(raw_value, div17);
    			append_dev(div17, t37);
    			append_dev(div17, div16);
    			append_dev(div18, t38);
    			if (if_block5) if_block5.m(div18, null);
    			/*div18_binding*/ ctx[62](div18);
    			insert_dev(target, t39, anchor);
    			mount_component(modalviewer, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*escapeAction*/ ctx[35], false, false, false),
    					listen_dev(window, "pointerup", /*windowPointerUp*/ ctx[32], false, false, false),
    					listen_dev(button0, "click", /*newProject*/ ctx[43], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[51], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[52], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[53], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[54], false, false, false),
    					listen_dev(button5, "click", /*togglePlayOnlyCurSelAnim*/ ctx[27], false, false, false),
    					listen_dev(button6, "click", /*toggleViewportBgPicker*/ ctx[45], false, false, false),
    					listen_dev(button7, "click", /*click_handler_6*/ ctx[57], false, false, false),
    					listen_dev(button8, "click", /*click_handler_7*/ ctx[58], false, false, false),
    					listen_dev(button9, "click", /*playAnimation*/ ctx[28], false, false, false),
    					listen_dev(button10, "click", /*pauseAnimation*/ ctx[29], false, false, false),
    					listen_dev(button11, "click", /*stopAnimation*/ ctx[30], false, false, false),
    					listen_dev(button12, "click", /*toggleAddStepMode*/ ctx[36], false, false, false),
    					listen_dev(button13, "click", /*toggleDeleteStepMode*/ ctx[37], false, false, false),
    					listen_dev(div16, "animationend", /*animationend_handler*/ ctx[61], false, false, false),
    					listen_dev(div18, "click", /*timelineClick*/ ctx[31], false, false, false),
    					listen_dev(div18, "pointermove", /*timelinePointerMove*/ ctx[33], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$animations, $currentProjectStore*/ 2097168 | dirty[1] & /*changeProject*/ 8192) {
    				each_value_3 = /*$animations*/ ctx[21].projects;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div1, t0);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*$playOnlyCurSelAnim*/ 4194304) {
    				toggle_class(div4, "active", !/*$playOnlyCurSelAnim*/ ctx[22]);
    			}

    			if (!current || dirty[0] & /*$animations*/ 2097152) {
    				set_style(div5, "background-color", /*$animations*/ ctx[21].viewportBg);
    			}

    			if (/*showVpBgPicker*/ ctx[15]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*showVpBgPicker*/ 32768) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div6, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*$animations*/ 2097152) {
    				toggle_class(div6, "transparent-bg", /*$animations*/ ctx[21].viewportBg === 'transparent');
    			}

    			if (/*showSidebarLeft*/ ctx[13]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*showSidebarLeft*/ 8192) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div9, t24);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*$animations*/ 2097152) {
    				set_style(div8, "background-color", /*$animations*/ ctx[21].viewportBg);
    			}

    			if (/*showSidebarRight*/ ctx[14]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*showSidebarRight*/ 16384) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div9, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*$animations*/ 2097152) {
    				toggle_class(div9, "transparent-bg", /*$animations*/ ctx[21].viewportBg === 'transparent');
    			}

    			if (!current || dirty[0] & /*stepsExisting, isAnimPlaying*/ 132 && button9_disabled_value !== (button9_disabled_value = !/*stepsExisting*/ ctx[7] || /*isAnimPlaying*/ ctx[2])) {
    				prop_dev(button9, "disabled", button9_disabled_value);
    			}

    			if (!current || dirty[0] & /*stepsExisting, isAnimPaused, isAnimStopped*/ 262280 && button10_disabled_value !== (button10_disabled_value = !/*stepsExisting*/ ctx[7] || /*isAnimPaused*/ ctx[18] || /*isAnimStopped*/ ctx[3])) {
    				prop_dev(button10, "disabled", button10_disabled_value);
    			}

    			if (!current || dirty[0] & /*stepsExisting, isAnimStopped*/ 136 && button11_disabled_value !== (button11_disabled_value = !/*stepsExisting*/ ctx[7] || /*isAnimStopped*/ ctx[3])) {
    				prop_dev(button11, "disabled", button11_disabled_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block3.d(1);
    				if_block3 = current_block_type(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(span6, null);
    				}
    			}

    			if (dirty[0] & /*stepsExisting, currentAction, CreatorAction*/ 6272) {
    				toggle_class(button12, "pulse", !/*stepsExisting*/ ctx[7] && /*currentAction*/ ctx[12] !== /*CreatorAction*/ ctx[11].AddStep);
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_2(ctx))) {
    				if_block4.d(1);
    				if_block4 = current_block_type_1(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(span7, null);
    				}
    			}

    			if (!current || dirty[0] & /*stepsExisting*/ 128 && button13_disabled_value !== (button13_disabled_value = !/*stepsExisting*/ ctx[7])) {
    				prop_dev(button13, "disabled", button13_disabled_value);
    			}

    			if (dirty[0] & /*$currentProjectStore, durationSteps*/ 272) {
    				each_value_1 = /*durationSteps*/ ctx[8];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div14, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*stepPos, $currentProjectStore*/ 65552 | dirty[1] & /*timelineStepGrabbing*/ 8) {
    				each_value = /*$currentProjectStore*/ ctx[4].steps;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div15, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*movingStepIdx*/ 1) {
    				toggle_class(div15, "moving", /*movingStepIdx*/ ctx[0] !== null);
    			}

    			if ((!current || dirty[0] & /*$currentProjectStore*/ 16) && raw_value !== (raw_value = wrapInTags('style', buildCursorKeyframeStyle(/*$currentProjectStore*/ ctx[4].steps)) + "")) html_tag.p(raw_value);

    			if (!current || dirty[0] & /*playerCursorState, playerCursorStyles*/ 131584 && div16_style_value !== (div16_style_value = `animation-play-state: ${/*playerCursorState*/ ctx[17]};` + /*playerCursorStyles*/ ctx[9])) {
    				attr_dev(div16, "style", div16_style_value);
    			}

    			if (dirty[0] & /*isAnimStopped*/ 8) {
    				toggle_class(div16, "stopped", /*isAnimStopped*/ ctx[3]);
    			}

    			if (/*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].AddStep && /*movingStepPos*/ ctx[1] !== null) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block(ctx);
    					if_block5.c();
    					if_block5.m(div18, null);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (dirty[0] & /*currentAction, CreatorAction*/ 6144) {
    				toggle_class(div18, "add-mode", /*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].AddStep);
    			}

    			if (dirty[0] & /*currentAction, CreatorAction*/ 6144) {
    				toggle_class(div18, "delete-mode", /*currentAction*/ ctx[12] === /*CreatorAction*/ ctx[11].DeleteStep);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(modalviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(modalviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_3, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*div8_binding*/ ctx[59](null);
    			if (if_block2) if_block2.d();
    			if_block3.d();
    			if_block4.d();
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block5) if_block5.d();
    			/*div18_binding*/ ctx[62](null);
    			if (detaching) detach_dev(t39);
    			destroy_component(modalviewer, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let currentProjectStore;
    	let doesAnimTargetElExist;
    	let isAnimPlaying;
    	let isAnimPaused;
    	let isAnimStopped;
    	let playerCursorState;
    	let stepPos;

    	let $currentProjectStore,
    		$$unsubscribe_currentProjectStore = noop,
    		$$subscribe_currentProjectStore = () => ($$unsubscribe_currentProjectStore(), $$unsubscribe_currentProjectStore = subscribe(currentProjectStore, $$value => $$invalidate(4, $currentProjectStore = $$value)), currentProjectStore);

    	let $animations;
    	let $currentProjectReacted;
    	let $currentProject;
    	let $playOnlyCurSelAnim;
    	$$self.$$.on_destroy.push(() => $$unsubscribe_currentProjectStore());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let targetViewportEl;
    	let targetShadowDOM;

    	onMount(() => {
    		$$invalidate(46, targetShadowDOM = targetViewportEl.attachShadow({ mode: 'open' }));
    		animations.selectProject(0);
    	});

    	const animations = new AnimationCreator();
    	validate_store(animations, 'animations');
    	component_subscribe($$self, animations, value => $$invalidate(21, $animations = value));
    	const currentProject = derived(animations, $ => $.projects[$.curPrj]);
    	validate_store(currentProject, 'currentProject');
    	component_subscribe($$self, currentProject, value => $$invalidate(49, $currentProject = value));
    	const currentProjectReacted = derived(currentProject, $ => $);
    	validate_store(currentProjectReacted, 'currentProjectReacted');
    	component_subscribe($$self, currentProjectReacted, value => $$invalidate(67, $currentProjectReacted = value));
    	let selectedStep;
    	let stepsExisting = false;
    	let durationSteps = [];
    	let playerCursorStyles;
    	var AnimationState;

    	(function (AnimationState) {
    		AnimationState[AnimationState["Stopped"] = 0] = "Stopped";
    		AnimationState[AnimationState["Playing"] = 1] = "Playing";
    		AnimationState[AnimationState["Paused"] = 2] = "Paused";
    	})(AnimationState || (AnimationState = {}));

    	let animationState = AnimationState.Stopped;
    	let playOnlyCurSelAnim = writable(true);
    	validate_store(playOnlyCurSelAnim, 'playOnlyCurSelAnim');
    	component_subscribe($$self, playOnlyCurSelAnim, value => $$invalidate(22, $playOnlyCurSelAnim = value));

    	function togglePlayOnlyCurSelAnim() {
    		playOnlyCurSelAnim.set(!$playOnlyCurSelAnim);
    	}

    	playOnlyCurSelAnim.subscribe(async () => {
    		if (isAnimPlaying) {
    			stopAnimation();
    			setTimeout(playAnimation);
    		}
    	});

    	function playAnimation() {
    		$$invalidate(48, animationState = AnimationState.Playing);

    		for (let prjIdx = 0; prjIdx < $animations.projects.length; prjIdx++) {
    			if ($playOnlyCurSelAnim && prjIdx !== $animations.curPrj) {
    				continue;
    			}

    			const prjStr = get_store_value($animations.projects[prjIdx]);
    			if (prjStr.targetEl === '') continue;
    			const el = targetShadowDOM.querySelector(prjStr.targetEl);
    			if (!el) continue;
    			el.style.animationPlayState = 'running';
    			el.style.animationName = prjStr.name;
    			el.style.animationDuration = prjStr.duration + 'ms';
    			el.style.animationDelay = prjStr.delay + 'ms';

    			el.style.animationIterationCount = prjStr.iterations === 0
    			? 'infinite'
    			: '' + prjStr.iterations;

    			if (prjStr.fillMode !== AnimFillmode.None) {
    				el.style.animationFillMode = prjStr.fillMode;
    			} else {
    				el.style.animationFillMode = null;
    			}

    			if (prjStr.direction !== AnimDirection.None) {
    				el.style.animationDirection = prjStr.direction;
    			} else {
    				el.style.animationDirection = null;
    			}

    			if (prjStr.timingFunction !== '') {
    				el.style.animationTimingFunction = prjStr.timingFunction;
    			}
    		}
    	}

    	function pauseAnimation() {
    		$$invalidate(48, animationState = AnimationState.Paused);

    		for (const prj of $animations.projects) {
    			const prjStr = get_store_value(prj);
    			if (prjStr.targetEl === '') continue;
    			const el = targetShadowDOM.querySelector(prjStr.targetEl);
    			if (!el) continue;
    			el.style.animationPlayState = 'paused';
    		}
    	}

    	function stopAnimation() {
    		$$invalidate(48, animationState = AnimationState.Stopped);

    		for (const prj of $animations.projects) {
    			const prjStr = get_store_value(prj);
    			if (prjStr.targetEl === '') continue;
    			const el = targetShadowDOM.querySelector(prjStr.targetEl);
    			if (!el) continue;
    			el.style.animationName = null;
    			el.style.animationDuration = null;
    			el.style.animationDelay = null;
    			el.style.animationIterationCount = null;
    			el.style.animationFillMode = null;
    			el.style.animationDirection = null;
    			el.style.animationTimingFunction = null;
    		}
    	}

    	let timelineEl;

    	function timelineClick(e) {
    		if (currentAction === CreatorAction.AddStep) {
    			const newIdx = $currentProject.addStep(Number((100 / timelineEl.clientWidth * e.offsetX).toFixed(0)));

    			if (newIdx > -1) {
    				cancelAction();
    				$currentProject.selectStep(newIdx);
    			}
    		}
    	}

    	let movingStepIdx = null;
    	let movingStepPos = null;

    	function windowPointerUp(e) {
    		// Re-positioning step
    		if (movingStepIdx !== null) {
    			$currentProject.changeStepPos(movingStepPos);
    			$$invalidate(0, movingStepIdx = null);
    			$$invalidate(1, movingStepPos = null);
    		} else // Creating new step
    		if (movingStepPos !== null) {
    			$$invalidate(1, movingStepPos = null);
    		}
    	}

    	function timelinePointerMove(e) {
    		if (movingStepIdx !== null || currentAction === CreatorAction.AddStep) {
    			$$invalidate(1, movingStepPos = Number((100 / timelineEl.clientWidth * e.offsetX).toFixed(0)));
    		}
    	}

    	function timelineStepGrabbing(pos, idx) {
    		if (currentAction === CreatorAction.None) {
    			$currentProject.selectStep(idx);
    			$$invalidate(0, movingStepIdx = idx);
    			$$invalidate(1, movingStepPos = pos);
    		} else if (currentAction === CreatorAction.DeleteStep) {
    			$currentProject.discardStep(idx);
    		}
    	}

    	var CreatorAction;

    	(function (CreatorAction) {
    		CreatorAction[CreatorAction["None"] = 0] = "None";
    		CreatorAction[CreatorAction["AddStep"] = 1] = "AddStep";
    		CreatorAction[CreatorAction["DeleteStep"] = 2] = "DeleteStep";
    	})(CreatorAction || (CreatorAction = {}));

    	let currentAction = CreatorAction.None;

    	function cancelAction() {
    		$$invalidate(12, currentAction = CreatorAction.None);
    	}

    	function escapeAction(e) {
    		if (e.key.toLocaleLowerCase() == 'escape') {
    			cancelAction();
    		}
    	}

    	function toggleAddStepMode() {
    		if (currentAction === CreatorAction.AddStep) {
    			cancelAction();
    		} else $$invalidate(12, currentAction = CreatorAction.AddStep);
    	}

    	function toggleDeleteStepMode() {
    		if (currentAction === CreatorAction.DeleteStep) {
    			cancelAction();
    		} else $$invalidate(12, currentAction = CreatorAction.DeleteStep);
    	}

    	function approveAnimDiscard() {
    		animations.discardProject();
    		closeModal();
    	}

    	function discardAllProjects() {
    		animations.reset();
    		closeModal();
    	}

    	function onOpenModal(id) {
    		stopAnimation();
    	}

    	let showSidebarLeft = true;
    	let showSidebarRight = true;

    	const sidebarAnim = (node, isLeft) => ({
    		duration: 300,
    		css: t => `transform: translateX(` + (isLeft ? '-' : '') + (101 - 101 * cubicInOut(t)) + `%);`
    	});

    	const colorPickerAnim = (node, o) => ({
    		duration: 150,
    		css: t => `opacity: ${cubicInOut(t)};` + `transform: translateY(-${1 - cubicInOut(t)}rem);`
    	});

    	function newProject() {
    		stopAnimation();
    		animations.newProject();
    	}

    	function changeProject(prjIdx) {
    		if (isAnimPlaying) {
    			stopAnimation();
    			setTimeout(playAnimation);
    		}

    		animations.selectProject(prjIdx);
    	}

    	let showVpBgPicker = false;

    	function toggleViewportBgPicker() {
    		$$invalidate(15, showVpBgPicker = !showVpBgPicker);
    	}

    	let _cachedTargetStyles = null;
    	let _cachedTargetHTML = null;
    	let currentProjectWatcher;
    	let selectedStepWatcher;

    	animations.subscribe(() => {
    		if (currentProjectWatcher) {
    			currentProjectWatcher();
    		}

    		currentProjectWatcher = currentProjectReacted.subscribe(() => {
    			if (selectedStepWatcher) {
    				selectedStepWatcher();
    			}

    			selectedStepWatcher = $currentProjectReacted.subscribe($ => {
    				animations.syncProjectsWithStorage();
    				$$invalidate(6, selectedStep = $.steps[$.selectedStep]);
    				$$invalidate(7, stepsExisting = $.steps.length > 0);
    				$$invalidate(8, durationSteps = Array(Number(($.duration / 250).toFixed(0)) + 1));

    				if (targetShadowDOM) {
    					const html = $animations.target.html;

    					const styles = $animations.target.css + '\n' + renderAllKeyframeStyles($animations.projects) + '\n' + buildCursorKeyframeStyle($.steps) + '\n' + ($.selectedStep === null
    					? ''
    					: selectedKeyframeStyle($.targetEl, $.steps[$.selectedStep].styles));

    					if (html !== _cachedTargetHTML) {
    						_cachedTargetHTML = html;
    						_cachedTargetStyles = styles;
    						$$invalidate(46, targetShadowDOM.innerHTML = wrapInTags('style', styles) + '\n' + $animations.target.html, targetShadowDOM);
    					} else if (styles !== _cachedTargetStyles) {
    						targetShadowDOM.querySelector('style').remove();
    						const stylesheet = document.createElement('style');
    						stylesheet.innerText = styles;
    						targetShadowDOM.appendChild(stylesheet);
    						_cachedTargetStyles = styles;
    					}
    				}

    				$$invalidate(9, playerCursorStyles = `animation-direction: ${$.direction};` + `animation-timing-function: ${$.timingFunction};` + `animation-duration: ${$.duration}ms;` + `animation-iteration-count: ${$.iterations > 0 ? $.iterations : 'infinite'};`);

    				if (animationState === AnimationState.Playing) {
    					const el = targetShadowDOM.querySelector($currentProjectStore.targetEl);
    					el.style.animationPlayState = 'running';
    					el.style.animationName = $.name;
    					el.style.animationDuration = $.duration + 'ms';
    					el.style.animationDelay = $.delay + 'ms';
    					el.style.animationIterationCount = $.iterations === 0 ? 'infinite' : '' + $.iterations;

    					if ($.fillMode !== AnimFillmode.None) {
    						el.style.animationFillMode = $.fillMode;
    					} else {
    						el.style.animationFillMode = null;
    					}

    					if ($.direction !== AnimDirection.None) {
    						el.style.animationDirection = $.direction;
    					} else {
    						el.style.animationDirection = null;
    					}

    					if ($.timingFunction !== '') {
    						el.style.animationTimingFunction = $.timingFunction;
    					}
    				}
    			});
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = prjIdx => changeProject(prjIdx);
    	const click_handler_1 = () => openModal(Modals.Import);
    	const click_handler_2 = () => openModal(Modals.Export);
    	const click_handler_3 = () => $$invalidate(13, showSidebarLeft = !showSidebarLeft);
    	const click_handler_4 = () => openModal(Modals.Target);
    	const click_handler_5 = () => animations.setViewportBg('transparent');
    	const input_handler = e => animations.setViewportBg(e.currentTarget.value);
    	const click_handler_6 = () => openModal(Modals.DiscardWholeProject);
    	const click_handler_7 = () => $$invalidate(14, showSidebarRight = !showSidebarRight);

    	function div8_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			targetViewportEl = $$value;
    			$$invalidate(5, targetViewportEl);
    		});
    	}

    	const pointerdown_handler = (step, stepIdx, e) => timelineStepGrabbing(step.pos, stepIdx);
    	const animationend_handler = e => isAnimPlaying ? stopAnimation() : 0;

    	function div18_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			timelineEl = $$value;
    			$$invalidate(10, timelineEl);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		AnimationCreator,
    		AnimDirection,
    		AnimFillmode,
    		cubicInOut,
    		derived,
    		getStore: get_store_value,
    		writable,
    		renderAllKeyframeStyles,
    		buildCursorKeyframeStyle,
    		wrapInTags,
    		selectedKeyframeStyle,
    		ModalViewer,
    		closeModal,
    		Modals,
    		openModal,
    		SidebarLeft,
    		SidebarRight,
    		targetViewportEl,
    		targetShadowDOM,
    		animations,
    		currentProject,
    		currentProjectReacted,
    		selectedStep,
    		stepsExisting,
    		durationSteps,
    		playerCursorStyles,
    		AnimationState,
    		animationState,
    		playOnlyCurSelAnim,
    		togglePlayOnlyCurSelAnim,
    		playAnimation,
    		pauseAnimation,
    		stopAnimation,
    		timelineEl,
    		timelineClick,
    		movingStepIdx,
    		movingStepPos,
    		windowPointerUp,
    		timelinePointerMove,
    		timelineStepGrabbing,
    		CreatorAction,
    		currentAction,
    		cancelAction,
    		escapeAction,
    		toggleAddStepMode,
    		toggleDeleteStepMode,
    		approveAnimDiscard,
    		discardAllProjects,
    		onOpenModal,
    		showSidebarLeft,
    		showSidebarRight,
    		sidebarAnim,
    		colorPickerAnim,
    		newProject,
    		changeProject,
    		showVpBgPicker,
    		toggleViewportBgPicker,
    		_cachedTargetStyles,
    		_cachedTargetHTML,
    		currentProjectWatcher,
    		selectedStepWatcher,
    		isAnimPlaying,
    		stepPos,
    		isAnimStopped,
    		playerCursorState,
    		isAnimPaused,
    		doesAnimTargetElExist,
    		currentProjectStore,
    		$currentProjectStore,
    		$animations,
    		$currentProjectReacted,
    		$currentProject,
    		$playOnlyCurSelAnim
    	});

    	$$self.$inject_state = $$props => {
    		if ('targetViewportEl' in $$props) $$invalidate(5, targetViewportEl = $$props.targetViewportEl);
    		if ('targetShadowDOM' in $$props) $$invalidate(46, targetShadowDOM = $$props.targetShadowDOM);
    		if ('selectedStep' in $$props) $$invalidate(6, selectedStep = $$props.selectedStep);
    		if ('stepsExisting' in $$props) $$invalidate(7, stepsExisting = $$props.stepsExisting);
    		if ('durationSteps' in $$props) $$invalidate(8, durationSteps = $$props.durationSteps);
    		if ('playerCursorStyles' in $$props) $$invalidate(9, playerCursorStyles = $$props.playerCursorStyles);
    		if ('AnimationState' in $$props) $$invalidate(47, AnimationState = $$props.AnimationState);
    		if ('animationState' in $$props) $$invalidate(48, animationState = $$props.animationState);
    		if ('playOnlyCurSelAnim' in $$props) $$invalidate(26, playOnlyCurSelAnim = $$props.playOnlyCurSelAnim);
    		if ('timelineEl' in $$props) $$invalidate(10, timelineEl = $$props.timelineEl);
    		if ('movingStepIdx' in $$props) $$invalidate(0, movingStepIdx = $$props.movingStepIdx);
    		if ('movingStepPos' in $$props) $$invalidate(1, movingStepPos = $$props.movingStepPos);
    		if ('CreatorAction' in $$props) $$invalidate(11, CreatorAction = $$props.CreatorAction);
    		if ('currentAction' in $$props) $$invalidate(12, currentAction = $$props.currentAction);
    		if ('showSidebarLeft' in $$props) $$invalidate(13, showSidebarLeft = $$props.showSidebarLeft);
    		if ('showSidebarRight' in $$props) $$invalidate(14, showSidebarRight = $$props.showSidebarRight);
    		if ('showVpBgPicker' in $$props) $$invalidate(15, showVpBgPicker = $$props.showVpBgPicker);
    		if ('_cachedTargetStyles' in $$props) _cachedTargetStyles = $$props._cachedTargetStyles;
    		if ('_cachedTargetHTML' in $$props) _cachedTargetHTML = $$props._cachedTargetHTML;
    		if ('currentProjectWatcher' in $$props) currentProjectWatcher = $$props.currentProjectWatcher;
    		if ('selectedStepWatcher' in $$props) selectedStepWatcher = $$props.selectedStepWatcher;
    		if ('isAnimPlaying' in $$props) $$invalidate(2, isAnimPlaying = $$props.isAnimPlaying);
    		if ('stepPos' in $$props) $$invalidate(16, stepPos = $$props.stepPos);
    		if ('isAnimStopped' in $$props) $$invalidate(3, isAnimStopped = $$props.isAnimStopped);
    		if ('playerCursorState' in $$props) $$invalidate(17, playerCursorState = $$props.playerCursorState);
    		if ('isAnimPaused' in $$props) $$invalidate(18, isAnimPaused = $$props.isAnimPaused);
    		if ('doesAnimTargetElExist' in $$props) $$invalidate(19, doesAnimTargetElExist = $$props.doesAnimTargetElExist);
    		if ('currentProjectStore' in $$props) $$subscribe_currentProjectStore($$invalidate(20, currentProjectStore = $$props.currentProjectStore));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*$currentProject*/ 262144) {
    			$$subscribe_currentProjectStore($$invalidate(20, currentProjectStore = $currentProject));
    		}

    		if ($$self.$$.dirty[0] & /*$currentProjectStore*/ 16 | $$self.$$.dirty[1] & /*targetShadowDOM*/ 32768) {
    			$$invalidate(19, doesAnimTargetElExist = targetShadowDOM && $currentProjectStore.targetEl && targetShadowDOM.querySelector($currentProjectStore.targetEl));
    		}

    		if ($$self.$$.dirty[1] & /*animationState, AnimationState*/ 196608) {
    			$$invalidate(2, isAnimPlaying = animationState === AnimationState.Playing);
    		}

    		if ($$self.$$.dirty[1] & /*animationState, AnimationState*/ 196608) {
    			$$invalidate(18, isAnimPaused = animationState === AnimationState.Paused);
    		}

    		if ($$self.$$.dirty[1] & /*animationState, AnimationState*/ 196608) {
    			$$invalidate(3, isAnimStopped = animationState === AnimationState.Stopped);
    		}

    		if ($$self.$$.dirty[0] & /*isAnimPlaying, isAnimStopped*/ 12) {
    			$$invalidate(17, playerCursorState = isAnimPlaying || isAnimStopped ? 'running' : 'paused');
    		}

    		if ($$self.$$.dirty[0] & /*movingStepIdx, movingStepPos*/ 3) {
    			$$invalidate(16, stepPos = (pos, idx) => idx === movingStepIdx ? movingStepPos : pos);
    		}
    	};

    	return [
    		movingStepIdx,
    		movingStepPos,
    		isAnimPlaying,
    		isAnimStopped,
    		$currentProjectStore,
    		targetViewportEl,
    		selectedStep,
    		stepsExisting,
    		durationSteps,
    		playerCursorStyles,
    		timelineEl,
    		CreatorAction,
    		currentAction,
    		showSidebarLeft,
    		showSidebarRight,
    		showVpBgPicker,
    		stepPos,
    		playerCursorState,
    		isAnimPaused,
    		doesAnimTargetElExist,
    		currentProjectStore,
    		$animations,
    		$playOnlyCurSelAnim,
    		animations,
    		currentProject,
    		currentProjectReacted,
    		playOnlyCurSelAnim,
    		togglePlayOnlyCurSelAnim,
    		playAnimation,
    		pauseAnimation,
    		stopAnimation,
    		timelineClick,
    		windowPointerUp,
    		timelinePointerMove,
    		timelineStepGrabbing,
    		escapeAction,
    		toggleAddStepMode,
    		toggleDeleteStepMode,
    		approveAnimDiscard,
    		discardAllProjects,
    		onOpenModal,
    		sidebarAnim,
    		colorPickerAnim,
    		newProject,
    		changeProject,
    		toggleViewportBgPicker,
    		targetShadowDOM,
    		AnimationState,
    		animationState,
    		$currentProject,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input_handler,
    		click_handler_6,
    		click_handler_7,
    		div8_binding,
    		pointerdown_handler,
    		animationend_handler,
    		div18_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

})();
//# sourceMappingURL=bundle.js.map
