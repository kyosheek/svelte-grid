<script>
    import GridItem from "./GridItem.svelte";
    import { onMount } from "svelte";
    export let rows = 4, columns = 4;

    let gridSize = rows * columns;
    let matrix = new Array(gridSize).fill(null);
    let mousePos = { x: null, y: null };
    let grabPos = { x: null, y: null };
    let mouse = { cursor: 'default', grabbing: false, stretching: false };

    let itemsProps = matrix.map((_, idx) => {
        let row = 0;
        while ((row * columns) + columns <= idx) row++;
        let col = idx % columns;

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
        newGrabbedItemProps.x = itemsProps[previewIdx].x;
        newGrabbedItemProps.y = itemsProps[previewIdx].y;
        newGrabbedItemProps.grabbed = false;
        newGrabbedItemProps.swapping = true;

        newPreviewItemProps.colStart = itemsProps[grabbedIdx].colStart;
        newPreviewItemProps.colEnd = itemsProps[grabbedIdx].colEnd;
        newPreviewItemProps.rowStart = itemsProps[grabbedIdx].rowStart;
        newPreviewItemProps.rowEnd = itemsProps[grabbedIdx].rowEnd;
        newPreviewItemProps.x = itemsProps[grabbedIdx].x;
        newPreviewItemProps.y = itemsProps[grabbedIdx].y;
        newPreviewItemProps.preview = false;
        newPreviewItemProps.previewX = null;
        newPreviewItemProps.previewY = null;
        newPreviewItemProps.grabbed = false;
        newPreviewItemProps.swapping = true;

        [ itemsProps[grabbedIdx], itemsProps[previewIdx] ] = [ newGrabbedItemProps, newPreviewItemProps ];
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
            itemsProps[idx].grabbed = true;
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
            pageX,
            pageY
        } = evt;
        mousePos = {
            x: pageX,
            y: pageY
        };

        const previewItemProps = Object.assign({}, itemsProps[grabbedIdx]);

        if (grabbedIdx != null && mouse.grabbing) {
            evt.preventDefault();

            for (let i = 0; i < itemsProps.length; i++) {
                if (!itemsProps[i].hidden && grabbedIdx !== i) {
                    const leftX = itemsProps[i].x;
                    const rightX = leftX + itemsProps[i].width;
                    const topY = itemsProps[i].y;
                    const bottomY = topY + itemsProps[i].height;

                    const newItemProps = Object.assign({}, itemsProps[i]);

                    if (pageX >= leftX && pageX <= rightX && pageY >= topY && pageY <= bottomY) {
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

    const resizeChildren = (entries) => {
        for (const entry of entries) {
            if (entry.target === grid) {
                const rect = entry?.contentRect ?? null;
                if (rect && rect.width >= 0 && rect.height >= 0) {
                    for (const key in childrenComponents) childrenComponents[key]?.resize();
                    return;
                }
            }
        }
    }

    const resizeObserver = (node) => {
        const obs = new ResizeObserver((entries) => resizeChildren(entries));
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

<svelte:window on:mouseup={mouseupHandler} />

<div class="_kyoshee-svelte-grid_"
     bind:this={grid}
     on:mousemove={mousemoveHandler}
     use:resizeObserver
     style:cursor={mouse.cursor ?? 'default'}
     style:--rows={rows ?? 4}
     style:--columns={columns ?? 4}>

    <div bind:this={slotHost}
         use:childrenObserver
         style:width={0}
         style:height={0}
         style:display={'none'}>
        <slot />
    </div>

    {#each itemsProps as itemProps, idx}
        <GridItem bind:props={itemProps}
                  bind:mouse={mouse}
                  mousePos={mousePos}
                  grabPos={grabPos}
                  mousedownHandler={(evt) => mousedownHandler(evt, itemProps.idx)}
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
