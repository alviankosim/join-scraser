const { parsepdf, paripurna } = require("../utils");
String.prototype.paripurna = paripurna;

const test_parseSinglePdf = async () => {
    const testName = 'Fetch single PDF';
    const parsedPdf = await parsepdf('https://join.if.uinsgd.ac.id/index.php/join/article/view/487/139'
        .replace('/view', '/download'), 'en');
    try {
        if (parsedPdf) {
            console.log({ parsedPdf });
            console.log(`✅ => ${testName}`)
        } else {
            console.log(`❌ => ${testName}`);
        }
    } catch (error) {
        console.log(`❌ => ${testName}`, error.message);
    }
}

const runtest = async () => {
    await test_parseSinglePdf();
}

runtest();