const { parsepdf, paripurna, save2json, getArgs } = require('./utils');
const scraper      = require('./utils/scraper');
const cheerio      = require("cheerio");
const path         = require('path');

String.prototype.paripurna = paripurna;

const minDataFetched = getArgs('--min-data-fetched') || 1;  // making sure this minimum data length fetched
const ordering       = getArgs('--ordering') || 'DESC';     // ordering
const MIN_TIME_DELAY = 200;
const MAX_TIME_DELAY = 1000;

const handleJournals = async (mainArr, arr, attr, $) => {
    for (const journalEl of mainArr) {

        // add try catch to make sure one fail not breaking the entire process
        try {
            const journalPdfEl = $(journalEl).find(`${attr.journalPdfBtnAttr}`);

            // checking language used in the journal
            const journalPdfText = journalPdfEl.text()?.paripurna();
            const journalPdfLang = journalPdfText.toLowerCase().includes('bahasa') ? 'id' : 'en';

            const journalName    = $(journalEl).find(`${attr.journalAttr}`).text()?.paripurna();
            const journalAuthor  = $(journalEl).find(`${attr.journalAuthorAttr}`).text()?.paripurna();
            const journalPdfLink = journalPdfEl.attr('href')?.paripurna();

            // if it's journal front cover / back cover then skip to the next iteration
            if (['cover depan', 'cover belakang'].some(o => journalName.toLowerCase().includes(o))) {
                console.log(`Skipping cover`);
                continue;
            }

            console.log(`====================== BEGIN =====================`);
            console.log(`Start parsing journal: ${journalName}`);
            console.log(`from  ${journalPdfLink}`);
            const parsedJournal = await parsepdf(journalPdfLink.replace('view', 'download'), journalPdfLang);

            if (parsedJournal && parsedJournal?.title && parsedJournal?.abstract && parsedJournal?.keywords) {
                arr.push({
                    dataWebsite: {
                        title : journalName,
                        author: journalAuthor,
                        link  : journalPdfLink,
                        lang  : journalPdfLang
                    },
                    dataPdf: parsedJournal,
                    valid: parsedJournal.title?.includes(journalName) ? true : false
                });
            } else {
                // throw new Error(`Journal ${journalName} can not be parsed`);
                console.log(`Skipping journal ${journalName}`);
            }

            // break the journal loops if finished
            if (arr.length >= minDataFetched) {
                break;
            }

            // sleep randomly 1-3s before coming to the next journal
            await new Promise(r => setTimeout(r, Math.floor((Math.random() * MAX_TIME_DELAY) + MIN_TIME_DELAY)));
        } catch (error) {
            console.log('[INFO] => Error in journal happening', error);
        }
    }
}

const handleIssues = async (mainArr_, arr, attr, $) => {
    const mainArr = ordering === 'ASC' ? Array.from(mainArr_).reverse() : mainArr_;
    for (const el of mainArr) {
        const issueName = $(el).find(`${attr.issueAttr}`).text()?.paripurna();
        const issueLink = $(el).find(`${attr.issueAttr}`).attr('href')?.paripurna();

        console.log(`Currently scraping issue: ${issueName}`);
        const scrapedIssue = await scraper(issueLink);

        // Load HTML of one issue we fetched in the previous line and get journal list
        const issue$      = cheerio.load(scrapedIssue);
        const listJournal = issue$(`${attr.journalListAttr}`);

        if (!(listJournal && listJournal.length > 0)) {
            console.log(`Journal can not be found from ${issueName}`);
        }

        console.log(`Found ${listJournal.length} journals from ${issueName}`);
        await handleJournals(listJournal, arr, attr, issue$);

        // break the issue loops if finished
        if (arr.length >= minDataFetched) {
            break;
        }

        // sleep randomly 1-3s before coming to the next issue
        await new Promise(r => setTimeout(r, Math.floor((Math.random() * MAX_TIME_DELAY) + MIN_TIME_DELAY)));
    }
}

// main function to scrape
const init = async () => {
    const result = [];
    const repoURL = 'https://join.if.uinsgd.ac.id/index.php/join/issue/archive';
    const repoAttrList = {
        issueListAttr    : 'ul.issues_archive li',
        issueAttr        : 'a.title',
        journalListAttr  : 'ul.cmp_article_list.articles > li',
        journalAttr      : 'h3.title a',
        journalAuthorAttr: '.meta .authors',
        journalPdfBtnAttr: 'a.obj_galley_link.pdf'
    };

    try {
        const scrapedRepo = await scraper(repoURL);

        // Load HTML of main repo we fetched in the previous line and get issue list
        const $         = cheerio.load(scrapedRepo);
        const listIssue = $(`${repoAttrList.issueListAttr}`);

        if (!(listIssue && listIssue.length > 0)) {
            throw new Error('Issue can not be found');
        }

        console.log(`Successfully fetched ${listIssue.length} issues`);

        console.log(`Starting to scrape every issues page`);
        await handleIssues(listIssue, result, repoAttrList, $);

        if (result.length > 0) {
            const saveDir = await save2json(result, 'JOIN Journal');
            console.log(`Successfully scraped and saved ${result.length} journals, saved on ${saveDir}`);
        }

    } catch (error) {
        console.log('Error is happening: ', error);
    }
}

init();