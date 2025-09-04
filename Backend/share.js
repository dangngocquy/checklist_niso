const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const filePath = path.join(__dirname, '../src/data/share.json');

exports.getShare = (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        let dataArray = [];

        if (data) {
            try {
                dataArray = JSON.parse(data);
                if (!Array.isArray(dataArray)) {
                    dataArray = [];
                }
            } catch (parseError) {
                console.error(parseError);
                return res.status(400).send('Invalid data format');
            }
        }

        res.json(dataArray);
    });
};


exports.putShare = (req, res) => {
    const { id, idchecklist, keysaccount } = req.body;

    fs.readFile(filePath, 'utf8', (err, existingData) => {
        if (err && err.code !== 'ENOENT') {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        let dataArray = [];

        if (existingData) {
            try {
                dataArray = JSON.parse(existingData);
                if (!Array.isArray(dataArray)) {
                    dataArray = [];
                }
            } catch (parseError) {
                console.error(parseError);
                return res.status(400).send('Invalid data format');
            }
        }

        const shareIndex = dataArray.findIndex(item => item.id === id);

        if (shareIndex === -1) {
            return res.status(404).send('Share not found');
        }

        dataArray[shareIndex] = { id, idchecklist, keysaccount };

        fs.writeFile(filePath, JSON.stringify(dataArray, null, 2), err => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json(dataArray);
        });
    });
};

exports.postShare = (req, res) => {
    const { idchecklist, keysaccount } = req.body;

    fs.readFile(filePath, 'utf8', (err, existingData) => {
        if (err && err.code !== 'ENOENT') {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        let dataArray = [];

        if (existingData) {
            try {
                dataArray = JSON.parse(existingData);
                if (!Array.isArray(dataArray)) {
                    dataArray = [];
                }
            } catch (parseError) {
                console.error(parseError);
                return res.status(400).send('Invalid data format');
            }
        }

        const newShare = {
            id: uuidv4(),
            idchecklist,
            keysaccount
        };

        dataArray.push(newShare);

        fs.writeFile(filePath, JSON.stringify(dataArray, null, 2), err => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json(dataArray);
        });
    });
};
