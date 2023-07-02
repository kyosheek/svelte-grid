<script>
    import Grid from "./lib/Grid.svelte";
    import Settings from "./lib/Settings.svelte";
    import TestIntoGrid
        from "./lib/TestIntoGrid.svelte";

    let count = 100;
    let exampleContent = new Array(3).fill(null).map(el => count++);

    const addContent = () => {
        exampleContent = [...exampleContent, count++ ];
    }

    let test = true;

    let rows = 4;
    let columns = 4;
</script>

<Grid>
    {#each exampleContent as num}
        <button on:click={function () { this.remove(); }}>{num}</button>
    {/each}
    {#if test}
        <TestIntoGrid />
    {/if}
</Grid>

<Settings />

<div id="control-buttons">
    <button on:click={addContent}>add content to grid?</button>
    <button on:click={() => test = !test}>toggle test</button>
<!--    <button on:click={rows++}>add row</button>-->
<!--    <button on:click={() => rows > 1 ? rows&#45;&#45; : rows}>remove row</button>-->
<!--    <button on:click={columns++}>add column</button>-->
<!--    <button on:click={() => columns > 1 ? columns&#45;&#45; : columns}>remove column</button>-->
</div>

<style>
    #control-buttons {
        position: fixed;
        left: 20px;
        bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
</style>
