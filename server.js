const express = require("express");
const app = express();
const PORT = 3000;
const path = require("path");
const bodyParser = require("body-parser");
const hbs = require("express-handlebars");
const Datastore = require("nedb");

const collection = new Datastore({
    filename: path.join(__dirname, "data/data.db"),
    autoload: true
});

//---------- app helpers ----------
const helpers = {
    boolTranslate: (value) => {
        if(value == "TAK")
            return '<span class="text-yellow-400 fw-bold">TAK</span>';
        else if(value == "NIE")
            return '<span class="text-white">NIE</span>';
        else
            return '<span class="text-white">BRAK DANYCH</span>';
    },
    selectOptions: (value) => {
        if(value == "TAK"){
            return('<option value="TAK" selected>TAK</option><option value="NIE">NIE</option><option value="BRAKDANYCH">BRAK DANYCH</option>');
        }
        else if(value == "NIE"){
            return('<option value="TAK">TAK</option><option value="NIE" selected>NIE</option><option value="BRAKDANYCH">BRAK DANYCH</option>');
        }
        else{
            return('<option value="TAK">TAK</option><option value="NIE">NIE</option><option value="BRAKDANYCH" selected>BRAK DANYCH</option>');
        }
    }
};

//---------- app settings ----------
app.use(express.static("static"));
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
    extname: '.hbs',
    partialsDir: "views/partials",
    helpers: helpers
}));

//---------- app context ----------
// const context = require("./data/data.json");


//---------- main app GET ----------
app.get("/", (req, res) => {
    res.render("homeView.hbs");
});

app.get("/addCar", (req, res) => {
    res.render("addCarView.hbs");
});

app.get("/carsList", (req, res) => {
    collection.find({}, (err, docs) => {
        res.render("carsListView.hbs", {carList: docs});
    });
});

app.get("/carsEdit", (req, res) => {
    collection.find({}, (err, docs) => {
        for(let key in docs){
            collection.update(
                { _id: docs[key]["_id"] }, 
                { $set: { isEdited: false } }, 
                {}, 
                (e, numReplaced) => {
                    if(e){
                        console.log(e);
                    }
                }
            );
        }
    });

    console.log("editedCarID: ", req.query.editedCarID);
    if("ID: ", req.query.editedCarID){
        collection.update(
            { _id: req.query.editedCarID }, 
            { $set: { isEdited: true } }, 
            {}, 
            (err, numReplaced) => {
                console.log(numReplaced, "car(s) status was changed to edited.");
            }
        );
    }

    collection.find({}, (err, docs) => {
        // console.log(docs);
        res.render("carsEditView.hbs", {carList: docs});
    });
});

app.post("/addCar", (req, res) => {
    const car = {
        isInsured: req.body["isInsured"] ? "TAK" : "NIE",
        isPetrolCar: req.body["isPetrolCar"] ? "TAK" : "NIE",
        isDamaged: req.body["isDamaged"] ? "TAK" : "NIE",
        isFourByFour: req.body["isFourByFour"] ? "TAK" : "NIE",
        isEdited: false
    };

    collection.insert(car, (e, newDoc) => {
        console.log("New car was insered: ", newDoc);
        console.log(newDoc['_id']);
        res.render("addCarView.hbs", {alert: `New car with <span class="fw-bold">id = ${newDoc['_id']}</span> was insered to databse.`});
    });
});

app.post("/handleDelete", (req, res) => {
    console.log(req.body);
    collection.remove({ _id: req.body.deletedCarID }, {}, (err, numRemoved) => {
        console.log("car was deleted");
        res.send({message: "car was deleted successfully."});
    });
});

app.post("/handleUpdate", (req, res) => {
    console.log(req.body);
    collection.update(
        { _id: req.body["_id"] }, 
        { $set: { 
            isInsured: req.body.isInsured,
            isPetrolCar: req.body.isPetrolCar,
            isDamaged: req.body.isDamaged,
            isFourByFour: req.body.isFourByFour,
            isEdited: req.body.isEdited
        } }, 
        {}, 
        (err, numReplaced) => {
            console.log(numReplaced, "car(s) status was updated.");
            res.send({message: "car was deleted successfully."});
        }
    );
});

//---------- start of the app ----------
app.listen(PORT, () => {
    console.log("start serwera na porcie", PORT);
});
