<script>
    import Card from "./Card.svelte";
    import { onMount } from "svelte";

    import { mouse } from "./stores/mouse.js";
    let cursor = 'default';
    mouse.subscribe(val => cursor = val.cursor);

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

    let hoveredIdx = null;
    let grabbedIdx = null;

    const assignHoverOver = (idx) => {
        if (!cards[idx].moving) hoveredIdx = idx;
    }

    const handleMouseDown = (evt, idx) => {
        if ((evt.which || evt.button) === 1) {
            mouse.update(() => {
                return {
                    grabbing: true,
                    cursor: 'grabbing'
                };
            });
            const { pageX, pageY } = evt;
            isCaptured = true;
            const objCopy = Object.assign({}, cards[idx]);
            objCopy.grabbed = true;
            objCopy.moveX = pageX;
            objCopy.moveY = pageY;
            cards[idx] = objCopy;
            grabbedIdx = idx;
        }
    }

    const moveGrabbedCard = (evt) => {
        const { pageX, pageY } = evt;
        const copyObj = Object.assign({}, cards[grabbedIdx]);
        const { moveX, moveY } = copyObj;
        copyObj.translateX = (pageX - moveX) + 'px';
        copyObj.translateY = (pageY - moveY) + 'px';
        cards[grabbedIdx] = copyObj;
    }

    const resetCardsPosition = () => {
        cards.forEach((card, idx) => {
            if (card.preview && card.idx !== hoveredIdx) {
                resetCardPreview(idx);
            }
        });
    }

    const resetPreview = (obj) => {
        obj.preview = false;
        obj.previewX = null;
        obj.previewY = null;
    }

    const resetCardPreview = (idx) => {
        const newCardObj = Object.assign({}, cards[idx]);
        resetPreview(newCardObj);
        cards[idx] = newCardObj;
    }

    const handleMouseMove = (evt) => {
        if (isCaptured) {
            moveGrabbedCard(evt);

            if (hoveredIdx != null) resetCardsPosition();

            if (hoveredIdx != null
                && hoveredIdx !== grabbedIdx
                && !cards[hoveredIdx].moving
                && !cards[hoveredIdx].preview
            ) {
                const previewObj = Object.assign({}, cards[grabbedIdx]);
                const newHovObj = Object.assign({}, cards[hoveredIdx]);
                newHovObj.preview = true;
                newHovObj.moving = true;
                newHovObj.previewX = previewObj.x;
                newHovObj.previewY = previewObj.y;
                cards[hoveredIdx] = newHovObj;
            }
        }
    }

    const swapCards = () => {
        const grabbedObj = cards[grabbedIdx];
        const newGrabbedObj = Object.assign({}, cards[grabbedIdx]);

        const hoveredObj = cards[hoveredIdx];
        const newHoveredObj = Object.assign({}, cards[hoveredIdx]);

        newGrabbedObj.grabbed = false;
        newGrabbedObj.swapped = true;
        newGrabbedObj.rowStart = hoveredObj.rowStart;
        newGrabbedObj.rowEnd = hoveredObj.rowEnd;
        newGrabbedObj.colStart = hoveredObj.colStart;
        newGrabbedObj.colEnd = hoveredObj.colEnd;
        newGrabbedObj.x = hoveredObj.x;
        newGrabbedObj.y = hoveredObj.y;
        newGrabbedObj.translateX = null;
        newGrabbedObj.translateY = null;

        resetPreview(newHoveredObj);
        newHoveredObj.rowStart = grabbedObj.rowStart;
        newHoveredObj.rowEnd = grabbedObj.rowEnd;
        newHoveredObj.colStart = grabbedObj.colStart;
        newHoveredObj.colEnd = grabbedObj.colEnd;
        newHoveredObj.x = grabbedObj.x;
        newHoveredObj.y = grabbedObj.y;

        const _gi = grabbedIdx;
        const _hi = hoveredIdx;

        [ cards[_gi], cards[_hi] ] = [ newGrabbedObj, newHoveredObj ];

        grabbedIdx = null;
        hoveredIdx = null;
        isCaptured = false;
    }

    const handleMouseUp = (evt) => {
        if ((evt.which || evt.button) === 1 && isCaptured) {
            mouse.update(() => {
                return {
                    grabbing: false,
                    cursor: 'default'
                };
            });
            isCaptured = false;
            if (grabbedIdx !== null) {
                if (hoveredIdx !== null && hoveredIdx !== grabbedIdx) swapCards();
                else {
                    cards[grabbedIdx].grabbed = false;
                    resetCardsPosition();
                }
            }
            grabbedIdx = hoveredIdx = null;
        }
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

    onMount(() => recalcCardsDimensions());
</script>

<svelte:window on:resize={recalcCardsDimensions}
               on:mouseup={handleMouseUp} />

<div class="_3xpl-screensaver_grid"
     bind:this={grid}
     on:mousemove={handleMouseMove}
     style="cursor: {cursor}">
    {#each cards as card, idx}
        <Card props="{card}"
              mousedownHandler={(evt) => handleMouseDown(evt, card.idx)}
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
