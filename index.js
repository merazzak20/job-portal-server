const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// custom middle wire
const logger = (req, res, next) => {
  console.log("inside the logger");
  next();
};

const verify = (req, res, next) => {
  // console.log("inside the verify", req.cookies);
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }

    req.user = decoded;
    next();
  });
};

// job_hunter
// tOGfOeD7k4KQLR5v

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0gevx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const jobsCollection = client.db("JobPortal").collection("jobs");
    const jobApplicationCollection = client
      .db("JobPortal")
      .collection("job-Applications");

    // Auth Related Api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hrEmail: email };
      }

      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // Post
    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    app.get("/jobs/:id", logger, async (req, res) => {
      console.log("Now inside the function");
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // Application API

    app.get("/job-applications", verify, async (req, res) => {
      const applicant_email = req.query.applicant_email;
      const query = { email: applicant_email };
      console.log(req.cookies);
      if (req.user.email !== req.query.applicant_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await jobApplicationCollection.find(query).toArray();
      for (const applications of result) {
        const query1 = { _id: new ObjectId(applications.job_id) };
        const job = await jobsCollection.findOne(query1);
        if (job) {
          applications.title = job.title;
          applications.company = job.company;
          applications.company_logo = job.company_logo;
        }
      }
      res.send(result);
    });

    app.post("/job-applications", verify, async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Jobs is here");
});

app.listen(port, () => {
  console.log(`Job is waiting in : ${port}`);
});
