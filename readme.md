# JIRA Enrichment Service

The JIRA Enrichment Service is a Node.js application that periodically checks JIRA tickets for IP addresses in their titles and enriches them with data from AbuseIPDB.

## Features

- Fetches tickets from JIRA based on a specified project key.
- Identifies IP addresses in ticket titles.
- Retrieves IP information from AbuseIPDB.
- Adds enriched data as comments to the corresponding JIRA tickets.
- Runs at regular intervals specified by the user.

## Prerequisites

- Node.js
- npm (Node Package Manager)

## Installation
 

1. Install the dependencies:
    ```sh
    npm install
    ```

2. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    JIRA_BASE_URL=your_jira_base_url
    JIRA_PROJECT_KEY=your_jira_project_key
    JIRA_EMAIL=your_jira_email
    JIRA_API_TOKEN=your_jira_api_token
    ABUSEIPDB_API_KEY=your_abuseipdb_api_key
    ABUSE_API=your_abuse_api_url
    POLL_INTERVAL=5
    ```

## Usage

1. Start the service:
    ```sh
    node index.js
    ```

2. The service will start polling JIRA tickets at the specified interval and enrich them with data from AbuseIPDB.

## License

This project is licensed under the MIT License.