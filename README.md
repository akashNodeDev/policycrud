# crud
Crud Assignment

Steps to run the project:

Step 1. Download the crud folder using the github link or clone the project
Step 2. Install the node modules.
Step 3. Run the following APIs as per the required parameters

1.API to upload the csv and the save the data in the user,user's account,policy,lob,agent and in the carrier collection

URL :  http://127.0.0.1:1852/api/upload
Method : POST

Parameter:
csvfile: <Upload the csv file> [Form Data]

2.API to get all the policies

URL : http://127.0.0.1:1852/api/get-all-policies
Method: GET

3. API to get the policy details by id

URL : http://127.0.0.1:1852/api/get-policy-data/:id
Method : GET

Here id is _id (ObjectId) value of the policy collection

4. API to update the policy details

URL:  http://127.0.0.1:1852/api/update/policy
Method: PUT

Paramaters: 

policy_id: ObjectId(_id value of the policy) required
policy_mode: Number
premium_amount_written : Number
premium_amount: Number
policy_type: String ["Single"/"Package"]
policy_start_date : String ["MM/DD/YYYY" format]
policy_end_date : String ["MM/DD/YYYY" format]

5. API to delete the policy details

URL :  http://127.0.0.1:1852/api/delete/policy
Method : POST

Paramaters: 
policy_id: ObjectId(_id value of the policy) required

6. API to get the user data

URL :  http://127.0.0.1:1852/api/get-user-data/:id
Method : GET

Here id is _id (ObjectId) value of the users collection

7. API to update the user data

URL :  http://127.0.0.1:1852/api/update/user-info
Method : PUT

Paramaters:

user_id: ObjectId(_id value of the user) required
firstname : String
email: String
phone: String
gender : String
city: String
address : String
state : String
zip: String
dob : String ["Date in MM/DD/YYYY" format]
userType: String
primary: String

8. API to delete the user data

URL :  http://127.0.0.1:1852/api/delete/user
Method : POST

Paramaters:

user_id: ObjectId(_id value of the user) required

9. API to get the account information

URL :  http://127.0.0.1:1852/api/get-user-account-data/:id
Method: GET

Here id is _id (ObjectId) value of the user_accounts collection

10. API to update the account information

URL :  http://127.0.0.1:1852/api/update/user-account-data
METHOD: PUT

Paramaters:

user_account_id: ObjectId(_id value of the user_accounts collection) required
account_name : String
account_type: String ["Personal"/"Commercial"]

11. API to update the account information

URL :  http://127.0.0.1:1852/api/delete/user-account-data
Method: Post

Parameters:

user_account_id: ObjectId(_id value of the user_accounts collection) required
