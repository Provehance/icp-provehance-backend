import {
    Server,
    serialize
} from 'azle';
import express from 'express';

export default Server(() => {
    const app = express();

    app.use(express.json());

    async function getAccounts(access_token: string) {
        const authorization = 'Bearer ' + access_token;

        const response = await fetch(`icp://aaaaa-aa/http_request`, {
            body: serialize({
                args: [
                    {
                        url: `https://buildhathon-sandbox.biapi.pro/2.0/users/me/accounts`,
                        max_response_bytes: [],
                        method: {
                            get: null
                        },
                        headers: [
                            {name: 'Authorization', value: authorization},
                            {name: 'Content-Type', value: 'application/json'}
                        ],
                        body: [],
                        transform: []
                    }
                ],
                cycles: 2000000000
            })
        });

        return await response.json();
    }

    app.post('/web2/accounts', async (req, res) => {
        const { access_token } = req.body;

        try {
            const balanceData = await getAccounts(access_token);
            const serializedData = JSON.parse(Buffer.from(balanceData.body).toString('utf-8'));
            res.json(serializedData);
        } catch (error: any) {
            const errorTxt = 'Error fetching accounts: ' + error.message;
            res.status(500).json({ error: errorTxt });
        }
    });

    app.use(express.static('/dist'));

    return app.listen();
});
