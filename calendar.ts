import * as ical from 'node-ical';
import moment from 'moment-timezone';

const calendarUrl = 'https://calendar.google.com/calendar/ical/team4909%40gmail.com/public/basic.ics';


// Function to filter events for this week
function filterEventsForThisWeek(events) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Get the date for next week

    return events
        .flatMap(event => {
            if (event.type !== 'VEVENT') {
                return [];
            }

            if (event.rrule) {
                const occurrences: Date[] = event.rrule.between(today, nextWeek);
                // if (occurrences.length > 0) {
                //     console.log('Occurrences:', occurrences.map(date => date.toLocaleString()));
                //     console.log('Event:', JSON.stringify(event, null, 4));
                // }

                return occurrences.map(date => {
                    let newDate;
                    if (event.rrule.origOptions.tzid) {
                        // tzid present (calculate offset from recurrence start)
                        const dateTimezone = moment.tz.zone('UTC')
                        if (!dateTimezone) {
                            throw new Error(`Invalid timezone: 'UTC'`)
                        }
                        const localTimezone = moment.tz.guess()
                        // console.log('localTimezone', localTimezone);
                        // console.log('event.rrule.origOptions', event.rrule.origOptions);
                        
                        const tz = event.rrule.origOptions.tzid === localTimezone ? event.rrule.origOptions.tzid : localTimezone
                        const timezone = moment.tz.zone(tz);
                        if (!timezone) {
                            throw new Error(`Invalid timezone: ${tz}`)
                        }
                        // console.log('timezone.utcOffset(date)', timezone.utcOffset(date.getTime()));
                        // console.log('dateTimezone.utcOffset(date)', dateTimezone.utcOffset(date.getTime()));
                        // console.log('moment(date).isDST()', moment(date).isDST());
                        // console.log('moment(dtstart).isDST()', moment(event.rrule.origOptions.dtstart).isDST());

                        const offset = timezone.utcOffset(date.getTime()) - timezone.utcOffset(event.rrule.origOptions.dtstart.getTime())
                        newDate = moment(date).add(offset, 'minutes').toDate()
                    } else {
                        // tzid not present (calculate offset from original start)                        
                        newDate = new Date(date.setHours(date.getHours() - ((event.start.getTimezoneOffset() - date.getTimezoneOffset()) / 60)))
                    }
                    // const start = moment(newDate)
                    return ({ ...event, start: newDate });
                });
            } else {
                return [event];
            }
        })
        .filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            // Check if the event starts within this week
            if (eventStart >= today && eventStart < nextWeek) {
                return true;
            }

            // Check if the event ends within this week
            if (eventEnd >= today && eventEnd < nextWeek) {
                return true;
            }

            return false;
        });
}

export async function getTeamCalendarEvents(icalUrl = calendarUrl) {
    // Fetch the calendar data and filter events for this week
    const data = await ical.fromURL(icalUrl);

    const events = Object.values(data);
    const eventsThisWeek = filterEventsForThisWeek(events).sort((a, b) => a.start - b.start);
    return eventsThisWeek.map(event => ({
        title: event.summary,
        link: event.url,
        startDate: new Date(event.start),
        endDate: new Date(event.end)
    }));
}
// console.log('Events for this week:\n');
// eventsThisWeek.forEach(event => {
//     console.log('Event:', event.title);
//     console.log('\tStart:', event.startDate.toLocaleString());
//     console.log('\tEnd:', event.endDate.toLocaleString());
//     // console.log('\tRaw:', JSON.stringify(event, null, 4));
//     console.log('------------------------');
// });

