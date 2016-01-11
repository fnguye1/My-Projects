let mongoose = require('mongoose')

let PostSchema = mongoose.Schema({
    title: {
        type: String, 
        required: true },
    content: { 
        type: String, 
        required: true },
    image: { 
        data: Buffer, 
        contentType: String },
    userId: { 
        type: String, 
        required: false},
   comments: [{
        username: String,
        content: String,
        date: Date
    }],
    created_at: {
        type: Date, 
        required: false},
    updated_at: { 
        type: Date, 
        required: false}
})


PostSchema.pre('save', function(next) {
    let now = new Date();
    this.updated_at = now;
    if (!this.created_at) {
        this.created_at = now;
    }
    next();
});

module.exports = mongoose.model('Post', PostSchema)
