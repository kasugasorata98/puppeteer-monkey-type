import * as puppeteer from 'puppeteer';

const TYPING_RANGE_DELAY: {  // 129 wpm = 75ms
    MIN: number,
    MAX: number
} = {
    MIN: 0,
    MAX: 150
}
const MISTAKE_CHANCE = 10; // 10% chance of making mistake

function sleep(ms: number) {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

function randomNumberGivenRange(): number {
    return Math.floor(Math.random() * (TYPING_RANGE_DELAY.MAX - TYPING_RANGE_DELAY.MIN + 1) + TYPING_RANGE_DELAY.MIN)
}

function shouldMakeIntentionalMistake() {
    const random = Math.random() * 100;
    if (random < MISTAKE_CHANCE) return true;
    return false;
}

async function makeIntentionalMistake(page: puppeteer.Page, word: string) {
    const shuffled = word.split('').sort(function () { return 0.5 - Math.random() }).join('');
    await page.type("#wordsWrapper", shuffled, {
        delay: randomNumberGivenRange()
    });
    for (let i = 0; i < shuffled.length; i++) {
        await page.keyboard.press('Backspace');
    }
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto("https://monkeytype.com/", { waitUntil: "networkidle2", timeout: 0 });
    await page.waitForSelector('.button.active.acceptAll')
    await page.click('.button.active.acceptAll')
    console.log('[Starting Challenge]')
    await sleep(500);
    while (true) {
        const word: string = await page.evaluate(() => {
            const letterElements = document.querySelectorAll('.word.active')
            let word: string = '';
            letterElements.forEach(letter => {
                word += (letter as HTMLElement).innerText
            })
            return word;
        })
        if (word.length === 0) break;
        console.log('-> Typing: ' + word);
        shouldMakeIntentionalMistake() && await makeIntentionalMistake(page, word);
        await page.type("#wordsWrapper", word + " ", {
            delay: randomNumberGivenRange()
        });
    }
    console.log('[Challenge Complete]')
}

main();