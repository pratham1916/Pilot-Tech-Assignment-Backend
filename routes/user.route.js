const express = require("express");
const { userModel } = require("../model/user.model");
const userRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth.middleware");
require("dotenv").config();

// Get All Users details
userRouter.get("/", auth, async (req, res) => {
    try {
        const { fullName, email } = req.query;
        let query = {};

        if (fullName || email) {
            query.$or = [];
            if (fullName) {
                query.$or.push({ fullName: { $regex: fullName, $options: "i" } });
            }
            if (email) {
                query.$or.push({ email: { $regex: email, $options: "i" } });
            }
        }

        const userDetails = await userModel.paginate(query);
        res.status(200).json(userDetails.docs);

    } catch (error) {
        res.status(500).json({ message: "Unable to retrieve data. Please try again later." });
    }
});

// Get user details by ID
userRouter.get("/:id", async (req, res) => {
    try {
        const userDetails = await userModel.findById(req.params.id)
        res.status(200).json(userDetails);
    } catch (error) {
        res.status(500).json({ message: "Unable to retrieve user details. Please Try again later." });
    }
});


userRouter.post("/signUp", async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already registered with this email." });
        }
        bcrypt.hash(password, 10, async (err, hash) => {
            if (err) {
                return res.status(500).json({ message: "Error while hashing the password" });
            }

            const newUser = new userModel({
                fullName,
                email,
                password: hash
            });

            await newUser.save();

            return res.status(201).json({ message: "Registration successful, You can now login" });
        });
    } catch (error) {
        return res.status(500).json({ message: "Registration failed, Please try again later." });
    }
});

// Login a user and generate JWT token
userRouter.post("/signIn", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: "Email does not exist, Please Sign Up" });
        }

        if(user.status === "suspended"){
            return res.status(400).json({ message: "Account is Suspended, Please contact Admin" });
        }

        const result = await bcrypt.compare(password, user.password);
        if (result) {
            const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
            res.status(200).json({ message: "Login Successful", token, userId: user._id, role: user.role });
        } else {
            res.status(400).json({ message: "Incorrect Email or Password" });
        }

    } catch (error) {
        res.status(500).json({ message: "Login Failed. Please try again later." });
    }
});

userRouter.put('/editUser/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { fullName, status } = req.body;

    try {
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.status = status !== undefined ? status : user.status;

        await user.save();

        return res.status(200).json({ message: 'User information updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to update user details. Please Try again later.' });
    }
});


module.exports = {
    userRouter
};
