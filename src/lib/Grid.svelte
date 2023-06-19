<script>
    let cards = new Array(16);
</script>

<div class="_3xpl-screensaver_grid">
    {#each cards as card, index}
        <div class="_3xpl-screensaver_grid-card _3xpl-screensaver_grid-card_empty"></div>
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

        &grid-card {
            border-radius: 0.625rem;
            background-color: rgba(255, 255, 255, 0.05);
        }
    }
</style>
