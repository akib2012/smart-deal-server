const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = 3000

const admin = require("firebase-admin");

const serviceAccount = require("./smart-delas-firebase-adminsdk-fbsvc-3d94959177.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// middleware
app.use(cors());
app.use(express.json());
require('dotenv').config();
const logger = (req,res,next) => {
  console.log("logger informations her")
  next();
}

const verifyfirebasetoken = async(req, res, next) => {

  console.log(req.headers.authorization);
  if(!req.headers.authorization){
  

    return res.status(400).send({message: 'unathorized access is not define'})
  }
  const tokern = req.headers.authorization.split(' ')[1];
  if(!tokern){
    return res.status(401).send({message: 'unauthorized acces is define '})
  }

  try{
     await admin.auth().verifyIdToken(tokern)
    return res.status(401).send({message: 'unauthorized acces is define '})


    next();

  }
  catch{

  }

  /* verify token here */



  next();
}



const uri = `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD)}@cluster0.exfto5h.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db('smartdeal02_db');
    const productscollections = db.collection('products');
    const bidscollections = db.collection('bids02');
    const userscollections = db.collection('users');



    /* jwt releted api here */
    app.post('/gettoken', (req, res) => {
      jwt.sign({data: 'foobar'}, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.send({token: token})
    })



    /* users apis here  */
    app.post('/users', async(req, res) => {
      const newuser = req.body;
      const email = req.body.email;
      const query = {email: email};
      const finduser = await userscollections.findOne(query);
      if(finduser){
        res.send("this uer alread haveing no need to again singup here,")
      }
      else{
        const result = await userscollections.insertOne(newuser);
      res.send(result);

      }
  
      
    })





    /* get product it can be the last query , ha ha ha ..... */

    app.get('/products', async(req, res) => {
      //  const projection = {title: 1, price_min: 1, price_max: 1, image: 1, category: 1, condition: 1}
      //   const  cursor = productscollections.find().sort({price_min: 1}).limit(4).project(projection);
      
      console.log(req.query)
      const email = req.query.email;
      const query={}
      if(email){
        query.email = email;
      }
      const cursor = productscollections.find(query)
        const result  = await cursor.toArray();
        res.send(result);
    })


    /* letested product here */

    app.get('/letes-product', async(req,res) => {
      const products = productscollections.find().sort({created_at: -1}).limit(6);
      const result = await products.toArray();
      res.send(result);
    })


    /* pertcicular jekono product get here */


    app.get('/products/:id', async(req,res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await productscollections.findOne(query);
        res.send(result);
    })

    


    // POST route
    app.post('/products', async (req, res) => {
      try {
        const newproduct = req.body;
       
        const result = await productscollections.insertOne(newproduct);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error inserting product' });
      }
    });


    /*update data or patch data   */

    app.patch('/products/:id', async(req, res) => {
        const id = req.params.id;
        const updateproduct =  req.body; // her genrally foud the exsisting product details here
        const query = {_id: new ObjectId(id)}
        const update = {
            $set: updateproduct
        }
        const  result = await productscollections.updateOne(query,update);
        res.send(result);
    })


   /* here the delet router api */
    app.delete('/products/:id', async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await productscollections.deleteOne(query);
        res.send(result);

    })


    /* bids get here */

    app.get('/bids02', async(req, res) => {
     
      const email = req.query.email;
      
      const  query = {}
      if(email){
        query.buyer_email = email
      }
      const cursor = bidscollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })


    /* bids post here */
    app.post('/bids02', async(req,res) => {
      const bid = req.body;
      /* const mail = req.body.bhuyer_emai;
      const query = {bhuyer_emai: mail}
      const targetbid = await bidscollections.findOne(query)
      if(targetbid){
        res.send("only uniq a bid allow for here  bidibg .......");

      } */
     
      const result = await bidscollections.insertOne(bid);
      res.send(result)
    
    })


    app.get('/product/bid/:productid', async(req,res) => {
      const prodctId = req.params.productid;
      const query = {product: prodctId};
      const cursor =  bidscollections.find(query).sort({bid_price: -1});
      const result  =  await cursor.toArray();
      res.send(result);
     })


     //  find my bid with query: 

     app.get('/bids',logger, verifyfirebasetoken,  async(req,res) => {
     
      // console.log('Full headers:', req.headers);
      const email = req.query.email;
    
      const query = {};
      if(email){
        query.bhuyer_emai= email
      }
      const bids = bidscollections.find(query);
      const result = await bids.toArray();
      res.send(result);
     })






 /* bid delete here */
  app.delete('/bids/:id', async(req,res) => {
    const productid  = req.params.id;
    const query = {};
    if(productid){
      query._id = new ObjectId (productid);
    }
    const result = await bidscollections.deleteOne(query);
    res.send(result);
  })
  





    // test connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");
  } catch (error) {
    console.error(error);
  }
  // ❌ DON'T CLOSE CLIENT HERE
  // await client.close();
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('smart server is running now!!!');
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
