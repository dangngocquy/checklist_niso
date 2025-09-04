const { connectDB } = require('./MongoDB/database');

// Get login history from LOGIN_HISTORY collection
exports.getHistorylogin = async (req, res) => {
  try {
    const collection = await connectDB('LOGIN_HISTORY');
    const keys = req.query.keys;

    // Create query object only when keys are provided
    const matchQuery = keys ? { keysJSON: keys } : {};

    // Use aggregation to group by Vitri, Hedieuhanh, Trinhduyet, Thietbi and get the latest entry
    const loginHistory = await collection.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            Vitri: "$Vitri",
            Hedieuhanh: "$Hedieuhanh",
            Trinhduyet: "$Trinhduyet",
            Thietbi: "$Thietbi",
            keysJSON: "$keysJSON"
          },
          latestThoigian: { $max: "$Thoigian" },
          latestEntry: { $first: "$$ROOT" } // Keep the entire document of the latest entry
        }
      },
      {
        $replaceRoot: { newRoot: "$latestEntry" } // Restore the original document structure
      },
      {
        $project: {
          _id: 1,
          Thoigian: 1,
          Thietbi: 1,
          Trinhduyet: 1,
          Hedieuhanh: 1,
          Vitri: 1,
          keysJSON: 1
        }
      },
      { $sort: { Thoigian: -1 } } // Sort by Thoigian descending
    ]).toArray();

    if (!loginHistory || loginHistory.length === 0) {
      return res.status(404).json({ message: 'No login history found' });
    }

    res.json(loginHistory);
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Add login history to LOGIN_HISTORY collection
exports.postHistorylogin = async (req, res) => {
  const { Thoigian, Thietbi, Trinhduyet, Hedieuhanh, Vitri, keysJSON } = req.body;

  try {
    // Use Promise.all to run queries in parallel
    const [userCollection, loginHistoryCollection] = await Promise.all([
      connectDB('CHECKLIST_DATABASE'),
      connectDB('LOGIN_HISTORY')
    ]);

    // Check if user exists with lean query (projection)
    const user = await userCollection.findOne({ keys: keysJSON }, { projection: { _id: 1 } });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Standardize date format before inserting
    const formattedTime = standardizeTimeFormat(Thoigian);

    const newEntry = {
      Thoigian: formattedTime,
      Thietbi,
      Trinhduyet,
      Hedieuhanh,
      Vitri,
      keysJSON,
      createdAt: new Date()
    };

    await loginHistoryCollection.insertOne(newEntry);
    res.send('Login history added successfully');
  } catch (error) {
    console.error(`Error adding login history: ${error}`);
    res.status(500).send('Internal Server Error');
  }
};

// Update or add new login history entry in LOGIN_HISTORY collection
exports.putHistorylogin = async (req, res) => {
  const { Thoigian, Thietbi, Trinhduyet, Hedieuhanh, Vitri, keysJSON } = req.body;

  try {
    // Use Promise.all to run queries in parallel
    const [userCollection, loginHistoryCollection] = await Promise.all([
      connectDB('CHECKLIST_DATABASE'),
      connectDB('LOGIN_HISTORY')
    ]);

    // Check if user exists with lean query
    const user = await userCollection.findOne({ keys: keysJSON }, { projection: { _id: 1 } });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Standardize date format
    const formattedTime = standardizeTimeFormat(Thoigian);

    // Use upsert to simplify the logic and reduce database calls
    const result = await loginHistoryCollection.updateOne(
      {
        keysJSON,
        Thietbi,
        Trinhduyet,
        Hedieuhanh,
        Vitri
      },
      {
        $set: {
          Thoigian: formattedTime,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      res.send('New login history entry created successfully');
    } else {
      res.send('Login history updated successfully');
    }
  } catch (error) {
    console.error(`Error updating login history: ${error}`);
    res.status(500).send('Internal Server Error');
  }
};

// Helper function to standardize time format
function standardizeTimeFormat(timeString) {
  try {
    if (!timeString) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    }

    // Check if format is DD-MM-YYYY HH:mm:ss
    const parts = timeString.split(' ');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const [day, month, year] = datePart.split('-');
      if (day && month && year && timePart.match(/^\d{2}:\d{2}:\d{2}$/)) {
        // Convert to YYYY-MM-DD HH:mm:ss format
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`;
      }
    }

    // If format is already YYYY-MM-DD HH:mm:ss, validate and return
    if (timeString.match(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/)) {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return timeString;
      }
    }

    // Fallback to current time if format is invalid
    console.warn('Invalid time format, using current time:', timeString);
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error standardizing time format:', error);
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  }
}