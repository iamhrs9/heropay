const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = decoded.id
      req.userType = decoded.type // 'user' or 'admin'
      next()
    } catch (err) {
      return res.status(401).json({ message: 'Token invalid or expired. Please log in again.' })
    }
  } else {
    return res.status(401).json({ message: 'No auth token provided.' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' })
  }
  next()
}

module.exports = { protect, adminOnly }
