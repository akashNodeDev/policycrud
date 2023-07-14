const userModel = require("../models/user.model");
const agentModel = require("../models/agent.model");
const lobModel = require("../models/lob.model");
const carrierModel = require("../models/carrier.model");
const policyModel = require("../models/policy.model");
const userAccountModel = require("../models/user_account.model");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const throttledQueue = require("throttled-queue");
const throttle = throttledQueue(10, 1000); // at most 10 requests per second.
const mongoose = require("mongoose");

function getSHA(fileName) {
  const results = [];
  return new Promise((resolve, reject) => {
    let stream = fs.createReadStream(fileName).pipe(csv());
    stream.on("error", (err) => reject(null));
    stream.on("data", (data) => results.push(data));
    stream.on("end", () => resolve(results));
  });
}

class CrudController {
  /**
   * @Method uploadCsv
   * @Description: To upload the CSV file and save the data
   */
  async uploadCsv(req, res) {
    try {
      if (_.has(req, "files")) {
        if (req.files && req.files.length > 0) {
          let file = req.files[0];
          if (file.fieldname == "csvfile" && file.mimetype == "text/csv") {
            let csvRead = await getSHA(file.path);
            // console.log("csvRead=",csvRead);

            if (csvRead && csvRead.length > 0) {
              for (let csvrow of csvRead) {
                throttle(async () => {
                  new CrudController().insertFromCSV(csvrow);
                });
              }

              return res.json({
                status: 200,
                message:
                  "The process to upload the recods has been started. Please wait for sometime",
              });
            } else {
              return res.json({
                status: 400,
                data: {},
                message: "The csv file contains the empty records",
              });
            }
          } else {
            return res.json({
              status: 400,
              data: {},
              message: "Please upload a valid file",
            });
          }
        } else {
          return res.json({
            status: 400,
            data: {},
            message: "No data available to save",
          });
        }
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "Please upload the csv file",
        });
      }
      //    console.log("comes Here =",req.files);
    } catch (err) {
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

  async insertFromCSV(csvrow) {
    try {
      //console.log("csvrow=",csvrow)
      if (!csvrow.account_name) {
        return;
      }

      let userAccountObj = {
        account_name: csvrow.account_name,
        account_type: csvrow.account_type,
      };

      // console.log("User obj=",userAccountObj)

      let saveRecords = await userAccountModel.create(userAccountObj);
      if (saveRecords && saveRecords._id) {
        let userObj = {
          firstname: csvrow.firstname,
          email: csvrow.email,
          phone: csvrow.phone,
          address: csvrow.address,
          city: csvrow.city,
          gender: csvrow.gender ? csvrow.gender : "",
          state: csvrow.state,
          zip: csvrow.zip,
          dob: csvrow.dob ? csvrow.dob : null,
          user_account_id: saveRecords._id,
          userType: csvrow.userType,
          primary: csvrow.primary,
        };

        let saveUser = await userModel.create(userObj);

        if (saveUser && saveUser._id) {
          let agentObj = {
            agent: csvrow.agent ? csvrow.agent : "",
            producer: csvrow.producer ? csvrow.producer : "",
            csr: csvrow.csr ? csvrow.csr : "",
          };
          let saveAgent = await agentModel.create(agentObj);
          let company_id = null;
          let category_id = null;

          if (csvrow.category_name) {
            let checkLobData = await lobModel.findOne({
              category_name: {
                $regex: csvrow.category_name.trim(),
                $options: "i",
              },
            });
            if (_.isEmpty(checkLobData)) {
              let saveLobData = await lobModel.create({
                category_name: csvrow.category_name,
              });
              if (!_.isEmpty(saveLobData)) {
                category_id = saveLobData._id;
              }
            } else {
              category_id = checkLobData._id;
            }
          }

          if (csvrow.company_name) {
            let checkCarrier = await carrierModel.findOne({
              company_name: {
                $regex: csvrow.company_name.trim(),
                $options: "i",
              },
            });
            if (_.isEmpty(checkCarrier)) {
              let saveCarrier = await carrierModel.create({
                company_name: csvrow.company_name,
              });
              if (!_.isEmpty(saveCarrier)) {
                company_id = saveCarrier._id;
              }
            } else {
              company_id = checkCarrier._id;
            }
          }

          let policyObj = {
            policy_no: csvrow.policy_number ? csvrow.policy_number : "",
            policy_mode: csvrow.policy_mode ? csvrow.policy_mode : 0,
            premium_amount_written: csvrow.premium_amount_written
              ? +csvrow.premium_amount_written
              : 0,
            premium_amount: csvrow.premium_amount
              ? parseFloat(csvrow.premium_amount)
              : 0,
            policy_type: csvrow.policy_type ? csvrow.policy_type : "Single",
            company_id: company_id ? company_id : null,
            category_id: category_id ? category_id : null,
            user_account_id: saveRecords._id ? saveRecords._id : null,
            user_id: saveUser._id,
            policy_start_date: csvrow.policy_start_date
              ? csvrow.policy_start_date
              : null,
            policy_end_date: csvrow.policy_end_date
              ? csvrow.policy_end_date
              : null,
            agent_id: saveAgent._id ? saveAgent._id : null,
          };

          let savePolicy = await policyModel.create(policyObj);
        }
      }
      // console.log("saveRecords=",saveRecords)

      return;
    } catch (e) {
      console.log("Error=", e);
      return;
    }
  }

  /**
   * @Method : getAllPolicies
   * @Description : To get all the policies from the DB
   */

  async getAllPolicies(req, res) {
    try {
      let getRecords = await policyModel.aggregate([
        {
          $lookup: {
            from: "users",
            let: { userId: "$user_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$userId"],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "user_accounts",
                  let: { userAccountId: "$user_account_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            {
                              $eq: ["$_id", "$$userAccountId"],
                            },
                          ],
                        },
                      },
                    },
                  ],
                  as: "user_account_data",
                },
              },
              {
                $unwind: {
                  path: "$user_account_data",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $project: {
                  firstname: 1,
                  email: 1,
                  phone: 1,
                  gender: 1,
                  city: 1,
                  address: 1,
                  state: 1,
                  zip: 1,
                  dob: 1,
                  userType: 1,
                  primary: 1,
                  application_id: 1,
                  agency_id: 1,
                  hasActive: 1,
                  clientPolicy: 1,
                  account_name: "$user_account_data.account_name",
                  account_type: "$user_account_data.account_type",
                },
              },
            ],
            as: "user_data",
          },
        },
        {
          $unwind: {
            path: "$user_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "agents",
            let: { agentId: "$agent_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$agentId"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "agent_data",
          },
        },
        {
          $unwind: {
            path: "$agent_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "lobs",
            let: { lobId: "$category_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$lobId"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "lob_data",
          },
        },
        {
          $unwind: {
            path: "$lob_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "carriers",
            let: { companyId: "$company_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$companyId"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "company_data",
          },
        },
        {
          $unwind: {
            path: "$company_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            policy_no: 1,
            policy_mode: 1,
            premium_amount_written: 1,
            premium_amount: 1,
            policy_type: 1,
            policy_start_date: 1,
            policy_end_date: 1,
            firstname: "$user_data.firstname",
            email: "$user_data.email",
            phone: "$user_data.phone",
            gender: "$user_data.gender",
            city: "$user_data.city",
            address: "$user_data.address",
            state: "$user_data.state",
            zip: "$user_data.zip",
            dob: "$user_data.dob",
            userType: "$user_data.userType",
            primary: "$user_data.primary",
            application_id: "$user_id.application_id",
            agency_id: "$user_data.agency_id",
            hasActive: "$user_data.hasActive",
            clientPolicy: "$user_data.clientPolicy",
            account_name: "$user_data.user_account_data.account_name",
            account_type: "$user_data.user_account_data.account_type",
            agent: "$agent_data.agent",
            producer: "$agent_data.producer",
            csr: "$agent_data.csr",
            category_name: "$lob_data.category_name",
            company_name: "$company_data.company_name",
          },
        },
      ]);

      if (!_.isEmpty(getRecords)) {
        return res.json({
          status: 200,
          data: getRecords,
          message: "Records has been fetched successfully",
        });
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "No Data found",
        });
      }
    } catch (e) {
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

  /**
   * @Method : getPolicyData
   * @Description : To get policy data from the DB
   */

  async getPolicyData(req, res) {
    try {
      if (!req.params.id) {
        return res.json({
          status: 400,
          data: {},
          message: "Policy Id is required",
        });
      }

      let policy_id = new mongoose.Types.ObjectId(req.params.id);

      let getRecord = await policyModel.aggregate([
        {
          $match: {
            _id: policy_id,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { userId: "$user_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$userId"],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "user_accounts",
                  let: { userAccountId: "$user_account_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            {
                              $eq: ["$_id", "$$userAccountId"],
                            },
                          ],
                        },
                      },
                    },
                  ],
                  as: "user_account_data",
                },
              },
              {
                $unwind: {
                  path: "$user_account_data",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $project: {
                  firstname: 1,
                  email: 1,
                  phone: 1,
                  gender: 1,
                  city: 1,
                  address: 1,
                  state: 1,
                  zip: 1,
                  dob: 1,
                  userType: 1,
                  primary: 1,
                  application_id: 1,
                  agency_id: 1,
                  hasActive: 1,
                  clientPolicy: 1,
                  account_name: "$user_account_data.account_name",
                  account_type: "$user_account_data.account_type",
                },
              },
            ],
            as: "user_data",
          },
        },
        {
          $unwind: {
            path: "$user_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "agents",
            let: { agentId: "$agent_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$agentId"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "agent_data",
          },
        },
        {
          $unwind: {
            path: "$agent_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "lobs",
            let: { lobId: "$category_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$lobId"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "lob_data",
          },
        },
        {
          $unwind: {
            path: "$lob_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "carriers",
            let: { companyId: "$company_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$_id", "$$companyId"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "company_data",
          },
        },
        {
          $unwind: {
            path: "$company_data",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            policy_no: 1,
            policy_mode: 1,
            premium_amount_written: 1,
            premium_amount: 1,
            policy_type: 1,
            policy_start_date: 1,
            policy_end_date: 1,
            firstname: "$user_data.firstname",
            email: "$user_data.email",
            phone: "$user_data.phone",
            gender: "$user_data.gender",
            city: "$user_data.city",
            address: "$user_data.address",
            state: "$user_data.state",
            zip: "$user_data.zip",
            dob: "$user_data.dob",
            userType: "$user_data.userType",
            primary: "$user_data.primary",
            application_id: "$user_id.application_id",
            agency_id: "$user_data.agency_id",
            hasActive: "$user_data.hasActive",
            clientPolicy: "$user_data.clientPolicy",
            account_name: "$user_data.user_account_data.account_name",
            account_type: "$user_data.user_account_data.account_type",
            agent: "$agent_data.agent",
            producer: "$agent_data.producer",
            csr: "$agent_data.csr",
            category_name: "$lob_data.category_name",
            company_name: "$company_data.company_name",
          },
        },
      ]);

      if (!_.isEmpty(getRecord)) {
        return res.json({
          status: 200,
          data: getRecord[0],
          message: "Records has been fetched successfully",
        });
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "No Data found",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

  /**
   * @Method : deletePolicy
   * @Description : To delete the policy data in the DB
   */

  async deletePolicy(req, res) {
    try {
      if (!req.body.policy_id) {
        return res.json({
          status: 400,
          data: {},
          message: "Policy Id is required",
        });
      }

      let policy_id = new mongoose.Types.ObjectId(req.body.policy_id);

      let getRecord = await policyModel.findById(policy_id);
      if (!_.isEmpty(getRecord)) {
        let deleteRecord = await policyModel.deleteOne({ _id: getRecord._id });
        if (deleteRecord && deleteRecord.deletedCount > 0) {
          return res.json({
            status: 200,
            message: "Record has removed successfully",
          });
        } else {
          return res.json({
            status: 400,
            data: {},
            message: "Something went wrong!",
          });
        }
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "No record found by the given id",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

  /**
   * @Method : updatePolicy
   * @Description : To update the policy data in the DB
   */

  async updatePolicy(req, res) {
    try {
      if (req.body.policy_no) delete req.body.policy_no;
      if (req.body.company_id) delete req.body.company_id;
      if (req.body.category_id) delete req.body.category_id;
      if (req.body.user_account_id) delete req.body.user_account_id;
      if (req.body.user_id) delete req.body.user_id;

      if (!req.body.policy_id) {
        return res.json({
          status: 400,
          data: {},
          message: "Policy Id is required",
        });
      }

      let policy_id = new mongoose.Types.ObjectId(req.body.policy_id);

      let getPolicyData = await policyModel.findById(policy_id);

      if (!_.isEmpty(getPolicyData)) {
        let updateRecord = await policyModel.findByIdAndUpdate(
          policy_id,
          req.body,
          { new: true }
        );

        if (!_.isEmpty(updateRecord)) {
          return res.json({
            status: 200,
            data: updateRecord,
            message: "Policy data has been updated successfully",
          });
        } else {
          return res.json({
            status: 400,
            data: {},
            message: "Something went wrong!",
          });
        }
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "Policy data does not exists any more",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

  /**
   * @Method : getUserData
   * @Description : To get the user data from the DB
   */

  async getUserData(req, res) {
    try {
      if (!req.params.id) {
        return res.json({
          status: 400,
          data: {},
          message: "User Id is required",
        });
      }

      let user_id = new mongoose.Types.ObjectId(req.params.id);

      let getRecord = await userModel.aggregate([
        {
          $match: {
            _id: user_id
          },
        },
        {
            $lookup:{
                from:"user_accounts",
                let:{accountId:"$user_account_id"},
                pipeline:[
                    {
                        $match:{
                            $expr:{
                                $and:[
                                    {
                                        $eq:["$_id","$$accountId"]
                                    }
                                ]
                            }
                        }
                    }
                ],
                as:"user_account_data"
            }
        },
        {
            $unwind:{
                path:"$user_account_data",
                preserveNullAndEmptyArrays:true
            }
        }
      ]);

      if (!_.isEmpty(getRecord)) {
        return res.json({
          status: 200,
          data: getRecord[0],
          message: "Records has been fetched successfully",
        });
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "No Data found",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }
  
   /**
   * @Method : updateUserData
   * @Description : To update the user data in the DB
   */

   async updateUserData(req, res) {
    try {
      if (req.body.user_account_id) delete req.body.user_account_id;
      if (req.body.clientPolicy) delete req.body.clientPolicy;
    
      if (!req.body.user_id) {
        return res.json({
          status: 400,
          data: {},
          message: "User Id is required",
        });
      }

      let user_id = new mongoose.Types.ObjectId(req.body.user_id);

      let getUserData = await userModel.findById(user_id);

      if (!_.isEmpty(getUserData)) {
        let updateRecord = await userModel.findByIdAndUpdate(
          user_id,
          req.body,
          { new: true }
        );

        if (!_.isEmpty(updateRecord)) {
          return res.json({
            status: 200,
            data: updateRecord,
            message: "User's data has been updated successfully",
          });
        } else {
          return res.json({
            status: 400,
            data: {},
            message: "Something went wrong!",
          });
        }
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "User's data does not exists any more",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

  
  /**
   * @Method : deletePolicy
   * @Description : To delete the user data in the DB
   */

  async deleteUser(req, res) {
    try {
      if (!req.body.user_id) {
        return res.json({
          status: 400,
          data: {},
          message: "User Id is required",
        });
      }

      let user_id = new mongoose.Types.ObjectId(req.body.user_id);

      let getRecord = await userModel.findById(user_id);
      if (!_.isEmpty(getRecord)) {
        let deleteRecord = await policyModel.deleteOne({ user_id: user_id });
        if (!_.isEmpty(deleteRecord)) {
            let deleteUserData = await userModel.deleteOne({ _id: user_id });
            if(!_.isEmpty(deleteUserData) && deleteUserData.deletedCount > 0) {
                return res.json({
                    status: 200,
                    message: "User data has removed successfully",
                  });
            } else {
                return res.json({
                    status: 400,
                    message: "Something went wrong!",
                  });
            }
        } else {
          return res.json({
            status: 400,
            data: {},
            message: "Something went wrong!",
          });
        }
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "No record found by the given id",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

   /**
   * @Method : getAccountInformation
   * @Description : To get the account data from the DB
   */

   async getAccountInformation(req, res) {
    try {
      if (!req.params.id) {
        return res.json({
          status: 400,
          data: {},
          message: "Account Id is required",
        });
      }

      let account_id = new mongoose.Types.ObjectId(req.params.id);

      let getRecord = await userAccountModel.aggregate([
        {
          $match: {
            _id: account_id
          },
        },
        {
            $lookup:{
                from:"users",
                let:{accountId:account_id},
                pipeline:[
                    {
                        $match:{
                            $expr:{
                                $and:[
                                    {
                                        $eq:["$user_account_id","$$accountId"]
                                    }
                                ]
                            }
                        }
                    }
                ],
                as:"users_data"
            }
        }
      ]);

      if (!_.isEmpty(getRecord)) {
        return res.json({
          status: 200,
          data: getRecord[0],
          message: "Records has been fetched successfully",
        });
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "No Data found",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

   /**
   * @Method : updateUserAccount
   * @Description : To update the user account data in the DB
   */

   async updateUserAccount(req, res) {
    try {
      if (!req.body.user_account_id) {
        return res.json({
          status: 400,
          data: {},
          message: "User Account Id is required",
        });
      }

      let user_account_id = new mongoose.Types.ObjectId(req.body.user_account_id);

      let getAccountData = await userAccountModel.findById(user_account_id);

      if (!_.isEmpty(getAccountData)) {
        let updateRecord = await userAccountModel.findByIdAndUpdate(
            user_account_id,
          req.body,
          { new: true }
        );

        if (!_.isEmpty(updateRecord)) {
          return res.json({
            status: 200,
            data: updateRecord,
            message: "User's account data has been updated successfully",
          });
        } else {
          return res.json({
            status: 400,
            data: {},
            message: "Something went wrong!",
          });
        }
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "User's account data does not exists any more",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }

  /**
   * @Method : deleteUserAccount
   * @Description : To delete the user account data in the DB
   */

  async deleteUserAccount(req, res) {
    try {
        if (!req.body.user_account_id) {
            return res.json({
              status: 400,
              data: {},
              message: "User Account Id is required",
            });
          }
    
      let user_account_id = new mongoose.Types.ObjectId(req.body.user_account_id);

      let getRecord = await userAccountModel.findById(user_account_id);
      if (!_.isEmpty(getRecord)) {
        let deleteRecord = await policyModel.deleteOne({ user_account_id: user_account_id });
        if (!_.isEmpty(deleteRecord)) {
            let deleteUserData = await userModel.deleteOne({ user_account_id: user_account_id });
            if(!_.isEmpty(deleteUserData)) {
                let deleteUserAccountData = await userAccountModel.deleteOne({ _id: user_account_id });
                if(!_.isEmpty(deleteUserAccountData) && deleteUserAccountData.deletedCount > 0) {
                    return res.json({
                        status: 200,
                        message: "User data has removed successfully",
                      });
                } else {
                    return res.json({
                        status: 400,
                        message: "Something went wrong!",
                      });
                }
            } else {
                return res.json({
                    status: 400,
                    message: "Something went wrong!",
                  });
            }
        } else {
          return res.json({
            status: 400,
            data: {},
            message: "Something went wrong!",
          });
        }
      } else {
        return res.json({
          status: 400,
          data: {},
          message: "No record found by the given id",
        });
      }
    } catch (e) {
      console.log("Error=", e);
      return res.json({
        status: 400,
        data: {},
        message: "something went wrong!!!!",
      });
    }
  }


}

module.exports = new CrudController();
