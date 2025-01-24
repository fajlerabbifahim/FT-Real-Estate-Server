const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());

app.use(express.json());

// mongoDB

app.get("/", async (req, res) => {
  res.send("ding dongg");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8jenr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const propertiesCollection = client
      .db("FT-Real-EstateDB")
      .collection("properties");

    //wishlist collection
    const wishlistCollection = client
      .db("FT-Real-EstateDB")
      .collection("wishlist");

    //reviews collection

    const reviewCollection = client
      .db("FT-Real-EstateDB")
      .collection("reviews");

    //user collection

    const userCollection = client.db("FT-Real-EstateDB").collection("users");

    // get all properties
    app.get("/properties", async (req, res) => {
      try {
        const result = await propertiesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch properties", error });
      }
    });

    //get a single data by id

    app.get("/propertyDetails/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const property = await propertiesCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(property);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch properties", error });
      }
    });

    // save wishlist on data base

    app.post("/wishlist", async (req, res) => {
      const data = req.body;
      const result = await wishlistCollection.insertOne(data);

      res.send(result);
    });

    //get wishlist from database

    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const wishlist = await wishlistCollection
        .find({ addWishList: email })
        .toArray();

      res.send(wishlist);
    });

    // delete wishlist

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const deleteWish = wishlistCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(deleteWish);
    });

    //save reviews on data base

    app.post("/reviews", async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.send(result);
    });

    // get reviews data

    app.get("/reviews", async (req, res) => {
      const propertyId = req.query.propertyId;

      try {
        const review = await reviewCollection
          .find({ propertyId: propertyId })
          .toArray();

        res.send(review);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch reviews" });
      }
    });

    //save user to the database

    app.post("/user", async (req, res) => {
      const user = req.body;
      const email = user.email;
      const existingUser = await userCollection.findOne({ email: email });
      if (existingUser) {
        return { message: "user already exist" };
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("app listen in this port", port);
});
