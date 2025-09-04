const express = require('express');
const { connectDB, closeConnection } = require('./MongoDB/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const app = express();
app.use(express.json());

// Sử dụng một kết nối DB được chia sẻ thay vì tạo mới mỗi lần
let dbCollection = null;

// Hàm khởi tạo kết nối cơ sở dữ liệu
const initializeDbConnection = async (collectionName) => {
    try {
        if (!dbCollection) {
            dbCollection = await connectDB(collectionName);
        }
        return dbCollection;
    } catch (error) {
        console.error('Failed to initialize database connection:', error);
        throw error;
    }
};

// Hàm lấy collection từ kết nối đã được thiết lập
const getCollection = async (collectionName) => {
    try {
        const collection = await initializeDbConnection(collectionName);
        return collection;
    } catch (error) {
        console.error(`Error getting collection ${collectionName}:`, error);
        throw error;
    }
};

exports.getSlider = async (req, res) => {
    try {
        const collection = await getCollection('SLIDER');
        const carouselData = await collection.find().sort({ date: -1 }).toArray();
        res.json(carouselData);
    } catch (err) {
        console.error('Error in getSlider:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.postSlider = async (req, res) => {
    const { title, imageUrl } = req.body;

    if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: 'imageUrl is required and must be a string' });
    }

    try {
        const collection = await getCollection('SLIDER');
        const date = new Date();
        const formattedDate = moment(date).format('DD/MM/YYYY HH:mm:ss');
        const newSlider = {
            id: uuidv4(),
            title: title || '',
            imageUrl,
            date: formattedDate,
        };

        await collection.insertOne(newSlider);
        res.status(201).json(newSlider);
    } catch (err) {
        console.error('Error in postSlider:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.putSlider = async (req, res) => {
    const { id } = req.params;
    const { title, imageUrl } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }
    if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: 'imageUrl is required and must be a string' });
    }

    try {
        const collection = await getCollection('SLIDER');
        const updatedSlider = {
            title: title || '',
            imageUrl,
            date: moment(new Date()).format('DD/MM/YYYY HH:mm:ss'),
        };

        const result = await collection.updateOne(
            { id },
            { $set: updatedSlider }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Slider item not found' });
        }

        res.json({
            data: { id, ...updatedSlider },
        });
    } catch (err) {
        console.error('Error in putSlider:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteSlider = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }

    try {
        const collection = await getCollection('SLIDER');
        const result = await collection.deleteOne({ id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Slider item not found' });
        }

        res.json({ message: 'Xóa slide thành công.' });
    } catch (err) {
        console.error('Error in deleteSlider:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Xử lý đóng kết nối khi ứng dụng tắt
process.on('SIGINT', async () => {
    try {
        await closeConnection();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error closing database connection:', error);
        process.exit(1);
    }
});