const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

const verifyToken = (req, res, next) => {
  console.log("inside the verify token", req.headers.authorization);

  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Forbidden Access" });
  }

  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Forbidden Access" });
    }
    res.decoded = decoded;

    next();
  });
};

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

    //   makeOffer collection

    const makeOfferCollection = client
      .db("FT-Real-EstateDB")
      .collection("makeOffers");

    //user collection

    const userCollection = client.db("FT-Real-EstateDB").collection("users");

    // ******************

    // jwt related apis

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.send({ token });
    });

    // add a  property
    app.post("/property", verifyToken, async (req, res) => {
      const property = req.body;
      const result = await propertiesCollection.insertOne(property);
      res.send(result);
    });

    // get all verified properties
    app.get("/properties", async (req, res) => {
      try {
        const result = await propertiesCollection
          .find({ verificationStatus: "verified" })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch properties", error });
      }
    });

    //get all properties

    app.get("/allProperties", verifyToken, async (req, res) => {
      try {
        const result = await propertiesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch properties", error });
      }
    });

    //property status update

    app.put("/property/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const statusData = req.body;
      const result = await propertiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: statusData }
      );
      res.send(result);
    });

    //get property added by agent

    app.get("/myAddedProperty/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await propertiesCollection
        .find({ agentEmail: email })
        .toArray();
      res.send(result);
    });

    //get a single data by id

    app.get("/propertyDetails/:id", verifyToken, async (req, res) => {
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

    app.post("/wishlist", verifyToken, async (req, res) => {
      const data = req.body;
      const result = await wishlistCollection.insertOne(data);

      res.send(result);
    });

    //get wishlist from database by email

    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const wishlist = await wishlistCollection
        .find({ addWishList: email })
        .toArray();

      res.send(wishlist);
    });

    //get make offer data from wishlist database by id
    app.get("/dashboard/makeOffer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await wishlistCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    //post a make offered data to the database

    app.post("/makeOffer", verifyToken, async (req, res) => {
      const data = req.body;
      const result = await makeOfferCollection.insertOne(data);
      console.log("make offer save database data", result);

      res.send(result);
    });

    //get make offer data for property bought by added user with email

    app.get("/propertyBought/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await makeOfferCollection
        .find({ buyerEmail: email })
        .toArray();
      res.send(result);
    });

    // get all make offer data

    app.get("/requestedProperty", verifyToken, async (req, res) => {
      const result = await makeOfferCollection.find().toArray();
      res.send(result);
    });

    // make offer status change function

    app.put("/requestedProperty/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updateStatus = req.body;
      const updateResult = await makeOfferCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateStatus }
      );

      const rejectResult = await makeOfferCollection.updateMany(
        {
          _id: { $ne: new ObjectId(id) },
          propertyTitle: updateStatus.propertyTitle,
        },
        { $set: { status: "reject" } }
      );
      res.send({
        message: "Offer accepted and other offers rejected.",
        acceptedOffer: updateResult,
        rejectedOffers: rejectResult,
      });
    });

    // delete wishlist

    app.delete("/wishlist/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const deleteWish = await wishlistCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(deleteWish);
    });

    //save reviews on data base

    app.post("/reviews", verifyToken, async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.send(result);
    });

    // get reviews by property id for property

    app.get("/reviews", verifyToken, async (req, res) => {
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

    //get all review

    app.get("/allReviews", verifyToken, async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    //delete a review

    app.delete("/reviews/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = reviewCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //get reviews by email

    app.get("/reviews/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const reviews = await reviewCollection
        .find({ reviewerEmail: email })
        .toArray();
      res.send(reviews);
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

    //get all user

    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    //get user by logged email

    app.get("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email: email });
      res.send(result);
    });

    //delete a user

    app.delete("/user/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //update user
    app.put("/user/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedUser }
      );
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
