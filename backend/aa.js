const express = require('express');
const router = express.Router();
const axios = require('axios');

require('dotenv').config();

const clientID = process.env.SETU_TEST_CLIENT_ID;
const secret = process.env.SETU_TEST_CLIENT_SECRET;
const product_instance_id = process.env.SETU_PRODUCT_INSTANCE_ID;
const grant_type = 'client_credentials';

async function getToken(){
    try{
        const response = await axios.post('https://orgservice-prod.setu.co/v1/users/login', {
            clientID,
            secret,
            grant_type
        },{
            headers:{
                client: 'bridge',
                'Content-Type': 'application/json'
            }
        }
    );
    
        console.log(response.data.access_token);
        return response.data.access_token;
    }catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }

}

async function createConsent(acess_token, phone_number){
    try{

        const response = await axios.post('https://fiu.setu.co/v2/consents', {
            "consentDuration": {
                "unit": "MONTH",
                "value": "1"
            },
            "vua": `${phone_number}@onemoney`,    
            "dataRange": {
                "from": "2025-01-01T00:00:00Z",
                "to": "2025-05-29T00:00:00Z"
            }
        },{
            headers:{
                Authorization: `Bearer ${acess_token}`,
                'x-product-instance-id': product_instance_id,
                'Content-Type': 'application/json',
                'x-client_id' :clientID,
                'x-client-secret': secret  
            }
        }
    )
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error creating consent:', error);
        throw error;
    }
}


router.post('/', async (req,res)=>{
    try{

        const {phone} = req.body;
        console.log('body:',req.body)
        console.log("received phone from frontend: ", phone)
        
        const token = await getToken()
        const consentData = await createConsent(token,phone);
        res.json({ message: 'aa-endpoint', phone, token, consentData });

    }catch(err){
        console.error("ERROR IN /aa POST: ", err)

    }
})

module.exports = router; //so it could be used in other files