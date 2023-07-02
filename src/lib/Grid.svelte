<script>
    import Card from "./Card.svelte";
    import { onMount } from "svelte";

    let rowSize = 4;
    let colSize = 4;
    let gridSize = rowSize * colSize;
    let matrix = new Array(gridSize).fill(null);
    let mousePos = { x: null, y: null };
    let grabPos = { x: null, y: null };
    let mouse = { cursor: 'default', grabbing: false, stretching: false };

    let cards = matrix.map((_, idx) => {
        let row = 0;
        while ((row * rowSize) + rowSize <= idx) row++;
        let col = idx % colSize;

        return {
            rowStart: row + 1,
            rowEnd: row + 2,
            colStart: col + 1,
            colEnd: col + 2,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            grabbed: false,
            moving: false,
            stretching: false,
            preview: false,
            previewX: null,
            previewY: null,
            shown: true,
            swapping: false,
            idx
        };
    });

    let grid = null;
    let children = null;

    let grabbedIdx = null;
    let previewIdx = null;

    const swapCards = () => {
        const newGrabbedCard = Object.assign({}, cards[grabbedIdx]);
        const newPreviewCard = Object.assign({}, cards[previewIdx]);

        newGrabbedCard.colStart = cards[previewIdx].colStart;
        newGrabbedCard.colEnd = cards[previewIdx].colEnd;
        newGrabbedCard.rowStart = cards[previewIdx].rowStart;
        newGrabbedCard.rowEnd = cards[previewIdx].rowEnd;
        newGrabbedCard.x = cards[previewIdx].x;
        newGrabbedCard.y = cards[previewIdx].y;
        newGrabbedCard.grabbed = false;
        newGrabbedCard.swapping = true;

        newPreviewCard.colStart = cards[grabbedIdx].colStart;
        newPreviewCard.colEnd = cards[grabbedIdx].colEnd;
        newPreviewCard.rowStart = cards[grabbedIdx].rowStart;
        newPreviewCard.rowEnd = cards[grabbedIdx].rowEnd;
        newPreviewCard.x = cards[grabbedIdx].x;
        newPreviewCard.y = cards[grabbedIdx].y;
        newPreviewCard.preview = false;
        newPreviewCard.previewX = null;
        newPreviewCard.previewY = null;
        newPreviewCard.grabbed = false;
        newPreviewCard.swapping = true;

        [ cards[grabbedIdx], cards[previewIdx] ] = [ newGrabbedCard, newPreviewCard ];
    }

    const mousedownHandler = (evt, idx) => {
        if ((evt.which || evt.button) === 1) {
            evt.preventDefault();

            const {
                pageX,
                pageY
            } = evt;

            grabPos = {
                x: pageX,
                y: pageY
            };

            mouse = {
                ...mouse,
                cursor: 'grabbing',
                grabbing: true
            };

            grabbedIdx = idx;
            cards[idx].grabbed = true;
        }
    }

    const mouseupHandler = (evt) => {
        if (mouse.grabbing && (evt.which || evt.button) === 1) {
            grabPos = {
                x: null,
                y: null
            };

            mouse = {
                ...mouse,
                cursor: 'default',
                grabbing: false
            };

            if (grabbedIdx != null) {
                if (previewIdx != null) {
                    swapCards();
                    previewIdx = null;
                }
                else {
                    cards[grabbedIdx].grabbed = false;
                }
                grabbedIdx = null;
            }
        }
    }

    const mousemoveHandler = (evt) => {
        const { pageX, pageY } = evt;
        mousePos = {
            x: pageX,
            y: pageY
        };

        const previewObj = Object.assign({}, cards[grabbedIdx]);

        if (grabbedIdx != null && mouse.grabbing) {
            evt.preventDefault();

            for (let i = 0; i < cards.length; i++) {
                if (cards[i].shown && grabbedIdx !== i) {
                    const leftX = cards[i].x;
                    const rightX = leftX + cards[i].width;
                    const topY = cards[i].y;
                    const bottomY = topY + cards[i].height;

                    const newCardObj = Object.assign({}, cards[i]);

                    if (pageX >= leftX && pageX <= rightX && pageY >= topY && pageY <= bottomY) {
                        newCardObj.preview = true;
                        newCardObj.previewX = previewObj.x;
                        newCardObj.previewY = previewObj.y;
                        previewIdx = i;
                    }
                    else {
                        newCardObj.preview = false;
                        newCardObj.previewX = null;
                        newCardObj.previewY = null;
                        if (previewIdx === i) previewIdx = null;
                    }

                    cards[i] = newCardObj;
                }
            }
        }
    }

    onMount(() => {
        children = Array.from(grid.children);
        cards = cards.map((card, idx) => {
           const rect = children[idx].getBoundingClientRect();
           return {
               ...card,
               width: rect.width,
               height: rect.height,
               x: rect.left,
               y: rect.top
           };
       });
    });
</script>

<svelte:window on:mouseup={mouseupHandler} />

<div class="_3xpl-screensaver_grid"
     bind:this={grid}
     on:mousemove={mousemoveHandler}
     style:cursor={mouse.cursor ?? 'default'}>
    {#each cards as card, idx}
        <Card props={card}
              bind:mouse={mouse}
              mousePos={mousePos}
              grabPos={grabPos}
              mousedownHandler={(evt) => mousedownHandler(evt, card.idx)} />
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