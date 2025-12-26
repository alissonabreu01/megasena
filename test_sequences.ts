
function testSequences(game: number[]) {
    const sortedGame = [...game].sort((a, b) => a - b);
    const sequences: string[] = [];
    let seqStart = sortedGame[0];
    let seqLen = 1;

    console.log('Game:', sortedGame.join(', '));

    for (let i = 1; i <= sortedGame.length; i++) {
        const curr = sortedGame[i];
        const prev = sortedGame[i - 1];

        // Check if consecutive
        if (i < sortedGame.length && curr === prev + 1) {
            seqLen++;
        } else {
            if (seqLen >= 2) {
                sequences.push(`${seqStart}-${sortedGame[i - 1]}`);
                console.log(`Found sequence: ${seqStart}-${sortedGame[i - 1]} (Len: ${seqLen})`);
            }
            if (i < sortedGame.length) {
                seqStart = sortedGame[i];
                seqLen = 1;
            }
        }
    }
    console.log('Result:', sequences);
}

testSequences([1, 2, 4, 5, 6, 10, 12, 13]); // Expected: 1-2, 4-6, 12-13
testSequences([1, 2, 3, 4, 5]); // Expected: 1-5
testSequences([1, 3, 5, 7]); // Expected: []
