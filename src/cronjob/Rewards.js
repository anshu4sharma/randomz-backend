const cron = require("node-cron");
const RewardAmount = require("../constant/index");
const Users = require("../model/UserSchema");
module.exports = class RewardUser {
  static CHECK_EVERY_FIVE_MINUTES = async () => {
    // cron.schedule("*/5 * * * *", () => {
    const data = await Users.find({
      referedBy: { $ne: '' },
    });
      console.log(data);
    // cron.schedule("*/4 * * * * *", () => {
    //   console.log(RewardAmount.REWARD_FOR_A_PURCHASE_AMOUNT);
    //   console.log("running a task every five minutes");
    // });
  };
};
