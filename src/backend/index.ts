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
                        url: `https://oxeniotna-sandbox.biapi.pro/2.0/users/me/accounts`,
                        max_response_bytes: [],
                        method: {
                            get: null
                        },
                        headers: [
                            { name: 'Authorization', value: authorization },
                            { name: 'Content-Type', value: 'application/json' }
                        ],
                        body: [],
                        transform: []
                    }
                ],
                cycles: 30000000000
            })
        });

        return await response.json();
    }

    async function getTransactions(access_token: string) {
        const authorization = 'Bearer ' + access_token;

        const response = await fetch(`icp://aaaaa-aa/http_request`, {
            body: serialize({
                args: [
                    {
                        url: `https://oxeniotna-sandbox.biapi.pro/2.0/users/me/transactions?limit=1000`,
                        max_response_bytes: [],
                        method: {
                            get: null
                        },
                        headers: [
                            { name: 'Authorization', value: authorization },
                            { name: 'Content-Type', value: 'application/json' }
                        ],
                        body: [],
                        transform: []
                    }
                ],
                cycles: 30000000000
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

    app.post('/web2/transactions', async (req, res) => {
        const { access_token, amount, name, condition } = req.body;

        try {
            const transactions = await getTransactions(access_token);
            const serializedData = JSON.parse(Buffer.from(transactions.body).toString('utf-8'));

            let validTransactions: any[] = [];

            serializedData.transactions.map((transaction: any) => {
                if (transaction.wording == name) {
                    if (condition == "low" && Math.abs(transaction.value) < amount) {
                        validTransactions.push(transaction);
                    }
                    else if (condition == "high" && Math.abs(transaction.value) > amount) {
                        validTransactions.push(transaction);
                    }
                    else if (condition == "equl" && Math.abs(transaction.value) == amount) {
                        validTransactions.push(transaction);
                    }
                }
            })

            res.json(validTransactions);

        } catch (error: any) {
            const errorTxt = 'Error fetching transactions: ' + error.message;
            res.status(500).json({ error: errorTxt });
        }
    });

    app.post('/web2/creditscore', (req, res) => {
        const { access_token } = req.body;

        function normalize(value: number, min: number, max: number): number {
            return (value - min) / (max - min);
        }

        // Not implemented yet: this data needs be performed by an AI for categorization of bank transactions
        let income = 3000
        let creditHistory = 3
        let jobStability = 2

        const incomeWeight = 0.4;
        const creditHistoryWeight = 0.3;
        const jobStabilityWeight = 0.3;

        const normalizedIncome = normalize(income, 1000, 10000);
        const normalizedCreditHistory = normalize(creditHistory, 0, 10);
        const normalizedJobStability = normalize(jobStability, 0, 5);

        const score = (normalizedIncome * incomeWeight) +
            (normalizedCreditHistory * creditHistoryWeight) +
            (normalizedJobStability * jobStabilityWeight);

        const normalizedScore = normalize(score, 0, 10);

        res.json(normalizedScore)
    });

    app.use(express.static('/dist'));

    return app.listen();
});
