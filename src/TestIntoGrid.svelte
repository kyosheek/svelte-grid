<script>
    export let testProp;
    let count = 1;
    $: doubled = count * 2;
    export let doubled;
    const increment = () => count++;

    setInterval(() => count++, 2000);
</script>

<button on:click={increment}>
    count: {count}
    <br/>
    doubled: {doubled}
    <br/>
    text prop: {testProp}
</button>
