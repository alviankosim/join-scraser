# JOIN Scraser - Jurnal Online Informatika Simple Journal Scraper & Parser

a Node JS simple scraper & parser for https://join.if.uinsgd.ac.id/ using axios, parse-pdf, and cheerio.

## Reminder

as part of netiquette, you should check for any website's robots.txt that will be scraped. For example, berita.https://join.if.uinsgd.ac.id/robots.txt allows us (scraper) to scrape their website by mentioning wildcard (*) for the allowed User-Agent.

## Running locally

Clone this repo by using `git clone` and do some npm install using `npm i` and run it using `npm start`.

### Options

When you are running `npm start`, there are two available options:
- `--min-data-fetched` is for set the minimum data to fetched (journal)
- `--ordering` is for set the sorting of the issue (`ASC`,`DESC`)

## Testing Scrape and Parse Single Journal

Using the included test file, run `npm test`

## License

MIT License