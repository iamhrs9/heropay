const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Only ONE admin exists for HeroPay, identified by a fixed username "admin"
const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      default: 'admin'
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
)

// Hash password before save
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('Admin', adminSchema, 'myheroadmin')
