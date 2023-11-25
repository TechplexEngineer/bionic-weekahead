
export {};
import * as cheerio from 'cheerio';

async function downloadWebPageContent() {
    try {
        const response = await fetch('https://www.firstinspires.org/robotics/frc/calendar');
        const webpageContent = await response.text();
        return webpageContent;
    } catch (error) {
        console.error('Error downloading web page content:', error);
        return null;
    }
}

const webpageContent = await downloadWebPageContent();
// console.log(webpageContent);

const $ = cheerio.load(webpageContent);

const $events = $("#block-system-main .view-calendar tbody tr");

const events: {
    title: string
    link: string
    startDate: Date
    endDate: Date
    category: string
}[] = [];

for (const rawEvent of $events) {
    const $event = $(rawEvent);

    const title = $event.find(".views-field-title").text().trim();

    const link = "https://www.firstinspires.org" + $event.find(".views-field-title a").attr("href");

    const $startDate = $event.find(".views-field-field-event-date .date-display-start");
    const $endDate = $event.find(".views-field-field-event-date .date-display-end");
    const $singleDate = $event.find(".views-field-field-event-date .date-display-single");

    // use lambda functions to allow const correctness
    const startDate = (()=>{
        if ($singleDate.length == 1) {
            return $singleDate.attr("content")?.trim();
        }
        return $startDate.attr("content")?.trim();
    })();

    const endDate = (() => {
        if ($singleDate.length == 1) {
            return startDate;
        }
        return $endDate.attr("content")?.trim();
    })();

    
    const category = $event.find(".field-name-field-event-category").text().trim();

    // console.log('Event:');
    // console.log("\t title:", title);
    // console.log("\t link: ", link);
    // console.log("\t start:", startDate);
    // console.log("\t end:  ", endDate);
    // console.log("\t cat:  ", category);

    events.push({
        title,
        link,
        startDate: new Date(Date.parse(startDate!)),
        endDate: new Date(Date.parse(endDate!)),
        category
    })
} 

// Filter events for the upcoming week
const upcomingWeekEvents = events.filter(event => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    return event.startDate >= now && event.startDate <= oneWeekFromNow;
});

console.log('Events for the upcoming week:', JSON.stringify(upcomingWeekEvents, null, 4));

// Convert curl to fetch
const slackUrl = process.env.SLACK_WEBHOOK_URL;
const slackPayload = {
    // text: 'Hello, Slack!',
    blocks: [
     
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Events this week"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": upcomingWeekEvents.map(e => `- <${e.link}|${e.title}> ${e.endDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}`).join("\n")
                }
            ]
        }
         
    ]
};

fetch(slackUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(slackPayload)
}).then(response => {
    if (response.ok) {
        console.log('Message sent to Slack successfully.');
    } else {
        console.error('Failed to send message to Slack:', response.status, response.statusText);
    }
}).catch(error => {
    console.error('Error sending message to Slack:', error);
});


