const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle
app.use(cors());
app.use(express.json());

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

    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // Application API

    app.get("/job-applications", async (req, res) => {
      const applicant_email = req.query.applicant_email;
      const query = { email: applicant_email };
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

    app.post("/job-applications", async (req, res) => {
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
