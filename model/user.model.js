const mongoose = require("mongoose");
const paginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema({
    fullName: { type: String },
    email: { type: String },
    password: { type: String },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    }
}, { versionKey: false, timestamps: true });

userSchema.plugin(paginate);
const userModel = mongoose.model("User", userSchema);

module.exports = {
    userModel
};
