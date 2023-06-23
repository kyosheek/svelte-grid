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

    let wasGrabbed = false;
    let inPreview = false;

    $: grabbed = props?.grabbed ?? false;
    $: tx = props?.translateX ?? null;
    $: ty = props?.translateY ?? null;
    $: grabbed && liftCard();
    $: (card && wasGrabbed && !grabbed) && returnCard();
    $: (card && grabbed && tx && ty) && moveCard();

    $: preview = props?.preview ?? false;
    $: preview && previewCard();
    $: (card && inPreview && !preview) && returnCard();

    const moveCard = () => {
        if (tx != null && ty != null) {
            card.style.transform = `translate(${tx}, ${ty})`;
        }
    }

    const fixCard = (clearTransform = false) => {
        const rect = card.getBoundingClientRect();
        card.style.position = 'fixed';
        card.style.width = `${rect.width}px`;
        card.style.height = `${rect.height}px`;
        card.style.left = `${rect.left}px`;
        card.style.top = `${rect.top}px`;
        if (clearTransform) card.style.transform = null;
    }

    const previewCard = () => {
        inPreview = true;
        fixCard();

        const rect = card.getBoundingClientRect();
        const dx = props.previewX - rect.left;
        const dy = props.previewY - rect.top;
        const endKeyframeTransform = `translate(${dx}px, ${dy}px)`;
        const keyframes = [
            { transform: `translate(0, 0)` },
            { transform: endKeyframeTransform }
        ];
        const vec = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        const timing = { duration: vec * 0.66, iterations: 1, easing: 'ease-out' };

        card.animation = card.animate(keyframes, timing);
        card.animation.onfinish = () => card.style.transform = endKeyframeTransform;
    }

    const liftCard = () => {
        wasGrabbed = true;
        fixCard(true);
    }

    const returnCard = () => {
        props.moving = true;

        if (card.animation) {
            card.animation.commitStyles();
            card.animation.cancel();
        }

        const rect = card.getBoundingClientRect();
        const dx = - rect.left + props.x;
        const dy = - rect.top + props.y;

        fixCard(true);
        const keyframes = [
            {transform: `translate(0, 0)`},
            {transform: `translate(${dx}px, ${dy}px)`}
        ];
        const vec = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        const timing = { duration: vec * 0.75, iterations: 1, easing: 'ease-out' };

        wasGrabbed = wasGrabbed ? false : wasGrabbed;
        inPreview = inPreview ? false : inPreview;

        card.animation = card.animate(keyframes, timing);
        card.animation.onfinish = () => {
            card.style = `grid-area: ${card.style.gridArea}`;
            props.preview = (props.preview != null && props.preview) ? false : props.preview;
            props.moving = (props.moving != null && props.moving) ? false : props.moving;
            props.swapped = (props.swapped != null && props.swapped) ? false : props.swapped;
        }
    }
</script>

<div bind:this={card}
     class="_3xpl-screensaver_card _3xpl-screensaver_card_empty"
     class:_3xpl-screensaver_card_grabbed={props.grabbed}
     class:_3xpls-screensaver_card_moving={props.moving}
     style="
        grid-area: { props.rowStart }/{ props.colStart }/{ props.rowEnd }/{ props.colEnd };
        --translate-x: { props.translateX };
        --translate-y: { props.translateY };
    "
     on:mousedown={mousedownHandler}
     on:mouseover={mouseoverHandler}
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

            backdrop-filter: blur(0.75rem);

            transform: translate(0, 0);

            &:hover {
                transition-duration: 0.1s;
                transition-timing-function: ease-out;
                border-color: var(--c-accent);
            }

            &_moving {
                pointer-events: none;
                z-index: 1;
                &:hover { border-color: transparent; }
            }

            &_grabbed {
                border-color: var(--c-accent);
                transition-timing-function: ease-out;
                pointer-events: none;

                position: fixed;
                width: var(--width);
                height: var(--height);
                left: var(--left);
                top: var(--top);

                transition: transform 0.1s ease-out;

                z-index: 2;

                transform: translate(var(--translate-x, 0), var(--translate-y, 0));
            }
        }
    }
</style>
