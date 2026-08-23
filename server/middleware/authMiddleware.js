const { verifyToken, requireRole } = require('./auth');

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.requireRole = requireRole;
