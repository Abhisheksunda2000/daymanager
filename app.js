const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

// connect to database
mongoose.connect("mongodb://localhost:27017/daymanagerDB");


// Schemas
const itemsSchema = mongoose.Schema({
    name : String
});

const listsSchema = mongoose.Schema({
    name:String,
    items:[itemsSchema]
})

// models
const Item = mongoose.model("Item",itemsSchema);
const List = mongoose.model("List", listsSchema);


// default items
const item1 = new Item({
    name : "Welcome to your dayManager!"
});

const item2 = new Item({
    name : "Hit the + button to add a new item."
});

const item3 = new Item({
    name : "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// routes
app.get("/", function(req, res) {
    Item.find({})
        .then(foundItems => {
            if (foundItems.length === 0) {
                return Item.insertMany(defaultItems)
                    .then(() => {
                        console.log("Successfully saved all items to the database");
                        return Item.find({}); 
                    });
            } else {
                return foundItems;
            }
        })
        .then(foundItems => {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("An error occurred");
        });
});


app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
        name: req.body.newItem
    });
    
    if(listName === "Today"){
        item.save();
        res.redirect("/")
    }else{
        List.findOne({name:listName})
            .then((foundList) => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
    }
});


app.post("/delete", function(req, res) {
    const id = req.body.checkbox; 
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.deleteOne({ _id: id })
        .then(() => {
            res.redirect("/");
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("An error occurred");
        });
    }else{
        List.findOneAndUpdate({name:listName}, {$pull : {items : {_id:id}}})
            .then((foundList) => {
                res.redirect("/" + listName);
            });
    }

    
});

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name:customListName})
        .then((foundList) =>{
             if(!foundList){
                const list = new List({
                    name : customListName,
                    items: defaultItems
                });

                list.save()
                    .then(() =>{
                        res.redirect("/"+customListName);
                    })
                    .catch((err) =>{
                        console.log(err);
                        res.status(500).send("An error occurred");
                    });
             }else{
                res.render("list", {listTitle:foundList.name, newListItems: foundList.items});
             }
        });
})

app.listen(3000, function(){
  console.log("server is running up at port 3000");
});