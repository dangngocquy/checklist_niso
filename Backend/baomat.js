
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const filePath = path.join(__dirname, '../src/data/baomat.json');


exports.getBaomat = (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        let giaoviecList = [];
        if (data) {
            try {
                giaoviecList = JSON.parse(data);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        res.status(200).json({ giaoviecList });
    });
};

exports.postBaomat = (req, res) => {
    const { cauhoi, cautraloi, tokenID, idkeys, account } = req.body;

    const id = uuidv4();

    fs.access(filePath, fs.constants.F_OK, (accessErr) => {
        if (accessErr) {
            console.error('Error accessing file:', accessErr);
            return res.status(500).json({ error: 'Internal server error' });
        }
        fs.readFile(filePath, 'utf8', (readErr, data) => {
            if (readErr) {
                console.error('Error reading file:', readErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            let giaoviecList = [];
            if (data) {
                try {
                    giaoviecList = JSON.parse(data);
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    return res.status(500).json({ error: 'Internal server error' });
                }
            }

            const newGiaoviec = { id, cauhoi, cautraloi, tokenID, idkeys, account };
            giaoviecList.push(newGiaoviec);

            fs.writeFile(filePath, JSON.stringify(giaoviecList, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error writing file:', writeErr);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                res.status(201).json({ message: 'Công việc đã được thêm thành công', giaoviec: newGiaoviec });
            });
        });
    });
};
