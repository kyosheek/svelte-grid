<script lang="ts">
    export let props, mouseoverHandler, mousedownHandler;

    const dragOffset = 10;

    let card;

    const handleMouseMove = (evt) => {
        const { currentTarget } = evt;
        const rect = currentTarget.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;

        if (x <= dragOffset || (rect.width - x) <= dragOffset) {
            card.style.cursor = 'col-resize';
        }
        else if (y <= dragOffset || (rect.height - y) <= dragOffset) {
            card.style.cursor = 'row-resize';
        }
        else {
            card.style.cursor = 'grab';
        }
    }

    const handleMouseEnter = () => {
        card.addEventListener('mousemove', handleMouseMove);
    }

    const handleMouseLeave = () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.style.cursor = null;
    }

    const mov = () => {
        mouseoverHandler();
    }
</script>

<div bind:this={card}
     class="_3xpl-screensaver_card _3xpl-screensaver_card_empty"
     class:_3xpl-screensaver_card_grabbed={props.grabbed}
     class:_3xpls-screensaver_card_moving={props.moving}
     style:grid-area="{ props.rowStart }/{ props.colStart }/{ props.rowEnd }/{ props.colEnd }"
     on:mousedown={mousedownHandler}
     on:mouseover={() => mov()}
     on:mouseenter={handleMouseEnter}
     on:mouseleave={handleMouseLeave}>
    {props.idx}
</div>

<style lang="scss">
    ._3xpl-screensaver_ {
        &card {
            box-sizing: border-box;

            border-radius: 0.625rem;
            padding: 1rem;
            background-color: var(--c-bg_card_empty);
            color: white;
            border: 1px solid transparent;

            cursor: pointer;

            grid-area: 0/1/0/1;

            grid-column: var(--col);
            grid-row: var(--row);

            transition: border-color 0.2s ease-in;

            user-select: none;

            backdrop-filter: blur(2rem);

            &:hover {
                transition-duration: 0.1s;
                transition-timing-function: ease-out;
                border-color: var(--c-accent);
            }

            &_grabbed {
                border-color: var(--c-accent);
                transition-timing-function: ease-out;
                pointer-events: none;
            }

            &_moving {
                pointer-events: none;
                &:hover { border-color: transparent; }
            }
        }
    }
</style>
