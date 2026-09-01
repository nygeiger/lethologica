export function shuffleArray<T>(array: T[]): T[] {
    // Loop from the last element down to the second element
    for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));

        // Swap elements using array destructuring
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}