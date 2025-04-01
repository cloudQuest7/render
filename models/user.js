import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    profilePic: {
        type: String,
        default: null
    }
});

export default mongoose.model('User', userSchema);