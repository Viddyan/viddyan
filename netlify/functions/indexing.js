const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

const KEY_FILE_PATH = './service-account.json'; // Upload to Netlify (Environment Variables recommended)
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

async function getAuthClient() {
    const auth = new GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: SCOPES,
    });
    return await auth.getClient();
}

async function sendToIndexingAPI(url) {
    const authClient = await getAuthClient();
    const ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
    
    const requestBody = {
        url: url,
        type: 'URL_UPDATED',
    };

    const res = await axios.post(ENDPOINT, requestBody, {
        headers: { Authorization: `Bearer ${await authClient.getAccessToken()}` },
    });

    return res.data;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { url } = JSON.parse(event.body);
        if (!url) {
            return { statusCode: 400, body: 'Missing URL' };
        }

        const response = await sendToIndexingAPI(url);
        return {
            statusCode: 200,
            body: JSON.stringify(response),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
