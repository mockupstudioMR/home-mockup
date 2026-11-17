var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
  if (element_src === url) return true;
  if (!src_url_equal_anchor) {
    src_url_equal_anchor = document.createElement("a");
  }
  src_url_equal_anchor.href = url;
  return element_src === src_url_equal_anchor.href;
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    for (const callback of callbacks) {
      callback(void 0);
    }
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
  component.$$.on_destroy.push(subscribe(store, callback));
}
const globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : (
  // @ts-ignore Node typings have this
  global
);
function append(target, node) {
  target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
  const append_styles_to = get_root_for_style(target);
  if (!append_styles_to.getElementById(style_sheet_id)) {
    const style = element("style");
    style.id = style_sheet_id;
    style.textContent = styles;
    append_stylesheet(append_styles_to, style);
  }
}
function get_root_for_style(node) {
  if (!node) return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && /** @type {ShadowRoot} */
  root.host) {
    return (
      /** @type {ShadowRoot} */
      root
    );
  }
  return node.ownerDocument;
}
function append_stylesheet(node, style) {
  append(
    /** @type {Document} */
    node.head || node,
    style
  );
  return style.sheet;
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i]) iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
  return function(event) {
    event.preventDefault();
    return fn.call(this, event);
  };
}
function attr(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}
function to_number(value) {
  return value === "" ? null : +value;
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data) return;
  text2.data = /** @type {string} */
  data;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function set_style(node, key, value, important) {
  if (value == null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, "");
  }
}
function toggle_class(element2, name, toggle) {
  element2.classList.toggle(name, !!toggle);
}
function get_custom_elements_slots(element2) {
  const result = {};
  element2.childNodes.forEach(
    /** @param {Element} node */
    (node) => {
      result[node.slot || "default"] = true;
    }
  );
  return result;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component) throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function bubble(component, event) {
  const callbacks = component.$$.callbacks[event.type];
  if (callbacks) {
    callbacks.slice().forEach((fn) => fn.call(this, event));
  }
}
const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length) binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
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
  seen_callbacks.clear();
  set_current_component(saved_component);
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
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}
const outroing = /* @__PURE__ */ new Set();
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function ensure_array_like(array_like_or_iterator) {
  return (array_like_or_iterator == null ? void 0 : array_like_or_iterator.length) !== void 0 ? array_like_or_iterator : Array.from(array_like_or_iterator);
}
function destroy_block(block, lookup) {
  block.d(1);
  lookup.delete(block.key);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block2, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};
  while (i--) old_indexes[old_blocks[i].key] = i;
  const new_blocks = [];
  const new_lookup = /* @__PURE__ */ new Map();
  const deltas = /* @__PURE__ */ new Map();
  const updates = [];
  i = n;
  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block = lookup.get(key);
    if (!block) {
      block = create_each_block2(key, child_ctx);
      block.c();
    } else {
      updates.push(() => block.p(child_ctx, dirty));
    }
    new_lookup.set(key, new_blocks[i] = block);
    if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
  }
  const will_move = /* @__PURE__ */ new Set();
  const did_move = /* @__PURE__ */ new Set();
  function insert2(block) {
    transition_in(block, 1);
    block.m(node, next);
    lookup.set(block.key, block);
    next = block.first;
    n--;
  }
  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;
    if (new_block === old_block) {
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      destroy(old_block, lookup);
      o--;
    } else if (!lookup.has(new_key) || will_move.has(new_key)) {
      insert2(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert2(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }
  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
  }
  while (n) insert2(new_blocks[n - 1]);
  run_all(updates);
  return new_blocks;
}
function mount_component(component, target, anchor) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  add_render_callback(() => {
    const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
    if (component.$$.on_destroy) {
      component.$$.on_destroy.push(...new_on_destroy);
    } else {
      run_all(new_on_destroy);
    }
    component.$$.on_mount = [];
  });
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
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
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles2 = null, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
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
  append_styles2 && append_styles2($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
      if (ready) make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro) transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor);
    flush();
  }
  set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor($$componentCtor, $$slots, use_shadow_dom) {
      super();
      /** The Svelte component constructor */
      __publicField(this, "$$ctor");
      /** Slots */
      __publicField(this, "$$s");
      /** The Svelte component instance */
      __publicField(this, "$$c");
      /** Whether or not the custom element is connected */
      __publicField(this, "$$cn", false);
      /** Component props data */
      __publicField(this, "$$d", {});
      /** `true` if currently in the process of reflecting component props back to attributes */
      __publicField(this, "$$r", false);
      /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
      __publicField(this, "$$p_d", {});
      /** @type {Record<string, Function[]>} Event listeners */
      __publicField(this, "$$l", {});
      /** @type {Map<Function, Function>} Event listener unsubscribe functions */
      __publicField(this, "$$l_u", /* @__PURE__ */ new Map());
      this.$$ctor = $$componentCtor;
      this.$$s = $$slots;
      if (use_shadow_dom) {
        this.attachShadow({ mode: "open" });
      }
    }
    addEventListener(type, listener, options) {
      this.$$l[type] = this.$$l[type] || [];
      this.$$l[type].push(listener);
      if (this.$$c) {
        const unsub = this.$$c.$on(type, listener);
        this.$$l_u.set(listener, unsub);
      }
      super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
      if (this.$$c) {
        const unsub = this.$$l_u.get(listener);
        if (unsub) {
          unsub();
          this.$$l_u.delete(listener);
        }
      }
      if (this.$$l[type]) {
        const idx = this.$$l[type].indexOf(listener);
        if (idx >= 0) {
          this.$$l[type].splice(idx, 1);
        }
      }
    }
    async connectedCallback() {
      this.$$cn = true;
      if (!this.$$c) {
        let create_slot = function(name) {
          return () => {
            let node;
            const obj = {
              c: function create() {
                node = element("slot");
                if (name !== "default") {
                  attr(node, "name", name);
                }
              },
              /**
               * @param {HTMLElement} target
               * @param {HTMLElement} [anchor]
               */
              m: function mount(target, anchor) {
                insert(target, node, anchor);
              },
              d: function destroy(detaching) {
                if (detaching) {
                  detach(node);
                }
              }
            };
            return obj;
          };
        };
        await Promise.resolve();
        if (!this.$$cn || this.$$c) {
          return;
        }
        const $$slots = {};
        const existing_slots = get_custom_elements_slots(this);
        for (const name of this.$$s) {
          if (name in existing_slots) {
            $$slots[name] = [create_slot(name)];
          }
        }
        for (const attribute of this.attributes) {
          const name = this.$$g_p(attribute.name);
          if (!(name in this.$$d)) {
            this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
          }
        }
        for (const key in this.$$p_d) {
          if (!(key in this.$$d) && this[key] !== void 0) {
            this.$$d[key] = this[key];
            delete this[key];
          }
        }
        this.$$c = new this.$$ctor({
          target: this.shadowRoot || this,
          props: {
            ...this.$$d,
            $$slots,
            $$scope: {
              ctx: []
            }
          }
        });
        const reflect_attributes = () => {
          this.$$r = true;
          for (const key in this.$$p_d) {
            this.$$d[key] = this.$$c.$$.ctx[this.$$c.$$.props[key]];
            if (this.$$p_d[key].reflect) {
              const attribute_value = get_custom_element_value(
                key,
                this.$$d[key],
                this.$$p_d,
                "toAttribute"
              );
              if (attribute_value == null) {
                this.removeAttribute(this.$$p_d[key].attribute || key);
              } else {
                this.setAttribute(this.$$p_d[key].attribute || key, attribute_value);
              }
            }
          }
          this.$$r = false;
        };
        this.$$c.$$.after_update.push(reflect_attributes);
        reflect_attributes();
        for (const type in this.$$l) {
          for (const listener of this.$$l[type]) {
            const unsub = this.$$c.$on(type, listener);
            this.$$l_u.set(listener, unsub);
          }
        }
        this.$$l = {};
      }
    }
    // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
    // and setting attributes through setAttribute etc, this is helpful
    attributeChangedCallback(attr2, _oldValue, newValue) {
      var _a;
      if (this.$$r) return;
      attr2 = this.$$g_p(attr2);
      this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
      (_a = this.$$c) == null ? void 0 : _a.$set({ [attr2]: this.$$d[attr2] });
    }
    disconnectedCallback() {
      this.$$cn = false;
      Promise.resolve().then(() => {
        if (!this.$$cn && this.$$c) {
          this.$$c.$destroy();
          this.$$c = void 0;
        }
      });
    }
    $$g_p(attribute_name) {
      return Object.keys(this.$$p_d).find(
        (key) => this.$$p_d[key].attribute === attribute_name || !this.$$p_d[key].attribute && key.toLowerCase() === attribute_name
      ) || attribute_name;
    }
  };
}
function get_custom_element_value(prop, value, props_definition, transform) {
  var _a;
  const type = (_a = props_definition[prop]) == null ? void 0 : _a.type;
  value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
  if (!transform || !props_definition[prop]) {
    return value;
  } else if (transform === "toAttribute") {
    switch (type) {
      case "Object":
      case "Array":
        return value == null ? null : JSON.stringify(value);
      case "Boolean":
        return value ? "" : null;
      case "Number":
        return value == null ? null : value;
      default:
        return value;
    }
  } else {
    switch (type) {
      case "Object":
      case "Array":
        return value && JSON.parse(value);
      case "Boolean":
        return value;
      case "Number":
        return value != null ? +value : value;
      default:
        return value;
    }
  }
}
function create_custom_element(Component, props_definition, slots, accessors, use_shadow_dom, extend) {
  let Class = class extends SvelteElement {
    constructor() {
      super(Component, slots, use_shadow_dom);
      this.$$p_d = props_definition;
    }
    static get observedAttributes() {
      return Object.keys(props_definition).map(
        (key) => (props_definition[key].attribute || key).toLowerCase()
      );
    }
  };
  Object.keys(props_definition).forEach((prop) => {
    Object.defineProperty(Class.prototype, prop, {
      get() {
        return this.$$c && prop in this.$$c ? this.$$c[prop] : this.$$d[prop];
      },
      set(value) {
        var _a;
        value = get_custom_element_value(prop, value, props_definition);
        this.$$d[prop] = value;
        (_a = this.$$c) == null ? void 0 : _a.$set({ [prop]: value });
      }
    });
  });
  accessors.forEach((accessor) => {
    Object.defineProperty(Class.prototype, accessor, {
      get() {
        var _a;
        return (_a = this.$$c) == null ? void 0 : _a[accessor];
      }
    });
  });
  Component.element = /** @type {any} */
  Class;
  return Class;
}
class SvelteComponent {
  constructor() {
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$");
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$set");
  }
  /** @returns {void} */
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  /**
   * @template {Extract<keyof Events, string>} K
   * @param {K} type
   * @param {((e: Events[K]) => void) | null | undefined} callback
   * @returns {() => void}
   */
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    };
  }
  /**
   * @param {Partial<Props>} props
   * @returns {void}
   */
  $set(props) {
    if (this.$$set && !is_empty(props)) {
      this.$$.skip_bound = true;
      this.$$set(props);
      this.$$.skip_bound = false;
    }
  }
}
const PUBLIC_VERSION = "4";
if (typeof window !== "undefined")
  (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(PUBLIC_VERSION);
const subscriber_queue = [];
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe
  };
}
function writable(value, start = noop) {
  let stop;
  const subscribers = /* @__PURE__ */ new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
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
  function update2(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set, update2) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0 && stop) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update: update2, subscribe: subscribe2 };
}
function derived(stores, fn, initial_value) {
  const single = !Array.isArray(stores);
  const stores_array = single ? [stores] : stores;
  if (!stores_array.every(Boolean)) {
    throw new Error("derived() expects stores as input, got a falsy value");
  }
  const auto = fn.length < 2;
  return readable(initial_value, (set, update2) => {
    let started = false;
    const values = [];
    let pending = 0;
    let cleanup = noop;
    const sync = () => {
      if (pending) {
        return;
      }
      cleanup();
      const result = fn(single ? values[0] : values, set, update2);
      if (auto) {
        set(result);
      } else {
        cleanup = is_function(result) ? result : noop;
      }
    };
    const unsubscribers = stores_array.map(
      (store, i) => subscribe(
        store,
        (value) => {
          values[i] = value;
          pending &= ~(1 << i);
          if (started) {
            sync();
          }
        },
        () => {
          pending |= 1 << i;
        }
      )
    );
    started = true;
    sync();
    return function stop() {
      run_all(unsubscribers);
      cleanup();
      started = false;
    };
  });
}
const { Map: Map_1 } = globals;
function add_css(target) {
  append_styles(target, "svelte-bfelzx", '.showroom-configurator.svelte-bfelzx.svelte-bfelzx{width:100%;max-width:100%;margin:0 auto;background:#f5f5f5;position:relative;display:flex;flex-direction:column;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif}.loading-screen.svelte-bfelzx.svelte-bfelzx,.error-screen.svelte-bfelzx.svelte-bfelzx{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;padding:2rem}.loading-screen.svelte-bfelzx p.svelte-bfelzx,.error-screen.svelte-bfelzx p.svelte-bfelzx{margin:1rem 0;color:#333}.error-screen.svelte-bfelzx button.svelte-bfelzx{padding:0.75rem 1rem;background:var(--theme-color);color:white;border:none;border-radius:4px;cursor:pointer;font-size:1rem}.error-screen.svelte-bfelzx button.svelte-bfelzx:hover{background:var(--theme-color-dark)}.spinner.svelte-bfelzx.svelte-bfelzx{width:50px;height:50px;border:4px solid rgba(0, 0, 0, 0.1);border-top-color:var(--theme-color);border-radius:50%;animation:svelte-bfelzx-spin 1s linear infinite}@keyframes svelte-bfelzx-spin{to{transform:rotate(360deg)}}.toolbar.svelte-bfelzx.svelte-bfelzx{position:relative;background:#f8f8f8;border-bottom:1px solid #e0e0e0}.toolbar-buttons.svelte-bfelzx.svelte-bfelzx{display:flex;gap:0.5rem;padding:0.5rem;justify-content:flex-end}@media(max-width: 768px){.toolbar-buttons.svelte-bfelzx.svelte-bfelzx{padding:0.4rem;gap:0.4rem}}.toolbar-button.svelte-bfelzx.svelte-bfelzx{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:white;border:1px solid #d0d0d0;border-radius:6px;cursor:pointer;font-size:0.9rem;color:#333;transition:all 0.2s}.toolbar-button.svelte-bfelzx.svelte-bfelzx:hover{background:var(--theme-color);color:white;border-color:var(--theme-color)}.toolbar-button.active.svelte-bfelzx.svelte-bfelzx{background:var(--theme-color);color:white;border-color:var(--theme-color)}.toolbar-button.language-toggle.svelte-bfelzx .language-label.svelte-bfelzx{font-weight:700;font-size:0.75rem;letter-spacing:0.5px}@media(max-width: 768px){.toolbar-button.language-toggle.svelte-bfelzx .language-label.svelte-bfelzx{display:inline}}.toolbar-button.svelte-bfelzx svg.svelte-bfelzx{flex-shrink:0;width:20px;height:20px}@media(max-width: 768px){.toolbar-button.svelte-bfelzx span.svelte-bfelzx:not(.language-label){display:none}.toolbar-button.svelte-bfelzx.svelte-bfelzx{padding:0.5rem;border-radius:4px}.toolbar-button.svelte-bfelzx svg.svelte-bfelzx{width:16px;height:16px}}@media(max-width: 480px){.toolbar-button.svelte-bfelzx.svelte-bfelzx{padding:0.4rem}.toolbar-button.svelte-bfelzx svg.svelte-bfelzx{width:14px;height:14px}}.enhancement-panel.svelte-bfelzx.svelte-bfelzx{position:absolute;top:100%;left:0;right:0;background:rgba(248, 248, 248, 0.3);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);border-bottom:1px solid rgba(224, 224, 224, 0.3);padding:1rem;animation:svelte-bfelzx-slideDown 0.2s ease;z-index:1100;box-shadow:0 4px 12px rgba(0, 0, 0, 0.15)}@media(max-width: 768px){.enhancement-panel.svelte-bfelzx.svelte-bfelzx{padding:0.5rem}}@media(max-width: 480px){.enhancement-panel.svelte-bfelzx.svelte-bfelzx{padding:0.4rem}}@keyframes svelte-bfelzx-slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.enhancement-controls.svelte-bfelzx.svelte-bfelzx{display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem}@media(max-width: 768px){.enhancement-controls.svelte-bfelzx.svelte-bfelzx{grid-template-columns:1fr;gap:0.5rem}}@media(max-width: 480px){.enhancement-controls.svelte-bfelzx.svelte-bfelzx{gap:0.4rem}}.control-group.svelte-bfelzx.svelte-bfelzx{display:flex;flex-direction:column;gap:0.5rem}@media(max-width: 768px){.control-group.svelte-bfelzx.svelte-bfelzx{flex-direction:row;align-items:center;gap:0.5rem}}.control-group.svelte-bfelzx label.svelte-bfelzx{display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;color:#555;font-weight:500}.control-group.svelte-bfelzx label .value.svelte-bfelzx{font-weight:600;color:var(--theme-color);min-width:50px;text-align:right}@media(max-width: 768px){.control-group.svelte-bfelzx label.svelte-bfelzx{font-size:0.75rem;min-width:100px;flex-shrink:0}.control-group.svelte-bfelzx label span.svelte-bfelzx:first-child{flex:1}.control-group.svelte-bfelzx label .value.svelte-bfelzx{min-width:25px;margin-left:0.5rem}}@media(max-width: 480px){.control-group.svelte-bfelzx label.svelte-bfelzx{font-size:0.7rem;min-width:85px}.control-group.svelte-bfelzx label .value.svelte-bfelzx{min-width:20px;margin-left:0.3rem}}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx{width:100%;height:6px;border-radius:3px;background:linear-gradient(to right, #e0e0e0 0%, var(--theme-color) 50%, #e0e0e0 100%);outline:none;-webkit-appearance:none}@media(max-width: 768px){.control-group.svelte-bfelzx input[type=range].svelte-bfelzx{flex:1}}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:var(--theme-color);cursor:pointer;box-shadow:0 2px 4px rgba(0, 0, 0, 0.2);transition:all 0.2s}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-webkit-slider-thumb:hover{transform:scale(1.2);box-shadow:0 3px 6px rgba(0, 0, 0, 0.3)}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-webkit-slider-thumb:active{transform:scale(1.1)}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--theme-color);cursor:pointer;border:none;box-shadow:0 2px 4px rgba(0, 0, 0, 0.2);transition:all 0.2s}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-moz-range-thumb:hover{transform:scale(1.2);box-shadow:0 3px 6px rgba(0, 0, 0, 0.3)}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-moz-range-thumb:active{transform:scale(1.1)}@media(max-width: 768px){.control-group.svelte-bfelzx input[type=range].svelte-bfelzx{height:6px}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-webkit-slider-thumb{width:16px;height:16px}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-moz-range-thumb{width:16px;height:16px}}@media(max-width: 480px){.control-group.svelte-bfelzx input[type=range].svelte-bfelzx{height:5px}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-webkit-slider-thumb{width:14px;height:14px}.control-group.svelte-bfelzx input[type=range].svelte-bfelzx::-moz-range-thumb{width:14px;height:14px}}.scene-container.svelte-bfelzx.svelte-bfelzx{position:relative;width:100%;background:#fff;overflow:visible;display:flex;align-items:center;justify-content:center}.transition-loader.svelte-bfelzx.svelte-bfelzx{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:transparent;z-index:999;pointer-events:none}.transition-loader.svelte-bfelzx .spinner.svelte-bfelzx{width:80px;height:80px}.showroom-canvas.svelte-bfelzx.svelte-bfelzx{width:100%;height:auto;display:block;transition:opacity 0.3s ease}.showroom-canvas.transitioning.svelte-bfelzx.svelte-bfelzx{opacity:0.5}.hotspot.svelte-bfelzx.svelte-bfelzx{position:absolute;width:40px;height:40px;background:transparent;border:none;cursor:pointer;z-index:1000;transition:transform 0.2s;color:var(--theme-color)}.hotspot.svelte-bfelzx.svelte-bfelzx:hover{transform:scale(1.1)}.hotspot.active.svelte-bfelzx.svelte-bfelzx{color:var(--theme-color-dark);transform:scale(1.2)}.hotspot.svelte-bfelzx svg.svelte-bfelzx{filter:drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))}@media(max-width: 768px){.hotspot.svelte-bfelzx.svelte-bfelzx{width:28px;height:28px}}.controls-container.svelte-bfelzx.svelte-bfelzx{background:white;border-top:1px solid #e0e0e0}.tabs.svelte-bfelzx.svelte-bfelzx{display:flex;gap:0;overflow-x:auto;border-bottom:1px solid #e0e0e0;scrollbar-width:thin}.tabs.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar{height:4px}.tabs.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px}@media(max-width: 768px){.tabs.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar{height:3px}}.tab.svelte-bfelzx.svelte-bfelzx{flex:1;min-width:max-content;padding:1rem 1rem;background:white;border:none;border-bottom:3px solid transparent;cursor:pointer;font-size:0.9rem;font-weight:500;color:#666;text-transform:uppercase;transition:all 0.2s;white-space:nowrap}.tab.svelte-bfelzx.svelte-bfelzx:hover{background:#f5f5f5;color:#333}.tab.active.svelte-bfelzx.svelte-bfelzx{color:var(--theme-color);border-bottom-color:var(--theme-color);font-weight:600}@media(max-width: 768px){.tab.svelte-bfelzx.svelte-bfelzx{padding:0.75rem 0.75rem;font-size:0.8rem;border-bottom-width:2px}}@media(max-width: 480px){.tab.svelte-bfelzx.svelte-bfelzx{padding:0.6rem 0.6rem;font-size:0.75rem;min-width:fit-content}}.carousel-wrapper.svelte-bfelzx.svelte-bfelzx{padding:0.5rem 1rem 1rem 1rem;position:relative}.carousel-container.svelte-bfelzx.svelte-bfelzx{position:relative;display:flex;align-items:center;gap:1rem}.carousel-nav.svelte-bfelzx.svelte-bfelzx{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:white;border:2px solid var(--theme-color);color:var(--theme-color);font-size:24px;font-weight:bold;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0, 0, 0, 0.15);transition:all 0.2s}.carousel-nav.svelte-bfelzx.svelte-bfelzx:hover{background:var(--theme-color);color:white;transform:translateY(-50%) scale(1.1)}.carousel-nav.svelte-bfelzx.svelte-bfelzx:active{transform:translateY(-50%) scale(0.95)}.carousel-nav-left.svelte-bfelzx.svelte-bfelzx{left:-10px}.carousel-nav-right.svelte-bfelzx.svelte-bfelzx{right:-10px}@media(max-width: 768px){.carousel-nav.svelte-bfelzx.svelte-bfelzx{width:32px;height:32px;font-size:20px}}.carousel-items.svelte-bfelzx.svelte-bfelzx{display:flex;gap:1rem;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:var(--theme-color) #f5f5f5;padding:0.5rem 0;flex:1}.carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar{height:6px}.carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar-track{background:#f5f5f5;border-radius:3px}.carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar-thumb{background:var(--theme-color);border-radius:3px}.carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar-thumb:hover{background:var(--theme-color-dark)}@media(max-width: 768px){.carousel-items.svelte-bfelzx.svelte-bfelzx{gap:0.75rem}}.carousel-item-wrapper.svelte-bfelzx.svelte-bfelzx{position:relative;flex:0 0 auto;width:calc(16.666% - 0.85rem);min-width:120px}@media(max-width: 1400px){.carousel-item-wrapper.svelte-bfelzx.svelte-bfelzx{width:calc(20% - 0.8rem)}}@media(max-width: 1200px){.carousel-item-wrapper.svelte-bfelzx.svelte-bfelzx{width:calc(25% - 0.75rem)}}@media(max-width: 992px){.carousel-item-wrapper.svelte-bfelzx.svelte-bfelzx{width:calc(33.333% - 0.75rem)}}@media(max-width: 768px){.carousel-item-wrapper.svelte-bfelzx.svelte-bfelzx{width:calc(33.333% - 0.5rem);min-width:90px}}@media(max-width: 480px){.carousel-item-wrapper.svelte-bfelzx.svelte-bfelzx{width:calc(33.333% - 0.5rem);min-width:85px}}.carousel-item-wrapper.svelte-bfelzx .carousel-item.svelte-bfelzx{width:100%;min-width:0}.carousel-item.svelte-bfelzx.svelte-bfelzx{flex:0 0 auto;width:calc(16.666% - 0.85rem);min-width:120px;background:#f5f5f5;border:2px solid transparent;border-radius:8px;cursor:pointer;overflow:hidden;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.25rem;scroll-snap-align:start}@media(max-width: 1400px){.carousel-item.svelte-bfelzx.svelte-bfelzx{width:calc(20% - 0.8rem)}}@media(max-width: 1200px){.carousel-item.svelte-bfelzx.svelte-bfelzx{width:calc(25% - 0.75rem)}}@media(max-width: 992px){.carousel-item.svelte-bfelzx.svelte-bfelzx{width:calc(33.333% - 0.75rem)}}@media(max-width: 768px){.carousel-item.svelte-bfelzx.svelte-bfelzx{width:calc(33.333% - 0.5rem);min-width:90px}}@media(max-width: 480px){.carousel-item.svelte-bfelzx.svelte-bfelzx{width:calc(33.333% - 0.5rem);min-width:85px}}.carousel-item.svelte-bfelzx .item-preview.svelte-bfelzx{width:100%;aspect-ratio:1;overflow:hidden;border-radius:4px;display:flex;align-items:center;justify-content:center}.carousel-item.svelte-bfelzx .item-preview img.svelte-bfelzx{width:100%;height:100%;object-fit:contain}.carousel-item.svelte-bfelzx span.svelte-bfelzx{margin-top:0.5rem;font-size:0.75rem;text-align:center;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.carousel-item.svelte-bfelzx.svelte-bfelzx:hover{border-color:var(--theme-color);transform:translateY(-2px);box-shadow:0 4px 8px rgba(0, 0, 0, 0.1)}.carousel-item.selected.svelte-bfelzx.svelte-bfelzx{border-color:var(--theme-color);background:#fff;box-shadow:0 2px 8px var(--theme-color-light)}.carousel-item.hidden.svelte-bfelzx.svelte-bfelzx{opacity:0.4;filter:grayscale(0.8)}.visibility-toggle.svelte-bfelzx.svelte-bfelzx{position:absolute;top:0.25rem;right:0.25rem;width:28px;height:28px;border-radius:50%;border:none;background:rgba(255, 255, 255, 0.95);color:#666;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0, 0, 0, 0.15);transition:all 0.2s;z-index:10}.visibility-toggle.svelte-bfelzx.svelte-bfelzx:hover{background:white;color:var(--theme-color);transform:scale(1.1);box-shadow:0 3px 10px rgba(0, 0, 0, 0.2)}.visibility-toggle.svelte-bfelzx.svelte-bfelzx:active{transform:scale(0.95)}.visibility-toggle.visible.svelte-bfelzx.svelte-bfelzx{color:var(--theme-color)}.visibility-toggle.svelte-bfelzx svg.svelte-bfelzx{width:16px;height:16px}@media(max-width: 768px){.visibility-toggle.svelte-bfelzx.svelte-bfelzx{width:24px;height:24px}.visibility-toggle.svelte-bfelzx svg.svelte-bfelzx{width:14px;height:14px}}.color-selector-section.svelte-bfelzx.svelte-bfelzx{margin-bottom:1rem}.color-carousel-container.svelte-bfelzx.svelte-bfelzx{position:relative;display:flex;align-items:center;gap:1rem}.color-carousel-items.svelte-bfelzx.svelte-bfelzx{display:flex;gap:0.75rem;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:var(--theme-color) #f5f5f5;padding:0.5rem 0;flex:1}.color-carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar{height:6px}.color-carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar-track{background:#f5f5f5;border-radius:3px}.color-carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar-thumb{background:var(--theme-color);border-radius:3px}.color-carousel-items.svelte-bfelzx.svelte-bfelzx::-webkit-scrollbar-thumb:hover{background:var(--theme-color-dark)}.color-option.svelte-bfelzx.svelte-bfelzx{flex:0 0 auto;width:70px;background:#f5f5f5;border:2px solid transparent;border-radius:8px;cursor:pointer;overflow:hidden;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.4rem;scroll-snap-align:start}.color-option.svelte-bfelzx .option-color.svelte-bfelzx{width:100%;aspect-ratio:1;border-radius:4px;border:1px solid rgba(0, 0, 0, 0.2);overflow:hidden}.color-option.svelte-bfelzx span.svelte-bfelzx{margin-top:0.4rem;font-size:0.65rem;text-align:center;color:#666;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.color-option.svelte-bfelzx.svelte-bfelzx:hover{border-color:var(--theme-color);transform:translateY(-2px);box-shadow:0 4px 8px rgba(0, 0, 0, 0.1)}.color-option.selected.svelte-bfelzx.svelte-bfelzx{border-color:var(--theme-color);background:#fff;box-shadow:0 2px 8px var(--theme-color-light)}@media(max-width: 768px){.color-option.svelte-bfelzx.svelte-bfelzx{width:60px;padding:0.3rem}.color-option.svelte-bfelzx span.svelte-bfelzx{font-size:0.6rem}}.material-type-selector.svelte-bfelzx.svelte-bfelzx{display:flex;gap:0.75rem;flex-wrap:wrap;padding:1rem 1rem 0.5rem 1rem}.material-type-button.svelte-bfelzx.svelte-bfelzx{flex:1;min-width:100px;padding:0.75rem 1rem;background:#f5f5f5;border:2px solid transparent;border-radius:2px;cursor:pointer;font-size:0.9rem;font-weight:600;color:#666;transition:all 0.2s;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.material-type-button.svelte-bfelzx.svelte-bfelzx:hover{background:#fff;border-color:var(--theme-color-light);color:var(--theme-color)}.material-type-button.active.svelte-bfelzx.svelte-bfelzx{background:var(--theme-color);color:white;border-color:var(--theme-color)}@media(max-width: 768px){.material-type-button.svelte-bfelzx.svelte-bfelzx{min-width:70px;padding:0.5rem 0.5rem;font-size:0.7rem;letter-spacing:0.3px}}');
}
function get_each_context_5(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[131] = list[i];
  child_ctx[123] = i;
  const constants_0 = (
    /*i*/
    child_ctx[123] + 1
  );
  child_ctx[132] = constants_0;
  return child_ctx;
}
function get_each_context_3(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[115] = list[i];
  return child_ctx;
}
function get_each_context_4(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[120] = list[i];
  child_ctx[123] = i;
  const constants_0 = `color-${/*i*/
  child_ctx[123] + 1}`;
  child_ctx[121] = constants_0;
  return child_ctx;
}
function get_each_context(ctx, list, i) {
  var _a, _b;
  const child_ctx = ctx.slice();
  child_ctx[115] = list[i];
  const constants_0 = (
    /*product*/
    (_a = child_ctx[115].materials) == null ? void 0 : _a[0]
  );
  child_ctx[116] = constants_0;
  const constants_1 = (
    /*$currentLayers*/
    ((_b = child_ctx[11][
      /*$activeTab*/
      child_ctx[4]
    ]) == null ? void 0 : _b.visible) !== false
  );
  child_ctx[117] = constants_1;
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[120] = list[i];
  child_ctx[123] = i;
  const constants_0 = `color-${/*i*/
  child_ctx[123] + 1}`;
  child_ctx[121] = constants_0;
  return child_ctx;
}
function get_each_context_2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[124] = list[i];
  return child_ctx;
}
function get_if_ctx_1(ctx) {
  const child_ctx = ctx.slice();
  const constants_0 = (
    /*activeLayer*/
    child_ctx[110].group === "materials"
  );
  child_ctx[127] = constants_0;
  return child_ctx;
}
function get_if_ctx(ctx) {
  var _a, _b;
  const child_ctx = ctx.slice();
  const constants_0 = (
    /*activeLayer*/
    child_ctx[110].products.find(function func(...args) {
      return (
        /*func*/
        ctx[70](
          /*activeState*/
          child_ctx[111],
          ...args
        )
      );
    })
  );
  child_ctx[113] = constants_0;
  const constants_1 = (
    /*selectedProduct*/
    (_b = (_a = child_ctx[113]) == null ? void 0 : _a.materials) == null ? void 0 : _b.find(function func_1(...args) {
      return (
        /*func_1*/
        ctx[71](
          /*activeState*/
          child_ctx[111],
          ...args
        )
      );
    })
  );
  child_ctx[114] = constants_1;
  return child_ctx;
}
function get_if_ctx_2(ctx) {
  var _a;
  const child_ctx = ctx.slice();
  const constants_0 = (
    /*$configData*/
    child_ctx[6].layers[
      /*$activeTab*/
      child_ctx[4]
    ]
  );
  child_ctx[110] = constants_0;
  const constants_1 = (
    /*$currentLayers*/
    child_ctx[11][
      /*$activeTab*/
      child_ctx[4]
    ]
  );
  child_ctx[111] = constants_1;
  const constants_2 = (
    /*activeLayer*/
    ((_a = child_ctx[110]) == null ? void 0 : _a.group) === "product-layer"
  );
  child_ctx[112] = constants_2;
  return child_ctx;
}
function get_each_context_6(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[134] = list[i];
  return child_ctx;
}
function get_each_context_7(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[137] = list[i];
  const constants_0 = Math.min(
    Math.max(
      /*hotspot*/
      child_ctx[137].position.x,
      0
    ),
    /*refWidth*/
    child_ctx[108]
  );
  child_ctx[138] = constants_0;
  const constants_1 = Math.min(
    Math.max(
      /*hotspot*/
      child_ctx[137].position.y,
      0
    ),
    /*refHeight*/
    child_ctx[109]
  );
  child_ctx[139] = constants_1;
  const constants_2 = window.innerWidth <= 768 ? 28 : 40;
  child_ctx[140] = constants_2;
  const constants_3 = (
    /*canvasRect*/
    child_ctx[7].left + /*clampedX*/
    child_ctx[138] / /*refWidth*/
    child_ctx[108] * /*canvasRect*/
    child_ctx[7].width - /*hotspotSize*/
    child_ctx[140] / 2
  );
  child_ctx[141] = constants_3;
  const constants_4 = (
    /*canvasRect*/
    child_ctx[7].top + /*clampedY*/
    child_ctx[139] / /*refHeight*/
    child_ctx[109] * /*canvasRect*/
    child_ctx[7].height - /*hotspotSize*/
    child_ctx[140] / 2
  );
  child_ctx[142] = constants_4;
  const constants_5 = Math.max(
    /*canvasRect*/
    child_ctx[7].left,
    Math.min(
      /*rawXPos*/
      child_ctx[141],
      /*canvasRect*/
      child_ctx[7].left + /*canvasRect*/
      child_ctx[7].width - /*hotspotSize*/
      child_ctx[140]
    )
  );
  child_ctx[143] = constants_5;
  const constants_6 = Math.max(
    /*canvasRect*/
    child_ctx[7].top,
    Math.min(
      /*rawYPos*/
      child_ctx[142],
      /*canvasRect*/
      child_ctx[7].top + /*canvasRect*/
      child_ctx[7].height - /*hotspotSize*/
      child_ctx[140]
    )
  );
  child_ctx[144] = constants_6;
  return child_ctx;
}
function get_if_ctx_3(ctx) {
  var _a, _b;
  const child_ctx = ctx.slice();
  const constants_0 = (
    /*$configData*/
    ((_a = child_ctx[6].imageSize) == null ? void 0 : _a.width) || 1920
  );
  child_ctx[108] = constants_0;
  const constants_1 = (
    /*$configData*/
    ((_b = child_ctx[6].imageSize) == null ? void 0 : _b.height) || 1080
  );
  child_ctx[109] = constants_1;
  return child_ctx;
}
function create_if_block_2(ctx) {
  let div1;
  let div0;
  let button0;
  let svg0;
  let circle0;
  let line0;
  let path0;
  let t0;
  let span0;
  let t1_value = (
    /*$currentLanguage*/
    ctx[15].toUpperCase() + ""
  );
  let t1;
  let t2;
  let button1;
  let svg1;
  let circle1;
  let circle2;
  let line1;
  let line2;
  let line3;
  let line4;
  let line5;
  let line6;
  let line7;
  let line8;
  let t3;
  let span1;
  let t4_value = (
    /*$t*/
    ctx[16].imageEnhancement + ""
  );
  let t4;
  let button1_title_value;
  let t5;
  let button2;
  let svg2;
  let path1;
  let polyline;
  let line9;
  let t6;
  let span2;
  let t7_value = (
    /*$t*/
    ctx[16].download + ""
  );
  let t7;
  let button2_title_value;
  let t8;
  let button3;
  let svg3;
  let path2;
  let t9;
  let span3;
  let t10_value = (
    /*$t*/
    ctx[16].fullscreen + ""
  );
  let t10;
  let button3_title_value;
  let t11;
  let t12;
  let div2;
  let t13;
  let canvas;
  let t14;
  let each_blocks_1 = [];
  let each0_lookup = new Map_1();
  let t15;
  let div4;
  let div3;
  let each_blocks = [];
  let each1_lookup = new Map_1();
  let t16;
  let mounted;
  let dispose;
  let if_block0 = (
    /*showEnhancementPanel*/
    ctx[10] && create_if_block_21(ctx)
  );
  let if_block1 = (
    /*$transitioning*/
    ctx[17] && create_if_block_20()
  );
  let each_value_7 = ensure_array_like(
    /*$visibleHotspots*/
    ctx[18]
  );
  const get_key = (ctx2) => (
    /*hotspot*/
    ctx2[137].id
  );
  for (let i = 0; i < each_value_7.length; i += 1) {
    let child_ctx = get_each_context_7(ctx, each_value_7, i);
    let key = get_key(child_ctx);
    each0_lookup.set(key, each_blocks_1[i] = create_each_block_7(key, child_ctx));
  }
  let each_value_6 = ensure_array_like(
    /*$tabs*/
    ctx[19]
  );
  const get_key_1 = (ctx2) => (
    /*tab*/
    ctx2[134].name
  );
  for (let i = 0; i < each_value_6.length; i += 1) {
    let child_ctx = get_each_context_6(ctx, each_value_6, i);
    let key = get_key_1(child_ctx);
    each1_lookup.set(key, each_blocks[i] = create_each_block_6(key, child_ctx));
  }
  let if_block2 = (
    /*$activeTab*/
    ctx[4] && create_if_block_3(get_if_ctx_2(ctx))
  );
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      button0 = element("button");
      svg0 = svg_element("svg");
      circle0 = svg_element("circle");
      line0 = svg_element("line");
      path0 = svg_element("path");
      t0 = space();
      span0 = element("span");
      t1 = text(t1_value);
      t2 = space();
      button1 = element("button");
      svg1 = svg_element("svg");
      circle1 = svg_element("circle");
      circle2 = svg_element("circle");
      line1 = svg_element("line");
      line2 = svg_element("line");
      line3 = svg_element("line");
      line4 = svg_element("line");
      line5 = svg_element("line");
      line6 = svg_element("line");
      line7 = svg_element("line");
      line8 = svg_element("line");
      t3 = space();
      span1 = element("span");
      t4 = text(t4_value);
      t5 = space();
      button2 = element("button");
      svg2 = svg_element("svg");
      path1 = svg_element("path");
      polyline = svg_element("polyline");
      line9 = svg_element("line");
      t6 = space();
      span2 = element("span");
      t7 = text(t7_value);
      t8 = space();
      button3 = element("button");
      svg3 = svg_element("svg");
      path2 = svg_element("path");
      t9 = space();
      span3 = element("span");
      t10 = text(t10_value);
      t11 = space();
      if (if_block0) if_block0.c();
      t12 = space();
      div2 = element("div");
      if (if_block1) if_block1.c();
      t13 = space();
      canvas = element("canvas");
      t14 = space();
      for (let i = 0; i < each_blocks_1.length; i += 1) {
        each_blocks_1[i].c();
      }
      t15 = space();
      div4 = element("div");
      div3 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t16 = space();
      if (if_block2) if_block2.c();
      attr(circle0, "cx", "12");
      attr(circle0, "cy", "12");
      attr(circle0, "r", "10");
      attr(line0, "x1", "2");
      attr(line0, "y1", "12");
      attr(line0, "x2", "22");
      attr(line0, "y2", "12");
      attr(path0, "d", "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z");
      attr(svg0, "width", "20");
      attr(svg0, "height", "20");
      attr(svg0, "viewBox", "0 0 24 24");
      attr(svg0, "fill", "none");
      attr(svg0, "stroke", "currentColor");
      attr(svg0, "stroke-width", "2");
      attr(svg0, "class", "svelte-bfelzx");
      attr(span0, "class", "language-label svelte-bfelzx");
      attr(button0, "class", "toolbar-button language-toggle svelte-bfelzx");
      attr(button0, "title", "Language / Sprache");
      attr(circle1, "cx", "12");
      attr(circle1, "cy", "12");
      attr(circle1, "r", "10");
      attr(circle2, "cx", "12");
      attr(circle2, "cy", "12");
      attr(circle2, "r", "3");
      attr(line1, "x1", "12");
      attr(line1, "y1", "1");
      attr(line1, "x2", "12");
      attr(line1, "y2", "3");
      attr(line2, "x1", "12");
      attr(line2, "y1", "21");
      attr(line2, "x2", "12");
      attr(line2, "y2", "23");
      attr(line3, "x1", "4.22");
      attr(line3, "y1", "4.22");
      attr(line3, "x2", "5.64");
      attr(line3, "y2", "5.64");
      attr(line4, "x1", "18.36");
      attr(line4, "y1", "18.36");
      attr(line4, "x2", "19.78");
      attr(line4, "y2", "19.78");
      attr(line5, "x1", "1");
      attr(line5, "y1", "12");
      attr(line5, "x2", "3");
      attr(line5, "y2", "12");
      attr(line6, "x1", "21");
      attr(line6, "y1", "12");
      attr(line6, "x2", "23");
      attr(line6, "y2", "12");
      attr(line7, "x1", "4.22");
      attr(line7, "y1", "19.78");
      attr(line7, "x2", "5.64");
      attr(line7, "y2", "18.36");
      attr(line8, "x1", "18.36");
      attr(line8, "y1", "5.64");
      attr(line8, "x2", "19.78");
      attr(line8, "y2", "4.22");
      attr(svg1, "width", "20");
      attr(svg1, "height", "20");
      attr(svg1, "viewBox", "0 0 24 24");
      attr(svg1, "fill", "none");
      attr(svg1, "stroke", "currentColor");
      attr(svg1, "stroke-width", "2");
      attr(svg1, "class", "svelte-bfelzx");
      attr(span1, "class", "svelte-bfelzx");
      attr(button1, "class", "toolbar-button svelte-bfelzx");
      attr(button1, "title", button1_title_value = /*$t*/
      ctx[16].imageEnhancement);
      toggle_class(
        button1,
        "active",
        /*showEnhancementPanel*/
        ctx[10]
      );
      attr(path1, "d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");
      attr(polyline, "points", "7 10 12 15 17 10");
      attr(line9, "x1", "12");
      attr(line9, "y1", "15");
      attr(line9, "x2", "12");
      attr(line9, "y2", "3");
      attr(svg2, "width", "20");
      attr(svg2, "height", "20");
      attr(svg2, "viewBox", "0 0 24 24");
      attr(svg2, "fill", "none");
      attr(svg2, "stroke", "currentColor");
      attr(svg2, "stroke-width", "2");
      attr(svg2, "class", "svelte-bfelzx");
      attr(span2, "class", "svelte-bfelzx");
      attr(button2, "class", "toolbar-button svelte-bfelzx");
      attr(button2, "title", button2_title_value = /*$t*/
      ctx[16].download);
      attr(path2, "d", "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3");
      attr(svg3, "width", "20");
      attr(svg3, "height", "20");
      attr(svg3, "viewBox", "0 0 24 24");
      attr(svg3, "fill", "none");
      attr(svg3, "stroke", "currentColor");
      attr(svg3, "stroke-width", "2");
      attr(svg3, "class", "svelte-bfelzx");
      attr(span3, "class", "svelte-bfelzx");
      attr(button3, "class", "toolbar-button svelte-bfelzx");
      attr(button3, "title", button3_title_value = /*$t*/
      ctx[16].fullscreen);
      attr(div0, "class", "toolbar-buttons svelte-bfelzx");
      attr(div1, "class", "toolbar svelte-bfelzx");
      attr(canvas, "class", "showroom-canvas svelte-bfelzx");
      toggle_class(
        canvas,
        "transitioning",
        /*$transitioning*/
        ctx[17]
      );
      attr(div2, "class", "scene-container svelte-bfelzx");
      attr(div3, "class", "tabs svelte-bfelzx");
      attr(div4, "class", "controls-container svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div0, button0);
      append(button0, svg0);
      append(svg0, circle0);
      append(svg0, line0);
      append(svg0, path0);
      append(button0, t0);
      append(button0, span0);
      append(span0, t1);
      append(div0, t2);
      append(div0, button1);
      append(button1, svg1);
      append(svg1, circle1);
      append(svg1, circle2);
      append(svg1, line1);
      append(svg1, line2);
      append(svg1, line3);
      append(svg1, line4);
      append(svg1, line5);
      append(svg1, line6);
      append(svg1, line7);
      append(svg1, line8);
      append(button1, t3);
      append(button1, span1);
      append(span1, t4);
      append(div0, t5);
      append(div0, button2);
      append(button2, svg2);
      append(svg2, path1);
      append(svg2, polyline);
      append(svg2, line9);
      append(button2, t6);
      append(button2, span2);
      append(span2, t7);
      append(div0, t8);
      append(div0, button3);
      append(button3, svg3);
      append(svg3, path2);
      append(button3, t9);
      append(button3, span3);
      append(span3, t10);
      append(div1, t11);
      if (if_block0) if_block0.m(div1, null);
      insert(target, t12, anchor);
      insert(target, div2, anchor);
      if (if_block1) if_block1.m(div2, null);
      append(div2, t13);
      append(div2, canvas);
      ctx[67](canvas);
      append(div2, t14);
      for (let i = 0; i < each_blocks_1.length; i += 1) {
        if (each_blocks_1[i]) {
          each_blocks_1[i].m(div2, null);
        }
      }
      insert(target, t15, anchor);
      insert(target, div4, anchor);
      append(div4, div3);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div3, null);
        }
      }
      append(div4, t16);
      if (if_block2) if_block2.m(div4, null);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*toggleLanguage*/
            ctx[32]
          ),
          listen(
            button1,
            "click",
            /*toggleEnhancementPanel*/
            ctx[49]
          ),
          listen(
            button2,
            "click",
            /*downloadImage*/
            ctx[50]
          ),
          listen(
            button3,
            "click",
            /*openFullscreen*/
            ctx[51]
          ),
          listen(canvas, "contextmenu", prevent_default(
            /*contextmenu_handler*/
            ctx[57]
          ))
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$currentLanguage*/
      32768 && t1_value !== (t1_value = /*$currentLanguage*/
      ctx2[15].toUpperCase() + "")) set_data(t1, t1_value);
      if (dirty[0] & /*$t*/
      65536 && t4_value !== (t4_value = /*$t*/
      ctx2[16].imageEnhancement + "")) set_data(t4, t4_value);
      if (dirty[0] & /*$t*/
      65536 && button1_title_value !== (button1_title_value = /*$t*/
      ctx2[16].imageEnhancement)) {
        attr(button1, "title", button1_title_value);
      }
      if (dirty[0] & /*showEnhancementPanel*/
      1024) {
        toggle_class(
          button1,
          "active",
          /*showEnhancementPanel*/
          ctx2[10]
        );
      }
      if (dirty[0] & /*$t*/
      65536 && t7_value !== (t7_value = /*$t*/
      ctx2[16].download + "")) set_data(t7, t7_value);
      if (dirty[0] & /*$t*/
      65536 && button2_title_value !== (button2_title_value = /*$t*/
      ctx2[16].download)) {
        attr(button2, "title", button2_title_value);
      }
      if (dirty[0] & /*$t*/
      65536 && t10_value !== (t10_value = /*$t*/
      ctx2[16].fullscreen + "")) set_data(t10, t10_value);
      if (dirty[0] & /*$t*/
      65536 && button3_title_value !== (button3_title_value = /*$t*/
      ctx2[16].fullscreen)) {
        attr(button3, "title", button3_title_value);
      }
      if (
        /*showEnhancementPanel*/
        ctx2[10]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_21(ctx2);
          if_block0.c();
          if_block0.m(div1, null);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*$transitioning*/
        ctx2[17]
      ) {
        if (if_block1) ;
        else {
          if_block1 = create_if_block_20();
          if_block1.c();
          if_block1.m(div2, t13);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (dirty[0] & /*$transitioning*/
      131072) {
        toggle_class(
          canvas,
          "transitioning",
          /*$transitioning*/
          ctx2[17]
        );
      }
      if (dirty[0] & /*canvasRect, $visibleHotspots, $configData, $activeTab*/
      262352 | dirty[1] & /*handleHotspotClick*/
      512) {
        each_value_7 = ensure_array_like(
          /*$visibleHotspots*/
          ctx2[18]
        );
        each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx2, each_value_7, each0_lookup, div2, destroy_block, create_each_block_7, null, get_each_context_7);
      }
      if (dirty[0] & /*$activeTab, $tabs, $currentLanguage*/
      557072 | dirty[1] & /*handleTabClick, translateTitle*/
      2052) {
        each_value_6 = ensure_array_like(
          /*$tabs*/
          ctx2[19]
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx2, each_value_6, each1_lookup, div3, destroy_block, create_each_block_6, null, get_each_context_6);
      }
      if (
        /*$activeTab*/
        ctx2[4]
      ) {
        if (if_block2) {
          if_block2.p(get_if_ctx_2(ctx2), dirty);
        } else {
          if_block2 = create_if_block_3(get_if_ctx_2(ctx2));
          if_block2.c();
          if_block2.m(div4, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
        detach(t12);
        detach(div2);
        detach(t15);
        detach(div4);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      ctx[67](null);
      for (let i = 0; i < each_blocks_1.length; i += 1) {
        each_blocks_1[i].d();
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      if (if_block2) if_block2.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_1(ctx) {
  let div;
  let p;
  let t0;
  let t1;
  let t2;
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      p = element("p");
      t0 = text("Error: ");
      t1 = text(
        /*$error*/
        ctx[14]
      );
      t2 = space();
      button = element("button");
      button.textContent = "Retry";
      attr(p, "class", "svelte-bfelzx");
      attr(button, "class", "svelte-bfelzx");
      attr(div, "class", "error-screen svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, p);
      append(p, t0);
      append(p, t1);
      append(div, t2);
      append(div, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*loadConfig*/
          ctx[38]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$error*/
      16384) set_data(
        t1,
        /*$error*/
        ctx2[14]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block(ctx) {
  let div1;
  return {
    c() {
      div1 = element("div");
      div1.innerHTML = `<div class="spinner svelte-bfelzx"></div> <p class="svelte-bfelzx">Loading configurator...</p>`;
      attr(div1, "class", "loading-screen svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
    }
  };
}
function create_if_block_21(ctx) {
  let div4;
  let div3;
  let div0;
  let label0;
  let span0;
  let t0_value = (
    /*$t*/
    ctx[16].brightness + ""
  );
  let t0;
  let t1;
  let span1;
  let t2_value = Math.round(
    /*$imageEnhancements*/
    (ctx[12].brightness - 100) / 25 * 9
  ) + 1 + "";
  let t2;
  let t3;
  let input0;
  let t4;
  let div1;
  let label1;
  let span2;
  let t5_value = (
    /*$t*/
    ctx[16].contrast + ""
  );
  let t5;
  let t6;
  let span3;
  let t7_value = Math.round(
    /*$imageEnhancements*/
    (ctx[12].contrast - 100) / 25 * 9
  ) + 1 + "";
  let t7;
  let t8;
  let input1;
  let t9;
  let div2;
  let label2;
  let span4;
  let t10_value = (
    /*$t*/
    ctx[16].saturation + ""
  );
  let t10;
  let t11;
  let span5;
  let t12_value = Math.round(
    /*$imageEnhancements*/
    (ctx[12].saturation - 100) / 100 * 9
  ) + 1 + "";
  let t12;
  let t13;
  let input2;
  let mounted;
  let dispose;
  return {
    c() {
      div4 = element("div");
      div3 = element("div");
      div0 = element("div");
      label0 = element("label");
      span0 = element("span");
      t0 = text(t0_value);
      t1 = space();
      span1 = element("span");
      t2 = text(t2_value);
      t3 = space();
      input0 = element("input");
      t4 = space();
      div1 = element("div");
      label1 = element("label");
      span2 = element("span");
      t5 = text(t5_value);
      t6 = space();
      span3 = element("span");
      t7 = text(t7_value);
      t8 = space();
      input1 = element("input");
      t9 = space();
      div2 = element("div");
      label2 = element("label");
      span4 = element("span");
      t10 = text(t10_value);
      t11 = space();
      span5 = element("span");
      t12 = text(t12_value);
      t13 = space();
      input2 = element("input");
      attr(span0, "class", "svelte-bfelzx");
      attr(span1, "class", "value svelte-bfelzx");
      attr(label0, "class", "svelte-bfelzx");
      attr(input0, "type", "range");
      attr(input0, "min", "100");
      attr(input0, "max", "125");
      attr(input0, "step", "2.777777777");
      attr(input0, "class", "svelte-bfelzx");
      attr(div0, "class", "control-group svelte-bfelzx");
      attr(span2, "class", "svelte-bfelzx");
      attr(span3, "class", "value svelte-bfelzx");
      attr(label1, "class", "svelte-bfelzx");
      attr(input1, "type", "range");
      attr(input1, "min", "100");
      attr(input1, "max", "125");
      attr(input1, "step", "2.777777777");
      attr(input1, "class", "svelte-bfelzx");
      attr(div1, "class", "control-group svelte-bfelzx");
      attr(span4, "class", "svelte-bfelzx");
      attr(span5, "class", "value svelte-bfelzx");
      attr(label2, "class", "svelte-bfelzx");
      attr(input2, "type", "range");
      attr(input2, "min", "100");
      attr(input2, "max", "200");
      attr(input2, "step", "11.111111111");
      attr(input2, "class", "svelte-bfelzx");
      attr(div2, "class", "control-group svelte-bfelzx");
      attr(div3, "class", "enhancement-controls svelte-bfelzx");
      attr(div4, "class", "enhancement-panel svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div4, anchor);
      append(div4, div3);
      append(div3, div0);
      append(div0, label0);
      append(label0, span0);
      append(span0, t0);
      append(label0, t1);
      append(label0, span1);
      append(span1, t2);
      append(div0, t3);
      append(div0, input0);
      set_input_value(
        input0,
        /*$imageEnhancements*/
        ctx[12].brightness
      );
      append(div3, t4);
      append(div3, div1);
      append(div1, label1);
      append(label1, span2);
      append(span2, t5);
      append(label1, t6);
      append(label1, span3);
      append(span3, t7);
      append(div1, t8);
      append(div1, input1);
      set_input_value(
        input1,
        /*$imageEnhancements*/
        ctx[12].contrast
      );
      append(div3, t9);
      append(div3, div2);
      append(div2, label2);
      append(label2, span4);
      append(span4, t10);
      append(label2, t11);
      append(label2, span5);
      append(span5, t12);
      append(div2, t13);
      append(div2, input2);
      set_input_value(
        input2,
        /*$imageEnhancements*/
        ctx[12].saturation
      );
      if (!mounted) {
        dispose = [
          listen(
            input0,
            "change",
            /*input0_change_input_handler*/
            ctx[58]
          ),
          listen(
            input0,
            "input",
            /*input0_change_input_handler*/
            ctx[58]
          ),
          listen(
            input0,
            "mouseup",
            /*mouseup_handler*/
            ctx[59]
          ),
          listen(
            input0,
            "touchend",
            /*touchend_handler*/
            ctx[60],
            { passive: true }
          ),
          listen(
            input1,
            "change",
            /*input1_change_input_handler*/
            ctx[61]
          ),
          listen(
            input1,
            "input",
            /*input1_change_input_handler*/
            ctx[61]
          ),
          listen(
            input1,
            "mouseup",
            /*mouseup_handler_1*/
            ctx[62]
          ),
          listen(
            input1,
            "touchend",
            /*touchend_handler_1*/
            ctx[63],
            { passive: true }
          ),
          listen(
            input2,
            "change",
            /*input2_change_input_handler*/
            ctx[64]
          ),
          listen(
            input2,
            "input",
            /*input2_change_input_handler*/
            ctx[64]
          ),
          listen(
            input2,
            "mouseup",
            /*mouseup_handler_2*/
            ctx[65]
          ),
          listen(
            input2,
            "touchend",
            /*touchend_handler_2*/
            ctx[66],
            { passive: true }
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$t*/
      65536 && t0_value !== (t0_value = /*$t*/
      ctx2[16].brightness + "")) set_data(t0, t0_value);
      if (dirty[0] & /*$imageEnhancements*/
      4096 && t2_value !== (t2_value = Math.round(
        /*$imageEnhancements*/
        (ctx2[12].brightness - 100) / 25 * 9
      ) + 1 + "")) set_data(t2, t2_value);
      if (dirty[0] & /*$imageEnhancements*/
      4096) {
        set_input_value(
          input0,
          /*$imageEnhancements*/
          ctx2[12].brightness
        );
      }
      if (dirty[0] & /*$t*/
      65536 && t5_value !== (t5_value = /*$t*/
      ctx2[16].contrast + "")) set_data(t5, t5_value);
      if (dirty[0] & /*$imageEnhancements*/
      4096 && t7_value !== (t7_value = Math.round(
        /*$imageEnhancements*/
        (ctx2[12].contrast - 100) / 25 * 9
      ) + 1 + "")) set_data(t7, t7_value);
      if (dirty[0] & /*$imageEnhancements*/
      4096) {
        set_input_value(
          input1,
          /*$imageEnhancements*/
          ctx2[12].contrast
        );
      }
      if (dirty[0] & /*$t*/
      65536 && t10_value !== (t10_value = /*$t*/
      ctx2[16].saturation + "")) set_data(t10, t10_value);
      if (dirty[0] & /*$imageEnhancements*/
      4096 && t12_value !== (t12_value = Math.round(
        /*$imageEnhancements*/
        (ctx2[12].saturation - 100) / 100 * 9
      ) + 1 + "")) set_data(t12, t12_value);
      if (dirty[0] & /*$imageEnhancements*/
      4096) {
        set_input_value(
          input2,
          /*$imageEnhancements*/
          ctx2[12].saturation
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div4);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_20(ctx) {
  let div1;
  return {
    c() {
      div1 = element("div");
      div1.innerHTML = `<div class="spinner svelte-bfelzx"></div>`;
      attr(div1, "class", "transition-loader svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
    }
  };
}
function create_each_block_7(key_1, ctx) {
  let button;
  let svg;
  let circle0;
  let circle1;
  let t_1;
  let button_aria_label_value;
  let mounted;
  let dispose;
  function click_handler() {
    return (
      /*click_handler*/
      ctx[68](
        /*hotspot*/
        ctx[137]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      button = element("button");
      svg = svg_element("svg");
      circle0 = svg_element("circle");
      circle1 = svg_element("circle");
      t_1 = space();
      attr(circle0, "cx", "20");
      attr(circle0, "cy", "20");
      attr(circle0, "r", "18");
      attr(circle0, "fill", "currentColor");
      attr(circle0, "opacity", "0.9");
      attr(circle1, "cx", "20");
      attr(circle1, "cy", "20");
      attr(circle1, "r", "6");
      attr(circle1, "fill", "white");
      attr(svg, "width", "100%");
      attr(svg, "height", "100%");
      attr(svg, "viewBox", "0 0 40 40");
      attr(svg, "class", "svelte-bfelzx");
      attr(button, "class", "hotspot svelte-bfelzx");
      set_style(
        button,
        "left",
        /*xPos*/
        ctx[143] + "px"
      );
      set_style(
        button,
        "top",
        /*yPos*/
        ctx[144] + "px"
      );
      attr(button, "aria-label", button_aria_label_value = /*hotspot*/
      ctx[137].title);
      toggle_class(
        button,
        "active",
        /*$activeTab*/
        ctx[4] === /*hotspot*/
        ctx[137].layerName
      );
      this.first = button;
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, svg);
      append(svg, circle0);
      append(svg, circle1);
      append(button, t_1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*canvasRect, $visibleHotspots, $configData*/
      262336) {
        set_style(
          button,
          "left",
          /*xPos*/
          ctx[143] + "px"
        );
      }
      if (dirty[0] & /*canvasRect, $visibleHotspots, $configData*/
      262336) {
        set_style(
          button,
          "top",
          /*yPos*/
          ctx[144] + "px"
        );
      }
      if (dirty[0] & /*$visibleHotspots*/
      262144 && button_aria_label_value !== (button_aria_label_value = /*hotspot*/
      ctx[137].title)) {
        attr(button, "aria-label", button_aria_label_value);
      }
      if (dirty[0] & /*$activeTab, $visibleHotspots*/
      262160) {
        toggle_class(
          button,
          "active",
          /*$activeTab*/
          ctx[4] === /*hotspot*/
          ctx[137].layerName
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_each_block_6(key_1, ctx) {
  let button;
  let t0_value = (
    /*translateTitle*/
    ctx[33](
      /*tab*/
      ctx[134].title,
      /*$currentLanguage*/
      ctx[15]
    ) + ""
  );
  let t0;
  let t1;
  let mounted;
  let dispose;
  function click_handler_1() {
    return (
      /*click_handler_1*/
      ctx[69](
        /*tab*/
        ctx[134]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      button = element("button");
      t0 = text(t0_value);
      t1 = space();
      attr(button, "class", "tab svelte-bfelzx");
      toggle_class(
        button,
        "active",
        /*$activeTab*/
        ctx[4] === /*tab*/
        ctx[134].name
      );
      this.first = button;
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_1);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*$tabs, $currentLanguage*/
      557056 && t0_value !== (t0_value = /*translateTitle*/
      ctx[33](
        /*tab*/
        ctx[134].title,
        /*$currentLanguage*/
        ctx[15]
      ) + "")) set_data(t0, t0_value);
      if (dirty[0] & /*$activeTab, $tabs*/
      524304) {
        toggle_class(
          button,
          "active",
          /*$activeTab*/
          ctx[4] === /*tab*/
          ctx[134].name
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_3(ctx) {
  let if_block_anchor;
  let if_block = (
    /*activeLayer*/
    ctx[110] && create_if_block_4(ctx)
  );
  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (
        /*activeLayer*/
        ctx2[110]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_4(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(if_block_anchor);
      }
      if (if_block) if_block.d(detaching);
    }
  };
}
function create_if_block_4(ctx) {
  let div;
  function select_block_type_1(ctx2, dirty) {
    if (
      /*isProductLayer*/
      ctx2[112] && /*activeLayer*/
      ctx2[110].products
    ) return create_if_block_5;
    if (
      /*activeLayer*/
      ctx2[110].products
    ) return create_if_block_13;
    if (
      /*activeLayer*/
      ctx2[110].folder || /*activeLayer*/
      ctx2[110].variations
    ) return create_if_block_19;
  }
  function select_block_ctx(ctx2, type) {
    if (type === create_if_block_5) return get_if_ctx(ctx2);
    if (type === create_if_block_13) return get_if_ctx_1(ctx2);
    return ctx2;
  }
  let current_block_type = select_block_type_1(ctx);
  let if_block = current_block_type && current_block_type(select_block_ctx(ctx, current_block_type));
  return {
    c() {
      div = element("div");
      if (if_block) if_block.c();
      attr(div, "class", "carousel-wrapper svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block) if_block.m(div, null);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2)) && if_block) {
        if_block.p(select_block_ctx(ctx2, current_block_type), dirty);
      } else {
        if (if_block) if_block.d(1);
        if_block = current_block_type && current_block_type(select_block_ctx(ctx2, current_block_type));
        if (if_block) {
          if_block.c();
          if_block.m(div, null);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block) {
        if_block.d();
      }
    }
  };
}
function create_if_block_19(ctx) {
  let div1;
  let button0;
  let t1;
  let div0;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let t2;
  let button1;
  let mounted;
  let dispose;
  let each_value_5 = ensure_array_like(Array.isArray(
    /*activeLayer*/
    ctx[110].variations
  ) ? (
    /*activeLayer*/
    ctx[110].variations
  ) : Array(
    /*activeLayer*/
    ctx[110].variations || 12
  ));
  const get_key = (ctx2) => (
    /*i*/
    ctx2[123]
  );
  for (let i = 0; i < each_value_5.length; i += 1) {
    let child_ctx = get_each_context_5(ctx, each_value_5, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_5(key, child_ctx));
  }
  return {
    c() {
      div1 = element("div");
      button0 = element("button");
      button0.textContent = "‹";
      t1 = space();
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t2 = space();
      button1 = element("button");
      button1.textContent = "›";
      attr(button0, "class", "carousel-nav carousel-nav-left svelte-bfelzx");
      attr(button0, "aria-label", "Scroll left");
      attr(div0, "class", "carousel-items svelte-bfelzx");
      attr(button1, "class", "carousel-nav carousel-nav-right svelte-bfelzx");
      attr(button1, "aria-label", "Scroll right");
      attr(div1, "class", "carousel-container svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, button0);
      append(div1, t1);
      append(div1, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      ctx[92](div0);
      append(div1, t2);
      append(div1, button1);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler_16*/
            ctx[90]
          ),
          listen(
            div0,
            "scroll",
            /*scroll_handler*/
            ctx[93]
          ),
          listen(
            button1,
            "click",
            /*click_handler_18*/
            ctx[94]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$currentLayers, $activeTab, $configData*/
      2128 | dirty[1] & /*handleVariationSelect, getAssetUrl*/
      4128) {
        each_value_5 = ensure_array_like(Array.isArray(
          /*activeLayer*/
          ctx2[110].variations
        ) ? (
          /*activeLayer*/
          ctx2[110].variations
        ) : Array(
          /*activeLayer*/
          ctx2[110].variations || 12
        ));
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_5, each_1_lookup, div0, destroy_block, create_each_block_5, null, get_each_context_5);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      ctx[92](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_13(ctx) {
  let t0;
  let div1;
  let t1;
  let div0;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let t2;
  let mounted;
  let dispose;
  let if_block0 = (
    /*activeLayer*/
    ctx[110].colors && /*activeLayer*/
    ctx[110].colors.length > 0 && create_if_block_16(ctx)
  );
  let if_block1 = (
    /*showProductNavButtons*/
    ctx[9] && create_if_block_15(ctx)
  );
  let each_value_3 = ensure_array_like(
    /*activeLayer*/
    ctx[110].products
  );
  const get_key = (ctx2) => (
    /*product*/
    ctx2[115].id
  );
  for (let i = 0; i < each_value_3.length; i += 1) {
    let child_ctx = get_each_context_3(ctx, each_value_3, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_3(key, child_ctx));
  }
  let if_block2 = (
    /*showProductNavButtons*/
    ctx[9] && create_if_block_14(ctx)
  );
  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      div1 = element("div");
      if (if_block1) if_block1.c();
      t1 = space();
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t2 = space();
      if (if_block2) if_block2.c();
      attr(div0, "class", "carousel-items svelte-bfelzx");
      attr(div1, "class", "carousel-container svelte-bfelzx");
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      insert(target, div1, anchor);
      if (if_block1) if_block1.m(div1, null);
      append(div1, t1);
      append(div1, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      ctx[88](div0);
      append(div1, t2);
      if (if_block2) if_block2.m(div1, null);
      if (!mounted) {
        dispose = listen(
          div0,
          "scroll",
          /*updateNavButtons*/
          ctx[48]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (
        /*activeLayer*/
        ctx2[110].colors && /*activeLayer*/
        ctx2[110].colors.length > 0
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_16(ctx2);
          if_block0.c();
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*showProductNavButtons*/
        ctx2[9]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_15(ctx2);
          if_block1.c();
          if_block1.m(div1, t1);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (dirty[0] & /*$currentLayers, $activeTab, $configData, $activeMaterial*/
      2160 | dirty[1] & /*handleProductSelect, getAssetUrl*/
      8224) {
        each_value_3 = ensure_array_like(
          /*activeLayer*/
          ctx2[110].products
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_3, each_1_lookup, div0, destroy_block, create_each_block_3, null, get_each_context_3);
      }
      if (
        /*showProductNavButtons*/
        ctx2[9]
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_14(ctx2);
          if_block2.c();
          if_block2.m(div1, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(t0);
        detach(div1);
      }
      if (if_block0) if_block0.d(detaching);
      if (if_block1) if_block1.d();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      ctx[88](null);
      if (if_block2) if_block2.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_5(ctx) {
  let t0;
  let t1;
  let div1;
  let t2;
  let div0;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let t3;
  let mounted;
  let dispose;
  let if_block0 = (
    /*selectedProduct*/
    ctx[113] && /*selectedProduct*/
    ctx[113].materials && /*selectedProduct*/
    ctx[113].materials.length > 1 && create_if_block_12(ctx)
  );
  let if_block1 = (
    /*selectedMaterial*/
    ctx[114] && /*selectedMaterial*/
    ctx[114].colors && /*selectedMaterial*/
    ctx[114].colors.length > 0 && create_if_block_9(ctx)
  );
  let if_block2 = (
    /*showProductNavButtons*/
    ctx[9] && create_if_block_8(ctx)
  );
  let each_value = ensure_array_like(
    /*activeLayer*/
    ctx[110].products
  );
  const get_key = (ctx2) => (
    /*product*/
    ctx2[115].id
  );
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
  }
  let if_block3 = (
    /*showProductNavButtons*/
    ctx[9] && create_if_block_6(ctx)
  );
  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      if (if_block1) if_block1.c();
      t1 = space();
      div1 = element("div");
      if (if_block2) if_block2.c();
      t2 = space();
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t3 = space();
      if (if_block3) if_block3.c();
      attr(div0, "class", "carousel-items svelte-bfelzx");
      attr(div1, "class", "carousel-container svelte-bfelzx");
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      if (if_block2) if_block2.m(div1, null);
      append(div1, t2);
      append(div1, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      ctx[80](div0);
      append(div1, t3);
      if (if_block3) if_block3.m(div1, null);
      if (!mounted) {
        dispose = listen(
          div0,
          "scroll",
          /*updateNavButtons*/
          ctx[48]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (
        /*selectedProduct*/
        ctx2[113] && /*selectedProduct*/
        ctx2[113].materials && /*selectedProduct*/
        ctx2[113].materials.length > 1
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_12(ctx2);
          if_block0.c();
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*selectedMaterial*/
        ctx2[114] && /*selectedMaterial*/
        ctx2[114].colors && /*selectedMaterial*/
        ctx2[114].colors.length > 0
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_9(ctx2);
          if_block1.c();
          if_block1.m(t1.parentNode, t1);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (
        /*showProductNavButtons*/
        ctx2[9]
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_8(ctx2);
          if_block2.c();
          if_block2.m(div1, t2);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (dirty[0] & /*$currentLayers, $activeTab, $t, currentLayers, $configData*/
      2164816 | dirty[1] & /*renderShowroom, handleProductSelect, getAssetUrl*/
      8480) {
        each_value = ensure_array_like(
          /*activeLayer*/
          ctx2[110].products
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div0, destroy_block, create_each_block, null, get_each_context);
      }
      if (
        /*showProductNavButtons*/
        ctx2[9]
      ) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
        } else {
          if_block3 = create_if_block_6(ctx2);
          if_block3.c();
          if_block3.m(div1, null);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(t0);
        detach(t1);
        detach(div1);
      }
      if (if_block0) if_block0.d(detaching);
      if (if_block1) if_block1.d(detaching);
      if (if_block2) if_block2.d();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      ctx[80](null);
      if (if_block3) if_block3.d();
      mounted = false;
      dispose();
    }
  };
}
function create_each_block_5(key_1, ctx) {
  let button;
  let div;
  let img;
  let img_src_value;
  let img_alt_value;
  let t_1;
  let mounted;
  let dispose;
  function click_handler_17() {
    return (
      /*click_handler_17*/
      ctx[91](
        /*variationNum*/
        ctx[132]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      var _a;
      button = element("button");
      div = element("div");
      img = element("img");
      t_1 = space();
      if (!src_url_equal(img.src, img_src_value = Array.isArray(
        /*activeLayer*/
        ctx[110].variations
      ) ? (
        /*variation*/
        ctx[131]
      ) : (
        /*getAssetUrl*/
        ctx[36](`${/*activeLayer*/
        ctx[110].folder}/${/*variationNum*/
        ctx[132]}.webp`)
      ))) attr(img, "src", img_src_value);
      attr(img, "alt", img_alt_value = "Variation " + /*variationNum*/
      ctx[132]);
      attr(img, "loading", "lazy");
      attr(img, "class", "svelte-bfelzx");
      attr(div, "class", "item-preview svelte-bfelzx");
      attr(button, "class", "carousel-item svelte-bfelzx");
      toggle_class(
        button,
        "selected",
        /*activeState*/
        ((_a = ctx[111]) == null ? void 0 : _a.selected) === /*variationNum*/
        ctx[132]
      );
      this.first = button;
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, div);
      append(div, img);
      append(button, t_1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_17);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a;
      ctx = new_ctx;
      if (dirty[0] & /*$configData, $activeTab*/
      80 && !src_url_equal(img.src, img_src_value = Array.isArray(
        /*activeLayer*/
        ctx[110].variations
      ) ? (
        /*variation*/
        ctx[131]
      ) : (
        /*getAssetUrl*/
        ctx[36](`${/*activeLayer*/
        ctx[110].folder}/${/*variationNum*/
        ctx[132]}.webp`)
      ))) {
        attr(img, "src", img_src_value);
      }
      if (dirty[0] & /*$configData, $activeTab*/
      80 && img_alt_value !== (img_alt_value = "Variation " + /*variationNum*/
      ctx[132])) {
        attr(img, "alt", img_alt_value);
      }
      if (dirty[0] & /*$currentLayers, $activeTab, $configData*/
      2128) {
        toggle_class(
          button,
          "selected",
          /*activeState*/
          ((_a = ctx[111]) == null ? void 0 : _a.selected) === /*variationNum*/
          ctx[132]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_16(ctx) {
  let div3;
  let div2;
  let div1;
  let t0;
  let div0;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let isGroupTab = (
    /*isGroupTab*/
    ctx[127]
  );
  let t1;
  let mounted;
  let dispose;
  let if_block0 = (
    /*showColorNavButtons*/
    ctx[8] && create_if_block_18(ctx)
  );
  let each_value_4 = ensure_array_like(
    /*activeLayer*/
    ctx[110].colors
  );
  const get_key = (ctx2) => (
    /*i*/
    ctx2[123]
  );
  for (let i = 0; i < each_value_4.length; i += 1) {
    let child_ctx = get_each_context_4(ctx, each_value_4, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_4(key, child_ctx));
  }
  const assign_div0 = () => (
    /*div0_binding_2*/
    ctx[84](div0, isGroupTab)
  );
  const unassign_div0 = () => (
    /*div0_binding_2*/
    ctx[84](null, isGroupTab)
  );
  let if_block1 = (
    /*showColorNavButtons*/
    ctx[8] && create_if_block_17(ctx)
  );
  return {
    c() {
      div3 = element("div");
      div2 = element("div");
      div1 = element("div");
      if (if_block0) if_block0.c();
      t0 = space();
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t1 = space();
      if (if_block1) if_block1.c();
      attr(div0, "class", "color-carousel-items svelte-bfelzx");
      attr(div1, "class", "color-carousel-container svelte-bfelzx");
      attr(div2, "class", "color-group");
      attr(div3, "class", "color-selector-section svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div2);
      append(div2, div1);
      if (if_block0) if_block0.m(div1, null);
      append(div1, t0);
      append(div1, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      assign_div0();
      append(div1, t1);
      if (if_block1) if_block1.m(div1, null);
      if (!mounted) {
        dispose = listen(
          div0,
          "scroll",
          /*updateNavButtons*/
          ctx[48]
        );
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (
        /*showColorNavButtons*/
        ctx[8]
      ) {
        if (if_block0) {
          if_block0.p(ctx, dirty);
        } else {
          if_block0 = create_if_block_18(ctx);
          if_block0.c();
          if_block0.m(div1, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty[0] & /*$currentLayers, $activeTab, $configData, $activeMaterial, $currentLanguage*/
      34928 | dirty[1] & /*handleProductVariationSelect, translateTitle*/
      16388) {
        each_value_4 = ensure_array_like(
          /*activeLayer*/
          ctx[110].colors
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each_1_lookup, div0, destroy_block, create_each_block_4, null, get_each_context_4);
      }
      if (isGroupTab !== /*isGroupTab*/
      ctx[127]) {
        unassign_div0();
        isGroupTab = /*isGroupTab*/
        ctx[127];
        assign_div0();
      }
      if (
        /*showColorNavButtons*/
        ctx[8]
      ) {
        if (if_block1) {
          if_block1.p(ctx, dirty);
        } else {
          if_block1 = create_if_block_17(ctx);
          if_block1.c();
          if_block1.m(div1, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      if (if_block0) if_block0.d();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      unassign_div0();
      if (if_block1) if_block1.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_18(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "‹";
      attr(button, "class", "carousel-nav carousel-nav-left svelte-bfelzx");
      attr(button, "aria-label", "Scroll left");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_10*/
          ctx[82]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_each_block_4(key_1, ctx) {
  let button;
  let div;
  let t0;
  let span;
  let t1_value = (
    /*translateTitle*/
    ctx[33](
      /*color*/
      ctx[120].name,
      /*$currentLanguage*/
      ctx[15]
    ) + ""
  );
  let t1;
  let t2;
  let mounted;
  let dispose;
  function click_handler_11() {
    return (
      /*click_handler_11*/
      ctx[83](
        /*isGroupTab*/
        ctx[127],
        /*variationSlug*/
        ctx[121]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      button = element("button");
      div = element("div");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      attr(div, "class", "option-color svelte-bfelzx");
      set_style(
        div,
        "background-color",
        /*color*/
        ctx[120].hex
      );
      attr(span, "class", "svelte-bfelzx");
      attr(button, "class", "color-option svelte-bfelzx");
      toggle_class(
        button,
        "selected",
        /*activeState*/
        ctx[111].selectedVariation === /*variationSlug*/
        ctx[121]
      );
      this.first = button;
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, div);
      append(button, t0);
      append(button, span);
      append(span, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_11);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*$configData, $activeTab*/
      80) {
        set_style(
          div,
          "background-color",
          /*color*/
          ctx[120].hex
        );
      }
      if (dirty[0] & /*$configData, $activeTab, $currentLanguage*/
      32848 && t1_value !== (t1_value = /*translateTitle*/
      ctx[33](
        /*color*/
        ctx[120].name,
        /*$currentLanguage*/
        ctx[15]
      ) + "")) set_data(t1, t1_value);
      if (dirty[0] & /*$currentLayers, $activeTab, $configData*/
      2128) {
        toggle_class(
          button,
          "selected",
          /*activeState*/
          ctx[111].selectedVariation === /*variationSlug*/
          ctx[121]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_17(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "›";
      attr(button, "class", "carousel-nav carousel-nav-right svelte-bfelzx");
      attr(button, "aria-label", "Scroll right");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_12*/
          ctx[85]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_15(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "‹";
      attr(button, "class", "carousel-nav carousel-nav-left svelte-bfelzx");
      attr(button, "aria-label", "Scroll left");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_13*/
          ctx[86]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_each_block_3(key_1, ctx) {
  let button;
  let div;
  let img;
  let img_src_value;
  let img_alt_value;
  let t0;
  let span;
  let t1_value = (
    /*product*/
    ctx[115].title + ""
  );
  let t1;
  let t2;
  let mounted;
  let dispose;
  function click_handler_14() {
    return (
      /*click_handler_14*/
      ctx[87](
        /*isGroupTab*/
        ctx[127],
        /*product*/
        ctx[115]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      var _a;
      button = element("button");
      div = element("div");
      img = element("img");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      if (!src_url_equal(img.src, img_src_value = /*product*/
      ctx[115].poster || /*getAssetUrl*/
      ctx[36](`${/*product*/
      ctx[115].source}/poster.webp`))) attr(img, "src", img_src_value);
      attr(img, "alt", img_alt_value = /*product*/
      ctx[115].title);
      attr(img, "loading", "lazy");
      attr(img, "class", "svelte-bfelzx");
      attr(div, "class", "item-preview svelte-bfelzx");
      attr(span, "class", "svelte-bfelzx");
      attr(button, "class", "carousel-item svelte-bfelzx");
      toggle_class(
        button,
        "selected",
        /*activeState*/
        ((_a = ctx[111]) == null ? void 0 : _a.product) === /*product*/
        ctx[115].id
      );
      this.first = button;
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, div);
      append(div, img);
      append(button, t0);
      append(button, span);
      append(span, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_14);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a;
      ctx = new_ctx;
      if (dirty[0] & /*$configData, $activeTab*/
      80 && !src_url_equal(img.src, img_src_value = /*product*/
      ctx[115].poster || /*getAssetUrl*/
      ctx[36](`${/*product*/
      ctx[115].source}/poster.webp`))) {
        attr(img, "src", img_src_value);
      }
      if (dirty[0] & /*$configData, $activeTab*/
      80 && img_alt_value !== (img_alt_value = /*product*/
      ctx[115].title)) {
        attr(img, "alt", img_alt_value);
      }
      if (dirty[0] & /*$configData, $activeTab*/
      80 && t1_value !== (t1_value = /*product*/
      ctx[115].title + "")) set_data(t1, t1_value);
      if (dirty[0] & /*$currentLayers, $activeTab, $configData*/
      2128) {
        toggle_class(
          button,
          "selected",
          /*activeState*/
          ((_a = ctx[111]) == null ? void 0 : _a.product) === /*product*/
          ctx[115].id
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_14(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "›";
      attr(button, "class", "carousel-nav carousel-nav-right svelte-bfelzx");
      attr(button, "aria-label", "Scroll right");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_15*/
          ctx[89]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_12(ctx) {
  let div;
  let each_value_2 = ensure_array_like(
    /*selectedProduct*/
    ctx[113].materials
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_2.length; i += 1) {
    each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "material-type-selector svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$currentLayers, $activeTab, $configData, $currentLanguage*/
      34896 | dirty[1] & /*handleMaterialSelect, translateTitle*/
      1028) {
        each_value_2 = ensure_array_like(
          /*selectedProduct*/
          ctx2[113].materials
        );
        let i;
        for (i = 0; i < each_value_2.length; i += 1) {
          const child_ctx = get_each_context_2(ctx2, each_value_2, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_2.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block_2(ctx) {
  let button;
  let t0_value = (
    /*translateTitle*/
    ctx[33](
      /*material*/
      ctx[124].title,
      /*$currentLanguage*/
      ctx[15]
    ) + ""
  );
  let t0;
  let t1;
  let mounted;
  let dispose;
  function click_handler_2() {
    return (
      /*click_handler_2*/
      ctx[72](
        /*material*/
        ctx[124]
      )
    );
  }
  return {
    c() {
      var _a;
      button = element("button");
      t0 = text(t0_value);
      t1 = space();
      attr(button, "class", "material-type-button svelte-bfelzx");
      toggle_class(
        button,
        "active",
        /*activeState*/
        ((_a = ctx[111]) == null ? void 0 : _a.material) === /*material*/
        ctx[124].id
      );
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_2);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a;
      ctx = new_ctx;
      if (dirty[0] & /*$configData, $activeTab, $currentLayers, $currentLanguage*/
      34896 && t0_value !== (t0_value = /*translateTitle*/
      ctx[33](
        /*material*/
        ctx[124].title,
        /*$currentLanguage*/
        ctx[15]
      ) + "")) set_data(t0, t0_value);
      if (dirty[0] & /*$currentLayers, $activeTab, $configData*/
      2128) {
        toggle_class(
          button,
          "active",
          /*activeState*/
          ((_a = ctx[111]) == null ? void 0 : _a.material) === /*material*/
          ctx[124].id
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_9(ctx) {
  let div3;
  let div2;
  let div1;
  let t0;
  let div0;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let t1;
  let mounted;
  let dispose;
  let if_block0 = (
    /*showColorNavButtons*/
    ctx[8] && create_if_block_11(ctx)
  );
  let each_value_1 = ensure_array_like(
    /*selectedMaterial*/
    ctx[114].colors
  );
  const get_key = (ctx2) => (
    /*i*/
    ctx2[123]
  );
  for (let i = 0; i < each_value_1.length; i += 1) {
    let child_ctx = get_each_context_1(ctx, each_value_1, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
  }
  let if_block1 = (
    /*showColorNavButtons*/
    ctx[8] && create_if_block_10(ctx)
  );
  return {
    c() {
      div3 = element("div");
      div2 = element("div");
      div1 = element("div");
      if (if_block0) if_block0.c();
      t0 = space();
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t1 = space();
      if (if_block1) if_block1.c();
      attr(div0, "class", "color-carousel-items svelte-bfelzx");
      attr(div1, "class", "color-carousel-container svelte-bfelzx");
      attr(div2, "class", "color-group");
      attr(div3, "class", "color-selector-section svelte-bfelzx");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div2);
      append(div2, div1);
      if (if_block0) if_block0.m(div1, null);
      append(div1, t0);
      append(div1, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      ctx[75](div0);
      append(div1, t1);
      if (if_block1) if_block1.m(div1, null);
      if (!mounted) {
        dispose = listen(
          div0,
          "scroll",
          /*updateNavButtons*/
          ctx[48]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (
        /*showColorNavButtons*/
        ctx2[8]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_11(ctx2);
          if_block0.c();
          if_block0.m(div1, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty[0] & /*$currentLayers, $activeTab, $configData, $currentLanguage*/
      34896 | dirty[1] & /*handleProductVariationSelect, translateTitle*/
      16388) {
        each_value_1 = ensure_array_like(
          /*selectedMaterial*/
          ctx2[114].colors
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_1, each_1_lookup, div0, destroy_block, create_each_block_1, null, get_each_context_1);
      }
      if (
        /*showColorNavButtons*/
        ctx2[8]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_10(ctx2);
          if_block1.c();
          if_block1.m(div1, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      if (if_block0) if_block0.d();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      ctx[75](null);
      if (if_block1) if_block1.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_11(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "‹";
      attr(button, "class", "carousel-nav carousel-nav-left svelte-bfelzx");
      attr(button, "aria-label", "Scroll left");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_3*/
          ctx[73]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_each_block_1(key_1, ctx) {
  let button;
  let div;
  let t0;
  let span;
  let t1_value = (
    /*translateTitle*/
    ctx[33](
      /*color*/
      ctx[120].name,
      /*$currentLanguage*/
      ctx[15]
    ) + ""
  );
  let t1;
  let t2;
  let mounted;
  let dispose;
  function click_handler_4() {
    return (
      /*click_handler_4*/
      ctx[74](
        /*variationSlug*/
        ctx[121]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      button = element("button");
      div = element("div");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      attr(div, "class", "option-color svelte-bfelzx");
      set_style(
        div,
        "background-color",
        /*color*/
        ctx[120].hex
      );
      attr(span, "class", "svelte-bfelzx");
      attr(button, "class", "color-option svelte-bfelzx");
      toggle_class(
        button,
        "selected",
        /*activeState*/
        ctx[111].selectedVariation === /*variationSlug*/
        ctx[121]
      );
      this.first = button;
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, div);
      append(button, t0);
      append(button, span);
      append(span, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_4);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*$configData, $activeTab, $currentLayers*/
      2128) {
        set_style(
          div,
          "background-color",
          /*color*/
          ctx[120].hex
        );
      }
      if (dirty[0] & /*$configData, $activeTab, $currentLayers, $currentLanguage*/
      34896 && t1_value !== (t1_value = /*translateTitle*/
      ctx[33](
        /*color*/
        ctx[120].name,
        /*$currentLanguage*/
        ctx[15]
      ) + "")) set_data(t1, t1_value);
      if (dirty[0] & /*$currentLayers, $activeTab, $configData*/
      2128) {
        toggle_class(
          button,
          "selected",
          /*activeState*/
          ctx[111].selectedVariation === /*variationSlug*/
          ctx[121]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_10(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "›";
      attr(button, "class", "carousel-nav carousel-nav-right svelte-bfelzx");
      attr(button, "aria-label", "Scroll right");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_5*/
          ctx[76]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_8(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "‹";
      attr(button, "class", "carousel-nav carousel-nav-left svelte-bfelzx");
      attr(button, "aria-label", "Scroll left");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_6*/
          ctx[77]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_else_block(ctx) {
  let path;
  let line;
  return {
    c() {
      path = svg_element("path");
      line = svg_element("line");
      attr(path, "d", "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24");
      attr(line, "x1", "1");
      attr(line, "y1", "1");
      attr(line, "x2", "23");
      attr(line, "y2", "23");
    },
    m(target, anchor) {
      insert(target, path, anchor);
      insert(target, line, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(path);
        detach(line);
      }
    }
  };
}
function create_if_block_7(ctx) {
  let path;
  let circle;
  return {
    c() {
      path = svg_element("path");
      circle = svg_element("circle");
      attr(path, "d", "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z");
      attr(circle, "cx", "12");
      attr(circle, "cy", "12");
      attr(circle, "r", "3");
    },
    m(target, anchor) {
      insert(target, path, anchor);
      insert(target, circle, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(path);
        detach(circle);
      }
    }
  };
}
function create_each_block(key_1, ctx) {
  let div1;
  let button0;
  let div0;
  let img;
  let img_src_value;
  let img_alt_value;
  let t0;
  let span;
  let t1_value = (
    /*product*/
    ctx[115].title + ""
  );
  let t1;
  let t2;
  let button1;
  let svg;
  let button1_title_value;
  let t3;
  let mounted;
  let dispose;
  function click_handler_7() {
    return (
      /*click_handler_7*/
      ctx[78](
        /*product*/
        ctx[115]
      )
    );
  }
  function select_block_type_2(ctx2, dirty) {
    if (
      /*isVisible*/
      ctx2[117]
    ) return create_if_block_7;
    return create_else_block;
  }
  let current_block_type = select_block_type_2(ctx);
  let if_block = current_block_type(ctx);
  function click_handler_8(...args) {
    return (
      /*click_handler_8*/
      ctx[79](
        /*isVisible*/
        ctx[117],
        ...args
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      var _a, _b, _c;
      div1 = element("div");
      button0 = element("button");
      div0 = element("div");
      img = element("img");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      button1 = element("button");
      svg = svg_element("svg");
      if_block.c();
      t3 = space();
      if (!src_url_equal(img.src, img_src_value = /*firstMaterial*/
      ((_a = ctx[116]) == null ? void 0 : _a.poster) || /*getAssetUrl*/
      ctx[36](`${/*firstMaterial*/
      ((_b = ctx[116]) == null ? void 0 : _b.source) || "placeholder"}/poster.webp`))) attr(img, "src", img_src_value);
      attr(img, "alt", img_alt_value = /*product*/
      ctx[115].title);
      attr(img, "loading", "lazy");
      attr(img, "class", "svelte-bfelzx");
      attr(div0, "class", "item-preview svelte-bfelzx");
      attr(span, "class", "svelte-bfelzx");
      attr(button0, "class", "carousel-item svelte-bfelzx");
      toggle_class(
        button0,
        "selected",
        /*activeState*/
        ((_c = ctx[111]) == null ? void 0 : _c.product) === /*product*/
        ctx[115].id
      );
      toggle_class(button0, "hidden", !/*isVisible*/
      ctx[117]);
      attr(svg, "width", "16");
      attr(svg, "height", "16");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "none");
      attr(svg, "stroke", "currentColor");
      attr(svg, "stroke-width", "2");
      attr(svg, "class", "svelte-bfelzx");
      attr(button1, "class", "visibility-toggle svelte-bfelzx");
      attr(button1, "title", button1_title_value = /*isVisible*/
      ctx[117] ? (
        /*$t*/
        ctx[16].hideProduct
      ) : (
        /*$t*/
        ctx[16].showProduct
      ));
      toggle_class(
        button1,
        "visible",
        /*isVisible*/
        ctx[117]
      );
      attr(div1, "class", "carousel-item-wrapper svelte-bfelzx");
      this.first = div1;
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, button0);
      append(button0, div0);
      append(div0, img);
      append(button0, t0);
      append(button0, span);
      append(span, t1);
      append(div1, t2);
      append(div1, button1);
      append(button1, svg);
      if_block.m(svg, null);
      append(div1, t3);
      if (!mounted) {
        dispose = [
          listen(button0, "click", click_handler_7),
          listen(button1, "click", click_handler_8)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a, _b, _c;
      ctx = new_ctx;
      if (dirty[0] & /*$configData, $activeTab*/
      80 && !src_url_equal(img.src, img_src_value = /*firstMaterial*/
      ((_a = ctx[116]) == null ? void 0 : _a.poster) || /*getAssetUrl*/
      ctx[36](`${/*firstMaterial*/
      ((_b = ctx[116]) == null ? void 0 : _b.source) || "placeholder"}/poster.webp`))) {
        attr(img, "src", img_src_value);
      }
      if (dirty[0] & /*$configData, $activeTab*/
      80 && img_alt_value !== (img_alt_value = /*product*/
      ctx[115].title)) {
        attr(img, "alt", img_alt_value);
      }
      if (dirty[0] & /*$configData, $activeTab*/
      80 && t1_value !== (t1_value = /*product*/
      ctx[115].title + "")) set_data(t1, t1_value);
      if (dirty[0] & /*$currentLayers, $activeTab, $configData*/
      2128) {
        toggle_class(
          button0,
          "selected",
          /*activeState*/
          ((_c = ctx[111]) == null ? void 0 : _c.product) === /*product*/
          ctx[115].id
        );
      }
      if (dirty[0] & /*$currentLayers, $activeTab*/
      2064) {
        toggle_class(button0, "hidden", !/*isVisible*/
        ctx[117]);
      }
      if (current_block_type !== (current_block_type = select_block_type_2(ctx))) {
        if_block.d(1);
        if_block = current_block_type(ctx);
        if (if_block) {
          if_block.c();
          if_block.m(svg, null);
        }
      }
      if (dirty[0] & /*$currentLayers, $activeTab, $t*/
      67600 && button1_title_value !== (button1_title_value = /*isVisible*/
      ctx[117] ? (
        /*$t*/
        ctx[16].hideProduct
      ) : (
        /*$t*/
        ctx[16].showProduct
      ))) {
        attr(button1, "title", button1_title_value);
      }
      if (dirty[0] & /*$currentLayers, $activeTab*/
      2064) {
        toggle_class(
          button1,
          "visible",
          /*isVisible*/
          ctx[117]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_6(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "›";
      attr(button, "class", "carousel-nav carousel-nav-right svelte-bfelzx");
      attr(button, "aria-label", "Scroll right");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_9*/
          ctx[81]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_fragment(ctx) {
  let div;
  function select_block_type(ctx2, dirty) {
    if (
      /*$loading*/
      ctx2[13]
    ) return create_if_block;
    if (
      /*$error*/
      ctx2[14]
    ) return create_if_block_1;
    if (
      /*$configData*/
      ctx2[6]
    ) return create_if_block_2;
  }
  function select_block_ctx(ctx2, type) {
    if (type === create_if_block_2) return get_if_ctx_3(ctx2);
    return ctx2;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type && current_block_type(select_block_ctx(ctx, current_block_type));
  return {
    c() {
      div = element("div");
      if (if_block) if_block.c();
      attr(div, "class", "showroom-configurator svelte-bfelzx");
      set_style(
        div,
        "--theme-color",
        /*themecolor*/
        ctx[0]
      );
      set_style(
        div,
        "--theme-color-dark",
        /*adjustColor*/
        ctx[37](
          /*themecolor*/
          ctx[0],
          -20
        )
      );
      set_style(
        div,
        "--theme-color-light",
        /*adjustColor*/
        ctx[37](
          /*themecolor*/
          ctx[0],
          20
        )
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block) if_block.m(div, null);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(select_block_ctx(ctx2, current_block_type), dirty);
      } else {
        if (if_block) if_block.d(1);
        if_block = current_block_type && current_block_type(select_block_ctx(ctx2, current_block_type));
        if (if_block) {
          if_block.c();
          if_block.m(div, null);
        }
      }
      if (dirty[0] & /*themecolor*/
      1) {
        set_style(
          div,
          "--theme-color",
          /*themecolor*/
          ctx2[0]
        );
      }
      if (dirty[0] & /*themecolor*/
      1) {
        set_style(
          div,
          "--theme-color-dark",
          /*adjustColor*/
          ctx2[37](
            /*themecolor*/
            ctx2[0],
            -20
          )
        );
      }
      if (dirty[0] & /*themecolor*/
      1) {
        set_style(
          div,
          "--theme-color-light",
          /*adjustColor*/
          ctx2[37](
            /*themecolor*/
            ctx2[0],
            20
          )
        );
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block) {
        if_block.d();
      }
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let $activeTab;
  let $activeMaterial;
  let $configData;
  let $currentLayers;
  let $imageEnhancements;
  let $rendering;
  let $loadedImages;
  let $loading;
  let $error;
  let $currentLanguage;
  let $t;
  let $transitioning;
  let $visibleHotspots;
  let $tabs;
  let { config = "" } = $$props;
  let { assets = "" } = $$props;
  let { themecolor = "#AB92C8" } = $$props;
  let { logo = "" } = $$props;
  let { showlogo = "true" } = $$props;
  let { showpoweredby = "true" } = $$props;
  const configData = writable(null);
  component_subscribe($$self, configData, (value) => $$invalidate(6, $configData = value));
  const currentLayers = writable([]);
  component_subscribe($$self, currentLayers, (value) => $$invalidate(11, $currentLayers = value));
  const activeTab = writable(null);
  component_subscribe($$self, activeTab, (value) => $$invalidate(4, $activeTab = value));
  const activeMaterial = writable(null);
  component_subscribe($$self, activeMaterial, (value) => $$invalidate(5, $activeMaterial = value));
  const loading = writable(true);
  component_subscribe($$self, loading, (value) => $$invalidate(13, $loading = value));
  const error = writable(null);
  component_subscribe($$self, error, (value) => $$invalidate(14, $error = value));
  const loadedImages = writable(/* @__PURE__ */ new Map());
  component_subscribe($$self, loadedImages, (value) => $$invalidate(98, $loadedImages = value));
  const rendering = writable(false);
  component_subscribe($$self, rendering, (value) => $$invalidate(97, $rendering = value));
  const transitioning = writable(false);
  component_subscribe($$self, transitioning, (value) => $$invalidate(17, $transitioning = value));
  const imageEnhancements = writable({
    brightness: 105.56,
    // Default to position 3 on the 1-10 scale
    contrast: 105.56,
    // Default to position 3 on the 1-10 scale
    saturation: 155.56
    // Default to position 6 on the 1-10 scale
  });
  component_subscribe($$self, imageEnhancements, (value) => $$invalidate(12, $imageEnhancements = value));
  const currentLanguage = writable("de");
  component_subscribe($$self, currentLanguage, (value) => $$invalidate(15, $currentLanguage = value));
  const translations = {
    de: {
      download: "Herunterladen",
      fullscreen: "Vollbild",
      imageEnhancement: "Tune",
      brightness: "Helligkeit",
      contrast: "Kontrast",
      saturation: "Sättigung",
      reset: "Zurücksetzen",
      hideProduct: "Produkt ausblenden",
      showProduct: "Produkt einblenden",
      // Tab/Layer titles
      floor: "Boden",
      wall: "Wand",
      carpet: "Teppich",
      material: "Material",
      furniture: "Möbel",
      armchair: "Sessel",
      sofa: "Sofa",
      leather: "Leder",
      textile: "Textil",
      // Color names
      black: "Schwarz",
      white: "Weiß",
      brown: "Braun",
      beige: "Beige",
      gray: "Grau",
      grey: "Grau",
      blue: "Blau",
      red: "Rot",
      green: "Grün",
      yellow: "Gelb",
      orange: "Orange",
      pink: "Rosa",
      purple: "Lila",
      navy: "Marineblau",
      cream: "Creme",
      tan: "Hellbraun",
      cognac: "Cognac",
      charcoal: "Anthrazit",
      "dark brown": "Dunkelbraun",
      "light brown": "Hellbraun",
      "dark gray": "Dunkelgrau",
      "light gray": "Hellgrau",
      "dark grey": "Dunkelgrau",
      "light grey": "Hellgrau",
      // German color names (from config) - keep as is
      schwarz: "Schwarz",
      anthrazit: "Anthrazit",
      braun: "Braun",
      marineblau: "Marineblau",
      türkis: "Türkis",
      bordeaux: "Bordeaux",
      rost: "Rost",
      gold: "Gold",
      taupe: "Taupe",
      silber: "Silber",
      salbei: "Salbei",
      waldgrün: "Waldgrün",
      stoff: "Stoff",
      leder: "Leder"
    },
    en: {
      download: "Download",
      fullscreen: "Fullscreen",
      imageEnhancement: "Tune",
      brightness: "Brightness",
      contrast: "Contrast",
      saturation: "Saturation",
      reset: "Reset",
      hideProduct: "Hide product",
      showProduct: "Show product",
      // Tab/Layer titles
      floor: "Floor",
      wall: "Wall",
      carpet: "Carpet",
      material: "Material",
      furniture: "Furniture",
      armchair: "Armchair",
      sofa: "Sofa",
      leather: "Leather",
      textile: "Textile",
      // Color names
      black: "Black",
      white: "White",
      brown: "Brown",
      beige: "Beige",
      gray: "Gray",
      grey: "Grey",
      blue: "Blue",
      red: "Red",
      green: "Green",
      yellow: "Yellow",
      orange: "Orange",
      pink: "Pink",
      purple: "Purple",
      navy: "Navy",
      cream: "Cream",
      tan: "Tan",
      cognac: "Cognac",
      charcoal: "Charcoal",
      "dark brown": "Dark Brown",
      "light brown": "Light Brown",
      "dark gray": "Dark Gray",
      "light gray": "Light Gray",
      "dark grey": "Dark Grey",
      "light grey": "Light Grey",
      // German color names (from config) - translate to English
      schwarz: "Black",
      anthrazit: "Charcoal",
      braun: "Brown",
      marineblau: "Navy Blue",
      türkis: "Turquoise",
      bordeaux: "Bordeaux",
      rost: "Rust",
      gold: "Gold",
      taupe: "Taupe",
      silber: "Silver",
      salbei: "Sage",
      waldgrün: "Forest Green",
      stoff: "Fabric",
      leder: "Leather"
    }
  };
  const t = derived(currentLanguage, ($lang) => translations[$lang]);
  component_subscribe($$self, t, (value) => $$invalidate(16, $t = value));
  const toggleLanguage = () => {
    currentLanguage.update((lang) => lang === "de" ? "en" : "de");
  };
  const translateTitle = (title, lang) => {
    if (!title) return "";
    const key = title.toLowerCase();
    return translations[lang][key] || title;
  };
  let layerColorSelections = {};
  let layerMaterialSelections = {};
  let canvasElement;
  const visibleHotspots = derived([configData, currentLayers], ([$configData2, $currentLayers2]) => {
    if (!$configData2) return [];
    const groups = {};
    const standalone = [];
    Object.entries($configData2.layers || {}).forEach(([name, layer]) => {
      if (layer.hotspot && layer.hotspot.visible) {
        if (layer.group === "materials") {
          if (!groups[layer.group]) {
            groups[layer.group] = {
              id: layer.group,
              title: "Material",
              position: layer.hotspot.position,
              layers: []
            };
          }
          groups[layer.group].layers.push({ name, title: layer.title || name, layer });
        } else {
          standalone.push({
            ...layer.hotspot,
            layerName: name,
            layerTitle: layer.title || name,
            isGroup: false
          });
        }
      }
    });
    const groupHotspots = Object.values(groups).map((group) => ({
      id: group.id,
      title: group.title,
      position: group.position,
      layerName: group.id,
      layerTitle: group.title,
      isGroup: true,
      groupLayers: group.layers
    }));
    return [...standalone, ...groupHotspots];
  });
  component_subscribe($$self, visibleHotspots, (value) => $$invalidate(18, $visibleHotspots = value));
  const tabs = derived([configData], ([$configData2]) => {
    if (!$configData2) return [];
    const groupMap = {};
    const standaloneTabs = [];
    Object.entries($configData2.layers || {}).forEach(([name, layer]) => {
      if (layer.order !== void 0) {
        if (layer.group === "materials") {
          if (!groupMap[layer.group]) {
            groupMap[layer.group] = {
              name: layer.group,
              title: "Material",
              order: layer.order,
              isGroup: true
            };
          }
        } else if (layer.group === "product-layer") {
          standaloneTabs.push({
            name,
            title: layer.title || name,
            order: layer.order,
            isGroup: false,
            isProductLayer: true
          });
        } else {
          standaloneTabs.push({
            name,
            title: layer.title || name,
            order: layer.order,
            isGroup: false
          });
        }
      }
    });
    const allTabs = [...standaloneTabs, ...Object.values(groupMap)];
    return allTabs.sort((a, b) => a.order - b.order);
  });
  component_subscribe($$self, tabs, (value) => $$invalidate(19, $tabs = value));
  const getAssetUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    const base = assets.endsWith("/") ? assets : `${assets}/`;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${base}${cleanPath}`;
  };
  const adjustColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 255) + amt;
    const B = (num & 255) + amt;
    return "#" + (16777216 + (R < 255 ? R < 1 ? 0 : R : 255) * 65536 + (G < 255 ? G < 1 ? 0 : G : 255) * 256 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };
  const loadImage = (url) => {
    if ($loadedImages.has(url)) {
      return Promise.resolve($loadedImages.get(url));
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        loadedImages.update((map) => {
          map.set(url, img);
          return map;
        });
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  };
  const applyEnhancements = (ctx, width, height, enhancements) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const brightness = enhancements.brightness / 100;
    const contrast = enhancements.contrast / 100;
    const saturation = enhancements.saturation / 100;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      r *= brightness;
      g *= brightness;
      b *= brightness;
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturation;
      g = gray + (g - gray) * saturation;
      b = gray + (b - gray) * saturation;
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    ctx.putImageData(imageData, 0, 0);
  };
  const loadConfig = async () => {
    try {
      loading.set(true);
      error.set(null);
      const configUrl = config.startsWith("http") ? config : config;
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.mockup) {
        const layersObj = {};
        if (Array.isArray(data.mockup.layers)) {
          data.mockup.layers.forEach((layer) => {
            layersObj[layer.name] = layer;
          });
        }
        data.layers = layersObj;
        data.background = data.mockup.image;
        data.load = data.mockup.load;
      }
      configData.set(data);
      const initialState = {};
      const productConfigPromises = [];
      Object.entries(data.layers || {}).forEach(([name, layer]) => {
        var _a, _b, _c, _d, _e;
        if (layer.folder) {
          initialState[name] = { selected: 1 };
        } else if (layer.group === "product-layer") {
          const loadParts = ((_a = data.load) == null ? void 0 : _a.split(":")) || [];
          const defaultProduct = loadParts[0] || ((_b = layer.products[0]) == null ? void 0 : _b.id);
          const defaultMaterial = loadParts[1] || ((_d = (_c = layer.products[0]) == null ? void 0 : _c.materials[0]) == null ? void 0 : _d.id);
          initialState[name] = {
            product: defaultProduct,
            material: defaultMaterial,
            selectedVariation: "color-1"
          };
          layerMaterialSelections[name] = defaultMaterial;
        } else if (layer.products) {
          const defaultProduct = data.load || ((_e = layer.products[0]) == null ? void 0 : _e.id);
          initialState[name] = {
            product: defaultProduct,
            selectedVariation: "color-1"
          };
        }
      });
      currentLayers.set(initialState);
      const firstMaterialLayer = Object.entries(data.layers || {}).find(([_, layer]) => layer.group === "materials" || layer.group === "product-layer");
      if (firstMaterialLayer) {
        activeMaterial.set(firstMaterialLayer[0]);
      }
      if (data.background) {
        await loadImage(getAssetUrl(data.background));
      }
      await renderShowroom(true);
      loading.set(false);
    } catch (err) {
      console.error("Config loading error:", err);
      error.set(err.message);
      loading.set(false);
    }
  };
  const renderShowroom = async (prerender = false) => {
    var _a, _b;
    if (!canvasElement || !$configData || $rendering) return;
    if (!prerender) {
      transitioning.set(true);
    }
    rendering.set(true);
    try {
      const ctx = canvasElement.getContext("2d");
      const refWidth = ((_a = $configData.imageSize) == null ? void 0 : _a.width) || 1920;
      const refHeight = ((_b = $configData.imageSize) == null ? void 0 : _b.height) || 1080;
      $$invalidate(1, canvasElement.width = refWidth, canvasElement);
      $$invalidate(1, canvasElement.height = refHeight, canvasElement);
      ctx.clearRect(0, 0, refWidth, refHeight);
      if ($configData.background) {
        const bgUrl = getAssetUrl($configData.background);
        const bgImg = await loadImage(bgUrl);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(bgImg, 0, 0, refWidth, refHeight);
      }
      const layers = Object.entries($configData.layers || {}).map(([name, layer]) => ({ ...layer, name })).filter((layer) => {
        if (layer.visible === false) return false;
        if (layer.group === "materials") {
          return $activeMaterial ? layer.name === $activeMaterial : false;
        }
        return true;
      }).sort((a, b) => a.order - b.order);
      for (const layer of layers) {
        await renderLayer(ctx, layer, refWidth, refHeight);
      }
      if (showlogo === "true" && logo) {
        try {
          const logoImg = await loadImage(logo);
          const maxLogoWidth = refWidth * 0.15;
          const maxLogoHeight = refHeight * 0.08;
          const logoAspect = logoImg.width / logoImg.height;
          let logoWidth = maxLogoWidth;
          let logoHeight = logoWidth / logoAspect;
          if (logoHeight > maxLogoHeight) {
            logoHeight = maxLogoHeight;
            logoWidth = logoHeight * logoAspect;
          }
          const logoX = refWidth - logoWidth - refWidth * 0.02;
          const logoY = refHeight * 0.02;
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
        } catch (err) {
          console.warn("Failed to load logo:", err);
        }
      }
      if (showpoweredby === "true") {
        try {
          const poweredByImg = await loadImage(getAssetUrl("powered-by.png"));
          const maxPoweredByWidth = refWidth * 0.1;
          const maxPoweredByHeight = refHeight * 0.05;
          const poweredByAspect = poweredByImg.width / poweredByImg.height;
          let poweredByWidth = maxPoweredByWidth;
          let poweredByHeight = poweredByWidth / poweredByAspect;
          if (poweredByHeight > maxPoweredByHeight) {
            poweredByHeight = maxPoweredByHeight;
            poweredByWidth = poweredByHeight * poweredByAspect;
          }
          const padding = refWidth * 4e-3;
          const margin = refWidth * 0.012;
          const poweredByX = margin;
          const poweredByY = refHeight - poweredByHeight - margin;
          const bgX = poweredByX - padding;
          const bgY = poweredByY - padding;
          const bgWidth = poweredByWidth + padding * 2;
          const bgHeight = poweredByHeight + padding * 2;
          const borderRadius = refWidth * 6e-3;
          ctx.globalCompositeOperation = "source-over";
          ctx.beginPath();
          ctx.moveTo(bgX + borderRadius, bgY);
          ctx.lineTo(bgX + bgWidth - borderRadius, bgY);
          ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + borderRadius);
          ctx.lineTo(bgX + bgWidth, bgY + bgHeight - borderRadius);
          ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - borderRadius, bgY + bgHeight);
          ctx.lineTo(bgX + borderRadius, bgY + bgHeight);
          ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - borderRadius);
          ctx.lineTo(bgX, bgY + borderRadius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + borderRadius, bgY);
          ctx.closePath();
          const gradient = ctx.createLinearGradient(bgX, bgY, bgX, bgY + bgHeight);
          gradient.addColorStop(0, "rgba(0, 0, 0, 0.25)");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0.35)");
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = refWidth * 1e-3;
          ctx.stroke();
          ctx.drawImage(poweredByImg, poweredByX, poweredByY, poweredByWidth, poweredByHeight);
        } catch (err) {
          console.warn("Failed to load powered-by image:", err);
        }
      }
      applyEnhancements(ctx, refWidth, refHeight, $imageEnhancements);
    } catch (err) {
      console.error("Rendering error:", err);
    } finally {
      rendering.set(false);
      if (!prerender) {
        setTimeout(() => transitioning.set(false), 100);
      }
    }
  };
  const renderLayer = async (ctx, layer, canvasWidth, canvasHeight) => {
    var _a;
    const state = $currentLayers[layer.name];
    if (!state) return;
    if (state.visible === false) return;
    ctx.globalCompositeOperation = "source-over";
    if (layer.folder || layer.variations) {
      const selectedVariation = state.selected || 1;
      let shadowUrl, colorUrl;
      if (layer.variations && Array.isArray(layer.variations)) {
        shadowUrl = layer.shadow;
        colorUrl = layer.variations[selectedVariation - 1];
      } else {
        shadowUrl = getAssetUrl(`${layer.folder}/shadow.webp`);
        colorUrl = getAssetUrl(`${layer.folder}/${selectedVariation}.webp`);
      }
      try {
        const colorImg = await loadImage(colorUrl);
        if (shadowUrl) {
          const shadowImg = await loadImage(shadowUrl);
          ctx.globalCompositeOperation = "multiply";
          ctx.drawImage(shadowImg, 0, 0, canvasWidth, canvasHeight);
        }
        ctx.globalCompositeOperation = shadowUrl ? "lighten" : "source-over";
        ctx.drawImage(colorImg, 0, 0, canvasWidth, canvasHeight);
      } catch (err) {
        console.error(`Failed to render layer ${layer.name}:`, err);
      }
    } else if (layer.group === "product-layer" && layer.products && state.product && state.material) {
      const product = layer.products.find((p) => p.id === state.product);
      if (!product) return;
      const material = (_a = product.materials) == null ? void 0 : _a.find((m) => m.id === state.material);
      if (!material) return;
      const selectedSlug = state.selectedVariation || "color-1";
      let shadowUrl, colorUrl;
      if (material.variations && Array.isArray(material.variations)) {
        shadowUrl = material.shadow;
        const colorIndex = parseInt(selectedSlug.replace("color-", "")) - 1;
        colorUrl = material.variations[colorIndex] || material.variations[0];
      } else {
        shadowUrl = getAssetUrl(`${material.source}/variations/shadow.webp`);
        colorUrl = getAssetUrl(`${material.source}/variations/${selectedSlug}.webp`);
      }
      try {
        const colorImg = await loadImage(colorUrl);
        if (shadowUrl) {
          const shadowImg = await loadImage(shadowUrl);
          ctx.globalCompositeOperation = "multiply";
          ctx.drawImage(shadowImg, 0, 0, canvasWidth, canvasHeight);
        }
        ctx.globalCompositeOperation = shadowUrl ? "lighten" : "source-over";
        ctx.drawImage(colorImg, 0, 0, canvasWidth, canvasHeight);
      } catch (err) {
        console.error(`Failed to render product ${product.id} with material ${material.id}:`, err);
      }
    } else if (layer.products && state.product) {
      const product = layer.products.find((p) => p.id === state.product);
      if (!product) return;
      const selectedSlug = state.selectedVariation || "color-1";
      const shadowUrl = getAssetUrl(`${product.source}/variations/shadow.webp`);
      const colorUrl = getAssetUrl(`${product.source}/variations/${selectedSlug}.webp`);
      try {
        const [shadowImg, colorImg] = await Promise.all([loadImage(shadowUrl), loadImage(colorUrl)]);
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(shadowImg, 0, 0, canvasWidth, canvasHeight);
        ctx.globalCompositeOperation = "lighten";
        ctx.drawImage(colorImg, 0, 0, canvasWidth, canvasHeight);
      } catch (err) {
        console.error(`Failed to render product ${product.id}:`, err);
      }
    }
  };
  const handleHotspotClick = (hotspot) => {
    if (hotspot.isGroup) {
      activeTab.update((current) => {
        if (current === hotspot.layerName) {
          activeMaterial.set(null);
          return null;
        } else {
          activeMaterial.set(hotspot.groupLayers[0].name);
          return hotspot.layerName;
        }
      });
    } else {
      activeTab.update((current) => current === hotspot.layerName ? null : hotspot.layerName);
    }
  };
  const handleMaterialSelect = async (layerName, materialId) => {
    layerMaterialSelections[layerName] = materialId;
    currentLayers.update((layers) => {
      if (!layers[layerName]) {
        return layers;
      }
      const savedColor = layerColorSelections[layerName] || "color-1";
      return {
        ...layers,
        [layerName]: {
          ...layers[layerName],
          material: materialId,
          selectedVariation: savedColor
        }
      };
    });
    await renderShowroom();
  };
  const handleTabClick = (tab) => {
    if (tab.isGroup) {
      activeTab.update((current) => {
        if (current === tab.name) {
          activeMaterial.set(null);
          return null;
        } else {
          activeMaterial.set("leather");
          return tab.name;
        }
      });
    } else {
      activeTab.update((current) => current === tab.name ? null : tab.name);
    }
  };
  const handleVariationSelect = async (layerName, variationNumber) => {
    var _a;
    const currentSelected = (_a = $currentLayers[layerName]) == null ? void 0 : _a.selected;
    if (currentSelected === variationNumber) {
      return;
    }
    currentLayers.update((layers) => ({
      ...layers,
      [layerName]: {
        ...layers[layerName],
        selected: variationNumber
      }
    }));
    await renderShowroom();
  };
  const handleProductSelect = async (layerName, productId) => {
    var _a, _b, _c, _d, _e, _f;
    const currentProduct = (_a = $currentLayers[layerName]) == null ? void 0 : _a.product;
    if (currentProduct === productId) {
      return;
    }
    const layer = $configData.layers[layerName];
    const product = (_b = layer == null ? void 0 : layer.products) == null ? void 0 : _b.find((p) => p.id === productId);
    const savedMaterial = layerMaterialSelections[layerName] || ((_c = $currentLayers[layerName]) == null ? void 0 : _c.material);
    let materialToUse = (_e = (_d = product == null ? void 0 : product.materials) == null ? void 0 : _d[0]) == null ? void 0 : _e.id;
    if (savedMaterial && ((_f = product == null ? void 0 : product.materials) == null ? void 0 : _f.find((m) => m.id === savedMaterial))) {
      materialToUse = savedMaterial;
    }
    const savedColor = layerColorSelections[layerName] || "color-1";
    currentLayers.update((layers) => {
      var _a2;
      return {
        ...layers,
        [layerName]: {
          product: productId,
          material: materialToUse || ((_a2 = layers[layerName]) == null ? void 0 : _a2.material),
          selectedVariation: savedColor
        }
      };
    });
    await renderShowroom();
  };
  const handleProductVariationSelect = async (layerName, variationSlug) => {
    var _a;
    const currentVariation = (_a = $currentLayers[layerName]) == null ? void 0 : _a.selectedVariation;
    if (currentVariation === variationSlug) {
      return;
    }
    layerColorSelections[layerName] = variationSlug;
    currentLayers.update((layers) => ({
      ...layers,
      [layerName]: {
        ...layers[layerName],
        selectedVariation: variationSlug
      }
    }));
    await renderShowroom();
  };
  let canvasRect = { width: 0, height: 0, left: 0, top: 0 };
  const updateCanvasRect = () => {
    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      const container = canvasElement.parentElement;
      const containerRect = container.getBoundingClientRect();
      $$invalidate(7, canvasRect = {
        width: rect.width,
        height: rect.height,
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top
      });
    }
  };
  let carouselRefs = {};
  let colorCarouselRefs = {};
  let showColorNavButtons = false;
  let showProductNavButtons = false;
  const scrollCarousel = (direction) => {
    const carousel = carouselRefs[$activeTab];
    if (!carousel) return;
    const scrollAmount = carousel.clientWidth * 0.8;
    carousel.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };
  const scrollColorCarousel = (direction) => {
    const materialKey = $activeMaterial || $activeTab;
    const carousel = colorCarouselRefs[materialKey];
    if (!carousel) return;
    const scrollAmount = carousel.clientWidth * 0.8;
    carousel.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };
  const checkScrollable = (element2) => {
    if (!element2) return false;
    return element2.scrollWidth > element2.clientWidth;
  };
  const updateNavButtons = () => {
    const materialKey = $activeMaterial || $activeTab;
    $$invalidate(8, showColorNavButtons = checkScrollable(colorCarouselRefs[materialKey]));
    $$invalidate(9, showProductNavButtons = checkScrollable(carouselRefs[$activeTab]));
  };
  let showEnhancementPanel = false;
  const toggleEnhancementPanel = () => {
    $$invalidate(10, showEnhancementPanel = !showEnhancementPanel);
  };
  const downloadImage = () => {
    if (!canvasElement) return;
    canvasElement.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mockup.jpg";
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      0.95
    );
  };
  const openFullscreen = () => {
    if (!canvasElement) return;
    const imageUrl = canvasElement.toDataURL("image/jpeg", 0.95);
    const fullscreenDiv = document.createElement("div");
    fullscreenDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: zoom-out;
    `;
    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.cssText = `
      max-width: 95%;
      max-height: 95%;
      object-fit: contain;
    `;
    fullscreenDiv.appendChild(img);
    fullscreenDiv.addEventListener("click", () => {
      document.body.removeChild(fullscreenDiv);
    });
    document.body.appendChild(fullscreenDiv);
  };
  onMount(() => {
    loadConfig();
    window.addEventListener("resize", updateCanvasRect);
    return () => window.removeEventListener("resize", updateCanvasRect);
  });
  afterUpdate(() => {
    updateNavButtons();
    updateCanvasRect();
  });
  function contextmenu_handler(event) {
    bubble.call(this, $$self, event);
  }
  function input0_change_input_handler() {
    $imageEnhancements.brightness = to_number(this.value);
    imageEnhancements.set($imageEnhancements);
  }
  const mouseup_handler = () => renderShowroom();
  const touchend_handler = () => renderShowroom();
  function input1_change_input_handler() {
    $imageEnhancements.contrast = to_number(this.value);
    imageEnhancements.set($imageEnhancements);
  }
  const mouseup_handler_1 = () => renderShowroom();
  const touchend_handler_1 = () => renderShowroom();
  function input2_change_input_handler() {
    $imageEnhancements.saturation = to_number(this.value);
    imageEnhancements.set($imageEnhancements);
  }
  const mouseup_handler_2 = () => renderShowroom();
  const touchend_handler_2 = () => renderShowroom();
  function canvas_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      canvasElement = $$value;
      $$invalidate(1, canvasElement);
    });
  }
  const click_handler = (hotspot) => handleHotspotClick(hotspot);
  const click_handler_1 = (tab) => handleTabClick(tab);
  const func = (activeState, p) => p.id === (activeState == null ? void 0 : activeState.product);
  const func_1 = (activeState, m) => m.id === (activeState == null ? void 0 : activeState.material);
  const click_handler_2 = (material) => handleMaterialSelect($activeTab, material.id);
  const click_handler_3 = () => scrollColorCarousel("left");
  const click_handler_4 = (variationSlug) => handleProductVariationSelect($activeTab, variationSlug);
  function div0_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      colorCarouselRefs[$activeTab] = $$value;
      $$invalidate(3, colorCarouselRefs);
    });
  }
  const click_handler_5 = () => scrollColorCarousel("right");
  const click_handler_6 = () => scrollCarousel("left");
  const click_handler_7 = (product) => handleProductSelect($activeTab, product.id);
  const click_handler_8 = (isVisible, e) => {
    e.stopPropagation();
    currentLayers.update((state) => {
      if (!state[$activeTab]) state[$activeTab] = {};
      state[$activeTab].visible = !isVisible;
      return state;
    });
    renderShowroom();
  };
  function div0_binding_1($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      carouselRefs[$activeTab] = $$value;
      $$invalidate(2, carouselRefs);
    });
  }
  const click_handler_9 = () => scrollCarousel("right");
  const click_handler_10 = () => scrollColorCarousel("left");
  const click_handler_11 = (isGroupTab, variationSlug) => handleProductVariationSelect(isGroupTab ? $activeMaterial : $activeTab, variationSlug);
  function div0_binding_2($$value, isGroupTab) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      colorCarouselRefs[isGroupTab ? $activeMaterial : $activeTab] = $$value;
      $$invalidate(3, colorCarouselRefs);
    });
  }
  const click_handler_12 = () => scrollColorCarousel("right");
  const click_handler_13 = () => scrollCarousel("left");
  const click_handler_14 = (isGroupTab, product) => handleProductSelect(isGroupTab ? $activeMaterial : $activeTab, product.id);
  function div0_binding_3($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      carouselRefs[$activeTab] = $$value;
      $$invalidate(2, carouselRefs);
    });
  }
  const click_handler_15 = () => scrollCarousel("right");
  const click_handler_16 = () => scrollCarousel("left");
  const click_handler_17 = (variationNum) => handleVariationSelect($activeTab, variationNum);
  function div0_binding_4($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      carouselRefs[$activeTab] = $$value;
      $$invalidate(2, carouselRefs);
    });
  }
  const scroll_handler = (e) => {
    $$invalidate(2, carouselRefs);
  };
  const click_handler_18 = () => scrollCarousel("right");
  $$self.$$set = ($$props2) => {
    if ("config" in $$props2) $$invalidate(52, config = $$props2.config);
    if ("assets" in $$props2) $$invalidate(53, assets = $$props2.assets);
    if ("themecolor" in $$props2) $$invalidate(0, themecolor = $$props2.themecolor);
    if ("logo" in $$props2) $$invalidate(54, logo = $$props2.logo);
    if ("showlogo" in $$props2) $$invalidate(55, showlogo = $$props2.showlogo);
    if ("showpoweredby" in $$props2) $$invalidate(56, showpoweredby = $$props2.showpoweredby);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & /*canvasElement, $configData*/
    66) {
      if (canvasElement && $configData) {
        renderShowroom().then(() => {
          setTimeout(updateCanvasRect, 50);
        });
      }
    }
    if ($$self.$$.dirty[0] & /*$activeTab, $activeMaterial, colorCarouselRefs, carouselRefs*/
    60) {
      if ($activeTab || $activeMaterial || colorCarouselRefs || carouselRefs[$activeTab]) {
        setTimeout(updateNavButtons, 100);
      }
    }
  };
  return [
    themecolor,
    canvasElement,
    carouselRefs,
    colorCarouselRefs,
    $activeTab,
    $activeMaterial,
    $configData,
    canvasRect,
    showColorNavButtons,
    showProductNavButtons,
    showEnhancementPanel,
    $currentLayers,
    $imageEnhancements,
    $loading,
    $error,
    $currentLanguage,
    $t,
    $transitioning,
    $visibleHotspots,
    $tabs,
    configData,
    currentLayers,
    activeTab,
    activeMaterial,
    loading,
    error,
    loadedImages,
    rendering,
    transitioning,
    imageEnhancements,
    currentLanguage,
    t,
    toggleLanguage,
    translateTitle,
    visibleHotspots,
    tabs,
    getAssetUrl,
    adjustColor,
    loadConfig,
    renderShowroom,
    handleHotspotClick,
    handleMaterialSelect,
    handleTabClick,
    handleVariationSelect,
    handleProductSelect,
    handleProductVariationSelect,
    scrollCarousel,
    scrollColorCarousel,
    updateNavButtons,
    toggleEnhancementPanel,
    downloadImage,
    openFullscreen,
    config,
    assets,
    logo,
    showlogo,
    showpoweredby,
    contextmenu_handler,
    input0_change_input_handler,
    mouseup_handler,
    touchend_handler,
    input1_change_input_handler,
    mouseup_handler_1,
    touchend_handler_1,
    input2_change_input_handler,
    mouseup_handler_2,
    touchend_handler_2,
    canvas_binding,
    click_handler,
    click_handler_1,
    func,
    func_1,
    click_handler_2,
    click_handler_3,
    click_handler_4,
    div0_binding,
    click_handler_5,
    click_handler_6,
    click_handler_7,
    click_handler_8,
    div0_binding_1,
    click_handler_9,
    click_handler_10,
    click_handler_11,
    div0_binding_2,
    click_handler_12,
    click_handler_13,
    click_handler_14,
    div0_binding_3,
    click_handler_15,
    click_handler_16,
    click_handler_17,
    div0_binding_4,
    scroll_handler,
    click_handler_18
  ];
}
class ShowroomConfigurator extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance,
      create_fragment,
      safe_not_equal,
      {
        config: 52,
        assets: 53,
        themecolor: 0,
        logo: 54,
        showlogo: 55,
        showpoweredby: 56
      },
      add_css,
      [-1, -1, -1, -1, -1]
    );
  }
  get config() {
    return this.$$.ctx[52];
  }
  set config(config) {
    this.$$set({ config });
    flush();
  }
  get assets() {
    return this.$$.ctx[53];
  }
  set assets(assets) {
    this.$$set({ assets });
    flush();
  }
  get themecolor() {
    return this.$$.ctx[0];
  }
  set themecolor(themecolor) {
    this.$$set({ themecolor });
    flush();
  }
  get logo() {
    return this.$$.ctx[54];
  }
  set logo(logo) {
    this.$$set({ logo });
    flush();
  }
  get showlogo() {
    return this.$$.ctx[55];
  }
  set showlogo(showlogo) {
    this.$$set({ showlogo });
    flush();
  }
  get showpoweredby() {
    return this.$$.ctx[56];
  }
  set showpoweredby(showpoweredby) {
    this.$$set({ showpoweredby });
    flush();
  }
}
customElements.define("showroom-configurator", create_custom_element(ShowroomConfigurator, { "config": {}, "assets": {}, "themecolor": {}, "logo": {}, "showlogo": {}, "showpoweredby": {} }, [], [], true));
export {
  ShowroomConfigurator as default
};
