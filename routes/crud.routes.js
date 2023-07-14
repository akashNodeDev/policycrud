const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const crudController = require('../controllers/crud.controller');
const Storage = multer.diskStorage({
    destination: (req, file, callback) => {
        if (!fs.existsSync("./public/csvfile")) {
            fs.mkdirSync("./public/csvfile");
        }
         
        callback(null, "./public/csvfile");

    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + "_" + file.originalname.replace(/\s/g, '_'));
    }
});

const uploadFile = multer({
    storage: Storage
});
const request_param = multer();

/** API to upload the csv file and save the data */
router.post('/upload', uploadFile.any(), crudController.uploadCsv); 

/** API to get all the policies */
router.get('/get-all-policies', crudController.getAllPolicies); 

/** API to get the specific record by passing the object id of the policy */
router.get('/get-policy-data/:id',request_param.any(),crudController.getPolicyData); 

/** API to delete the policy data from the database*/
router.post('/delete/policy', request_param.any(), crudController.deletePolicy); 

/** API to update the policy data from the database*/
router.put('/update/policy', crudController.updatePolicy);

/** API to get the user data */
router.get('/get-user-data/:id',request_param.any(),crudController.getUserData); 

/** API to update the user data */
router.put('/update/user-info', crudController.updateUserData);

/** API to delete the user data from the database*/
router.post('/delete/user', request_param.any(), crudController.deleteUser); 

/** API to get the user's account information */
router.get('/get-user-account-data/:id',request_param.any(),crudController.getAccountInformation); 

/** API to update the user's account data */
router.put('/update/user-account-data', crudController.updateUserAccount);

/** API to delete the user's account data */
router.post('/delete/user-account-data', crudController.deleteUserAccount);

module.exports = router;