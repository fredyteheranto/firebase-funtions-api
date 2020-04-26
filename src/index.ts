//import libraries
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as request from "request-promise-native";

//initialize firebase inorder to access its services
admin.initializeApp(functions.config().firebase);

//initialize express server
const app = express();
const main = express();

//add the path to receive request and set json as bodyParser to process the body
main.use("/api/v1", app);
// tslint:disable-next-line: deprecation
main.use(bodyParser.json());
// tslint:disable-next-line: deprecation
main.use(bodyParser.urlencoded({ extended: false }));

//initialize the database and the collection
const db = admin.firestore();

//get direccion
app.get("/map/:lat", (req, res) => {
  try {
    request(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${req.params.lat}&key=AIzaSyDYVuIbJGhi3QW19IOpTNUyzyIutHTJD98`,
      function (error, response, body) {
        if (error) {
          res.status(400).send(error);
        } else {
          res.status(200).json({
            code: response.statusCode,
            data: body,
          });
        }
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//get data
app.get("/database/:database", async (req, res) => {
  try {
    const Bd: string = req.params.database;
    const userQuerySnapshot = await db.collection(Bd).get();
    const users: any[] = [];
    userQuerySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        data: doc.data(),
      });
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

//post data obj
app.post("/database/:database", async (req, res) => {
  try {
    const obj = req.body;
    const database = req.params.database;
    const newDoc = await db.collection(database).add(obj);
    res.status(201).send(`Created a new user: ${newDoc.id}`);
  } catch (error) {
    res.status(400).send(error);
  }
});

//get data for obj
app.get("/database/:database/:Id", (req, res) => {
  const dataId = req.params.Id;
  const database = req.params.database;
  db.collection(database)
    .doc(dataId)
    .get()
    .then((data) => {
      if (!data.exists) throw new Error("User not found");
      res.status(200).json({ id: data.id, data: data.data() });
    })
    .catch((error) => res.status(500).send(error));
});

// Update
app.put("/database/:database/:Id", async (req, res) => {
  await db
    .collection(req.params.database)
    .doc(req.params.Id)
    .set(req.body, { merge: true })
    .then(() => res.json({ id: req.params.Id }))
    .catch((error) => res.status(500).send(error));
});

// Delete
app.delete("/database/:database/:Id", (req, res) => {
  db.collection(req.params.database)
    .doc(req.params.Id)
    .delete()
    .then(() => res.status(204).send("Document successfully deleted!"))
    .catch(function (error) {
      res.status(500).send(error);
    });
});

//define google cloud function name
export const webApi = functions.https.onRequest(main);
