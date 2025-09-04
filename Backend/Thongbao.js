const { connectDB } = require('./MongoDB/database');

exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 6 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const userKeys = req.user?.keys; // Giả sử từ middleware auth
  const userPhanquyen = req.user?.phanquyen;

  try {
    const collection = await connectDB("THONGBAO");

    const restrictedEvents = [
      "CREATE_DEPARTMENT", "UPDATE_DEPARTMENT", "DELETE_DEPARTMENT", "CREATE_DEPARTMENT_BATCH", "DELETE_DEPARTMENT_BATCH",
      "CREATE_CHINHANH", "UPDATE_CHINHANH", "DELETE_CHINHANH", "CREATE_CHINHANH_BATCH", "DELETE_CHINHANH_BATCH",
      "CREATE_ACCOUNT", "UPDATE_ACCOUNT", "DELETE_ACCOUNT", "CREATE_ACCOUNT_BATCH", "DELETE_ACCOUNT_BATCH",
      "UPDATE_PERMISSIONS_USER", "UPDATE_PERMISSIONS_DEPARTMENT", "UPDATE_PERMISSIONS_RESTAURANT", "UPDATE_BATCH_PERMISSIONS",
      "CREATE_MODULE", "TRANSFER_CHINHANH"
    ];

    // Create query based on user permissions
    const query = userPhanquyen ? {} : { event: { $nin: restrictedEvents } };

    // Use aggregation for better performance
    const [notificationsResult, totalResult, unreadTotalResult] = await Promise.all([
      // Get paginated notifications
      collection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),

      // Get total count with projection to minimize data transfer
      collection.countDocuments(query),

      // Get unread count with projection
      collection.countDocuments({
        ...query,
        readBy: { $ne: userKeys }
      })
    ]);

    res.json({
      notifications: notificationsResult,
      total: totalResult,
      unreadTotal: unreadTotalResult,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const userKeys = req.body.userKeys;

  try {
    const collection = await connectDB("THONGBAO");

    // Use findOneAndUpdate to reduce DB operations to just one
    const result = await collection.findOneAndUpdate(
      { id, readBy: { $ne: userKeys } }, // Only update if not already read
      { $addToSet: { readBy: userKeys } },
      { returnDocument: 'after', projection: { readBy: 1 } } // Return only what's needed
    );

    if (!result.value) {
      // Check if notification exists at all
      const exists = await collection.findOne({ id }, { projection: { _id: 1 } });
      if (!exists) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Notification exists but was already read by this user
      return res.json({
        message: "Notification was already marked as read for user",
        readBy: (await collection.findOne({ id }, { projection: { readBy: 1 } }))?.readBy || []
      });
    }

    res.json({
      message: "Notification marked as read for user",
      readBy: result.value.readBy
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  const userKeys = req.body.userKeys;
  const userPhanquyen = req.body.phanquyen;

  try {
    const collection = await connectDB("THONGBAO");

    const restrictedEvents = [
      "CREATE_DEPARTMENT", "UPDATE_DEPARTMENT", "DELETE_DEPARTMENT", "CREATE_DEPARTMENT_BATCH", "DELETE_DEPARTMENT_BATCH",
      "CREATE_CHINHANH", "UPDATE_CHINHANH", "DELETE_CHINHANH", "CREATE_CHINHANH_BATCH", "DELETE_CHINHANH_BATCH",
      "CREATE_ACCOUNT", "UPDATE_ACCOUNT", "DELETE_ACCOUNT", "CREATE_ACCOUNT_BATCH", "DELETE_ACCOUNT_BATCH",
      "UPDATE_PERMISSIONS_USER", "UPDATE_PERMISSIONS_DEPARTMENT", "UPDATE_PERMISSIONS_RESTAURANT", "UPDATE_BATCH_PERMISSIONS",
      "CREATE_MODULE", "TRANSFER_CHINHANH"
    ];

    // Create query based on user permissions
    const query = userPhanquyen
      ? { readBy: { $ne: userKeys } }
      : { event: { $nin: restrictedEvents }, readBy: { $ne: userKeys } };

    // Get count before update for reporting
    const countToUpdate = await collection.countDocuments(query);

    // Only perform update if there are documents to update
    let modifiedCount = 0;
    if (countToUpdate > 0) {
      const result = await collection.updateMany(
        query,
        { $addToSet: { readBy: userKeys } }
      );
      modifiedCount = result.modifiedCount;
    }

    res.json({
      message: `Đã đánh dấu ${modifiedCount} thông báo là đã đọc`,
      modifiedCount: modifiedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};