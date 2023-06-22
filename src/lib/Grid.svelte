<script>
    import Card from "./Card.svelte";
    import { onMount } from "svelte";

    let gridSize = 16;
    let rowSize = 4;
    let matrix = new Array(gridSize).fill(null);

    let cards = matrix.map((_, idx) => {
        let row = 0;
        while ((row * rowSize) + rowSize <= idx) row++;
        let col = idx % 4;

        return {
            rowStart: row + 1,
            rowEnd: row + 2,
            colStart: col + 1,
            colEnd: col + 2,
            idx
        };
    });

    let grid;

    const MoveType = Object.freeze({
        'MOVE': Symbol('move'),
        'STRETCH': Symbol('move')
    });

    let isCaptured = false;
    let grabbedObject = null;

    let grabbedCardEl = null;

    let hoveredIdx = null;
    let grabbedIdx = null;

    $: grabbedObject = cards[grabbedIdx] ?? null;
    $: grabbedCardEl = grid?.children?.item(grabbedIdx) ?? null;

    $: hoveredObject = cards[hoveredIdx] ?? null;
    $: hoveredCardEl = grid?.children?.item(hoveredIdx) ?? null;

    const assignHoverOver = (idx) => hoveredIdx = idx;

    const handleMouseDown = (idx) => {
        isCaptured = true;
        cards[idx].grabbed = true;
        grabbedIdx = idx;
    }

    const animateCard = (el, keyframes, timing, newObj) => {
        newObj.moving = true;
        cards[newObj.idx] = newObj;

        const animation = el.animate(keyframes, timing);
        el.animation = animation;
        animation.onfinish = () => {
            animation.oncancel = null;
            animation.onfinish = null;
            animation.commitStyles();
            el.style = `grid-area: ${el.style.gridArea}`;

            cards[newObj.idx].moving = false;
            if (grabbedIdx !== newObj.idx) {
                cards[newObj.idx].grabbed = false;
            }
        }
    }

    const handleMouseMove = () => {
        if (isCaptured) {
            if (hoveredIdx !== grabbedIdx
                && hoveredObject
                && !hoveredObject.moving) {

                const newHovObj = Object.assign({}, cards[grabbedIdx]);
                const newGrbObj = Object.assign({}, cards[hoveredIdx]);

                newHovObj.idx = hoveredObject.idx;
                newHovObj.grabbed = false;

                newGrbObj.idx = grabbedObject.idx;
                newGrbObj.grabbed = true;

                const hoveredCardRect = hoveredCardEl.getBoundingClientRect();
                const grabbedCardRect = grabbedCardEl.getBoundingClientRect();

                const hoveredCardTransformX = newHovObj.x - hoveredCardRect.left;
                const hoveredCardTransformY = newHovObj.y - hoveredCardRect.top
                const movableCardTransformX = newGrbObj.x - grabbedCardRect.left;
                const movableCardTransformY = newGrbObj.y - grabbedCardRect.top;

                if (grabbedCardEl.animation && grabbedCardEl.animation.playState !== 'finished') grabbedCardEl.animation.cancel();

                hoveredCardEl.style = `
                    position: fixed;
                    width: ${hoveredCardRect.width}px;
                    height: ${hoveredCardRect.height}px;
                    top: ${hoveredCardRect.top}px;
                    left: ${hoveredCardRect.left}px;
                `;
                grabbedCardEl.style = `
                    position: fixed;
                    width: ${grabbedCardRect.width}px;
                    height: ${grabbedCardRect.height}px;
                    top: ${grabbedCardRect.top}px;
                    left: ${grabbedCardRect.left}px;
                `;

                const hoveredCardKeyframes = [
                    { transform: `translate(0, 0)` },
                    { transform: `translate(${hoveredCardTransformX}px, ${hoveredCardTransformY}px)` },
                ];

                const grabbedCardKeyframes = [
                    { transform: `translate(0, 0)` },
                    { transform: `translate(${movableCardTransformX}px, ${movableCardTransformY}px)` },
                ];

                const keyframesTiming = {
                    duration: 200,
                    iterations: 1
                };

                hoveredIdx = null;

                animateCard(grabbedCardEl, grabbedCardKeyframes, keyframesTiming, newGrbObj);
                animateCard(hoveredCardEl, hoveredCardKeyframes, keyframesTiming, newHovObj);
            }
        }
    }

    const handleMouseUp = () => {
        isCaptured = false;
        if (grabbedIdx) cards[grabbedIdx].grabbed = false;
        grabbedIdx = null;
        hoveredIdx = null;
    }

    const recalcCardsDimensions = () => {
        cards = cards.map((card, idx) => {
            const rect = grid.children.item(idx).getBoundingClientRect();

            return {
                ...card,
                x: rect.left,
                y: rect.top
            }
        });
    }

    onMount(() => {
        recalcCardsDimensions();
    });
</script>

<svelte:window on:resize={recalcCardsDimensions} on:mouseup={handleMouseUp} />

<div class="_3xpl-screensaver_grid"
     bind:this={grid}
     on:mousemove={handleMouseMove}>
    {#each cards as card, idx}
        <Card props="{card}"
              mousedownHandler={() => handleMouseDown(card.idx)}
              mouseoverHandler={() => assignHoverOver(card.idx)} />
    {/each}
</div>

<style lang="scss">
    ._3xpl-screensaver_ {
        &grid {
            height: 100%;
            width: 100%;

            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(4, 1fr);
            grid-gap: 1.25rem;
        }
    }
</style>
