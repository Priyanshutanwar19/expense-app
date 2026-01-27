const mongoose= require('mongoose');

const groupSchema= new mongoose.Schema({
    name:{type: String, required: true}, 
    description:{type: String, required: true}, 
    adminEmail:[{type: String, required:true, unique: true}],
    membersEmail:[{type: String, required:true, unique: true}],
    thumbnail:{type: String}
})

module.exports=mongoose.model('Group',groupSchema);
