const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://escapefromtarkov.fandom.com/wiki/Quests");

    const traderNames = ['Prapor', 'Therapist', 'Skier', 'Peacekeeper', 'Mechanic', 'Fence', 'Ragman', 'Jaeger', 'Lightkeeper'];
    let allQuests = [];

    for(let name of traderNames) {
        console.log("Currently searching prapor tasks")
        
        const csvWriter = createCsvWriter({
            path: `${name}_quests.csv`,
            header: [
                {id: 'title', title: 'Quest Title'},
                {id: 'type', title: 'Type'},
                {id: 'objectives', title: 'Objectives'},
                {id: 'rewards', title: 'Rewards'},
                {id: 'kappa', title: 'Required for Kappa'},
                {id: 'prev', title: 'Previous Quest'},
                {id: 'next', title: 'next'},
            ]
        });

        const selector = `.questtable.${name}-content`;
        
        const tableExists = await page.$(selector) !== null;
        
        console.log(selector, tableExists);
        const quests = await page.$$eval(`${selector} tbody tr`, rows => {
            return rows.map(row => {
                const ths = row.querySelectorAll('th');
                const tds = row.querySelectorAll('td');
                const link = row.querySelector('a');
                const link_href = link.getAttribute('href');

                return {
                    title: ths[0]?.innerText.trim(),
                    type: ths[1]?.innerText.trim(),
                    objectives: tds[0]?.innerText.trim(),
                    rewards: tds[1]?.innerText.trim(),
                    kappa: ths[2]?.innerText.trim(),
                    link: link_href
                }
            })
        });

        for(const quest of quests) {


            let questData = {
                title: quest.title,
                type: quest.type,
                objectives: quest.objectives,
                rewards: quest.rewards,
                kappa: quest.kappa,
            }

            console.log(`Currently on ${quest.link}`)
            if(quest.link) {
                await page.goto(`https://escapefromtarkov.fandom.com/${quest.link}`);
                await page.waitForSelector('.va-infobox');

                let prev = '';
                let next = '';

                const pageDetail = await page.evaluate(() => {
                    const infobox = document.querySelector('.va-infobox tbody');
                    if(infobox) {
                        const rows = infobox.querySelector('#va-infobox0-content');
                        if(rows) {
                            const tables = rows.querySelectorAll('table');
                            if(tables) {
                                const relatedQuests = tables[2].querySelectorAll('tr');
                                const prevAndNext = relatedQuests[3];
                                const data = prevAndNext.querySelectorAll('td');

                                if(data.length > 1) {
                                    prev = data[0].innerText;
                                    next = data[2].innerText;
                                    
                                    return [prev, next];
                                }          
                            }
                        }
                    } 
                })         
                
                if(pageDetail) {
                    [prev, next] = pageDetail;
                    questData.prev = prev;
                    questData.next = next;

                    console.log(pageDetail);
                }
            }   
            allQuests.push(questData); 
            await page.goBack();        
        }
        await csvWriter.writeRecords(allQuests);
    }
    console.log('CSV file has been written');

    await browser.close();
})();