const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: 'quests.csv',
    header: [
        {id: 'title', title: 'Quest Title'},
        {id: 'type', title: 'Type'},
        {id: 'objectives', title: 'Objectives'},
        {id: 'rewards', title: 'Rewards'},
        {id: 'kappa', title: 'Required for Kappa'}
    ]
});

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://escapefromtarkov.fandom.com/wiki/Quests");

    const traderNames = ['Prapor', 'Therapist', 'Skier', 'Peacekeeper', 'Mechanic', 'Ragman', 'Jaeger', 'Fence'];
    let allQuests = [];

    for(let name of traderNames) {
        console.log("Currently searching prapor tasks")
        const selector = `.questtable.${name}-content`;
        
        const tableExists = await page.$(selector) !== null;
        
        console.log(selector, tableExists);
        const quests = await page.$$eval(`${selector} tr`, rows => {
            return rows.map(row => {
                const ths = row.querySelectorAll('th');
                const tds = row.querySelectorAll('td');
                
                return {
                    title: ths[0]?.innerText.trim(),
                    type: ths[1]?.innerText.trim(),
                    objectives: tds[0]?.innerText.trim(),
                    rewards: tds[1]?.innerText.trim(),
                    kappa: ths[2]?.innerText.trim()
                }
            })
        });

        allQuests.push(...quests);
    }

    console.log(allQuests);

    await csvWriter.writeRecords(allQuests);
    console.log('CSV file has been written');

    await browser.close();
})();