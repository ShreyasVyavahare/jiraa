// Load environment variables
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

// Configuration variables from environment
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const ABUSE_API = process.env.ABUSE_API;
const POLL_INTERVAL = process.env.POLL_INTERVAL || 5;

// Create authentication token for JIRA
const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');


async function fetchJiraTickets() {
    try {
        // Get tickets from JIRA
        const response = await axios.get(
            `${JIRA_BASE_URL}/rest/api/3/search?jql=project=${JIRA_PROJECT_KEY} ORDER BY created DESC`, 
            {
                headers: {
                    'Authorization': `Basic ${jiraAuth}`,
                    'Accept': 'application/json'
                }
            }
        );

        const tickets = response.data.issues;
        console.log(`Fetched ${tickets.length} tickets from JIRA.`);

        // Process each ticket
        for (let ticket of tickets) {
            const title = ticket.fields.summary;
            const ticketId = ticket.key;

            // Look for IP addresses in the ticket title
            const ipMatch = title.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
            if (ipMatch) {
                const ip = ipMatch[0];
                console.log(`Found IP in ticket ${ticketId}: ${ip}`);
                await enrichTicketWithAbuseIPDB(ticketId, ip);
            }
        }
    } catch (error) {
        console.error('Error fetching JIRA tickets:', error.response?.data || error.message);
    }
}

// Get IP information from AbuseIPDB
async function enrichTicketWithAbuseIPDB(ticketId, ip) {
    try {
       
        const response = await axios.get(ABUSE_API, {
            headers: {
                'Key': ABUSEIPDB_API_KEY,
                'Accept': 'application/json'
            },
            params: {
                ipAddress: ip,
                maxAgeInDays: 90
            }
        });

        // Format the data for the JIRA comment
        const abuseData = response.data.data;
        const comment = `
        IP Address: ${ip}
        Abuse Confidence Score: ${abuseData.abuseConfidenceScore}
        ISP: ${abuseData.isp}
        Domain: ${abuseData.domain}
        Country: ${abuseData.countryCode}
        Total Reports: ${abuseData.totalReports}
        `;

        // Add the data as a comment to the JIRA ticket
        await addJiraComment(ticketId, comment);

    } catch (error) {
        console.error(`Error fetching IP data for ${ip}:`, error.response?.data || error.message);
    }
}

// Add a comment to a JIRA ticket with proper formatting
async function addJiraComment(ticketId, commentText) {
    try {
        // Create a properly formatted JIRA document with bold labels
        const paragraphs = commentText.trim().split('\n').filter(line => line.trim());
        
        // Build content array for Atlassian Document Format
        const content = paragraphs.map(paragraph => {
            // Split each line into label and value
            const parts = paragraph.trim().split(':');
            
            if (parts.length >= 2) {
                const label = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                
                return {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: label + ": ",
                            marks: [{ type: "strong" }]  // This makes text bold
                        },
                        {
                            type: "text",
                            text: value
                        }
                    ]
                };
            } else {
                // If not in label:value format, just display as regular text
                return {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: paragraph.trim()
                        }
                    ]
                };
            }
        });

        await axios.post(
            `${JIRA_BASE_URL}/rest/api/3/issue/${ticketId}/comment`,
            {
                body: {
                    type: "doc",
                    version: 1,
                    content: content
                }
            },
            {
                headers: {
                    Authorization: `Basic ${jiraAuth}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(`✅ Comment added to ${ticketId}`);
    } catch (error) {
        console.error(`❌ Error adding comment to ${ticketId}:`, error.response?.data || error.message);
    }
}

// Set up the scheduled task to run at regular intervals
cron.schedule(`*/${POLL_INTERVAL} * * * *`, async () => {
    console.log('Checking JIRA tickets for IPs...');
    await fetchJiraTickets();
});

// Startup message
console.log(`JIRA Enrichment Service started! Polling every ${POLL_INTERVAL} minutes...`);