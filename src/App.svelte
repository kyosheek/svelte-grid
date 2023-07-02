<script>
    import Grid from "./lib/Grid.svelte";
    import Settings from "./lib/Settings.svelte";
    // import TestIntoGrid
    //     from "./lib/TestIntoGrid.svelte";

    let count = 100;
    let exampleContent = new Array(3).fill(null).map(el => count++);

    const addContent = () => {
        exampleContent = [...exampleContent, count++ ];
    }

    // let test = true;
</script>

<Grid>
    {#each exampleContent as num}
        <div>{num}</div>
    {/each}
    <!--{#if test}-->
    <!--    <TestIntoGrid />-->
    <!--{/if}-->
</Grid>

<Settings />

<button id="add-button" on:click={addContent}>add content to grid?</button>
<!--<button id="test-button" on:click={() => test = !test}>toggle test</button>-->

<style>
    #add-button {
        position: fixed;
        bottom: 20px;
        left: 20px;
    }

    /*#test-button {*/
    /*    position: fixed;*/
    /*    bottom: 50px;*/
    /*    left: 20px;*/
    /*}*/
</style>
