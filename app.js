//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-haruko:Atläss9102@cluster0-avswv.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema=new mongoose.Schema({
  name: String
});

const Item=mongoose.model("Item", itemsSchema);

const item1=new Item({
  name: "Welcome to your todolist!"
});
const item2=new Item({
  name: "Hit the + button to add a new item."
});
const item3=new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems=[item1, item2, item3];

const listSchema={
  name: String,
  items: [itemsSchema]
};

const List=mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find(function(err, items){
    if(items.length===0){
      Item.insertMany(defaultItems, function(err){
        if(err)
          console.log(err);
        else console.log("Successfully saved all the default items.");
      });
      //res.redirect("/");
    }

    if(err) console.log(err);
    else{
      res.render("list", {listTitle: "Today", newListItems: items});
    }

  });

});

app.get("/:listCat", function(req, res){
  const customListName=_.capitalize(req.params.listCat);

  List.findOne({name: customListName}, function(err, result){
    if(!err){
      if(result){
        //show an existing list
        res.render("list", {listTitle: result.name, newListItems: result.items});
      }
      else{
        //create a new list
        const list=new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+customListName);
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list

  const item=new Item({
    name: itemName
  });

  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId, {useFindAndModify: false}, function(err){
      if(err) console.log(err);
      else{
        console.log("The document with the id of "+checkedItemId+" has been deleted.");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}, useFindAndModify: false}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

let port=process.env.PORT;
if(port==null || port==""){
  port=3000;
}
app.listen(port, function() {
  console.log("Server has started.");
});
