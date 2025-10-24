// server/adminMiddleware.js

const isAdmin = (req, res, next) => {
    // This middleware should run AFTER authenticateToken
    // ensure req.user is populated by authenticateToken
    if (!req.user) {
        return res.status(401).send("Authentication required.");
    }

    if (req.user.role !== 'admin') {
        console.warn(`[Admin Auth] Forbidden: User ${req.user.id} (${req.user.username}) attempted admin access.`);
        return res.status(403).send("Forbidden: Admin privileges required.");
    }

    // User is authenticated and is an admin
    console.log(`[Admin Auth] Granted: User ${req.user.id} (${req.user.username}) accessed admin route.`);
    next();
};

module.exports = isAdmin;