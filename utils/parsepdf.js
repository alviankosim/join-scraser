const pdf        = require('pdf-parse');
const downloader = require('./downloader');
const version    = require('./version');
const splitlines = require('./splitlines');
const isnumber   = require('./isnumber');
const grouparray = require('./grouparray');

const findSection = (arr, pointOrFunc, incr = 0, needLower = false) => {
    const lower = str => needLower ? str?.toLowerCase() : str;
    let beforeTitleArrIndex;
    if (typeof pointOrFunc === 'string') {
        beforeTitleArrIndex = arr.findIndex(o => o.filter(k => lower(k).startsWith(lower(pointOrFunc))).length > 0);
    } else {
        beforeTitleArrIndex = arr.findIndex(o => o.filter(k => pointOrFunc(lower(k))).length > 0);
    }
    if (beforeTitleArrIndex < 0) {
        return;
    }
    // console.log('siuu', { as: arr[beforeTitleArrIndex + 1], pointOrFunc });
    if (incr > 0) {
        // it means the page number with the title is together, no need to increment
        if (arr[beforeTitleArrIndex].length > 1 && typeof pointOrFunc === 'string' && !arr[beforeTitleArrIndex].some(o => o.startsWith(pointOrFunc))) {
            console.log('masuk sini gasi');
            arr[beforeTitleArrIndex] = arr[beforeTitleArrIndex].slice(1);
            return arr[beforeTitleArrIndex];
        }
    }
    return arr[beforeTitleArrIndex + incr];
}

const parseV1 = (arr,) => {

    const abstractArrPoint         = 'Abstrak';
    const abstractArrPoint2        = 'Abstract';
    const keywordsArrPoint2        = 'Keywords';
    let   keywordsArrPoint         = 'Kata kunci';
    let   keywordsArrStoppingPoint = 'I. PENDAHULUAN';

    // remapping if found the merged title <=> abstrak || abstrak <=> keyword
    let useEn = false;
    const findingMerged = arr.findIndex(o => {
        const findingKeywords2 = o.find(k => k.startsWith(keywordsArrPoint2));
        if (findingKeywords2) {
            useEn = true;
        }
        return (o.find(k => k.startsWith(abstractArrPoint)) || o.find(k => k.startsWith(abstractArrPoint2)))
            && (o.find(k => k.startsWith(keywordsArrPoint)) || o.find(k => k.startsWith(keywordsArrPoint2)))
    });
    if (useEn) {
        keywordsArrPoint = keywordsArrPoint2;
        keywordsArrStoppingPoint = 'I. INTRODUCTION';
    }
    if (findingMerged > -1) {
        const splitted = grouparray(arr[findingMerged], keywordsArrPoint, true, 'I. PENDAHULUAN');
        arr = [
            ...arr.slice(0, findingMerged),
            ...splitted,
            ...arr.slice(findingMerged + 1)
        ];
    }

    const handleAbstract = (str, point) => str?.replace(new RegExp(point, 'i'), '')
        .replace('', '').replace('-', '').replace('—', '')?.paripurna();
    const handleKeywords = (str, point) => {
        const beforeSplit = str?.replace(new RegExp(point, 'i'), '')
        .replace('– ', '').replace('—', '').replace('-', '') // the first one for older v1
        const splitted = beforeSplit?.split(',').length - 1 > beforeSplit?.split(';').length - 1
            ? beforeSplit?.split(',') : beforeSplit?.split(';');
        
        return splitted?.map(o => o?.replace(':', '')?.paripurna())?.filter(o => o);
    }

    // (v1 doesn't have any english journal)
    console.log(`Starting using parser v1`);

    // extracting title
    let title2;
    let _abstract;
    let _abstract2;
    let _keywords;

    const beforeTitleArrPoint = 'Makalah dikirim';
    const title = findSection(arr, beforeTitleArrPoint, 1)?.join(' ');

    // additional title for fallback older v1
    const beforeTitleArrPoint2 = isnumber;
    let _title2 = findSection(arr, beforeTitleArrPoint2, 1);

    _abstract  = _title2.findIndex(o => o.toLowerCase().startsWith(abstractArrPoint.toLowerCase()));
    _abstract2 = _title2.findIndex(o => o.startsWith(abstractArrPoint2));
    _keywords  = _title2.findIndex(o => o.toLowerCase().startsWith(keywordsArrPoint.toLowerCase()));

    // handle if the title includes abstract and keywords
    if (_abstract > -1 || _abstract2 > -1 || _keywords > -1) {
        
        // when to start and when to stop
        const startTitle = 0;
        const lastTitle = _title2.slice(startTitle)?.findIndex(o => isnumber(o)); // numbering for author
        // 0, 1, 2, 3, 4
        // 1 -> 3
        // 1 + 1
        // 3
        // 2, 3, 4
        // 1
        title2 = _title2.slice(startTitle, (startTitle + lastTitle - 1))?.join(' ');

        if (_abstract > -1) {
            // when to start and when to stop
            const lastAbstract = _title2?.findIndex(o => o.toLowerCase().startsWith(keywordsArrPoint.toLowerCase())); // touching the kata kunci
            _abstract = handleAbstract(_title2.slice(_abstract, lastAbstract)?.join(' '), abstractArrPoint);
        }

        if (_abstract2 > -1) {
            // when to start and when to stop
            const lastAbstract2 = _title2?.findIndex(o => o.toLowerCase().startsWith(keywordsArrPoint.toLowerCase())); // touching the kata kunci
            _abstract2 = handleAbstract(_title2.slice(_abstract2, lastAbstract2)?.join(' '), abstractArrPoint2);
        }

        if (_keywords > -1) {
            // when to start and assuming that it's the last in the array so no need to pass end argument
            const lastKeywords = _title2?.findIndex(o => o.toLowerCase().startsWith('I. PENDAHULUAN'.toLowerCase())); // touching the kata kunci
            _keywords = handleKeywords(_title2.slice(_keywords, lastKeywords)?.join(' '), keywordsArrPoint);
        }

    } else {
        title2 = _title2?.join(' ');
    }

    // extracting abstract
    let abstract;
    let abstract2;
    if (_abstract < 0 && _abstract2 < 0) {
        abstract = handleAbstract(findSection(arr, abstractArrPoint, 0, true)?.join(' '), abstractArrPoint);
        // additional abstract for older version (early v1)
        abstract2 = handleAbstract(findSection(arr, abstractArrPoint2)?.join(' '), abstractArrPoint2);
    } else {
        abstract = _abstract || _abstract2;
    }

    // extracting keywords (v1 keyword is a sentence or row based position)
    let keywords;
    if (_keywords < 0) {
        let findKeywords = findSection(arr, keywordsArrPoint);

        // handle undefined for the first time, retrying using another point
        if (!findKeywords) {
            keywordsArrPoint = 'Keyword';
            findKeywords = findSection(arr, keywordsArrPoint);
        }
        
        const lastKeywords = findKeywords?.findIndex(o => o.toLowerCase().startsWith(keywordsArrStoppingPoint.toLowerCase())); // touching the kata kunci
        const daKeywords = lastKeywords > -1 ? findKeywords?.slice(0, lastKeywords) : findKeywords;
        keywords = handleKeywords(daKeywords?.join(' '), keywordsArrPoint);
    } else {
        keywords = _keywords;
    }
    // console.log(arr);

    console.log(`Done using parser v1`);
    return ({ title: title || title2, abstract: abstract || abstract2, keywords });
}

const parseV2 = (arr, lang) => {
    const handleKeywords = (str, point) => {
        const beforeSplit = str?.replace(new RegExp(point, 'i'), '')
        .replace('– ', '').replace('—', '').replace('-', '') // the first one for older v1
        const splitted = beforeSplit?.split(',').length - 1 > beforeSplit?.split(';').length - 1
            ? beforeSplit?.split(',') : beforeSplit?.split(';');
        
        return splitted?.map(o => o?.replace(':', '')?.paripurna())?.filter(o => o);
    }

    console.log(`Starting using parser v2`);
    // console.log(arr, lang);

    const keywordsArrPoint = lang === 'en' ? 'Keywords' : 'Kata kunci';
    const keywordsArrStoppingPoint = 'I. ';

    // extracting title
    const beforeTitleArrPoint = lang === 'en' ? 'Received' : 'Makalah dikirim';
    const title = findSection(arr, beforeTitleArrPoint, 1).join(' ');

    // extracting abstract
    const abstractArrPoint = lang === 'en' ? 'Abstract' : 'Abstrak';
    const findAbstract = findSection(arr, abstractArrPoint)

    const lastAbstract = findAbstract?.findIndex(o => o.toLowerCase().startsWith(keywordsArrPoint.toLowerCase()));  // touching the kata kunci
    const daAbstract   = lastAbstract > -1 ? findAbstract?.slice(0, lastAbstract) : findAbstract;
    const abstract     = daAbstract.join(' ')
        .replace(abstractArrPoint, '').paripurna().replace('- ', '');

    // extracting keywords (v2 keyword is a sentence or row based position)
    const findKeywords = findSection(arr, keywordsArrPoint)
    const firstKeyword = findKeywords?.findIndex(o => o.toLowerCase().startsWith(keywordsArrPoint.toLowerCase()));          // touching the kata kunci
    const lastKeyword  = findKeywords?.findIndex(o => o.toLowerCase().startsWith(keywordsArrStoppingPoint.toLowerCase()));  // touching the kata kunci
    const daKeywords   = lastKeyword > -1 ? findKeywords?.slice(firstKeyword, lastKeyword) : findKeywords;

    const keywords = handleKeywords(daKeywords.join(' '), keywordsArrPoint)

    console.log(`Done using parser v2`);

    return ({ title, abstract, keywords });
}

const parseV3 = (arr,_) => {
    console.log(`Starting using parser v3`);
    // console.log(arr);

    const keywordsArrPoint = 'Keywords';
    const keywordsArrStoppingPoint = 'Corresponding Author';

    // extracting title
    const beforeTitleArrPoint = isnumber;
    const title = findSection(arr, beforeTitleArrPoint, 1).join(' ');

    // extracting abstract and keywords (for v3, the abstract and keywords are on the same side) and no bahasa
    const beforeAbstractArrPoint = 'Article Info';
    // console.log(findSection(arr, beforeAbstractArrPoint, 1))
    const [ _abstract, _keywords ] = grouparray(findSection(arr, beforeAbstractArrPoint, 1), keywordsArrPoint, true);

    // handle keywords mixed with corresponding authors
    const firstKeyword = _keywords?.findIndex(o => o.toLowerCase().startsWith(keywordsArrPoint.toLowerCase()));          // touching the kata kunci
    const lastKeyword  = _keywords?.findIndex(o => o.toLowerCase().startsWith(keywordsArrStoppingPoint.toLowerCase()));  // touching the kata kunci
    const daKeywords   = lastKeyword > -1 ? _keywords?.slice(firstKeyword, lastKeyword) : _keywords;
    const keywords     = daKeywords.join(',')
        .replace(keywordsArrPoint, '').replace(':', '').replace('- ', '')
        .split(',').map(o => o?.paripurna()).filter(o => o);
    // console.log({ firstKeyword, lastKeyword, daKeywords, _keywords })

    const abstract = _abstract.join(' ');

    console.log(`Done using parser v3`);

    return { title, abstract, keywords };
}

module.exports = async (url, lang) => {
    // Juli 2020 V3
    // const url = 'https://join.if.uinsgd.ac.id/index.php/join/article/download/569/145';
    // Desember 2017 V2
    // const url = 'https://join.if.uinsgd.ac.id/index.php/join/article/download/v2i21/68';
    // Juli 2017 V1
    // const url = 'https://join.if.uinsgd.ac.id/index.php/join/article/download/v2i12/85-pdf/241';

    // download the pdf file
    const pdfData = await downloader(url);

    // parse pdf to array and clean it from any whitespaces and unwanted characters
    let arrPdf = await pdf(pdfData.data);
    arrPdf = splitlines(arrPdf.text).filter(o => o);
    // arrPdf = splitlines(arrPdf.text).filter(o => o?.paripurna());

    // getting publish date to determine document version
    const documentVersion = version(arrPdf, lang);
    // console.log({ documentVersion });

    // document version cannot be detrmined
    if (!documentVersion) {
        return;
    }

    const groupedArrPdf = grouparray(arrPdf);

    const parser = (documentVersion === 3 ? parseV3 : (documentVersion === 2 ? parseV2 : parseV1))
    const parsedDoc = parser(groupedArrPdf, lang);
    console.log(`====================== END =======================`);

    return parsedDoc;
}