const axios = require('axios');
const { addJiraComment } = require('./index');

// filepath: /C:/Users/copyn/OneDrive/Desktop/Jira/index.test.js
jest.mock('axios');

describe('addJiraComment', () => {
    const ticketId = 'TEST-123';
    const commentText = `
    IP Address: 192.168.1.1
    Abuse Confidence Score: 100
    ISP: Test ISP
    Domain: test.com
    Country: US
    Total Reports: 10
    `;

    it('should add a comment to a JIRA ticket successfully', async () => {
        axios.post.mockResolvedValue({ data: {} });

        await addJiraComment(ticketId, commentText);

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining(`/rest/api/3/issue/${ticketId}/comment`),
            expect.objectContaining({
                body: {
                    type: "doc",
                    version: 1,
                    content: expect.any(Array)
                }
            }),
            expect.objectContaining({
                headers: {
                    Authorization: expect.stringContaining('Basic '),
                    "Content-Type": "application/json"
                }
            })
        );
    });

    it('should handle errors when adding a comment to a JIRA ticket', async () => {
        const errorMessage = 'Error adding comment';
        axios.post.mockRejectedValue(new Error(errorMessage));

        console.error = jest.fn();

        await addJiraComment(ticketId, commentText);

        expect(console.error).toHaveBeenCalledWith(
            `❌ Error adding comment to ${ticketId}:`,
            errorMessage
        );
    });
});