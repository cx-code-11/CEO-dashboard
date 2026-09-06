const AuditLog = require('../models/AuditLog');

const auditLog = (action, module) => async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json to capture response
  res.json = async (body) => {
    try {
      if (req.user && (action === 'CREATE' || action === 'UPDATE' || action === 'DELETE' || action === 'APPROVE' || action === 'REJECT' || action === 'EXPORT' || action === 'IMPORT')) {
        await AuditLog.create({
          user: req.user._id,
          userName: req.user.name,
          userRole: req.user.role,
          action,
          module,
          resourceId: req.params.id || (body?.data?._id),
          resourceType: module,
          details: { method: req.method, path: req.path, query: req.query },
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          status: res.statusCode < 400 ? 'Success' : 'Failed',
        });
      }
    } catch (err) {
      console.error('Audit log error:', err);
    }
    return originalJson(body);
  };
  
  next();
};

module.exports = auditLog;
