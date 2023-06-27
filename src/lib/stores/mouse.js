import { writable } from "svelte/store";
export const mouse = writable({
    cursor: 'default',
    grabbing: false
});
