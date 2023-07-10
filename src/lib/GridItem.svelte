<script>
    import { onMount } from "svelte";

    export let props, gridSize, mouse, mousePos, grabPos, mousedownHandler, hideEmpty;

    $: cursor = mouse.cursor;
    $: mouseGrabbing = mouse.grabbing;
    $: grabbed = props.grabbed;
    $: preview = props.preview;
    $: swapping = props.swapping;
    $: stretching = props.stretching;
    $: isStretched = (props.colEnd - props.colStart > 1) || (props.rowEnd - props.rowStart > 1);
    let zIndex = props.idx + 1;
    $: {
        if (grabbed) zIndex = gridSize + 2;
        else if (moving || stretching) zIndex = gridSize + 1;
        else if (props.hidden) zIndex = -1;
        else zIndex = props.idx + 1;
    }

    export let mouseGrabbing, grabbed, preview, swapping;
    let gridArea = `${props.rowStart}/${props.colStart}/${props.rowEnd}/${props.colEnd}`;

    let card;
    let wasGrabbed = false;
    let wasPreviewed = false;
    let tx = 0;
    let ty = 0;
    let moving = false;
    let width = null;
    let height = null;
    let left = null;
    let top = null;
    let right = null;
    let bottom = null;

    let animation = null;
    let clone = null;

    const createTransformAnimationProps = (from, to, fill) => {
        let keyframes = [], duration = 100;

        from = {
            x: from?.x ?? 0,
            y: from?.y ?? 0
        };
        to = {
            x: to?.x ?? 0,
            y: to?.y ?? 0
        };

        keyframes = [
            { transform: `translate(${from.x}px, ${from.y}px)` },
            { transform: `translate(${to.x}px, ${to.y}px)` }
        ];

        duration = Math.round(Math.sqrt(Math.pow((to.x - from.x), 2) + Math.pow((to.y - from.y), 2)) * 0.5);
        const timing = { duration, iterations: 1, easing: 'linear', fill }

        return { keyframes, timing };
    }

    const createSizeAnimationProps = (from, to, fill) => {
        let keyframes = [], duration = 100;

        from = {
            width: from?.width ?? null,
            height: from?.height ?? null
        };
        to = {
            width: to?.width ?? null,
            height: to?.height ?? null
        };

        keyframes = [
            { width: from.width + 'px', height: from.height + 'px' },
            { width: to.width + 'px', height: to.height + 'px' }
        ];

        duration = Math.round(
            Math.sqrt(
                Math.pow(((to?.width ?? 0) - (from?.width ?? 0)), 2)
                + Math.pow(((to?.height ?? 0) - (from?.height ?? 0)), 2)
            ) * 0.666);

        const timing = { duration, iterations: 1, easing: 'linear', fill };

        return { keyframes, timing };
    }

    const createAnimationProps = (type, from = null, to, fill = 'none') => {
        if (type === 'transform') return createTransformAnimationProps(from, to, fill);
        else if (type === 'size') return createSizeAnimationProps(from, to, fill);
        return false;
    }

    const cancelAnimation = (fixCard = true) => {
        tx = ty = 0;
        if (fixCard) {
            const rect = card.getBoundingClientRect();
            left = rect.left;
            top = rect.top;
        }
        animation?.cancel();
        animation = null;
    }

    const swap = () => {
        gridArea = `${props.rowStart}/${props.colStart}/${props.rowEnd}/${props.colEnd}`;
        if (wasGrabbed || animation?.playState !== 'finished') {
            cancelAnimation();

            const to = {
                x: props.x - left,
                y: props.y - top
            };
            const { keyframes, timing } = createAnimationProps('transform', null, to);

            moving = true;
            animation = card.animate(keyframes, timing);
            animation.onfinish = () => {
                left = props.x;
                top = props.y;
                moving = false;
                props.swapping = false;
                wasPreviewed = false;
            }
        }
        else if (animation?.playState === 'finished') {
            cancelAnimation(false);
            left = props.x;
            top = props.y;
            moving = false;
            props.swapping = false;
            wasPreviewed = false;
        }
    }

    const cloneItem = () => {
        clone = card.cloneNode();
        clone.style.visibility = 'hidden';
        card.parentElement.append(clone);
    }

    const moveGrabbed = () => {
        if (!wasGrabbed) {
            cloneItem();

            wasGrabbed = true;
            const rect = card.getBoundingClientRect();
            left = rect.left;
            top = rect.top;
        }

        const next = {
            tx: mousePos.x - grabPos.x,
            ty: mousePos.y - grabPos.y
        };
        ({ tx, ty } = next);
    };

    const previewCard = () => {
        if (moving) return;

        left = props.x;
        top = props.y;

        const to = {
            x: props.previewX - props.x,
            y: props.previewY - props.y
        };
        const { keyframes, timing } = createAnimationProps('transform', null, to, 'forwards');

        moving = true;
        animation = card.animate(keyframes, timing);
        animation.onfinish = () => {
            moving = false;
            wasPreviewed = !wasPreviewed;
        }
    }

    const returnGrabbed = () => {
        if (moving) return;

        wasGrabbed = false;
        clone.remove();

        const matrix = new DOMMatrix(getComputedStyle(card).transform);
        const from = {
            x: matrix.e,
            y: matrix.f
        };
        const { keyframes, timing } = createAnimationProps('transform', from, null);

        moving = true;
        tx = ty = 0;
        animation = card.animate(keyframes, timing);
        animation.onfinish = () => {
            moving = false;
            left = props.x;
            top = props.y;
        }
    };

    const returnPreviewed = () => {
        if (moving) return;
        if (animation) {
            moving = true;
            animation.reverse();
            animation = null;
        }
    };

    const returnCard = () => {
        if (card != null) {
            if (wasGrabbed) return returnGrabbed();
            if (wasPreviewed) return returnPreviewed();
        }
    }

    $: {
        if (grabbed) {
            if (grabPos.x != null && grabPos.y != null && mousePos.x != null && mousePos.y != null) {
                moveGrabbed();
            }
        }
        else if (!swapping && wasGrabbed) {
            returnCard();
        }
    }

    $: {
        if (animation == null || animation.playState === 'finished') {
            if (preview && !wasPreviewed) {
                if (props.previewX != null && props.previewY != null) {
                    previewCard();
                }
            }
            else if (!swapping && !preview && wasPreviewed) {
                returnCard();
            }
        }
    }

    $: swapping && swap();

    const mousemoveHandler = (evt) => {
        evt.preventDefault();
        if (!mouseGrabbing) {
            const { currentTarget } = evt;
            const rect = currentTarget.getBoundingClientRect();
            const x = evt.clientX - rect.left;
            const y = evt.clientY - rect.top;

            if (x <= mouse.dragOffset || (rect.width - x) <= mouse.dragOffset) {
                mouse = {
                    ...mouse,
                    cursor: 'col-resize'
                };
            }
            else if (y <= mouse.dragOffset || (rect.height - y) <= mouse.dragOffset) {
                mouse = {
                    ...mouse,
                    cursor: 'row-resize'
                };
            }
            else {
                mouse = {
                    ...mouse,
                    cursor: isStretched ? null : 'grab'
                };
            }
        }
    }

    const mouseleaveHandler = (evt) => {
        evt.preventDefault();
        if (!mouseGrabbing) {
            mouse = {
                ...mouse,
                cursor: null
            };
        }
    }

    export const resize = () => {
        if (animation && !(animation.playState === 'finished')) return;

        const rect = card.getBoundingClientRect();
        props = {
            ...props,
            width: rect.width,
            height: rect.height,
            x: wasPreviewed ? props.x : rect.left,
            y: wasPreviewed ? props.y : rect.top
        };
        ([ left, top, right, bottom, width, height ] = [ props.x, props.y, window.innerWidth - rect.right, window.innerHeight - rect.bottom, rect.width, rect.height ]);
    }

    onMount(() => resize());

    const checkRemovedNodes = (entries) => {
        for (const entry of entries) {
            if (entry?.removedNodes.length > 0 && card.innerHTML === '') {
                props.content = false;
            }
        }
    }

    const contentObserver = (node) => {
        const obs = new MutationObserver((entries) => checkRemovedNodes(entries));
        obs.observe(node, { childList: true });

        return {
            destroy() {
                obs.disconnect();
            }
        }
    }

    const resizeObserver = (node) => {
        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === card) {
                    const rect = entry?.contentRect ?? null;
                    if (rect && rect.width >= 0 && rect.height >= 0) {
                        resize();
                        return;
                    }
                }
            }
        });

        obs.observe(node);

        return {
            destroy() {
                obs.unobserve(node);
            }
        }
    }

    const handleMousedown = (evt) => {
        mousedownHandler(evt, props.idx, isStretched);
    }

    $: hidden = props.hidden || (hideEmpty && !props.content);
    export let hidden;

    const stretchOrShrink = () => {
        if (card && stretching) {
            let newGridArea = `${props.rowStart}/${props.colStart}/${props.rowEnd}/${props.colEnd}`;
            cloneItem();
            clone.style.gridArea = newGridArea;
            let newRect = clone.getBoundingClientRect();
            let currentRect = card.getBoundingClientRect();

            let newRight = null,
                newLeft = null,
                newTop = null,
                newBottom = null;

            if (newRect.left < currentRect.left || newRect.left > currentRect.left) {
                newLeft = null;
                newRight = window.innerWidth - newRect.right;
            } else if (newRect.right > currentRect.right || newRect.right < currentRect.right) {
                newLeft = newRect.left;
                newRight = null;
            }
            else if (currentRect.left === newRect.left) {
                newLeft = currentRect.left;
                newRight = null;
            }

            if (newRect.top < currentRect.top || newRect.top > currentRect.top) {
                newTop = null;
                newBottom = window.innerHeight - newRect.bottom;
            } else if (newRect.bottom > currentRect.bottom || newRect.bottom < currentRect.bottom) {
                newTop = newRect.top;
                newBottom = null;
            }
            else if (currentRect.top === newRect.top) {
                newTop = currentRect.top;
                newBottom = null;
            }

            const { keyframes, timing } = createAnimationProps('size',
                {
                    width: currentRect.width,
                    height: currentRect.height
                },
                {
                    width: newRect.width,
                    height: newRect.height
                });

            // console.log({ newLeft, newTop, newRight, newBottom });

            ([ left, top, right, bottom ] = [ newLeft, newTop, newRight, newBottom ]);
            card.style.position = 'fixed';
            animation = card.animate(keyframes, timing);
            animation.onfinish = () => {
                animation = null;
                card.style.position = null;
                gridArea = newGridArea;
                props = {
                    ...props,
                    stretching: false
                };
                clone.remove();
            }
        }
    }

    $: (props.colStart || props.colEnd || props.rowStart || props.rowEnd) && stretchOrShrink();
</script>

<div bind:this={card}
     class="_kyoshee-svelte-grid_item _kyoshee-svelte-grid_item_empty"
     class:_kyoshee-svelte-grid_item_grabbed={grabbed}
     class:_kyoshee-svelte-grid_item_moving={moving}
     class:_kyoshee-svelte-grid_item_swapping={swapping}
     class:_kyoshee-svelte-grid_item_stretching={stretching}
     class:_kyoshee-svelte-grid_item_hidden={hidden}
     style:grid-area={gridArea}
     style:z-index={zIndex}
     style:--width={width ? (width + 'px') : width}
     style:--height={height ? (height + 'px') : height}
     style:--left={left ? (left + 'px') : left}
     style:--top={top ? (top + 'px') : top}
     style:--right={right ? (right + 'px') : right}
     style:--bottom={bottom ? (bottom + 'px') : bottom}
     style:--tx={tx + 'px'}
     style:--ty={ty + 'px'}
     on:mousedown={handleMousedown}
     on:mousemove={mousemoveHandler}
     on:mouseleave={mouseleaveHandler}
     use:contentObserver
     use:resizeObserver
     role="gridcell"
     tabindex={hidden ? '-1' : `${props.colStart + props.rowStart}`}>
    {props.idx}
</div>

<style lang="scss">
    ._kyoshee-svelte-grid_ {
        &item {
            box-sizing: border-box;

            width: 100%;
            height: 100%;

            background-color: var(--c-bg_card_empty);
            color: white;
            border: 1px solid transparent;

            cursor: inherit;

            grid-area: 1/1/2/2;

            user-select: none;

            transform: translate(0, 0);

            backdrop-filter: blur(0.75rem);
            --default-transitions: border-color 200ms ease-in;
            transition: var(--default-transitions);

            &:not(&_moving, &_swapping, &_stretching):hover {
                transition-duration: 100ms;
                transition-timing-function: ease-out;
                border-color: var(--c-accent);
            }

            &_moving {
                border-color: var(--c-accent);
                transition-timing-function: ease-out;
                pointer-events: none;
                z-index: 4;
            }

            &_grabbed {
                transform: translate(var(--tx, 0px), var(--ty, 0px));
                transition: var(--default-transitions), transform 50ms linear;
            }

            &_grabbed, &_swapping, &_stretching {
                position: fixed;
                width: var(--width);
                height: var(--height);
                left: var(--left, unset);
                top: var(--top, unset);
                right: var(--right, unset);
                bottom: var(--bottom, unset);
            }

            &_hidden {
                animation: toOpacity;
                opacity: 0;
            }
        }
    }
</style>
