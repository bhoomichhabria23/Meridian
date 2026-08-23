function apiResponse(req, res, next) {
  const originalJson = res.json.bind(res);

  res.success = (data, status = 200, meta) => {
    res.status(status);
    const payload = { success: true, data };
    if (meta) payload.meta = meta;
    return originalJson(payload);
  };

  res.fail = (status, message, details) => {
    res.status(status);
    return originalJson({
      success: false,
      error: {
        message,
        ...(details ? { details } : {}),
      },
    });
  };

  res.json = (payload) => {
    if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'success')) {
      return originalJson(payload);
    }
    if (res.statusCode >= 400) {
      const message = payload?.message || 'Request failed';
      const details = payload?.details;
      return originalJson({
        success: false,
        error: { message, ...(details ? { details } : {}) },
      });
    }
    return originalJson({ success: true, data: payload });
  };

  next();
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { apiResponse, asyncHandler };
