export default function shuffle<T>(array: T[]): T[] {
    for (let i: number = array.length - 1; i > 0; i--) { // From i = end of array moving backwards
        const j = Math.floor(Math.random() * (i + 1)); // Random index 0 to i
        [array[i], array[j]] = [array[j], array[i]]; // Swap i and j
    }
    return array;
}