<script>
    let count = 0;
    $: doubled = count * 2;
    export let doubled;
    const increment = () => count++;
</script>

<button on:click={increment}>
    count: {count}
    <br/>
    doubled: {doubled}
</button>
