<script>
    import GridItem from "./GridItem.svelte";
    import { onMount } from "svelte";
    export let rows = 4, columns = 4, hideEmpty = false;

    let gridSize = rows * columns;
    let mousePos = {
        x: null,
        y: null
    };
    let grabPos = {
        x: null,
        y: null
    };
    let scrollX = 0;
    let scrollY = 0;
    let mouse = {
        cursor: null,
        grabbing: false,
        stretching: false,
        dragOffset: 20
    };

    let itemsProps = new Array(gridSize).fill(null).map((_, idx) => {
        let row = 0;
        while ((row * columns) + columns <= idx) row++;
        let col = idx % columns;

        return {
            rowStart: row + 1,
            rowEnd: row + 2,
            colStart: col + 1,
            colEnd: col + 2,
            originalRowStart: row + 1,
            originalRowEnd: row + 2,
            originalColStart: col + 1,
            originalColEnd: col + 2,
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
            hidden: false,
            swapping: false,
            idx,
            content: null
        };
    });

    let grid = null;
    let children = null;

    let slotHost;
    let appendedSlotChildrenCount = 0;
    let childrenComponents = {};
    itemsProps.map(el => el.idx.toString()).forEach(idx => childrenComponents[idx] = null);

    let grabbedIdx = null;
    let previewIdx = null;

    const swapItemsProps = () => {
        const newGrabbedItemProps = Object.assign({}, itemsProps[grabbedIdx]);
        const newPreviewItemProps = Object.assign({}, itemsProps[previewIdx]);

        newGrabbedItemProps.colStart = itemsProps[previewIdx].colStart;
        newGrabbedItemProps.colEnd = itemsProps[previewIdx].colEnd;
        newGrabbedItemProps.rowStart = itemsProps[previewIdx].rowStart;
        newGrabbedItemProps.rowEnd = itemsProps[previewIdx].rowEnd;
        newGrabbedItemProps.originalColStart = itemsProps[previewIdx].originalColStart;
        newGrabbedItemProps.originalColEnd = itemsProps[previewIdx].originalColEnd;
        newGrabbedItemProps.originalRowStart = itemsProps[previewIdx].originalRowStart;
        newGrabbedItemProps.originalRowEnd = itemsProps[previewIdx].originalRowEnd;
        newGrabbedItemProps.x = itemsProps[previewIdx].x;
        newGrabbedItemProps.y = itemsProps[previewIdx].y;
        newGrabbedItemProps.grabbed = false;
        newGrabbedItemProps.swapping = true;

        newPreviewItemProps.colStart = itemsProps[grabbedIdx].colStart;
        newPreviewItemProps.colEnd = itemsProps[grabbedIdx].colEnd;
        newPreviewItemProps.rowStart = itemsProps[grabbedIdx].rowStart;
        newPreviewItemProps.rowEnd = itemsProps[grabbedIdx].rowEnd;
        newPreviewItemProps.originalColStart = itemsProps[grabbedIdx].originalColStart;
        newPreviewItemProps.originalColEnd = itemsProps[grabbedIdx].originalColEnd;
        newPreviewItemProps.originalRowStart = itemsProps[grabbedIdx].originalRowStart;
        newPreviewItemProps.originalRowEnd = itemsProps[grabbedIdx].originalRowEnd;
        newPreviewItemProps.x = itemsProps[grabbedIdx].x;
        newPreviewItemProps.y = itemsProps[grabbedIdx].y;
        newPreviewItemProps.preview = false;
        newPreviewItemProps.previewX = null;
        newPreviewItemProps.previewY = null;
        newPreviewItemProps.grabbed = false;
        newPreviewItemProps.swapping = true;

        [ itemsProps[grabbedIdx], itemsProps[previewIdx] ] = [ newGrabbedItemProps, newPreviewItemProps ];
    }

    const startGrabbing = (evt, idx) => {
        resizeChildren();

        const {
            clientX,
            clientY
        } = evt;

        grabPos = {
            x: clientX,
            y: clientY
        };

        mouse = {
            ...mouse,
            cursor: 'grabbing',
            grabbing: true
        };

        grabbedIdx = idx;
        itemsProps[idx].grabbed = true;
    }

    const isOverlapping = (firstProps, secondProps) => {
        const firstColStart = firstProps.colStart;
        const firstColEnd = firstProps.colEnd;
        const firstRowStart = firstProps.rowStart;
        const firstRowEnd = firstProps.rowEnd;

        const secondColStart = secondProps.colStart;
        const secondColEnd = secondProps.colEnd;
        const secondRowStart = secondProps.rowStart;
        const secondRowEnd = secondProps.rowEnd;

        const isNoHorizontalOverlap = firstColStart >= secondColEnd || firstColEnd <= secondColStart;
        const isNoVerticalOverlap = firstRowStart >= secondRowEnd || firstRowEnd <= secondRowStart;

        return !isNoHorizontalOverlap && !isNoVerticalOverlap;
    }

    const hideOverlapped = (currentIdx) => {
        itemsProps.forEach((itemProps, innerIdx) => {
            if (itemProps.hidden || currentIdx === innerIdx) return;
            if (isOverlapping(itemsProps[currentIdx], itemProps)) {
                itemsProps[innerIdx] = {
                    ...itemsProps[innerIdx],
                    hidden: true
                };
            }
        });
    }

    const hideOverlappedAndShowPreviouslyOverlapped = (currentIdx, oldProps) => {
        itemsProps.forEach((itemProps, innerIdx) => {
            if (innerIdx === currentIdx) return;
            if (isOverlapping(oldProps, itemProps) && !isOverlapping(itemsProps[currentIdx], itemProps)) {
                itemsProps[innerIdx] = {
                    ...itemsProps[innerIdx],
                    hidden: false
                };
            }
            else if (isOverlapping(itemsProps[currentIdx], itemProps)) {
                itemsProps[innerIdx] = {
                    ...itemsProps[innerIdx],
                    hidden: true
                };
            }
        });
    }

    const canBeStretchedOrShrinked = (newProps) => {
        let originalEqualCount = 4;
        [ 'colStart', 'colEnd', 'rowStart', 'rowEnd' ].forEach(propName => {
            const originalPropName = 'original' + propName.slice(0, 1).toUpperCase() + propName.slice(1);
            if (newProps[propName] !== newProps[originalPropName]) originalEqualCount -= 1;
        });
        return originalEqualCount > 0;
    }

    const stretchItemToLeft = (idx) => {
        if (itemsProps[idx].colStart === 1) return;
        const newProps = {
            ...itemsProps[idx],
            colStart: itemsProps[idx].colStart - 1
        };
        if (!canBeStretchedOrShrinked(newProps)) return;
        itemsProps[idx] = newProps;
        hideOverlapped(idx);
    }

    const shrinkItemFromLeft = (idx) => {
        if (!(itemsProps[idx].colStart === columns || itemsProps[idx].colStart + 1 === itemsProps[idx].colEnd)) {
            const newProps = {
                ...itemsProps[idx],
                colStart: itemsProps[idx].colStart + 1
            };
            if (!canBeStretchedOrShrinked(newProps)) return;
            const oldProps = Object.assign({}, itemsProps[idx]);
            itemsProps[idx] = newProps;
            hideOverlappedAndShowPreviouslyOverlapped(idx, oldProps);
        }
    }

    const stretchItemToRight = (idx) => {
        if (itemsProps[idx].colEnd === columns + 1) return;
        const newProps = {
            ...itemsProps[idx],
            colEnd: itemsProps[idx].colEnd + 1
        };
        if (!canBeStretchedOrShrinked(newProps)) return;
        itemsProps[idx] = newProps;
        hideOverlapped(idx);
    }

    const shrinkItemFromRight = (idx) => {
        if (!(itemsProps[idx].colEnd === 2 || itemsProps[idx].colEnd - 1 === itemsProps[idx].colStart)) {
            const newProps = {
                ...itemsProps[idx],
                colEnd: itemsProps[idx].colEnd - 1
            };
            if (!canBeStretchedOrShrinked(newProps)) return;
            const oldProps = Object.assign({}, itemsProps[idx]);
            itemsProps[idx] = newProps;
            hideOverlappedAndShowPreviouslyOverlapped(idx, oldProps);
        }
    }

    const stretchItemToTop = (idx) => {
        if (itemsProps[idx].rowStart === 1) return;
        const newProps = {
            ...itemsProps[idx],
            rowStart: itemsProps[idx].rowStart - 1
        };
        if (!canBeStretchedOrShrinked(newProps)) return;
        itemsProps[idx] = newProps;
        hideOverlapped(idx);
    }

    const shrinkItemFromTop = (idx) => {
        if (!(itemsProps[idx].rowStart === rows || itemsProps[idx].rowStart - 1 === itemsProps[idx].rowEnd)) {
            const newProps = {
                ...itemsProps[idx],
                rowStart: itemsProps[idx].rowStart + 1
            };
            if (!canBeStretchedOrShrinked(newProps)) return;
            const oldProps = Object.assign({}, itemsProps[idx]);
            itemsProps[idx] = newProps;
            hideOverlappedAndShowPreviouslyOverlapped(idx, oldProps);
        }
    }

    const stretchItemToBottom = (idx) => {
        if (itemsProps[idx].rowEnd === rows + 1) return;
        const newProps = {
            ...itemsProps[idx],
            rowEnd: itemsProps[idx].rowEnd + 1
        };
        if (!canBeStretchedOrShrinked(newProps)) return;
        itemsProps[idx] = newProps;
        hideOverlapped(idx);
    }

    const shrinkItemFromBottom = (idx) => {
        if (!(itemsProps[idx].rowEnd === 2 || itemsProps[idx].rowEnd - 1 === itemsProps[idx].rowStart)) {
            const newProps = {
                ...itemsProps[idx],
                rowEnd: itemsProps[idx].rowEnd - 1
            };
            if (!canBeStretchedOrShrinked(newProps)) return;
            const oldProps = Object.assign({}, itemsProps[idx]);
            itemsProps[idx] = newProps;
            hideOverlappedAndShowPreviouslyOverlapped(idx, oldProps);
        }
    }

    const resizeItemColumn = (evt, idx) => {
        const node = children[idx];
        const rect = node.getBoundingClientRect();
        const x = evt.clientX - rect.left;

        if (x < rect.width / 2) {
            if (x < mouse.dragOffset / 2) stretchItemToLeft(idx);
            else if (x < mouse.dragOffset) shrinkItemFromLeft(idx);
        }
        else {
            if (x > (rect.width - mouse.dragOffset / 2)) stretchItemToRight(idx);
            else if (x > (rect.width - mouse.dragOffset)) shrinkItemFromRight(idx);
        }
    }

    const resizeItemRow = (evt, idx) => {
        const node = children[idx];
        const rect = node.getBoundingClientRect();
        const y = evt.clientY - rect.top;

        if (y < rect.height / 2) {
            if (y < mouse.dragOffset / 2) stretchItemToTop(idx);
            else if (y < mouse.dragOffset) shrinkItemFromTop(idx);
        }
        else {
            if (y > (rect.height - mouse.dragOffset / 2)) stretchItemToBottom(idx);
            else if (y > (rect.height - mouse.dragOffset)) shrinkItemFromBottom(idx);
        }
    }

    const mousedownHandler = (evt, idx, restrictDrag = false) => {
        if ((evt.which || evt.button) === 1) {
            evt.preventDefault();

            if (mouse.cursor === 'grab' && !restrictDrag) startGrabbing(evt, idx);
            else if (mouse.cursor === 'col-resize') resizeItemColumn(evt, idx);
            else if (mouse.cursor === 'row-resize') resizeItemRow(evt, idx);
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
                    swapItemsProps();
                    previewIdx = null;
                }
                else {
                    itemsProps[grabbedIdx].grabbed = false;
                }
                grabbedIdx = null;
            }
        }
    }

    const mousemoveHandler = (evt) => {
        const {
            clientX,
            clientY
        } = evt;

        mousePos = {
            x: clientX,
            y: clientY
        };

        const previewItemProps = Object.assign({}, itemsProps[grabbedIdx]);

        if (grabbedIdx != null && mouse.grabbing) {
            evt.preventDefault();

            for (let i = 0; i < itemsProps.length; i++) {
                if (grabbedIdx !== i) {
                    const leftX = itemsProps[i].x;
                    const rightX = leftX + itemsProps[i].width;
                    const topY = itemsProps[i].y;
                    const bottomY = topY + itemsProps[i].height;

                    const newItemProps = Object.assign({}, itemsProps[i]);

                    if (clientX >= leftX && clientX <= rightX && clientY >= topY && clientY <= bottomY) {
                        newItemProps.preview = true;
                        newItemProps.previewX = previewItemProps.x;
                        newItemProps.previewY = previewItemProps.y;
                        previewIdx = i;
                    }
                    else {
                        newItemProps.preview = false;
                        newItemProps.previewX = null;
                        newItemProps.previewY = null;
                        if (previewIdx === i) previewIdx = null;
                    }

                    itemsProps[i] = newItemProps;
                }
            }
        }
    }

    onMount(() => {
        children = Array.from(grid.children).filter(el => el !== slotHost);

        const slotHostChildren = slotHost.children;
        Array.from(slotHostChildren).forEach((el, idx) => {
            itemsProps[idx].content = true;
            children[idx].innerHTML = null;
            children[idx].appendChild(el);
            appendedSlotChildrenCount++;
        });
    });

    const resizeChildren = () => {
        for (const key in childrenComponents) childrenComponents[key]?.resize();
    }

    const resizeObserverHandler = (entries) => {
        for (const entry of entries) {
            if (entry.target === grid) {
                const rect = entry?.contentRect ?? null;
                if (rect && rect.width >= 0 && rect.height >= 0) {
                    resizeChildren();
                    return;
                }
            }
        }
    }

    const resizeObserver = (node) => {
        const obs = new ResizeObserver((entries) => resizeObserverHandler(entries));
        obs.observe(node);

        return {
            destroy() {
                obs.unobserve(node);
            }
        }
    }

    const addChildren = (entries) => {
        entries.forEach(entry => {
            let { addedNodes } = entry;
            addedNodes = Array.from(addedNodes);
            if (appendedSlotChildrenCount >= gridSize) {
                while (addedNodes.length > 0) {
                    const node = addedNodes.pop();
                    node.remove();
                }
            }
            addedNodes = addedNodes.filter(el => (el.nodeType === 1 || el.nodeType === 3));
            itemsProps.forEach((itemProps, idx) => {
                if (addedNodes.length > 0 && appendedSlotChildrenCount < gridSize) {
                    if (!itemProps.content) {
                        itemsProps[idx].content = true;
                        children[idx].innerHTML = null;
                        children[idx].appendChild(addedNodes.pop());
                        appendedSlotChildrenCount++;
                    }
                }
            });
        })
    }

    const childrenObserver = (node) => {
        const obs = new MutationObserver((entries) => addChildren(entries));
        obs.observe(node, { childList: true });

        return {
            destroy() {
                obs.disconnect();
            }
        }
    }
</script>

<svelte:window on:mouseup={mouseupHandler} bind:scrollX bind:scrollY />

<div class="_kyoshee-svelte-grid_"
     bind:this={grid}
     on:mousemove={mousemoveHandler}
     use:resizeObserver
     style:cursor={mouse.cursor}
     style:--rows={rows ?? 4}
     style:--columns={columns ?? 4}
     role="grid"
     tabindex="0">

    <div bind:this={slotHost}
         use:childrenObserver
         style:width={0}
         style:height={0}
         style:display={'none'}
         role="log">
        <slot />
    </div>

    {#each itemsProps as itemProps, idx}
        <GridItem bind:props={itemProps}
                  bind:mouse={mouse}
                  {gridSize}
                  {hideEmpty}
                  mousePos={mousePos}
                  grabPos={grabPos}
                  mousedownHandler={mousedownHandler}
                  bind:this={childrenComponents[idx]} />
    {/each}
</div>

<style lang="scss">
    ._kyoshee-svelte-grid_ {
        height: 100%;
        width: 100%;

        display: grid;
        grid-template-columns: repeat(var(--columns, 4), 1fr);
        grid-template-rows: repeat(var(--rows, 4), 1fr);
        grid-gap: 1.25rem;

        color: white;
    }
</style>
