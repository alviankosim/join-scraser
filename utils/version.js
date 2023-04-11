const { DateTime } = require("luxon");

// version changes
const v2StartDate = '2017-12-02';
const v3StartDate = '2020-07-02';

module.exports = (arr, lang) => {
    let documentVersion;

    const findPublishedVersion = arr.findIndex(o => o.toLowerCase().startsWith('article info '));
    if (findPublishedVersion > -1) {
        documentVersion = 3;// published >= July 2020
    } else {
        const points = {
            received    : lang === 'en' ? 'Received' : 'Makalah dikirim',
            slicing     : lang === 'en' ? -2 : -3,
            splitWord   : lang === 'en' ? 'Published' : 'Publish',
            dateFormat  : lang === 'en' ? "LLLL dd,yyyy" : "dd LLLL yyyy",
            param       : lang === 'en' ? {} : { locale: "id" }
        };
        const findPublishedVersion1or2 = arr.findIndex(o => o.startsWith(points.received));
        // console.log({ findPublishedVersion1or2 });
        
        if (findPublishedVersion1or2 > -1) {

            const linePublish = arr[findPublishedVersion1or2]
                .split(points.splitWord)[1].trim()
                .split(' ').slice(points.slicing)
                .join(' ').trim();

            const publishedDateFormat = points.dateFormat;
            const datePublish = DateTime.fromFormat(linePublish, publishedDateFormat, points.param);
            // console.log({ datePublish, linePublishs: arr[findPublishedVersion1or2].split(points.splitWord)[1].trim().split(' ').slice(points.slicing) })
            if (datePublish.startOf("day") >= DateTime.fromISO(v2StartDate).startOf("day")) {
                documentVersion = 2;// published >= December 2017
            } else if (datePublish.startOf("day") < DateTime.fromISO(v2StartDate).startOf("day")) {
                documentVersion = 1;    
            } else {
                // default fallback to v1
                documentVersion = 1;
            }
        } else {
            // default fallback to v1
            documentVersion = 1;
        }

    }

    return documentVersion;
}