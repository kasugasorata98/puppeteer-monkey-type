import * as puppeteer from 'puppeteer';

const typingDelay = 0;
// 129 wpm = 75ms

function sleep(ms: number) {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.goto("https://monkeytype.com/", { waitUntil: "networkidle2", timeout: 0 });
    await page.waitForSelector('.button.active.acceptAll')
    await page.click('.button.active.acceptAll')
    await sleep(500);
    while (true) {
        const letters: string[] = await page.evaluate(() => {
            const letterElements = document.querySelectorAll('.word.active')
            let letterList: string[] = []
            letterElements.forEach(letter => {
                letterList.push((letter as HTMLElement).innerText);
            })
            return letterList;
        })
        if (letters.length === 0) break;
        console.dir(letters, { 'maxArrayLength': null });
        for (const letter of letters) {
            await page.type("#wordsWrapper", letter, {
                delay: typingDelay
            });
        }
        await page.type("#wordsWrapper", " ", {
            delay: typingDelay
        });
    }
    console.log('Challenge completed')
}

main();