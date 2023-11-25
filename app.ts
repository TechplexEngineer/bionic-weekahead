import 'dotenv/config'

import { getTeamCalendarEvents } from "./calendar";
import { getUpcomingWeekEvents } from "./frc";

const frcEvents = await getUpcomingWeekEvents();

const teamEvents = await getTeamCalendarEvents();

const events = [...frcEvents, ...teamEvents];

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
                    "text": events.map(e => `- ${e.link ? `<${e.link}|${e.title}>` : e.title} ${e.endDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}`).join("\n")
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


