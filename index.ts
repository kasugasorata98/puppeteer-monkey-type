import * as puppeteer from 'puppeteer';

const TYPING_RANGE_DELAY: {  // 129 wpm = 75ms
    MIN: number,
    MAX: number
} = {
    MIN: 70,
    MAX: 80
}
const MISTAKE_CHANCE = 10; // 10% chance of making mistake

function sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

function randomNumberGivenRange(): number {
    return Math.floor(Math.random() * (TYPING_RANGE_DELAY.MAX - TYPING_RANGE_DELAY.MIN + 1) + TYPING_RANGE_DELAY.MIN)
}

function shouldMakeIntentionalMistake(): boolean {
    const random = Math.random() * 100;
    return random <= MISTAKE_CHANCE;
}

async function recoverFromMistake(page: puppeteer.Page, backSpaceAmount: number): Promise<void> {
    console.log('-> [Recover From Mistake]')
    for (let i = 0; i < backSpaceAmount; i++) {
        await page.keyboard.press('Backspace');
    }
}

async function makeIntentionalMistake(page: puppeteer.Page, word: string): Promise<void> {
    const shuffled = word.split('').sort(function () { return 0.5 - Math.random() }).join('');
    console.log('-> [Mistake]: ' + shuffled);
    await page.type("#wordsWrapper", shuffled, {
        delay: randomNumberGivenRange()
    });
}

async function launchPuppeteer(): Promise<puppeteer.Page> {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto("https://monkeytype.com/", { waitUntil: "networkidle2", timeout: 0 });
    return page;
}

async function handleAcceptCookiesBtn(page: puppeteer.Page): Promise<void> {
    await page.waitForSelector('.button.active.acceptAll')
    await page.click('.button.active.acceptAll')
}

async function startChallenge(page: puppeteer.Page): Promise<void> {
    await handleAcceptCookiesBtn(page);
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
        console.log('-> [Typing]: ' + word);
        shouldMakeIntentionalMistake() && await makeIntentionalMistake(page, word).then(async () => await recoverFromMistake(page, word.length));
        await page.type("#wordsWrapper", word + " ", {
            delay: randomNumberGivenRange()
        });
    }
    console.log('[Challenge Complete]')
}

async function main() {
    const page = await launchPuppeteer();
    await startChallenge(page);
}

main();