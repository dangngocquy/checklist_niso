const { connectDB } = require('./MongoDB/database');
const { ObjectId } = require('mongodb');

const DEFAULT_PERMISSIONS = {
  account: ['Cho phép chấm công', 'Tạo công và quản lý ca làm việc', 'Tạo checklist', 'Sửa checklist', 'Xóa checklist', 'Cấu hình điểm nâng cao', 'Xóa phản hồi', 'Xem phản hồi', 'Xử lý phản hồi', 'Gán phản hồi', 'Quản lý báo cáo', 'Quản lý tài sản', 'Xóa tài sản', 'Kiểm kê tài sản', 'Tạo thông báo'],
  department: ['Cho phép chấm công', 'Tạo công và quản lý ca làm việc', 'Tạo checklist', 'Sửa checklist', 'Xóa checklist', 'Cấu hình điểm nâng cao', 'Xóa phản hồi', 'Xem phản hồi', 'Xử lý phản hồi', 'Gán phản hồi', 'Quản lý báo cáo', 'Quản lý tài sản', 'Xóa tài sản', 'Kiểm kê tài sản', 'Tạo thông báo'],
  restaurant: ['Cho phép chấm công', 'Tạo công và quản lý ca làm việc', 'Tạo checklist', 'Sửa checklist', 'Xóa checklist', 'Cấu hình điểm nâng cao', 'Xóa phản hồi', 'Xem phản hồi', 'Xử lý phản hồi', 'Gán phản hồi', 'Quản lý báo cáo', 'Quản lý tài sản', 'Xóa tài sản', 'Kiểm kê tài sản', 'Tạo thông báo'],
};

// Cache for database connections to avoid repeated connections
const dbConnections = {};
async function getDBConnection(dbName) {
  if (!dbConnections[dbName]) {
    dbConnections[dbName] = await connectDB(dbName);
  }
  return dbConnections[dbName];
}

exports.getPermissions = async (req, res) => {
  const { type, id } = req.params;

  try {
    let collection;
    let query;
    let projection = { permissions: 1 };

    switch (type) {
      case 'user':
        collection = await getDBConnection('CHECKLIST_DATABASE');
        query = { keys: id };
        projection.name = 1;
        break;
      case 'department':
        collection = await getDBConnection('DEPARTMENTS');
        query = { _id: new ObjectId(id) };
        projection.bophan = 1;
        break;
      case 'restaurant':
        collection = await getDBConnection('SHOP');
        query = { id };
        projection.restaurant = 1;
        break;
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    // Add timeout to avoid long-running queries
    const entity = await collection.findOne(query, { 
      projection, 
      timeout: 5000 
    });
    
    if (!entity) {
      return res.status(404).json({ message: `${type} not found` });
    }

    const permissions = entity.permissions || {};
    res.json({
      success: true,
      data: {
        id: entity.keys || entity._id || entity.id,
        name: entity.name || entity.bophan || entity.restaurant,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updatePermissions = async (req, res) => {
  const { type, id } = req.params;
  const { permissions, userKeys } = req.body;

  if (typeof permissions !== 'object' || Array.isArray(permissions)) {
    return res.status(400).json({ message: 'Permissions must be an object with module:action structure' });
  }

  try {
    let collection;
    let query;

    switch (type) {
      case 'department':
        collection = await getDBConnection('DEPARTMENTS');
        query = { _id: new ObjectId(id) };
        break;
      case 'user':
        collection = await getDBConnection('CHECKLIST_DATABASE');
        query = { keys: id };
        break;
      case 'restaurant':
        collection = await getDBConnection('SHOP');
        query = { id };
        break;
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    // Check if entity exists first with minimal projection
    const entityExists = await collection.findOne(query, { 
      projection: { _id: 1, name: 1, bophan: 1, restaurant: 1 },
      timeout: 3000
    });
    
    if (!entityExists) {
      return res.status(404).json({ message: `${type} not found` });
    }

    // Update permissions in one operation
    const result = await collection.updateOne(query, { $set: { permissions } }, { timeout: 5000 });
    
    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getModules = async (req, res) => {
  try {
    const collection = await getDBConnection('MODULES');
    // Add timeout and limit to prevent long queries
    const modules = await collection.find({}).limit(100).toArray();
    
    res.json({
      success: true,
      data: modules.length > 0 ? modules : Object.keys(DEFAULT_PERMISSIONS).map((module) => ({
        _id: new ObjectId(),
        name: module.charAt(0).toUpperCase() + module.slice(1),
        permissions: DEFAULT_PERMISSIONS[module],
        status: true,
      })),
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.addModule = async (req, res) => {
  const { name, permissions, status = true, applicableTo, userKeys } = req.body;

  if (!name || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ message: 'Name and permissions array are required' });
  }

  if (applicableTo && !Array.isArray(applicableTo)) {
    return res.status(400).json({ message: 'applicableTo must be an array' });
  }

  const validEntities = ['account', 'department', 'restaurant', 'user'];
  if (applicableTo && !applicableTo.every(entity => validEntities.includes(entity))) {
    return res.status(400).json({ message: 'Invalid entity in applicableTo' });
  }

  try {
    const collection = await getDBConnection('MODULES');

    // Use case-insensitive regex search with timeout
    const existingModule = await collection.findOne(
      { name: { $regex: new RegExp(`^${name}$`, 'i') } },
      { timeout: 3000 }
    );
    
    if (existingModule) {
      return res.status(400).json({ message: 'Module already exists' });
    }

    const newModule = {
      name,
      permissions,
      status,
      applicableTo: applicableTo || validEntities,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newModule, { timeout: 5000 });

    res.json({
      success: true,
      data: { ...newModule, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Error adding module:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateModule = async (req, res) => {
  const { id } = req.params;
  const { name, permissions, status, applicableTo } = req.body;

  if (!name || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ message: 'Name and permissions array are required' });
  }

  if (applicableTo && !Array.isArray(applicableTo)) {
    return res.status(400).json({ message: 'applicableTo must be an array' });
  }

  const validEntities = ['account', 'department', 'restaurant', 'user'];
  if (applicableTo && !applicableTo.every(entity => validEntities.includes(entity))) {
    return res.status(400).json({ message: 'Invalid entity in applicableTo' });
  }

  try {
    const collection = await getDBConnection('MODULES');

    // Combine two queries into one with projection
    const currentModule = await collection.findOne(
      { _id: new ObjectId(id) },
      { 
        projection: { applicableTo: 1 },
        timeout: 3000
      }
    );
    
    if (!currentModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const currentApplicableTo = currentModule.applicableTo || [];
    const newEntities = applicableTo.filter(entity => !currentApplicableTo.includes(entity));

    if (newEntities.length > 0) {
      // Use more efficient query with appropriate timeout
      const conflictingModules = await collection.find(
        {
          _id: { $ne: new ObjectId(id) },
          applicableTo: { $in: newEntities }
        },
        { 
          projection: { name: 1, applicableTo: 1 },
          timeout: 5000
        }
      ).toArray();

      const conflicts = [];
      newEntities.forEach(entity => {
        const conflictingModule = conflictingModules.find(module =>
          module.applicableTo && module.applicableTo.includes(entity)
        );

        if (conflictingModule) {
          conflicts.push({
            entity,
            conflictWith: conflictingModule.name
          });
        }
      });

      if (conflicts.length > 0) {
        return res.status(400).json({
          message: 'Entity type already assigned to another module',
          conflicts
        });
      }
    }

    // Update module with timeout
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          name, 
          permissions, 
          status, 
          applicableTo: applicableTo || validEntities,
          updatedAt: new Date() 
        } 
      },
      { timeout: 5000 }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json({ success: true, message: 'Module updated successfully' });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.deleteModule = async (req, res) => {
  const { id } = req.params;

  try {
    const collection = await getDBConnection('MODULES');
    
    // Add timeout to delete operation
    const result = await collection.deleteOne(
      { _id: new ObjectId(id) },
      { timeout: 5000 }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getEntityPermissions = async (req, res) => {
  const { module, action } = req.query;
  const { entities, actions } = req.body;

  if (!entities || !Array.isArray(entities) || entities.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid entities input' });
  }

  // Limit number of entities to process to prevent CPU overload
  const limitedEntities = entities.slice(0, 100);
  
  const actionsToCheck = actions && Array.isArray(actions) && actions.length > 0 ? actions : [action];
  if (!actionsToCheck.every(a => a)) {
    return res.status(400).json({ success: false, message: 'Invalid actions input' });
  }

  try {
    const moduleCollection = await getDBConnection('MODULES');
    
    // Optimize module query with better projection and timeout
    let moduleData;
    if (module) {
      moduleData = await moduleCollection.findOne(
        { name: decodeURIComponent(module).trim() },
        { 
          projection: { name: 1, permissions: 1, status: 1, applicableTo: 1 },
          timeout: 3000
        }
      );
    } else {
      moduleData = await moduleCollection.findOne(
        { permissions: { $in: actionsToCheck } },
        { 
          projection: { name: 1, permissions: 1, status: 1, applicableTo: 1 },
          timeout: 3000
        }
      );
      
      if (!moduleData) {
        moduleData = await moduleCollection.findOne(
          {},
          { 
            projection: { name: 1, permissions: 1, status: 1, applicableTo: 1 },
            timeout: 3000
          }
        );
      }
    }

    if (!moduleData || moduleData.status === false) {
      return res.status(200).json({
        success: true,
        data: limitedEntities.map(entity => ({
          type: entity.type,
          id: entity.id,
          success: true,
          data: { id: entity.id, name: 'Unnamed', module: module || 'Unknown', actions: actionsToCheck, hasPermission: false },
        })),
        hasPermission: false,
      });
    }

    const moduleName = moduleData.name.trim();
    const modulePermissions = moduleData.permissions || [];
    const applicableTo = moduleData.applicableTo || ['user', 'department', 'restaurant', 'account'];

    // Group entities by type to batch database operations
    const entitiesByType = limitedEntities.reduce((acc, entity) => {
      const { type } = entity;
      if (!acc[type]) acc[type] = [];
      acc[type].push(entity);
      return acc;
    }, {});

    // Process each type in parallel
    const resultsPromises = Object.entries(entitiesByType).map(async ([type, typeEntities]) => {
      let collection, queryField, identifierField, nameField;
      
      switch (type.toLowerCase()) {
        case 'user':
          collection = await getDBConnection('CHECKLIST_DATABASE');
          queryField = 'keys';
          identifierField = 'keys';
          nameField = 'name';
          break;
        case 'department':
          collection = await getDBConnection('DEPARTMENTS');
          queryField = 'bophan';
          identifierField = '_id';
          nameField = 'bophan';
          break;
        case 'restaurant':
          collection = await getDBConnection('SHOP');
          queryField = 'id';
          identifierField = 'id';
          nameField = 'restaurant';
          break;
        default:
          return typeEntities.map(entity => ({ 
            type, 
            id: entity.id, 
            success: false, 
            message: 'Invalid type' 
          }));
      }

      // Create array of IDs for this type
      const ids = typeEntities.map(entity => entity.id);
      
      // Create query for batch operation
      let query;
      if (type.toLowerCase() === 'restaurant') {
        query = { $or: [
          { id: { $in: ids } },
          { restaurant: { $in: ids } }
        ]};
      } else {
        query = { [queryField]: { $in: ids } };
      }

      // Get all entities in one query with timeout
      const projection = { 
        [identifierField]: 1, 
        [nameField]: 1, 
        permissions: 1 
      };
      
      const entities = await collection.find(query, { 
        projection,
        timeout: 10000
      }).toArray();

      // Create a lookup map for fast access
      const entityMap = {};
      entities.forEach(entity => {
        const lookupId = entity[queryField] || entity[identifierField] || entity.restaurant;
        entityMap[lookupId] = entity;
      });

      // Process each entity request
      return typeEntities.map(entity => {
        const { id } = entity;
        const entityData = entityMap[id];
        
        if (!entityData) {
          return { type, id, success: false, message: `${type} not found` };
        }

        const entityPermissions = entityData.permissions || {};
        const effectiveType = type.toLowerCase() === 'user' ? 'account' : type.toLowerCase();

        if (!applicableTo.includes(effectiveType)) {
          return { 
            type, 
            id, 
            success: false, 
            message: `Module "${moduleName}" not applicable to "${type}"` 
          };
        }

        const matchingKey = Object.keys(entityPermissions)
          .find(key => key.trim() === moduleName) || moduleName;
        const entityModulePermissions = entityPermissions[matchingKey] || [];

        const permissionsResult = actionsToCheck.reduce((acc, act) => {
          acc[act] = entityModulePermissions.includes(act) && modulePermissions.includes(act);
          return acc;
        }, {});

        return {
          type,
          id,
          success: true,
          data: {
            id: entityData[identifierField],
            name: entityData[nameField] || 'Unnamed',
            module: moduleName,
            permissions: permissionsResult,
          },
        };
      });
    });

    // Wait for all batched operations to complete
    const resultGroups = await Promise.all(resultsPromises);
    const results = resultGroups.flat();

    const hasPermission = results.some(result => 
      result.success && result.data?.permissions && 
      Object.values(result.data.permissions).some(p => p)
    );

    return res.status(200).json({
      success: true,
      data: results,
      hasPermission,
    });
  } catch (error) {
    console.error('Error in getEntityPermissions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.updateBatchPermissions = async (req, res) => {
  const { entities, permissions, userKeys } = req.body;

  if (!Array.isArray(entities) || entities.length === 0 || typeof permissions !== 'object') {
    return res.status(400).json({ 
      message: 'Entities must be a non-empty array and permissions must be an object' 
    });
  }

  // Limit batch size to prevent CPU overload
  const limitedEntities = entities.slice(0, 100);

  try {
    // Group entities by type to batch operations
    const entitiesByType = limitedEntities.reduce((acc, entity) => {
      const { type } = entity;
      if (!acc[type]) acc[type] = [];
      acc[type].push(entity);
      return acc;
    }, {});

    // Process each type in parallel with better error handling
    const updatePromises = Object.entries(entitiesByType).map(async ([type, typeEntities]) => {
      let collection, queryField;
      
      switch (type) {
        case 'user':
          collection = await getDBConnection('CHECKLIST_DATABASE');
          queryField = 'keys';
          break;
        case 'department':
          collection = await getDBConnection('DEPARTMENTS');
          queryField = '_id';
          // Convert string IDs to ObjectIds for MongoDB
          typeEntities = typeEntities.map(entity => ({
            ...entity,
            id: new ObjectId(entity.id)
          }));
          break;
        case 'restaurant':
          collection = await getDBConnection('SHOP');
          queryField = 'id';
          break;
        default:
          throw new Error(`Invalid type: ${type}`);
      }

      // Get IDs for query
      const ids = typeEntities.map(entity => entity.id);
      
      // Verify entities exist first with minimal projection
      const existingEntities = await collection.find(
        { [queryField]: { $in: ids } },
        { 
          projection: { [queryField]: 1 },
          timeout: 5000
        }
      ).toArray();
      
      const existingIds = existingEntities.map(e => String(e[queryField]));
      const missingIds = ids.filter(id => !existingIds.includes(String(id)));
      
      if (missingIds.length > 0) {
        throw new Error(`Some ${type} entities not found: ${missingIds.join(', ')}`);
      }

      // Perform bulk update
      const bulkOps = typeEntities.map(entity => ({
        updateOne: {
          filter: { [queryField]: entity.id },
          update: { $set: { permissions } }
        }
      }));

      return collection.bulkWrite(bulkOps, { timeout: 15000 });
    });

    // Wait for all updates with proper error handling
    const results = await Promise.allSettled(updatePromises);
    
    // Check for errors
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason.message);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some updates failed', 
        errors 
      });
    }

    res.json({ 
      success: true, 
      message: `Updated permissions for ${limitedEntities.length} entities` 
    });
  } catch (error) {
    console.error('Error updating batch permissions:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};