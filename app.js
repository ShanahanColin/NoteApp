const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const date = require(__dirname + '/date.js');
const _ = require('lodash');
const mongoose = require('mongoose');


const app = express();

// SETUP
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-cs:dbAdminCS@cluster0.mzsqa.mongodb.net/toDoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ITEMS SCHEMA
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Required"]
  }
});
const Item = mongoose.model("Item", itemsSchema);

// DEFUALT ITEMS
const itemOne = new Item({
  name: "Welcome to NoteApp"
});
const itemTwo = new Item({
  name: "Cleck the '+' to add item to your list"
});
const itemThree = new Item({
  name: "Click the ◻ to check an item off for deletion"
});
const introItems = [itemOne, itemTwo, itemThree];

// CUSTOM LIST SCHEMA
const customSchema = {
  name: {
    type: String,
    required: [true, "Name Required"]
  },
  items: [itemsSchema]
};

const CustomList = mongoose.model("CustomList", customSchema);

//DATE
const day = date.getDate();

// LIST ROOT
app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(introItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Saved items to DB");
        }
        res.redirect("/")
      });
    } else {
      res.render("list", {
        listTitle: day,
        newDuty: foundItems
      });
    }
  });
});

// CUSTOM LISTS
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  CustomList.findOne({name: customListName}, (err, foundList) =>{
    if (!err){
      if(!foundList){
        const list = new CustomList({
          name: customListName,
          items: introItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list", {
          listTitle: foundList.name,
          newDuty: foundList.items
        });
      }
    }
  });
});

// POSTS
app.post("/", (req, res) => {
  const itemName = req.body.nextToDo;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === day){
    newItem.save();
    res.redirect("/");
  }else{
    CustomList.findOne({name: listName}, (err, foundList)=>{
      if(err){
        console.log(err);
      }else {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/"+ listName);
      }
    });
  }
});

//DELETE ITEM
app.post("/delete", (req, res) => {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === day){
    Item.deleteOne({
      _id: checkedItem
    }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(checkedItem + "removed from DB");
      }
      res.redirect("/");
    });
  }else{
    CustomList.findOne({name: listName}, (err, foundList)=>{
      if(!err){
        foundList.items.pull({_id:checkedItem});
        foundList.save();
        res.redirect("/"+listName);
      }
    });
  }
});

// ABOUT
app.get("/about", (req, res) => {
  res.render("about");
});

//CONNECTION
app.listen(3000, () => {
  console.log("S found on 3t");
});
