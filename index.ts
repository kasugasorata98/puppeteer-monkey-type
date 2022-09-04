import * as puppeteer from 'puppeteer';
import randomWords from 'random-words';

const TYPING_RANGE_DELAY: {  // 129 wpm = 75ms
    min: number,
    max: number
} = {
    min: 60,
    max: 70
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
    return Math.floor(Math.random() * (TYPING_RANGE_DELAY.max - TYPING_RANGE_DELAY.min + 1) + TYPING_RANGE_DELAY.min)
}

function shouldMakeIntentionalMistake() {
    const random = Math.random() * 100;
    if (random < MISTAKE_CHANCE) return true;
    return false;
}

async function makeIntentionalMistake(page: puppeteer.Page) {
    const randomWord: string = randomWords(1)[0];
    await page.type("#wordsWrapper", randomWord, {
        delay: randomNumberGivenRange()
    });
    for (let i = 0; i < randomWord.length; i++) {
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
        shouldMakeIntentionalMistake() && await makeIntentionalMistake(page);
        for (const letter of letters) {
            await page.type("#wordsWrapper", letter, {
                delay: randomNumberGivenRange()
            });
        }
        await page.type("#wordsWrapper", " ", {
            delay: randomNumberGivenRange()
        });
    }
    console.log('Challenge completed')
}

main();